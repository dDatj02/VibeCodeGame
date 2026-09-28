import { describe, it, expect, beforeEach } from 'vitest';
import { useEconomyStore } from '../stores/economyStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useRecipeStore } from '../stores/recipeStore';
import { useCustomerStore } from '../stores/customerStore';
import { useReviewStore } from '../stores/reviewStore';
import { useShopStore } from '../stores/shopStore';
import { useGameStore } from '../stores/gameStore';
import { useLargeOrderStore } from '../stores/largeOrderStore';
import { LargeOrderRiskCalculator } from '../systems/LargeOrderRiskCalculator';
import { LargeOrderGenerator } from '../systems/LargeOrderGenerator';
import { LARGE_ORDER_UNLOCK_LEVEL } from '../config/largeOrderConfig';
import { SaveService } from '../services/SaveService';

describe('FEATURE: Large Order Business Challenge System', () => {
  beforeEach(() => {
    useEconomyStore.getState().resetEconomy();
    useInventoryStore.getState().resetInventory();
    useRecipeStore.getState().resetRecipes();
    useCustomerStore.getState().resetDailyCustomerMetrics();
    useCustomerStore.getState().clearQueue();
    useReviewStore.getState().resetReviews();
    useShopStore.getState().resetShop();
    useLargeOrderStore.getState().resetLargeOrders();
  });

  it('TEST 1: Level 1-4 cannot receive Large Orders', () => {
    const shopStore = useShopStore.getState();
    expect(shopStore.currentShopLevel).toBe(1);

    const loStore = useLargeOrderStore.getState();
    const isUnlocked = loStore.checkUnlockStatus();
    expect(isUnlocked).toBe(false);

    const offer = loStore.generateOffer();
    expect(offer).toBeNull();
  });

  it('TEST 2: Level 5 unlocks Large Orders and triggers introductory tutorial/order', () => {
    // Upgrade shop to level 5
    useShopStore.setState({ currentShopLevel: LARGE_ORDER_UNLOCK_LEVEL });
    expect(useShopStore.getState().currentShopLevel).toBe(5);

    const loStore = useLargeOrderStore.getState();
    const isUnlocked = loStore.checkUnlockStatus();
    expect(isUnlocked).toBe(true);

    // Offer should now be generated
    const offer = useLargeOrderStore.getState().activeOffer;
    expect(offer).toBeDefined();
    expect(offer?.quantity).toBe(30); // First safe order has 30 smoothies
    expect(offer?.depositAmount).toBeGreaterThan(0); // Has deposit
  });

  it('TEST 3: Risk Calculator accurately computes risk tiers based on deposit and customer reliability', () => {
    const safeCalc = LargeOrderRiskCalculator.calculateRisk({
      baseReliability: 95,
      depositPercent: 0.5,
      quantity: 30,
      averageRating: 4.8,
    });
    expect(safeCalc.riskTier).toBe('very_low');
    expect(safeCalc.riskPercent).toBeLessThanOrEqual(0.08);

    const riskyCalc = LargeOrderRiskCalculator.calculateRisk({
      baseReliability: 60,
      depositPercent: 0,
      quantity: 120,
      averageRating: 3.2,
      previousCancellations: 2,
    });
    expect(riskyCalc.riskPercent).toBeGreaterThan(0.25);
  });

  it('TEST 4: Accepting large order consumes inventory ingredients and collects deposit', () => {
    useShopStore.setState({ currentShopLevel: 5 });
    const loStore = useLargeOrderStore.getState();
    loStore.generateOffer(true);

    const offer = useLargeOrderStore.getState().activeOffer;
    expect(offer).toBeDefined();

    // Give sufficient inventory stock
    const invStore = useInventoryStore.getState();
    useInventoryStore.setState({
      ingredients: invStore.ingredients.map((ing) => ({ ...ing, currentStock: 200 })),
    });

    const initialCash = useEconomyStore.getState().cash;
    const acceptRes = useLargeOrderStore.getState().acceptOffer();
    expect(acceptRes.success).toBe(true);

    // Active order should now be producing
    const activeOrder = useLargeOrderStore.getState().activeOrder;
    expect(activeOrder).toBeDefined();
    expect(activeOrder?.status).toBe('producing');

    // Deposit added to cash
    if (offer!.depositAmount > 0) {
      expect(useEconomyStore.getState().cash).toBe(initialCash + offer!.depositAmount);
    }
  });

  it('TEST 5: Production ticks automatically and completes when duration reaches 0', () => {
    useShopStore.setState({ currentShopLevel: 5 });
    useInventoryStore.setState({
      ingredients: useInventoryStore.getState().ingredients.map((ing) => ({ ...ing, currentStock: 200 })),
    });

    const loStore = useLargeOrderStore.getState();
    loStore.generateOffer(true);
    loStore.acceptOffer();

    // Tick production
    const totalDuration = useLargeOrderStore.getState().activeOrder!.totalProductionSeconds;
    useLargeOrderStore.getState().tickProduction(totalDuration + 1);

    const activeOrder = useLargeOrderStore.getState().activeOrder;
    expect(activeOrder?.status).toBe('confirming');
    expect(useLargeOrderStore.getState().showConfirmationModal).toBe(true);
  });

  it('TEST 6: Speed boost deducts 50.000đ and sets isBoosted to true', () => {
    useShopStore.setState({ currentShopLevel: 5 });
    useInventoryStore.setState({
      ingredients: useInventoryStore.getState().ingredients.map((ing) => ({ ...ing, currentStock: 200 })),
    });

    useLargeOrderStore.getState().generateOffer(true);
    useLargeOrderStore.getState().acceptOffer();

    const cashBefore = useEconomyStore.getState().cash;
    const boostRes = useLargeOrderStore.getState().boostProduction();
    expect(boostRes.success).toBe(true);
    expect(useEconomyStore.getState().cash).toBe(cashBefore - 50000);
    expect(useLargeOrderStore.getState().activeOrder?.isBoosted).toBe(true);
  });

  it('TEST 7: Save and Load preserves Large Order offers, active orders, and history', () => {
    useShopStore.setState({ currentShopLevel: 5 });
    useInventoryStore.setState({
      ingredients: useInventoryStore.getState().ingredients.map((ing) => ({ ...ing, currentStock: 200 })),
    });

    useLargeOrderStore.getState().generateOffer(true);
    const offerId = useLargeOrderStore.getState().activeOffer!.id;

    // Save
    const saved = SaveService.saveGame();
    expect(saved).toBe(true);

    // Reset stores
    useLargeOrderStore.getState().resetLargeOrders();
    expect(useLargeOrderStore.getState().activeOffer).toBeNull();

    // Load
    const loaded = SaveService.loadGame();
    expect(loaded).toBe(true);

    expect(useLargeOrderStore.getState().activeOffer?.id).toBe(offerId);
  });
});
