import { create } from 'zustand';
import { ActiveCustomer, CustomerArchetypeId, RecipeId } from '../types';
import { CUSTOMER_ARCHETYPES, VIETNAMESE_NAMES } from '../data/customers';

interface CustomerState {
  activeCustomers: ActiveCustomer[];
  customersServedToday: number;
  customersLostToday: number;
  dailyRevenueToday: number;
  dailyIngredientCostToday: number;

  // Actions
  spawnCustomer: (availableRecipes: RecipeId[], maxQueue: number) => ActiveCustomer | null;
  tickPatience: (deltaSeconds: number) => { expiredCustomers: ActiveCustomer[] };
  serveCustomer: (customerId: string) => ActiveCustomer | undefined;
  removeCustomer: (customerId: string) => void;
  recordSale: (revenue: number, ingredientCost: number) => void;
  resetDailyCustomerMetrics: () => void;
  clearQueue: () => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  activeCustomers: [],
  customersServedToday: 0,
  customersLostToday: 0,
  dailyRevenueToday: 0,
  dailyIngredientCostToday: 0,

  spawnCustomer: (availableRecipes: RecipeId[], maxQueue: number) => {
    const { activeCustomers } = get();
    if (activeCustomers.length >= maxQueue || availableRecipes.length === 0) {
      return null;
    }

    // Weighted random archetype selection
    const totalWeight = CUSTOMER_ARCHETYPES.reduce((sum, a) => sum + a.spawnWeight, 0);
    let rand = Math.random() * totalWeight;
    let chosenArchetype = CUSTOMER_ARCHETYPES[0];

    for (const arch of CUSTOMER_ARCHETYPES) {
      if (rand < arch.spawnWeight) {
        chosenArchetype = arch;
        break;
      }
      rand -= arch.spawnWeight;
    }

    // Pick desired recipe (prefer archetype favorites if unlocked)
    const favoriteUnlocked = chosenArchetype.favoriteRecipes.filter((rId) =>
      availableRecipes.includes(rId)
    );
    const chosenRecipeId =
      favoriteUnlocked.length > 0
        ? favoriteUnlocked[Math.floor(Math.random() * favoriteUnlocked.length)]
        : availableRecipes[Math.floor(Math.random() * availableRecipes.length)];

    const randomName = VIETNAMESE_NAMES[Math.floor(Math.random() * VIETNAMESE_NAMES.length)];
    
    // Archetype-aware preferences (Gymer, Student, Foodie, Picky, etc.)
    let sugar: 'regular' | 'less_sugar' | 'no_sugar' = 'regular';
    let ice: 'regular' | 'less_ice' = 'regular';
    let milk: 'regular' | 'no_milk' = 'regular';

    if (chosenArchetype.id === 'gymer') {
      // Gymer: low sugar / no sugar, less ice, sometimes no milk
      const rSugar = Math.random();
      sugar = rSugar < 0.45 ? 'no_sugar' : rSugar < 0.85 ? 'less_sugar' : 'regular';
      ice = Math.random() < 0.6 ? 'less_ice' : 'regular';
      milk = Math.random() < 0.25 ? 'no_milk' : 'regular';
    } else if (chosenArchetype.id === 'foodie') {
      // Foodie: less sugar to taste real fruit, moderate ice
      const rSugar = Math.random();
      sugar = rSugar < 0.45 ? 'less_sugar' : rSugar < 0.65 ? 'no_sugar' : 'regular';
      ice = Math.random() < 0.35 ? 'less_ice' : 'regular';
      milk = Math.random() < 0.15 ? 'no_milk' : 'regular';
    } else if (chosenArchetype.id === 'difficult') {
      // Difficult customer: picky requests (less ice, no sugar, or no milk)
      const r = Math.random();
      if (r < 0.4) sugar = 'no_sugar';
      else if (r < 0.7) ice = 'less_ice';
      else if (r < 0.85) milk = 'no_milk';
    } else if (chosenArchetype.id === 'office_worker') {
      // Office worker: often less sugar
      sugar = Math.random() < 0.45 ? 'less_sugar' : 'regular';
      ice = Math.random() < 0.3 ? 'less_ice' : 'regular';
      milk = 'regular';
    } else {
      // Student & Loyal: mostly classic sweet & cold
      sugar = Math.random() < 0.2 ? 'less_sugar' : 'regular';
      ice = 'regular';
      milk = 'regular';
    }

    // Build Vietnamese custom note
    const notes: string[] = [];
    if (sugar === 'no_sugar') notes.push('Không đường');
    else if (sugar === 'less_sugar') notes.push('Ít đường');

    if (ice === 'less_ice') notes.push('Ít đá');

    if (milk === 'no_milk') notes.push('Không sữa (thuần chay)');

    const customNote = notes.length > 0 ? `Dặn dò: ${notes.join(' · ')}` : 'Dặn dò: Chuẩn vị quán';

    const newCustomer: ActiveCustomer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      archetypeId: chosenArchetype.id,
      name: randomName,
      desiredRecipeId: chosenRecipeId,
      spawnTime: Date.now(),
      maxPatience: chosenArchetype.patienceSeconds,
      remainingPatience: chosenArchetype.patienceSeconds,
      state: 'queuing',
      queuePosition: activeCustomers.length + 1,
      sugarPreference: sugar,
      icePreference: ice,
      milkPreference: milk,
      customNote,
    };

