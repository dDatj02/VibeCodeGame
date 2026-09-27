import { useGameStore } from '../stores/gameStore';
import { useEconomyStore } from '../stores/economyStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useRecipeStore } from '../stores/recipeStore';
import { useShopStore } from '../stores/shopStore';
import { useReviewStore } from '../stores/reviewStore';
import { useSocialStore } from '../stores/socialStore';

const SAVE_KEY = 'quan_sinh_to_save_v1';

// In-memory fallback if localStorage is unavailable (e.g. testing or private browsing)
const memoryStorage: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {}
  return memoryStorage[key] || null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {}
  memoryStorage[key] = value;
}

function removeStorageItem(key: string): void {
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
}

export class SaveService {
  public static saveGame(): boolean {
    try {
      const g = useGameStore.getState();
      const e = useEconomyStore.getState();
      const i = useInventoryStore.getState();
      const r = useRecipeStore.getState();
      const s = useShopStore.getState();
      const rev = useReviewStore.getState();
      const soc = useSocialStore.getState();

      const saveData: GameSaveDataV1 = {
        version: 1,
        timestamp: Date.now(),
        game: {
          day: g.day,
          weather: g.weather,
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
      };

      setStorageItem(SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (err) {
      console.error('Failed to save game:', err);
      return false;
    }
  }

  public static loadGame(): boolean {
    try {
      const raw = getStorageItem(SAVE_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw) as GameSaveDataV1;
      if (!data || data.version !== 1) return false;

      // Hydrate Zustand stores
      if (data.game) {
        useGameStore.setState({
          day: data.game.day,
          weather: data.game.weather as any,
          phase: 'prep',
        });
      }
      if (data.economy) {
        useEconomyStore.setState({
          cash: data.economy.cash,
          bankBalance: data.economy.bankBalance,
          creditScore: data.economy.creditScore,
          activeLoans: data.economy.activeLoans as any,
          dailyReports: data.economy.dailyReports as any,
        });
      }
      if (data.inventory?.ingredients) {
        useInventoryStore.setState({ ingredients: data.inventory.ingredients as any });
      }
      if (data.recipes?.recipes) {
        useRecipeStore.setState({ recipes: data.recipes.recipes as any });
      }
      if (data.shop) {
        useShopStore.setState({
          currentShopLevel: data.shop.currentShopLevel,
          equipment: data.shop.equipment as any,
          employees: data.shop.employees as any,
          cleanliness: data.shop.cleanliness,
        });
      }
      if (data.reviews) {
        useReviewStore.setState({
          reviews: data.reviews.reviews as any,
          averageRating: data.reviews.averageRating,
          totalReviews: data.reviews.totalReviews,
        });
      }
      if (data.social) {
        useSocialStore.setState({
          posts: data.social.posts as any,
          totalViews: data.social.totalViews,
          totalLikes: data.social.totalLikes,
          followerCount: data.social.followerCount,
        });
      }

      return true;
    } catch (err) {
      console.error('Failed to load game:', err);
      return false;
    }
  }

  public static clearSave(): void {
    removeStorageItem(SAVE_KEY);
    useGameStore.getState().resetGame();
    useEconomyStore.getState().resetEconomy();
    useInventoryStore.getState().resetInventory();
    useRecipeStore.getState().resetRecipes();
    useShopStore.getState().resetShop();
    useReviewStore.getState().resetReviews();
    useSocialStore.getState().resetSocial();
  }
}
