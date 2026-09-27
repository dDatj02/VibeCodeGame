import { describe, it, expect, beforeEach } from 'vitest';
import { useEconomyStore } from '../stores/economyStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useRecipeStore } from '../stores/recipeStore';
import { useCustomerStore } from '../stores/customerStore';
import { useReviewStore } from '../stores/reviewStore';
import { useShopStore } from '../stores/shopStore';
import { useGameStore } from '../stores/gameStore';
import { OrderSystem } from '../systems/OrderSystem';
import { LOAN_PRODUCTS } from '../data/loans';
import { SaveService } from '../services/SaveService';

describe('Quán Sinh Tố - Core Game Systems', () => {
  beforeEach(() => {
    useEconomyStore.getState().resetEconomy();
    useInventoryStore.getState().resetInventory();
    useRecipeStore.getState().resetRecipes();
    useCustomerStore.getState().resetDailyCustomerMetrics();
    useCustomerStore.getState().clearQueue();
    useReviewStore.getState().resetReviews();
    useShopStore.getState().resetShop();
  });

  it('TEST 1: Starting economy state is correct (500.000đ cash, 500 credit score)', () => {
    const econ = useEconomyStore.getState();
    expect(econ.cash).toBe(500000);
    expect(econ.creditScore).toBe(500);
    expect(econ.activeLoans.length).toBe(0);
  });

  it('TEST 2: Purchasing ingredients deducts cash and increments stock', () => {
    const inv = useInventoryStore.getState();
    const econ = useEconomyStore.getState();

    const mango = inv.ingredients.find((i) => i.id === 'mango');
    expect(mango).toBeDefined();
    const initialStock = mango!.currentStock;

    // Buy 5 units of mango
    const purchase = inv.buyIngredient('mango', 5);
    expect(purchase.success).toBe(true);
    expect(purchase.totalCost).toBe(mango!.basePrice * 5);

    econ.deductCash(purchase.totalCost);

    const updatedMango = useInventoryStore.getState().ingredients.find((i) => i.id === 'mango');
    expect(updatedMango!.currentStock).toBe(initialStock + 5);
    expect(useEconomyStore.getState().cash).toBe(500000 - purchase.totalCost);
  });

  it('TEST 3: Order serving consumes ingredients and pays revenue', () => {
    // Spawn a customer
    const spawned = useCustomerStore.getState().spawnCustomer(['smoothie_mango'], 5);
    expect(spawned).toBeDefined();
    expect(useCustomerStore.getState().activeCustomers.length).toBe(1);

    const recipe = useRecipeStore.getState().getRecipeById('smoothie_mango');
    expect(recipe).toBeDefined();

    const initialCash = useEconomyStore.getState().cash;
    const initialMangoStock = useInventoryStore.getState().ingredients.find((i) => i.id === 'mango')!.currentStock;

    // Serve order
    const result = OrderSystem.serveOrder(spawned!.id);
    expect(result.success).toBe(true);
    expect(result.revenue).toBeGreaterThanOrEqual(recipe!.currentSellingPrice);

    // Cash should have increased
    expect(useEconomyStore.getState().cash).toBeGreaterThan(initialCash);

    // Mango stock should have decreased by 1
    const finalMangoStock = useInventoryStore.getState().ingredients.find((i) => i.id === 'mango')!.currentStock;
    expect(finalMangoStock).toBe(initialMangoStock - 1);

    // Customer queue should now be empty
    expect(useCustomerStore.getState().activeCustomers.length).toBe(0);
  });

  it('TEST 4: Taking a bank loan provides liquidity, records debt and repayment schedule', () => {
    const econ = useEconomyStore.getState();
    const bankLoanProduct = LOAN_PRODUCTS.find((l) => l.id === 'bank_starter');
    expect(bankLoanProduct).toBeDefined();

    const success = econ.takeLoan(bankLoanProduct!);
    expect(success).toBe(true);

    const updatedEcon = useEconomyStore.getState();
    expect(updatedEcon.cash).toBe(500000 + bankLoanProduct!.principal);
    expect(updatedEcon.activeLoans.length).toBe(1);
    expect(updatedEcon.activeLoans[0].remainingPrincipal).toBe(bankLoanProduct!.principal * 1.08);

    // Simulate daily loan payment
    const dailyResult = econ.payLoanDaily();
    expect(dailyResult.totalPaid).toBe(bankLoanProduct!.dailyPayment);
  });

  it('TEST 5: Fast cash loan with higher rate can be taken without credit constraints', () => {
    const econ = useEconomyStore.getState();
    const fastCash = LOAN_PRODUCTS.find((l) => l.id === 'fast_cash')!;
    const success = econ.takeLoan(fastCash);
    expect(success).toBe(true);

    expect(useEconomyStore.getState().cash).toBe(500000 + fastCash.principal);
  });

  it('TEST 6: Save and load preserves full game state', () => {
    const econ = useEconomyStore.getState();
    econ.addCash(150000); // 650.000đ

    const saved = SaveService.saveGame();
    expect(saved).toBe(true);

    // Reset stores
    useEconomyStore.getState().resetEconomy();
    expect(useEconomyStore.getState().cash).toBe(500000);

    // Load
    const loaded = SaveService.loadGame();
    expect(loaded).toBe(true);
    expect(useEconomyStore.getState().cash).toBe(650000);
  });

  it('TEST 7: When customer 1 is served, next customer stepping up to counter gets full fresh patience', () => {
    const custStore = useCustomerStore.getState();
    const c1 = custStore.spawnCustomer(['smoothie_mango'], 5)!;
    const c2 = custStore.spawnCustomer(['smoothie_avocado'], 5)!;

    expect(c1).toBeDefined();
    expect(c2).toBeDefined();

    // Advance time so c1 has only 3 seconds left
    const elapsed = c1.maxPatience - 3;
    custStore.tickPatience(elapsed);

    const customersBefore = useCustomerStore.getState().activeCustomers;
    expect(Math.round(customersBefore[0].remainingPatience)).toBe(3);

    // Serve c1
    custStore.serveCustomer(c1.id);

    // c2 should now be at position 1 and have full fresh patience
    const customersAfter = useCustomerStore.getState().activeCustomers;
    expect(customersAfter.length).toBe(1);
    expect(customersAfter[0].id).toBe(c2.id);
    expect(customersAfter[0].remainingPatience).toBe(c2.maxPatience);
  });

  it('TEST 8: Watermelon ingredient, recipe, and custom shop profile with avatar work properly', () => {
    const inv = useInventoryStore.getState();
    const watermelon = inv.ingredients.find((i) => i.id === 'watermelon');
    expect(watermelon).toBeDefined();
    expect(watermelon?.icon).toBe('🍉');
    expect(watermelon?.currentStock).toBeGreaterThan(0);

    const recipes = useRecipeStore.getState().recipes;
    const watermelonSmoothie = recipes.find((r) => r.id === 'smoothie_watermelon');
    expect(watermelonSmoothie).toBeDefined();
    expect(watermelonSmoothie?.icon).toBe('🍉');

    // Test shop profile customization
    useGameStore.getState().setShopProfile('Tiệm Sinh Tố Dưa Hấu Chill', '🍉');
    expect(useGameStore.getState().shopName).toBe('Tiệm Sinh Tố Dưa Hấu Chill');
    expect(useGameStore.getState().shopAvatar).toBe('🍉');
  });
});
