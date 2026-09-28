import { describe, it, expect, beforeEach } from 'vitest';
import { useEconomyStore } from '../stores/economyStore';
import { useGameStore } from '../stores/gameStore';
import { useShopStore } from '../stores/shopStore';
import { useInvestmentStore } from '../stores/investmentStore';
import { PropertyMarket } from '../systems/investment/PropertyMarket';
import { PropertyInspection } from '../systems/investment/PropertyInspection';
import { RentalManager } from '../systems/investment/RentalManager';
import { PropertyMaintenance } from '../systems/investment/PropertyMaintenance';
import { SaveService } from '../services/SaveService';

describe('FEATURE: Investment System — Land & House', () => {
  beforeEach(() => {
    useEconomyStore.getState().resetEconomy();
    useShopStore.getState().resetShop();
    useGameStore.getState().resetGame();
    useInvestmentStore.getState().resetInvestment();
  });

  it('TEST 1: Initial marketplace has Land and House properties available with realistic prices', () => {
    const invStore = useInvestmentStore.getState();
    expect(invStore.availableLand.length).toBeGreaterThan(0);
    expect(invStore.availableHouses.length).toBeGreaterThan(0);
    expect(invStore.ownedProperties.length).toBe(0);

    // Check realistic pricing
    expect(invStore.availableLand[0].purchasePrice).toBeGreaterThanOrEqual(500000000); // >= 500 Triệu
    expect(invStore.availableHouses[0].purchasePrice).toBeGreaterThanOrEqual(1000000000); // >= 1 Tỷ
  });

  it('TEST 2: Inspecting a property deducts fee and reveals inspection report', () => {
    useEconomyStore.setState({ cash: 2000000000 }); // 2 Tỷ
    const invStore = useInvestmentStore.getState();
    const land = invStore.availableLand[0];

    const initialCash = useEconomyStore.getState().cash;
    const res = invStore.inspectProperty(land.id);
    expect(res.success).toBe(true);
    expect(res.report).toBeDefined();
    expect(res.report?.verifiedOwner).toBe(true);

    expect(useEconomyStore.getState().cash).toBe(initialCash - land.inspectionCost);

    // Property in store should now be marked as isChecked
    const updatedLand = useInvestmentStore.getState().availableLand.find((l) => l.id === land.id);
    expect(updatedLand?.isChecked).toBe(true);
    expect(updatedLand?.inspectionReport).toBeDefined();
  });

  it('TEST 3: Buying land deducts purchase price, moves to owned portfolio, and records transaction', () => {
    useEconomyStore.setState({ cash: 2000000000 }); // 2 Tỷ
    const invStore = useInvestmentStore.getState();
    const land = invStore.availableLand[0];
    const price = land.purchasePrice;

    const res = invStore.buyProperty(land.id, true);
    expect(res.success).toBe(true);

    // Cash deducted
    expect(useEconomyStore.getState().cash).toBe(2000000000 - price);

    // Moved to owned
    const state = useInvestmentStore.getState();
    expect(state.ownedProperties.length).toBe(1);
    expect(state.ownedProperties[0].id).toBe(land.id);
    expect(state.ownedProperties[0].isOwned).toBe(true);
    expect(state.availableLand.find((l) => l.id === land.id)).toBeUndefined();

    // History recorded
    expect(state.investmentHistory.length).toBe(1);
    expect(state.investmentHistory[0].type).toBe('buy');
    expect(state.investmentHistory[0].amount).toBe(-price);
  });

  it('TEST 4: Renting out land or house generates contract and deposits initial rent', () => {
    useEconomyStore.setState({ cash: 2000000000 });
    const invStore = useInvestmentStore.getState();
    const land = invStore.availableLand[0];
    invStore.buyProperty(land.id, true);

    const cashBeforeRent = useEconomyStore.getState().cash;
    const rentRes = useInvestmentStore.getState().rentOutProperty(land.id);
    expect(rentRes.success).toBe(true);
    expect(rentRes.contract).toBeDefined();

    // Deposit paid to cash
    expect(useEconomyStore.getState().cash).toBe(cashBeforeRent + rentRes.contract!.depositAmount);

    const ownedProp = useInvestmentStore.getState().ownedProperties[0];
    expect(ownedProp.isRented).toBe(true);
    expect(ownedProp.activeRentalContract).toBeDefined();
  });

  it('TEST 5: Daily investment tick generates passive rental income payouts', () => {
    useEconomyStore.setState({ cash: 2000000000 });
    const invStore = useInvestmentStore.getState();
    const land = invStore.availableLand[0];
    invStore.buyProperty(land.id, true);
    invStore.rentOutProperty(land.id);

    const cashBeforeTick = useEconomyStore.getState().cash;
    const dailyRent = useInvestmentStore.getState().ownedProperties[0].activeRentalContract!.dailyRent;

    // Simulate 1 day
    useInvestmentStore.getState().tickDailyInvestment(2);

    expect(useEconomyStore.getState().cash).toBe(cashBeforeTick + dailyRent);
    expect(useInvestmentStore.getState().totalRentalIncomeEarned).toBeGreaterThan(0);
  });

  it('TEST 6: Renovating a house restores condition to 100% and increases market value & rent', () => {
    useEconomyStore.setState({ cash: 5000000000 }); // 5 Tỷ
    const invStore = useInvestmentStore.getState();
    const house = invStore.availableHouses[0];
    invStore.buyProperty(house.id, true);

    const initialVal = house.currentMarketValue;
    const res = useInvestmentStore.getState().renovateHouse(house.id);
    expect(res.success).toBe(true);

    const ownedHouse = useInvestmentStore.getState().ownedProperties.find((p) => p.id === house.id) as any;
    expect(ownedHouse.condition).toBe(100);
    expect(ownedHouse.currentMarketValue).toBeGreaterThan(initialVal);
  });

  it('TEST 7: Selling property calculates 2% fee, adds net cash, and records realized profit', () => {
    useEconomyStore.setState({ cash: 5000000000 });
    const invStore = useInvestmentStore.getState();
    const land = invStore.availableLand[0];
    invStore.buyProperty(land.id, true);

    const cashBeforeSell = useEconomyStore.getState().cash;
    const sellRes = useInvestmentStore.getState().sellProperty(land.id);
    expect(sellRes.success).toBe(true);

    expect(useEconomyStore.getState().cash).toBe(cashBeforeSell + sellRes.netReceived);
    expect(useInvestmentStore.getState().ownedProperties.length).toBe(0);
    expect(useInvestmentStore.getState().totalRealizedProfit).toBeDefined();
  });

  it('TEST 8: Cannot sell property while an active rental contract is running until terminated', () => {
    useEconomyStore.setState({ cash: 2000000000 });
    const invStore = useInvestmentStore.getState();
    const land = invStore.availableLand[0];
    invStore.buyProperty(land.id, true);
    invStore.rentOutProperty(land.id);

    const sellRes = useInvestmentStore.getState().sellProperty(land.id);
    expect(sellRes.success).toBe(false);

    // Terminate rental first
    useInvestmentStore.getState().terminateRental(land.id);
    const retrySellRes = useInvestmentStore.getState().sellProperty(land.id);
    expect(retrySellRes.success).toBe(true);
  });

  it('TEST 9: Net Worth correctly combines Cash + Equipment + Real Estate Market Value - Loans', () => {
    useEconomyStore.setState({ cash: 2000000000, bankBalance: 50000000 });
    const invStore = useInvestmentStore.getState();
    const land = invStore.availableLand[0];
    invStore.buyProperty(land.id, true);

    const equipmentVal = useShopStore.getState().getTotalEquipmentValue();
    const propVal = useInvestmentStore.getState().getTotalPropertyMarketValue();
    const netWorth = useEconomyStore.getState().calculateNetWorth(equipmentVal, propVal);

    expect(netWorth).toBe(useEconomyStore.getState().cash + 50000000 + equipmentVal + propVal);
  });

  it('TEST 10: Save and Load preserves owned properties, listings, and investment history', () => {
    useEconomyStore.setState({ cash: 2000000000 });
    const invStore = useInvestmentStore.getState();
    const land = invStore.availableLand[0];
    invStore.buyProperty(land.id, true);

    const saved = SaveService.saveGame();
    expect(saved).toBe(true);

    // Reset
    useInvestmentStore.getState().resetInvestment();
    expect(useInvestmentStore.getState().ownedProperties.length).toBe(0);

    // Load
    const loaded = SaveService.loadGame();
    expect(loaded).toBe(true);
    expect(useInvestmentStore.getState().ownedProperties.length).toBe(1);
    expect(useInvestmentStore.getState().ownedProperties[0].id).toBe(land.id);
  });

  it('TEST 11: formatVND formats >= 1,000,000,000 using chữ "tỷ"', async () => {
    const { formatVND } = await import('../utils/format');
    expect(formatVND(1000000000)).toBe('1 tỷ');
    expect(formatVND(1450000000)).toBe('1,45 tỷ');
    expect(formatVND(3200000000)).toBe('3,2 tỷ');
    expect(formatVND(7800000000)).toBe('7,8 tỷ');
    expect(formatVND(650000000)).toBe('650.000.000đ');
    expect(formatVND(-1500000000)).toBe('-1,5 tỷ');
  });
});