    set((state) => ({
      activeCustomers: [...state.activeCustomers, newCustomer],
    }));

    return newCustomer;
  },

  tickPatience: (deltaSeconds: number) => {
    const { activeCustomers } = get();
    const remaining: ActiveCustomer[] = [];
    const expired: ActiveCustomer[] = [];

    activeCustomers.forEach((cust, idx) => {
      // The front customer at the counter (idx === 0) actively counts down order preparation time.
      // Customers behind them in line lose patience much slower (0.2x) while waiting in queue.
      const rate = idx === 0 ? 1 : 0.2;
      const newPatience = cust.remainingPatience - deltaSeconds * rate;
      if (newPatience <= 0) {
        expired.push(cust);
      } else {
        remaining.push({
          ...cust,
          remainingPatience: newPatience,
        });
      }
    });

    // Re-index queue positions
    // When a customer steps up to the counter (becomes position 1), refresh to full maxPatience
    const reindexed = remaining.map((cust, idx) => {
      const isNowAtCounter = idx === 0;
      const wasInQueue = cust.queuePosition > 1;
      return {
        ...cust,
        queuePosition: idx + 1,
        remainingPatience: isNowAtCounter && wasInQueue ? cust.maxPatience : cust.remainingPatience,
      };
    });

    set((state) => ({
      activeCustomers: reindexed,
      customersLostToday: state.customersLostToday + expired.length,
    }));

    return { expiredCustomers: expired };
  },

  serveCustomer: (customerId: string) => {
    const { activeCustomers } = get();
    const customer = activeCustomers.find((c) => c.id === customerId);
    if (!customer) return undefined;

    // Remove served customer and advance queue
    // The next customer stepping up to the counter (idx === 0) gets their full preparation time
    const remaining = activeCustomers
      .filter((c) => c.id !== customerId)
      .map((c, idx) => {
        const isNowAtCounter = idx === 0;
        const wasInQueue = c.queuePosition > 1;
        return {
          ...c,
          queuePosition: idx + 1,
          remainingPatience: isNowAtCounter && wasInQueue ? c.maxPatience : c.remainingPatience,
        };
      });

    set((state) => ({
      activeCustomers: remaining,
      customersServedToday: state.customersServedToday + 1,
    }));

    return customer;
  },

  removeCustomer: (customerId: string) => {
    set((state) => ({
      activeCustomers: state.activeCustomers
        .filter((c) => c.id !== customerId)
        .map((c, idx) => {
          const isNowAtCounter = idx === 0;
          const wasInQueue = c.queuePosition > 1;
          return {
            ...c,
            queuePosition: idx + 1,
            remainingPatience: isNowAtCounter && wasInQueue ? c.maxPatience : c.remainingPatience,
          };
        }),
    }));
  },

  recordSale: (revenue: number, ingredientCost: number) => {
    set((state) => ({
      dailyRevenueToday: state.dailyRevenueToday + revenue,
      dailyIngredientCostToday: state.dailyIngredientCostToday + ingredientCost,
    }));
  },

  resetDailyCustomerMetrics: () => {
    set({
      customersServedToday: 0,
      customersLostToday: 0,
      dailyRevenueToday: 0,
      dailyIngredientCostToday: 0,
    });
  },

  clearQueue: () => {
    set({ activeCustomers: [] });
  },
}));
