import { describe, it, expect, beforeEach } from 'vitest';
import { useInvestmentStore, INITIAL_GOLD_HOLDING } from '../stores/investmentStore';
import { useEconomyStore } from '../stores/economyStore';
import { useGameStore } from '../stores/gameStore';
import { useShopStore } from '../stores/shopStore';
import { SaveService } from '../services/SaveService';
import { BackupService } from '../services/BackupService';
import { GOLD_TRANSACTION_FEE, INITIAL_GOLD_PRICE } from '../systems/investment/GoldMarket';

describe('FEATURE: Gold Investment System (Buy & Sell Gold)', () => {
  beforeEach(() => {
    SaveService.clearSave();
  });

  it('TEST 1: Buy gold with cash decreases cash and increases gold holding', () => {
    useEconomyStore.setState({ cash: 100000000 }); // 100M
    useInvestmentStore.setState({
      goldMarket: {
        currentPrice: 12500000,
        yesterdayPrice: 12000000,
        todayChangePercent: 4.17,
        priceHistory: [],
      },
    });

    const res = useInvestmentStore.getState().buyGold(2.0);
    expect(res.success).toBe(true);

    const holding = useInvestmentStore.getState().goldHolding;
    expect(holding.quantity).toBe(2.0);

    const expectedCost = 2.0 * 12500000;
    const expectedFee = expectedCost * GOLD_TRANSACTION_FEE;
    const totalPaid = expectedCost + expectedFee;

    expect(holding.totalInvested).toBe(totalPaid);
    expect(holding.averagePurchasePrice).toBe(totalPaid / 2.0);
    expect(useEconomyStore.getState().cash).toBe(100000000 - totalPaid);

    // Financial transaction recorded
    const history = useInvestmentStore.getState().investmentHistory;
    expect(history.length).toBe(1);
    expect(history[0].propertyType).toBe('gold');
    expect(history[0].type).toBe('buy');
    expect(history[0].amount).toBe(-totalPaid);
  });

  it('TEST 2: Multiple purchases compute weighted average purchase price correctly', () => {
    useEconomyStore.setState({ cash: 200000000 }); // 200M

    // Buy 1: 1 lượng at 10M
    useInvestmentStore.setState({
      goldMarket: {
        currentPrice: 10000000,
        yesterdayPrice: 10000000,
        todayChangePercent: 0,
        priceHistory: [],
      },
    });
    useInvestmentStore.getState().buyGold(1.0);

    // Buy 2: 2 lượng at 15M
    useInvestmentStore.setState({
      goldMarket: {
        currentPrice: 15000000,
        yesterdayPrice: 10000000,
        todayChangePercent: 50,
        priceHistory: [],
      },
    });
    useInvestmentStore.getState().buyGold(2.0);

    const holding = useInvestmentStore.getState().goldHolding;
    expect(holding.quantity).toBe(3.0);

    const cost1 = 1.0 * 10000000 * 1.01;
    const cost2 = 2.0 * 15000000 * 1.01;
    const totalInvested = cost1 + cost2;
    expect(holding.totalInvested).toBe(totalInvested);
    expect(holding.averagePurchasePrice).toBe(Math.round(totalInvested / 3.0));
  });

  it('TEST 3: Partial sell reduces gold holding and increases cash correctly', () => {
    useEconomyStore.setState({ cash: 100000000 });
    useInvestmentStore.setState({
      goldHolding: {
        quantity: 5.0,
        totalInvested: 50000000,
        averagePurchasePrice: 10000000,
        realizedProfit: 0,
      },
      goldMarket: {
        currentPrice: 15000000,
        yesterdayPrice: 14000000,
        todayChangePercent: 7.1,
        priceHistory: [],
      },
    });

    const sellRes = useInvestmentStore.getState().sellGold(2.0);
    expect(sellRes.success).toBe(true);

    const holding = useInvestmentStore.getState().goldHolding;
    expect(holding.quantity).toBe(3.0);
    expect(holding.averagePurchasePrice).toBe(10000000);

    // Revenue: 2 * 15M = 30M, Fee: 300k, Net: 29.7M
    const expectedGross = 2 * 15000000;
    const expectedFee = expectedGross * GOLD_TRANSACTION_FEE;
    const netRevenue = expectedGross - expectedFee;
    const costBasis = 2 * 10000000;
    const profit = netRevenue - costBasis;

    expect(holding.realizedProfit).toBe(profit);
    expect(useEconomyStore.getState().cash).toBe(100000000 + netRevenue);
  });

  it('TEST 4: Full sell clears holding quantity and updates realized profit', () => {
    useEconomyStore.setState({ cash: 50000000 });
    useInvestmentStore.setState({
      goldHolding: {
        quantity: 3.0,
        totalInvested: 30000000,
        averagePurchasePrice: 10000000,
        realizedProfit: 2000000,
      },
      goldMarket: {
        currentPrice: 14000000,
        yesterdayPrice: 12000000,
        todayChangePercent: 16.7,
        priceHistory: [],
      },
    });

    const sellRes = useInvestmentStore.getState().sellGold(3.0);
    expect(sellRes.success).toBe(true);

    const holding = useInvestmentStore.getState().goldHolding;
    expect(holding.quantity).toBe(0);
    expect(holding.totalInvested).toBe(0);
    expect(holding.averagePurchasePrice).toBe(0);

    // Gross: 3 * 14M = 42M, Fee: 420k, Net: 41.58M, Cost: 30M -> Profit: 11.58M
    const netRevenue = 42000000 * 0.99;
    const saleProfit = netRevenue - 30000000;
    expect(holding.realizedProfit).toBe(2000000 + saleProfit);
  });

  it('TEST 5: Unrealized profit and loss calculated accurately on price movement', () => {
    useInvestmentStore.setState({
      goldHolding: {
        quantity: 2.0,
        totalInvested: 20000000, // 10M per lượng
        averagePurchasePrice: 10000000,
        realizedProfit: 0,
      },
      goldMarket: {
        currentPrice: 13000000, // +3M per lượng
        yesterdayPrice: 10000000,
        todayChangePercent: 30,
        priceHistory: [],
      },
    });

    // Current value = 2 * 13M = 26M
    expect(useInvestmentStore.getState().getGoldCurrentValue()).toBe(26000000);
    // Unrealized = 26M - 20M = +6M
    expect(useInvestmentStore.getState().getGoldUnrealizedProfit()).toBe(6000000);

    // Price drop: 8M per lượng
    useInvestmentStore.setState({
      goldMarket: {
        currentPrice: 8000000,
        yesterdayPrice: 13000000,
        todayChangePercent: -38.5,
        priceHistory: [],
      },
    });

    // Current value = 2 * 8M = 16M
    expect(useInvestmentStore.getState().getGoldCurrentValue()).toBe(16000000);
    // Unrealized = 16M - 20M = -4M
    expect(useInvestmentStore.getState().getGoldUnrealizedProfit()).toBe(-4000000);
  });

  it('TEST 6: Net Worth accurately integrates Gold Asset without double counting', () => {
    useEconomyStore.setState({
      cash: 50000000, // 50M
      bankBalance: 20000000, // 20M
      activeLoans: [],
    });

    useShopStore.setState({
      equipment: [],
    });

    useInvestmentStore.setState({
      ownedProperties: [],
      goldHolding: {
        quantity: 4.0,
        totalInvested: 40000000,
        averagePurchasePrice: 10000000,
        realizedProfit: 0,
      },
      goldMarket: {
        currentPrice: 15000000, // 4 * 15M = 60M
        yesterdayPrice: 15000000,
        todayChangePercent: 0,
        priceHistory: [],
      },
    });

    const equipmentVal = useShopStore.getState().getTotalEquipmentValue();
    const propertyVal = useInvestmentStore.getState().getTotalPropertyMarketValue();
    const goldVal = useInvestmentStore.getState().getGoldCurrentValue();

    expect(goldVal).toBe(60000000);
    const netWorth = useEconomyStore.getState().calculateNetWorth(equipmentVal, propertyVal, goldVal);

    // 50M cash + 20M bank + 0 equipment + 0 property + 60M gold = 130M
    expect(netWorth).toBe(130000000);
  });

  it('TEST 7: Save & Load preserves gold holdings and market data', () => {
    useGameStore.setState({ day: 14 });
    useEconomyStore.setState({ cash: 85000000 });
    useInvestmentStore.setState({
      goldHolding: {
        quantity: 3.5,
        totalInvested: 42000000,
        averagePurchasePrice: 12000000,
        realizedProfit: 5500000,
      },
      goldMarket: {
        currentPrice: 14200000,
        yesterdayPrice: 13800000,
        todayChangePercent: 2.9,
        priceHistory: [{ day: 14, price: 14200000, changePercent: 2.9 }],
      },
    });

    // Save
    const saveOk = SaveService.saveGame();
    expect(saveOk).toBe(true);

    // Reset
    useInvestmentStore.getState().resetInvestment();
    expect(useInvestmentStore.getState().goldHolding.quantity).toBe(0);

    // Load
    const loadOk = SaveService.loadGame();
    expect(loadOk).toBe(true);

    const loadedHolding = useInvestmentStore.getState().goldHolding;
    expect(loadedHolding.quantity).toBe(3.5);
    expect(loadedHolding.totalInvested).toBe(42000000);
    expect(loadedHolding.averagePurchasePrice).toBe(12000000);
    expect(loadedHolding.realizedProfit).toBe(5500000);
    expect(useInvestmentStore.getState().goldMarket.currentPrice).toBe(14200000);
  });

  it('TEST 8: Cross-device transfer preserves gold state in portable backup code', () => {
    // Device A
    useGameStore.setState({ day: 18, shopName: 'Tiệm Vàng & Sinh Tố' });
    useEconomyStore.setState({ cash: 120000000 });
    useInvestmentStore.setState({
      goldHolding: {
        quantity: 8.0,
        totalInvested: 96000000,
        averagePurchasePrice: 12000000,
        realizedProfit: 14000000,
      },
      goldMarket: {
        currentPrice: 15500000,
        yesterdayPrice: 15000000,
        todayChangePercent: 3.33,
        priceHistory: [],
      },
    });

    // Export code on Device A
    const backup = BackupService.generateBackupCode();
    expect(backup.metadata.goldQuantity).toBe(8.0);

    // Reset everything on Device B
    SaveService.clearSave();
    expect(useInvestmentStore.getState().goldHolding.quantity).toBe(0);

    // Device B validates & restores
    const validation = BackupService.validateBackupCode(backup.formattedCode);
    expect(validation.success).toBe(true);
    expect(validation.envelope?.metadata.goldQuantity).toBe(8.0);

    const restoreRes = BackupService.restoreFromEnvelope(validation.envelope!);
    expect(restoreRes.success).toBe(true);

    // Verify on Device B
    const bHolding = useInvestmentStore.getState().goldHolding;
    expect(bHolding.quantity).toBe(8.0);
    expect(bHolding.totalInvested).toBe(96000000);
    expect(bHolding.averagePurchasePrice).toBe(12000000);
    expect(bHolding.realizedProfit).toBe(14000000);
    expect(useInvestmentStore.getState().goldMarket.currentPrice).toBe(15500000);
  });

  it('TEST 9: Validation rejects purchases without enough cash or invalid quantities', () => {
    useEconomyStore.setState({ cash: 5000000 }); // 5M cash
    useInvestmentStore.setState({
      goldHolding: { quantity: 1.0, totalInvested: 10000000, averagePurchasePrice: 10000000, realizedProfit: 0 },
      goldMarket: { currentPrice: 12500000, yesterdayPrice: 12000000, todayChangePercent: 4.17, priceHistory: [] },
    });

    // Buying 1 lượng costs > 12.5M -> Fails
    const buyFail = useInvestmentStore.getState().buyGold(1.0);
    expect(buyFail.success).toBe(false);

    // Buying negative / zero -> Fails
    const buyZero = useInvestmentStore.getState().buyGold(0);
    expect(buyZero.success).toBe(false);

    // Selling more than owned (owns 1.0, tries to sell 2.0) -> Fails
    const sellFail = useInvestmentStore.getState().sellGold(2.0);
    expect(sellFail.success).toBe(false);

    // Selling 0 -> Fails
    const sellZero = useInvestmentStore.getState().sellGold(0);
    expect(sellZero.success).toBe(false);
  });
});
