import { create } from 'zustand';
import { Ingredient, IngredientRequirement } from '../types';
import { INITIAL_INGREDIENTS } from '../data/ingredients';
import { Supplier } from '../data/suppliers';

export interface BuyResult {
  success: boolean;
  totalCost: number;
  quantityBought: number;
  goodQuantity: number;
  defectiveQuantity: number;
  message: string;
}

interface InventoryState {
  ingredients: Ingredient[];

  // Actions
  buyIngredient: (
    ingredientId: string,
    quantity: number,
    supplier?: Supplier
  ) => BuyResult;

  hasEnoughIngredients: (requirements: IngredientRequirement[]) => boolean;
  consumeIngredients: (requirements: IngredientRequirement[]) => boolean;
  calculateRecipeIngredientCost: (requirements: IngredientRequirement[]) => number;
  ageIngredientsDaily: (coolerRetentionBonus: number) => { spoiledUnits: number; spoiledLossCost: number; details: string[] };
  clearSpoiledIngredients: (ingredientId?: string) => { clearedCount: number };
  resetInventory: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  ingredients: INITIAL_INGREDIENTS,

  buyIngredient: (ingredientId: string, quantity: number, supplier?: Supplier) => {
    const { ingredients } = get();
    const item = ingredients.find((i) => i.id === ingredientId);
    if (!item || quantity <= 0) {
      return {
        success: false,
        totalCost: 0,
        quantityBought: 0,
        goodQuantity: 0,
        defectiveQuantity: 0,
        message: 'Nguyên liệu không tồn tại',
      };
    }

    const priceModifier = supplier ? supplier.priceModifier : 1.0;
    const unitPrice = Math.round(item.basePrice * priceModifier);
    const totalCost = unitPrice * quantity;

    // Calculate defect / rot rate based on supplier
    const isFruit = item.category === 'fruit';
    const defectRate = (isFruit && supplier) ? supplier.defectRate : 0;
    
    // Determine exact number of defective fruits
    let defectiveQuantity = 0;
    if (defectRate > 0 && isFruit) {
      for (let i = 0; i < quantity; i++) {
        if (Math.random() < defectRate) {
          defectiveQuantity++;
        }
      }
    }

    const goodQuantity = Math.max(0, quantity - defectiveQuantity);

    set((state) => ({
      ingredients: state.ingredients.map((ing) => {
        if (ing.id === ingredientId) {
          const incomingFreshness = supplier ? supplier.freshnessGuarantee : 100;
          const newTotalStock = ing.currentStock + goodQuantity;
          
          let weightedFreshness = 100;
          if (newTotalStock > 0) {
            weightedFreshness = Math.round(
              (ing.currentStock * ing.freshness + goodQuantity * incomingFreshness) / newTotalStock
            );
          }

          return {
            ...ing,
            currentStock: newTotalStock,
            freshness: Math.min(100, weightedFreshness),
          };
        }
        return ing;
      }),
    }));

    let message = `Đã mua +${goodQuantity} ${item.unit} ${item.name}`;
    if (defectiveQuantity > 0) {
      message = `🔍 Mua ${quantity} phần từ ${supplier?.name}: Nhận ${goodQuantity} phần tươi ngon, ${defectiveQuantity} phần bị dập hỏng phải bỏ thùng rác!`;
    }

    return {
      success: true,
      totalCost,
      quantityBought: quantity,
      goodQuantity,
      defectiveQuantity,
      message,
    };
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
    let spoiledLossCost = 0;
    const details: string[] = [];

    set((state) => ({
      ingredients: state.ingredients.map((ing) => {
        if (ing.shelfLifeDays >= 365 || ing.currentStock <= 0) return ing;
        
        // Freshness decay: fruits expire quickly without cooler
        const isFruit = ing.category === 'fruit';
        const baseDrop = Math.round(100 / Math.max(1, ing.shelfLifeDays));
        const protectedDrop = Math.max(5, Math.round(baseDrop * (1 - coolerRetentionBonus)));
        const newFreshness = Math.max(0, ing.freshness - protectedDrop);

        // If freshness drops below 30%, a portion of stock turns rotten/spoiled
        let newStock = ing.currentStock;
        if (newFreshness < 30 && isFruit) {
          const waste = Math.max(1, Math.ceil(ing.currentStock * 0.3));
          spoiledUnits += waste;
          const loss = waste * ing.basePrice;
          spoiledLossCost += loss;
          details.push(`${ing.name}: -${waste} ${ing.unit} (quá hạn/bị ủng)`);
          newStock = Math.max(0, ing.currentStock - waste);
        }

        return {
          ...ing,
          freshness: newFreshness,
          currentStock: newStock,
        };
      }),
    }));

    return { spoiledUnits, spoiledLossCost, details };
  },

  clearSpoiledIngredients: (ingredientId?: string) => {
    let clearedCount = 0;
    set((state) => ({
      ingredients: state.ingredients.map((ing) => {
        if (ingredientId && ing.id !== ingredientId) return ing;
        if (ing.freshness < 20) {
          clearedCount += ing.currentStock;
          return {
            ...ing,
            currentStock: 0,
            freshness: 100, // Reset after clearing
          };
        }
        return ing;
      }),
    }));

    return { clearedCount };
  },

  resetInventory: () => {
    set({ ingredients: INITIAL_INGREDIENTS });
  },
}));
