import { create } from 'zustand';
import { Recipe } from '../types';
import { RECIPES } from '../data/recipes';

interface RecipeState {
  recipes: Recipe[];

  // Actions
  updateSellingPrice: (recipeId: string, newPrice: number) => void;
  unlockRecipe: (recipeId: string) => boolean;
  getRecipeById: (recipeId: string) => Recipe | undefined;
  getUnlockedRecipes: () => Recipe[];
  resetRecipes: () => void;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: RECIPES,

  updateSellingPrice: (recipeId: string, newPrice: number) => {
    set((state) => ({
      recipes: state.recipes.map((r) => {
        if (r.id === recipeId) {
          const clampedPrice = Math.max(5000, Math.min(200000, newPrice));
          // Price demand elasticity
          const ratio = clampedPrice / r.baseSellingPrice;
          let newPopularity = r.popularity;
          if (ratio > 1) {
            newPopularity = Math.max(10, Math.round(r.popularity / (ratio * 1.2)));
          } else {
            newPopularity = Math.min(100, Math.round(r.popularity * (1 + (1 - ratio) * 0.5)));
          }

          return {
            ...r,
            currentSellingPrice: clampedPrice,
            popularity: newPopularity,
          };
        }
        return r;
      }),
    }));
  },

  unlockRecipe: (recipeId: string) => {
    const { recipes } = get();
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe || recipe.unlocked) return false;

    set((state) => ({
      recipes: state.recipes.map((r) => (r.id === recipeId ? { ...r, unlocked: true } : r)),
    }));
    return true;
  },

  getRecipeById: (recipeId: string) => {
    return get().recipes.find((r) => r.id === recipeId);
  },

  getUnlockedRecipes: () => {
    return get().recipes.filter((r) => r.unlocked);
  },

  resetRecipes: () => {
    set({ recipes: RECIPES });
  },
}));
