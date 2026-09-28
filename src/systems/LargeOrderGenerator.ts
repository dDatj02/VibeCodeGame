import { LargeOrder, LargeOrderCustomer } from '../types/largeOrder';
import { LARGE_ORDER_CUSTOMER_TEMPLATES, CustomerTemplate } from '../data/largeOrderCustomers';
import { useRecipeStore } from '../stores/recipeStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useShopStore } from '../stores/shopStore';
import { useReviewStore } from '../stores/reviewStore';
import { useGameStore } from '../stores/gameStore';
import { LargeOrderRiskCalculator } from './LargeOrderRiskCalculator';
import { IngredientRequirement } from '../types';
import { BASE_PRODUCTION_SECONDS_PER_SMOOTHIE } from '../config/largeOrderConfig';

export class LargeOrderGenerator {
  public static generateOrder(
    isFirstOrder: boolean = false,
    customerReliabilityMap: Record<string, { reliability: number; completedOrders: number; cancelledOrders: number }> = {}
  ): LargeOrder | null {
    const recipeStore = useRecipeStore.getState();
    const unlockedRecipes = recipeStore.getUnlockedRecipes();
    if (unlockedRecipes.length === 0) return null;

    const shopStore = useShopStore.getState();
    const currentLevel = shopStore.currentShopLevel;
    const reviewStore = useReviewStore.getState();
    const gameStore = useGameStore.getState();

    // 1. Pick or configure customer
    let template: CustomerTemplate;
    let recipe = unlockedRecipes[0];
    let quantity = 30;
    let depositPercent = 0.5; // 50% deposit for first order

    if (isFirstOrder) {
      // First introductory order: Safe office company, 30 smoothies
      template = LARGE_ORDER_CUSTOMER_TEMPLATES[0]; // Tập Đoàn Tech VNG Center
      const mangoRecipe = unlockedRecipes.find((r) => r.id === 'smoothie_mango') || unlockedRecipes[0];
      recipe = mangoRecipe;
      quantity = 30;
      depositPercent = 0.5;
    } else {
      // Random customer template
      template = LARGE_ORDER_CUSTOMER_TEMPLATES[Math.floor(Math.random() * LARGE_ORDER_CUSTOMER_TEMPLATES.length)];

      // Pick matching recipe if available, else random unlocked
      if (template.preferredRecipeTags && template.preferredRecipeTags.length > 0) {
        const preferred = unlockedRecipes.filter((r) => template.preferredRecipeTags!.includes(r.tag));
        if (preferred.length > 0) {
          recipe = preferred[Math.floor(Math.random() * preferred.length)];
        } else {
          recipe = unlockedRecipes[Math.floor(Math.random() * unlockedRecipes.length)];
        }
      } else {
        recipe = unlockedRecipes[Math.floor(Math.random() * unlockedRecipes.length)];
      }

      // Scale quantity with shop level
      const baseQty = currentLevel <= 5 ? 30 : currentLevel === 6 ? 50 : 80;
      const randomVariance = Math.floor(Math.random() * 21) - 5; // -5 to +15
      quantity = Math.max(25, Math.round((baseQty + randomVariance) * template.quantityMultiplier));

      // Deposit roll based on template
      if (Math.random() < template.depositChance) {
        depositPercent = Math.random() < 0.4 ? 0.5 : 0.3;
      } else {
        depositPercent = 0;
      }
    }

    // Historical reliability for this customer
    const history = customerReliabilityMap[template.id] || {
      reliability: template.baseReliability,
      completedOrders: 0,
      cancelledOrders: 0,
    };

    const customer: LargeOrderCustomer = {
      id: template.id,
      name: template.name,
      type: template.type,
      avatar: template.avatar,
      reliability: history.reliability,
      completedOrders: history.completedOrders,
      cancelledOrders: history.cancelledOrders,
      description: template.description,
    };

    // Calculate wholesale price per item (e.g. 95% - 105% base selling price)
    const priceModifier = isFirstOrder ? 1.0 : 0.95 + Math.random() * 0.15;
    const pricePerItem = Math.round((recipe.currentSellingPrice * priceModifier) / 1000) * 1000;
    const totalRevenue = pricePerItem * quantity;
    const depositAmount = Math.round(totalRevenue * depositPercent);

    // Calculate required ingredients
    const requiredIngredients: IngredientRequirement[] = [];

    // Cups
    requiredIngredients.push({
      ingredientId: 'cup',
      amount: quantity,
      unit: 'ly',
    });

    // Other ingredients from recipe
    recipe.ingredients.forEach((ingReq) => {
      if (ingReq.ingredientId === 'cup') return;
      requiredIngredients.push({
        ingredientId: ingReq.ingredientId,
        amount: ingReq.amount * quantity,
        unit: ingReq.unit || 'phần',
      });
    });

    // Total ingredient cost
    const invStore = useInventoryStore.getState();
    const ingredientCostTotal = invStore.calculateRecipeIngredientCost(requiredIngredients);

    // Calculate Risk
    const riskResult = LargeOrderRiskCalculator.calculateRisk({
      baseReliability: customer.reliability,
      depositPercent,
      quantity,
      isUrgent: template.type === 'event',
      averageRating: reviewStore.averageRating,
      previousCancellations: customer.cancelledOrders,
      completedOrders: customer.completedOrders,
    });

    // Calculate Production Duration
    // Base real seconds: e.g. 30 smoothies * 0.4s = 12s, scaled with equipment & employee bonuses
    const speedBonus = shopStore.getBlenderSpeedBonus(); // e.g. 0.35 = 35% faster
    const netSpeedMultiplier = Math.max(0.4, 1 - speedBonus);
    const totalProductionSeconds = Math.max(8, Math.round(quantity * BASE_PRODUCTION_SECONDS_PER_SMOOTHIE * netSpeedMultiplier));
    const productionDurationMinutes = Math.round((totalProductionSeconds / 15) * 60); // In-game minutes equivalent

    // Estimate opportunity cost during shop closure (normal traffic revenue)
    const normalPriceAvg = 40000;
    const estimatedNormalCustomers = Math.max(3, Math.round(quantity * 0.12));
    const opportunityCostEstimate = estimatedNormalCustomers * normalPriceAvg;

    const orderId = `large_ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    return {
      id: orderId,
      customer,
      recipeId: recipe.id,
      recipeName: recipe.name,
      recipeIcon: recipe.icon,
      quantity,
      pricePerItem,
      totalRevenue,
      depositPercent,
      depositAmount,
      cancellationRisk: isFirstOrder ? 0.05 : riskResult.riskPercent,
      riskTier: isFirstOrder ? 'very_low' : riskResult.riskTier,
      productionDurationMinutes,
      totalProductionSeconds,
      remainingProductionSeconds: totalProductionSeconds,
      progressCount: 0,
      speedMultiplier: 1.0,
      requiredIngredients,
      status: 'offered',
      createdAtDay: gameStore.day,
      opportunityCostEstimate,
      lostCustomersCount: 0,
      isBoosted: false,
      activeEvent: null,
      ingredientCostTotal,
    };
  }
}
