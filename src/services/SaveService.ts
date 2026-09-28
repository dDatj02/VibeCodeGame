import { useGameStore } from '../stores/gameStore';
import { useEconomyStore } from '../stores/economyStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useRecipeStore } from '../stores/recipeStore';
import { useShopStore } from '../stores/shopStore';
import { useReviewStore } from '../stores/reviewStore';
import { useSocialStore } from '../stores/socialStore';
import { useLargeOrderStore } from '../stores/largeOrderStore';
import { useInvestmentStore, INITIAL_GOLD_HOLDING } from '../stores/investmentStore';
import { INITIAL_GOLD_MARKET } from '../systems/investment/GoldMarket';
import { INITIAL_INGREDIENTS } from '../data/ingredients';
import { RECIPES } from '../data/recipes';
import { INITIAL_LAND_PROPERTIES, INITIAL_HOUSE_PROPERTIES } from '../data/properties';

export const SAVE_KEY = 'quan_sinh_to_save_v1';
export const SAFETY_BACKUP_KEY = 'quan_sinh_to_safety_backup_v1';

// In-memory fallback if localStorage is unavailable (e.g. testing or private browsing)
const memoryStorage: Record<string, string> = {};

export function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {}
  return memoryStorage[key] || null;
}

export function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {}
  memoryStorage[key] = value;
}

export function removeStorageItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }
  } catch {}
  delete memoryStorage[key];
}

export interface GameSaveDataV1 {
  version: 1;
  timestamp: number;
  game: {
    day: number;
    weather: string;
    shopName?: string;
    shopAvatar?: string;
    managerName?: string;
    managerAvatar?: string;
  };
  economy: {
    cash: number;
    bankBalance: number;
    creditScore: number;
    activeLoans: unknown[];
    dailyReports: unknown[];
  };
  inventory: {
    ingredients: unknown[];
  };
  recipes: {
    recipes: unknown[];
  };
  shop: {
    currentShopLevel: number;
    equipment: unknown[];
    employees: unknown[];
    cleanliness: number;
  };
  reviews: {
    reviews: unknown[];
    averageRating: number;
    totalReviews: number;
  };
  social: {
    posts: unknown[];
    totalViews: number;
    totalLikes: number;
    followerCount: number;
  };
  largeOrders?: {
    activeOffer: unknown;
    activeOrder: unknown;
    orderHistory: unknown[];
    customerReliabilities: Record<string, unknown>;
    hasShownUnlockTutorial: boolean;
  };
  investments?: {
    availableLand: unknown[];
    availableHouses: unknown[];
    ownedProperties: unknown[];
    investmentHistory: unknown[];
    totalRealizedProfit: number;
    totalRentalIncomeEarned: number;
    goldHolding?: unknown;
    goldMarket?: unknown;
  };
}

export class SaveService {
  /**
   * Captures the current active state across all Zustand stores into a pure GameSaveDataV1 object.
   */
  public static getCurrentSaveData(): GameSaveDataV1 {
    const g = useGameStore.getState();
    const e = useEconomyStore.getState();
    const i = useInventoryStore.getState();
    const r = useRecipeStore.getState();
    const s = useShopStore.getState();
    const rev = useReviewStore.getState();
    const soc = useSocialStore.getState();
    const lo = useLargeOrderStore.getState();
    const inv = useInvestmentStore.getState();

    return {
      version: 1,
      timestamp: Date.now(),
      game: {
        day: g.day,
        weather: g.weather,
        shopName: g.shopName,
        shopAvatar: g.shopAvatar,
        managerName: g.managerName,
        managerAvatar: g.managerAvatar,
      },
      economy: {
        cash: e.cash,
        bankBalance: e.bankBalance,
        creditScore: e.creditScore,
        activeLoans: e.activeLoans,
        dailyReports: e.dailyReports,
      },
      inventory: {
        ingredients: i.ingredients,
      },
      recipes: {
        recipes: r.recipes,
      },
      shop: {
        currentShopLevel: s.currentShopLevel,
        equipment: s.equipment,
        employees: s.employees,
        cleanliness: s.cleanliness,
      },
      reviews: {
        reviews: rev.reviews,
        averageRating: rev.averageRating,
        totalReviews: rev.totalReviews,
      },
      social: {
        posts: soc.posts,
        totalViews: soc.totalViews,
        totalLikes: soc.totalLikes,
        followerCount: soc.followerCount,
      },
      largeOrders: {
        activeOffer: lo.activeOffer,
        activeOrder: lo.activeOrder,
        orderHistory: lo.orderHistory,
        customerReliabilities: lo.customerReliabilities,
        hasShownUnlockTutorial: lo.hasShownUnlockTutorial,
      },
      investments: {
        availableLand: inv.availableLand,
        availableHouses: inv.availableHouses,
        ownedProperties: inv.ownedProperties,
        investmentHistory: inv.investmentHistory,
        totalRealizedProfit: inv.totalRealizedProfit,
        totalRentalIncomeEarned: inv.totalRentalIncomeEarned,
        goldHolding: inv.goldHolding,
        goldMarket: inv.goldMarket,
      },
    };
  }

