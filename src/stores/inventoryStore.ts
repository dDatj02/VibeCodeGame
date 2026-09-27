import { create } from 'zustand';
import { Ingredient, IngredientRequirement } from '../types';
import { INITIAL_INGREDIENTS } from '../data/ingredients';
import { Supplier } from '../data/suppliers';

interface InventoryState {
  ingredients: Ingredient[];

  // Actions
  buyIngredient: (
    ingredientId: string,
    quantity: number,
    supplier?: Supplier
  ) => { success: boolean; totalCost: number; message?: string };

  hasEnoughIngredients: (requirements: IngredientRequirement[]) => boolean;
  consumeIngredients: (requirements: IngredientRequirement[]) => boolean;
  calculateRecipeIngredientCost: (requirements: IngredientRequirement[]) => number;
  ageIngredientsDaily: (coolerRetentionBonus: number) => { spoiledUnits: number };
  resetInventory: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  ingredients: INITIAL_INGREDIENTS,

  buyIngredient: (ingredientId: string, quantity: number, supplier?: Supplier) => {
    const { ingredients } = get();
    const item = ingredients.find((i) => i.id === ingredientId);
    if (!item || quantity <= 0) {
      return { success: false, totalCost: 0, message: 'Nguyên liệu không tồn tại' };
    }

    const priceModifier = supplier ? supplier.priceModifier : 1.0;
    const unitPrice = Math.round(item.basePrice * priceModifier);
    const totalCost = unitPrice * quantity;

    set((state) => ({
      ingredients: state.ingredients.map((ing) => {
        if (ing.id === ingredientId) {
          // Weighted freshness calculation
          const incomingFreshness = supplier ? supplier.freshnessGuarantee : 100;
          const newTotalStock = ing.currentStock + quantity;
          const weightedFreshness = Math.round(
            (ing.currentStock * ing.freshness + quantity * incomingFreshness) / newTotalStock
          );

          return {
            ...ing,
            currentStock: newTotalStock,
            freshness: Math.min(100, weightedFreshness),
          };
        }
        return ing;
      }),
    }));

    return { success: true, totalCost };
  },

  hasEnoughIngredients: (requirements: IngredientRequirement[]) => {
    const { ingredients } = get();
    return requirements.every((req) => {
      const stockItem = ingredients.find((i) => i.id === req.ingredientId);
      return stockItem && stockItem.currentStock >= req.amount;
    });
  },

  consumeIngredients: (requirements: IngredientRequirement[]) => {
    const { hasEnoughIngredients } = get();
    if (!hasEnoughIngredients(requirements)) {
      return false;
    }

    set((state) => ({
      ingredients: state.ingredients.map((ing) => {
        const req = requirements.find((r) => r.ingredientId === ing.id);
        if (req) {
          return {
            ...ing,
            currentStock: Math.max(0, ing.currentStock - req.amount),
          };
        }
        return ing;
      }),
    }));

    return true;
  },

  calculateRecipeIngredientCost: (requirements: IngredientRequirement[]) => {
    const { ingredients } = get();
    return requirements.reduce((total, req) => {
      const ing = ingredients.find((i) => i.id === req.ingredientId);
      const unitPrice = ing ? ing.basePrice : 0;
      return total + unitPrice * req.amount;
    }, 0);
  },

  ageIngredientsDaily: (coolerRetentionBonus: number) => {
    let spoiledUnits = 0;
    set((state) => ({
      ingredients: state.ingredients.map((ing) => {
        if (ing.shelfLifeDays <= 0 || ing.currentStock <= 0) return ing;
        
        // Freshness drops faster for fruits, mitigated by cooler upgrade
        const baseDrop = Math.round(100 / ing.shelfLifeDays);
        const protectedDrop = Math.max(5, Math.round(baseDrop * (1 - coolerRetentionBonus)));
        const newFreshness = Math.max(0, ing.freshness - protectedDrop);

        // If freshness reaches 0, a fraction spoils
        let newStock = ing.currentStock;
        if (newFreshness < 20 && ing.category === 'fruit') {
          const waste = Math.ceil(ing.currentStock * 0.25);
          spoiledUnits += waste;
          newStock = Math.max(0, ing.currentStock - waste);
        }

        return {
          ...ing,
          freshness: newFreshness,
          currentStock: newStock,
        };
      }),
    }));

    return { spoiledUnits };
  },

  resetInventory: () => {
    set({ ingredients: INITIAL_INGREDIENTS });
  },
}));