  /**
   * Saves the current game state to primary local storage.
   */
  public static saveGame(): boolean {
    try {
      const saveData = this.getCurrentSaveData();
      setStorageItem(SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (err) {
      console.error('Failed to save game:', err);
      return false;
    }
  }

  /**
   * Applies and hydrates all Zustand stores from a GameSaveDataV1 structure.
   */
  public static applySaveData(data: GameSaveDataV1): boolean {
    try {
      if (!data || data.version !== 1) return false;

      // Hydrate Zustand stores
      if (data.game) {
        useGameStore.setState({
          day: data.game.day,
          weather: data.game.weather as any,
          shopName: data.game.shopName || 'Sinh Tố Nhà Tui',
          shopAvatar: data.game.shopAvatar || '🍹',
          managerName: (data.game as any).managerName || 'Bé Bơ',
          managerAvatar: (data.game as any).managerAvatar || '🥑',
          phase: 'prep',
        });
      }
      if (data.economy) {
        useEconomyStore.setState({
          cash: data.economy.cash,
          bankBalance: data.economy.bankBalance,
          creditScore: data.economy.creditScore,
          activeLoans: (data.economy.activeLoans as any) || [],
          dailyReports: (data.economy.dailyReports as any) || [],
        });
      }
      if (data.inventory?.ingredients) {
        const savedIngs = data.inventory.ingredients as any[];
        const mergedIngs = [...savedIngs];
        INITIAL_INGREDIENTS.forEach((initial) => {
          if (!mergedIngs.some((i) => i.id === initial.id)) {
            mergedIngs.push(initial);
          }
        });
        useInventoryStore.setState({ ingredients: mergedIngs });
      }
      if (data.recipes?.recipes) {
        const savedRecs = data.recipes.recipes as any[];
        const mergedRecs = [...savedRecs];
        RECIPES.forEach((rec) => {
          if (!mergedRecs.some((r) => r.id === rec.id)) {
            mergedRecs.push(rec);
          }
        });
        useRecipeStore.setState({ recipes: mergedRecs });
      }
      if (data.shop) {
        useShopStore.setState({
          currentShopLevel: data.shop.currentShopLevel || 1,
          equipment: (data.shop.equipment as any) || [],
          employees: (data.shop.employees as any) || [],
          cleanliness: data.shop.cleanliness ?? 100,
        });
      }
      if (data.reviews) {
        useReviewStore.setState({
          reviews: (data.reviews.reviews as any) || [],
          averageRating: data.reviews.averageRating || 5.0,
          totalReviews: data.reviews.totalReviews || 0,
        });
      }
      if (data.social) {
        useSocialStore.setState({
          posts: (data.social.posts as any) || [],
          totalViews: data.social.totalViews || 0,
          totalLikes: data.social.totalLikes || 0,
          followerCount: data.social.followerCount || 0,
        });
      }
      if (data.largeOrders) {
        useLargeOrderStore.setState({
          activeOffer: (data.largeOrders.activeOffer as any) || null,
          activeOrder: (data.largeOrders.activeOrder as any) || null,
          orderHistory: (data.largeOrders.orderHistory as any) || [],
          customerReliabilities: (data.largeOrders.customerReliabilities as any) || {},
          hasShownUnlockTutorial: Boolean(data.largeOrders.hasShownUnlockTutorial),
        });
      }
      if (data.investments) {
        useInvestmentStore.setState({
          availableLand: (data.investments.availableLand as any) || INITIAL_LAND_PROPERTIES,
          availableHouses: (data.investments.availableHouses as any) || INITIAL_HOUSE_PROPERTIES,
          ownedProperties: (data.investments.ownedProperties as any) || [],
          investmentHistory: (data.investments.investmentHistory as any) || [],
          totalRealizedProfit: data.investments.totalRealizedProfit || 0,
          totalRentalIncomeEarned: data.investments.totalRentalIncomeEarned || 0,
          goldHolding: (data.investments.goldHolding as any) || INITIAL_GOLD_HOLDING,
          goldMarket: (data.investments.goldMarket as any) || INITIAL_GOLD_MARKET,
        });
      }

      return true;
    } catch (err) {
      console.error('Failed to apply save data:', err);
      return false;
    }
  }

  /**
   * Loads and hydrates the game from primary local storage.
   */
  public static loadGame(): boolean {
    try {
      const raw = getStorageItem(SAVE_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw) as GameSaveDataV1;
      return this.applySaveData(data);
    } catch (err) {
      console.error('Failed to load game:', err);
      return false;
    }
  }

  /**
   * Creates an automatic local safety backup before a restore or risky operation.
   */
  public static saveSafetyBackup(): boolean {
    try {
      const raw = getStorageItem(SAVE_KEY);
      if (raw) {
        setStorageItem(SAFETY_BACKUP_KEY, raw);
        return true;
      }
      // If nothing saved yet, snapshot the active state
      const current = this.getCurrentSaveData();
      setStorageItem(SAFETY_BACKUP_KEY, JSON.stringify(current));
      return true;
    } catch (err) {
      console.error('Failed to create safety backup:', err);
      return false;
    }
  }

  /**
   * Checks if a safety backup exists in storage.
   */
  public static hasSafetyBackup(): boolean {
    return Boolean(getStorageItem(SAFETY_BACKUP_KEY));
  }

  /**
   * Restores from the safety backup if available.
   */
  public static restoreSafetyBackup(): boolean {
    try {
      const raw = getStorageItem(SAFETY_BACKUP_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw) as GameSaveDataV1;
      const ok = this.applySaveData(data);
      if (ok) {
        setStorageItem(SAVE_KEY, raw);
      }
      return ok;
    } catch (err) {
      console.error('Failed to restore safety backup:', err);
      return false;
    }
  }

  /**
   * Resets the entire local game save and reinitializes stores to pristine state.
   */
  public static clearSave(): void {
    removeStorageItem(SAVE_KEY);
    useGameStore.getState().resetGame();
    useEconomyStore.getState().resetEconomy();
    useInventoryStore.getState().resetInventory();
    useRecipeStore.getState().resetRecipes();
    useShopStore.getState().resetShop();
    useReviewStore.getState().resetReviews();
    useSocialStore.getState().resetSocial();
    useLargeOrderStore.getState().resetLargeOrders();
    useInvestmentStore.getState().resetInvestment();
  }
}
