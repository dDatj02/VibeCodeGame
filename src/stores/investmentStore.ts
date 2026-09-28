import { create } from 'zustand';
import { 
  LandProperty, 
  HouseProperty, 
  PropertyItem, 
  InvestmentTransaction, 
  InspectionReport,
  TenantType,
  RentalContract,
  GoldHolding,
  GoldMarketState
} from '../types/investment';
import { INITIAL_LAND_PROPERTIES, INITIAL_HOUSE_PROPERTIES } from '../data/properties';
import { PropertyMarket } from '../systems/investment/PropertyMarket';
import { PropertyInspection } from '../systems/investment/PropertyInspection';
import { RentalManager } from '../systems/investment/RentalManager';
import { PropertyMaintenance } from '../systems/investment/PropertyMaintenance';
import { PropertyEventGenerator } from '../systems/investment/PropertyEventGenerator';
import { GoldMarket, INITIAL_GOLD_MARKET, GOLD_TRANSACTION_FEE } from '../systems/investment/GoldMarket';
import { useEconomyStore } from './economyStore';
import { useGameStore } from './gameStore';
import { audioService } from '../services/AudioService';
import { formatVND } from '../utils/format';

export const INITIAL_GOLD_HOLDING: GoldHolding = {
  quantity: 0,
  totalInvested: 0,
  averagePurchasePrice: 0,
  realizedProfit: 0,
};

interface InvestmentState {
  availableLand: LandProperty[];
  availableHouses: HouseProperty[];
  ownedProperties: (LandProperty | HouseProperty)[];
  investmentHistory: InvestmentTransaction[];
  totalRealizedProfit: number;
  totalRentalIncomeEarned: number;
  selectedPropertyModal: PropertyItem | null;
  inspectionResultModal: { property: PropertyItem; report: InspectionReport } | null;
  activeCategoryTab: 'all' | 'land' | 'house' | 'gold' | 'commercial';

  // Gold Investment State
  goldHolding: GoldHolding;
  goldMarket: GoldMarketState;
  isBuyGoldModalOpen: boolean;
  isSellGoldModalOpen: boolean;

  // Actions
  setActiveCategoryTab: (tab: 'all' | 'land' | 'house' | 'gold' | 'commercial') => void;
  openPropertyModal: (property: PropertyItem) => void;
  closePropertyModal: () => void;
  closeInspectionModal: () => void;

  openBuyGoldModal: () => void;
  closeBuyGoldModal: () => void;
  openSellGoldModal: () => void;
  closeSellGoldModal: () => void;
  
  buyProperty: (propertyId: string, bypassInspection: boolean) => { success: boolean; message: string };
  inspectProperty: (propertyId: string) => { success: boolean; report?: InspectionReport };
  sellProperty: (propertyId: string) => { success: boolean; netReceived: number; realizedProfit: number };
  rentOutProperty: (propertyId: string, tenantType?: TenantType) => { success: boolean; contract?: RentalContract };
  terminateRental: (propertyId: string) => { success: boolean };
  renovateHouse: (propertyId: string) => { success: boolean; cost: number };
  repairMaintenance: (propertyId: string, cost: number) => { success: boolean };
  convertPropertyToShop: (propertyId: string) => { success: boolean };

  // Gold Actions
  buyGold: (quantity: number) => { success: boolean; message: string; totalCost?: number };
  sellGold: (quantity: number) => { success: boolean; message: string; netRevenue?: number; realizedProfit?: number };

  tickDailyInvestment: (currentDay: number) => void;
  getTotalPropertyMarketValue: () => number;
  getGoldCurrentValue: () => number;
  getTotalInvestmentValue: () => number;
  getTotalUnrealizedProfit: () => number;
  getGoldUnrealizedProfit: () => number;
  getTotalDailyRentalIncome: () => number;
  getTotalMonthlyRentalIncome: () => number;
  resetInvestment: () => void;
}

export const useInvestmentStore = create<InvestmentState>((set, get) => ({
  availableLand: INITIAL_LAND_PROPERTIES,
  availableHouses: INITIAL_HOUSE_PROPERTIES,
  ownedProperties: [],
  investmentHistory: [],
  totalRealizedProfit: 0,
  totalRentalIncomeEarned: 0,
  selectedPropertyModal: null,
  inspectionResultModal: null,
  activeCategoryTab: 'all',

  goldHolding: INITIAL_GOLD_HOLDING,
  goldMarket: INITIAL_GOLD_MARKET,
  isBuyGoldModalOpen: false,
  isSellGoldModalOpen: false,

  setActiveCategoryTab: (tab) => set({ activeCategoryTab: tab }),
  openPropertyModal: (property) => set({ selectedPropertyModal: property }),
  closePropertyModal: () => set({ selectedPropertyModal: null }),
  closeInspectionModal: () => set({ inspectionResultModal: null }),

  openBuyGoldModal: () => set({ isBuyGoldModalOpen: true }),
  closeBuyGoldModal: () => set({ isBuyGoldModalOpen: false }),
  openSellGoldModal: () => set({ isSellGoldModalOpen: true }),
  closeSellGoldModal: () => set({ isSellGoldModalOpen: false }),

  buyProperty: (propertyId: string, bypassInspection: boolean) => {
    const { availableLand, availableHouses, ownedProperties, investmentHistory } = get();
    const econ = useEconomyStore.getState();
    const game = useGameStore.getState();

    // Find in available
    const land = availableLand.find((l) => l.id === propertyId);
    const house = availableHouses.find((h) => h.id === propertyId);
    const property = land || house;

    if (!property) return { success: false, message: 'Bất động sản không tồn tại!' };

    // Check cash
    if (econ.cash < property.purchasePrice) {
      audioService.playDisappointed();
      game.showNotification('Không đủ tiền mặt để mua bất động sản này!', 'error');
      return { success: false, message: 'Không đủ tiền mặt' };
    }

    // Deduct cash
    econ.deductCash(property.purchasePrice);

    // Build owned property object
    const boughtProperty: PropertyItem = {
      ...property,
      isOwned: true,
      originalPurchasePrice: property.purchasePrice,
      purchasedAtDay: game.day,
      lastValueUpdateDay: game.day,
    };

    // Remove from available and add to owned
    const newAvailableLand = availableLand.filter((l) => l.id !== propertyId);
    const newAvailableHouses = availableHouses.filter((h) => h.id !== propertyId);
    const newOwned = [boughtProperty, ...ownedProperties];

    // Record transaction
    const tx: InvestmentTransaction = {
      id: `tx_buy_${Date.now()}`,
      day: game.day,
      type: 'buy',
      propertyId: property.id,
      propertyName: property.name,
      propertyType: property.propertyType,
      amount: -property.purchasePrice,
      description: `Mua ${property.propertyType === 'land' ? 'lô đất' : 'căn nhà'} "${property.name}"`,
    };

    audioService.playCashRegister();
    game.showNotification(`Chúc mừng! Bạn đã sở hữu ${property.name} 🎉`, 'success');

    set({
      availableLand: newAvailableLand,
      availableHouses: newAvailableHouses,
      ownedProperties: newOwned,
      investmentHistory: [tx, ...investmentHistory],
      selectedPropertyModal: null,
    });

    return { success: true, message: 'Mua thành công' };
  },

  inspectProperty: (propertyId: string) => {
    const { availableLand, availableHouses } = get();
    const econ = useEconomyStore.getState();
    const game = useGameStore.getState();

    const land = availableLand.find((l) => l.id === propertyId);
    const house = availableHouses.find((h) => h.id === propertyId);
    const property = land || house;

    if (!property) return { success: false };

    if (econ.cash < property.inspectionCost) {
      audioService.playDisappointed();
      game.showNotification('Không đủ tiền để thuê luật sư/thẩm định!', 'error');
      return { success: false };
    }

    econ.deductCash(property.inspectionCost);

    const report = PropertyInspection.inspect(property);
    const updatedProperty: PropertyItem = {
      ...property,
      isChecked: true,
      inspectionReport: report,
    };

    const newAvailableLand = availableLand.map((l) => (l.id === propertyId ? (updatedProperty as LandProperty) : l));
    const newAvailableHouses = availableHouses.map((h) => (h.id === propertyId ? (updatedProperty as HouseProperty) : h));

    const tx: InvestmentTransaction = {
      id: `tx_inspect_${Date.now()}`,
      day: game.day,
      type: 'inspection',
      propertyId: property.id,
      propertyName: property.name,
      propertyType: property.propertyType,
      amount: -property.inspectionCost,
      description: `Phí thẩm định pháp lý "${property.name}"`,
    };

    audioService.playClick();
    game.showNotification(`Đã hoàn tất thẩm định cho ${property.name}!`, 'info');

    set({
      availableLand: newAvailableLand,
      availableHouses: newAvailableHouses,
      selectedPropertyModal: updatedProperty,
      inspectionResultModal: { property: updatedProperty, report },
      investmentHistory: [tx, ...get().investmentHistory],
    });

    return { success: true, report };
  },

  sellProperty: (propertyId: string) => {
    const { ownedProperties, investmentHistory, totalRealizedProfit } = get();
    const econ = useEconomyStore.getState();
    const game = useGameStore.getState();

    const property = ownedProperties.find((p) => p.id === propertyId);
    if (!property) return { success: false, netReceived: 0, realizedProfit: 0 };

    if (property.isRented) {
      audioService.playDisappointed();
      game.showNotification('Không thể bán BĐS đang cho thuê! Vui lòng thanh lý hợp đồng trước.', 'warning');
      return { success: false, netReceived: 0, realizedProfit: 0 };
    }

    const originalCost = property.originalPurchasePrice || property.purchasePrice;
    const saleValue = property.currentMarketValue;
    const brokerFee = Math.round(saleValue * 0.02); // 2% broker fee
    const netReceived = saleValue - brokerFee;
    const realized = netReceived - originalCost;

    // Add cash to player
    econ.addCash(netReceived);

    const updatedOwned = ownedProperties.filter((p) => p.id !== propertyId);

    const tx: InvestmentTransaction = {
      id: `tx_sell_${Date.now()}`,
      day: game.day,
      type: 'sell',
      propertyId: property.id,
      propertyName: property.name,
      propertyType: property.propertyType,
      amount: netReceived,
      realizedProfit: realized,
      description: `Bán ${property.name} (${realized >= 0 ? 'Lãi' : 'Lỗ'} ${formatVND(Math.abs(realized))})`,
    };

    if (realized >= 0) {
      audioService.playCashRegister();
      game.showNotification(`Chốt lời thành công ${property.name}: +${formatVND(realized)}! 🎉`, 'success');
    } else {
      audioService.playDisappointed();
      game.showNotification(`Đã bán cắt lỗ ${property.name}: ${formatVND(realized)}`, 'warning');
    }

    set({
      ownedProperties: updatedOwned,
      totalRealizedProfit: totalRealizedProfit + realized,
      investmentHistory: [tx, ...investmentHistory],
      selectedPropertyModal: null,
    });

    return { success: true, netReceived, realizedProfit: realized };
  },

  rentOutProperty: (propertyId: string, tenantType?: TenantType) => {
    const { ownedProperties, investmentHistory } = get();
    const game = useGameStore.getState();
    const econ = useEconomyStore.getState();

    const property = ownedProperties.find((p) => p.id === propertyId);
    if (!property || property.isRented) return { success: false };

    const contract = RentalManager.createContract(property, tenantType);
    
    // Receive 1st month deposit
    econ.addCash(contract.depositAmount);

    const updatedOwned = ownedProperties.map((p) => {
      if (p.id === propertyId) {
        return {
          ...p,
          isRented: true,
          activeRentalContract: contract,
        };
      }
      return p;
    });

    const tx: InvestmentTransaction = {
      id: `tx_deposit_${Date.now()}`,
      day: game.day,
      type: 'rent_income',
      propertyId: property.id,
      propertyName: property.name,
      propertyType: property.propertyType,
      amount: contract.depositAmount,
      description: `Nhận cọc thuê từ khách ${contract.tenantName} (${contract.tenantType})`,
    };

    audioService.playCashRegister();
    game.showNotification(`Đã ký hợp đồng cho thuê ${property.name} với ${contract.tenantName}! (+${formatVND(contract.depositAmount)} cọc)`, 'success');

    set({
      ownedProperties: updatedOwned,
      investmentHistory: [tx, ...investmentHistory],
      selectedPropertyModal: updatedOwned.find((p) => p.id === propertyId) || null,
    });

    return { success: true, contract };
  },

  terminateRental: (propertyId: string) => {
    const { ownedProperties, investmentHistory } = get();
    const game = useGameStore.getState();

    const property = ownedProperties.find((p) => p.id === propertyId);
    if (!property || !property.isRented) return { success: false };

    const updatedOwned = ownedProperties.map((p) => {
      if (p.id === propertyId) {
        return {
          ...p,
          isRented: false,
          activeRentalContract: null,
        };
      }
      return p;
    });

    const tx: InvestmentTransaction = {
      id: `tx_term_${Date.now()}`,
      day: game.day,
      type: 'rent_income',
      propertyId: property.id,
      propertyName: property.name,
      propertyType: property.propertyType,
      amount: 0,
      description: `Chấm dứt hợp đồng thuê tại "${property.name}"`,
    };

    audioService.playClick();
    game.showNotification(`Đã lấy lại mặt bằng tại ${property.name}!`, 'info');

    set({
      ownedProperties: updatedOwned,
      investmentHistory: [tx, ...investmentHistory],
      selectedPropertyModal: updatedOwned.find((p) => p.id === propertyId) || null,
    });

    return { success: true };
  },

  renovateHouse: (propertyId: string) => {
    const { ownedProperties, investmentHistory } = get();
    const econ = useEconomyStore.getState();
    const game = useGameStore.getState();

    const property = ownedProperties.find((p) => p.id === propertyId && p.propertyType === 'house') as HouseProperty | undefined;
    if (!property) return { success: false, cost: 0 };

    if (econ.cash < property.renovationCost) {
      audioService.playDisappointed();
      game.showNotification('Không đủ tiền để đại tu nâng cấp nhà!', 'error');
      return { success: false, cost: 0 };
    }

    econ.deductCash(property.renovationCost);

    const { newCondition, newMarketValue, newRentalIncome } = PropertyMaintenance.calculateRenovationImpact(property);
    const valueIncrease = newMarketValue - property.currentMarketValue;
    const rentalIncrease = newRentalIncome - property.rentalIncomeMonthly;
    const updatedHouse: HouseProperty = {
      ...property,
      condition: newCondition,
      currentMarketValue: newMarketValue,
      rentalIncomeMonthly: newRentalIncome,
    };

    const updatedOwned = ownedProperties.map((p) => (p.id === propertyId ? updatedHouse : p));

    const tx: InvestmentTransaction = {
      id: `tx_renovate_${Date.now()}`,
      day: game.day,
      type: 'renovation',
      propertyId: property.id,
      propertyName: property.name,
      propertyType: 'house',
      amount: -property.renovationCost,
      description: `Đại tu nâng cấp "${property.name}" (+${formatVND(valueIncrease)} giá trị BĐS)`,
    };

    audioService.playCashRegister();
    game.showNotification(`Đã đại tu xong ${property.name}! Giá trị BĐS tăng +${formatVND(valueIncrease)}, giá thuê tăng +${formatVND(rentalIncrease)}/tháng.`, 'success');

    set({
      ownedProperties: updatedOwned,
      investmentHistory: [tx, ...investmentHistory],
      selectedPropertyModal: updatedHouse,
    });

    return { success: true, cost: property.renovationCost };
  },

  repairMaintenance: (propertyId: string, cost: number) => {
    const { ownedProperties, investmentHistory } = get();
    const econ = useEconomyStore.getState();
    const game = useGameStore.getState();

    const property = ownedProperties.find((p) => p.id === propertyId && p.propertyType === 'house') as HouseProperty | undefined;
    if (!property) return { success: false };

    if (econ.cash < cost) {
      audioService.playDisappointed();
      game.showNotification('Không đủ tiền để bảo trì sửa chữa!', 'error');
      return { success: false };
    }

    econ.deductCash(cost);
    const updatedHouse: HouseProperty = {
      ...property,
      condition: Math.min(100, property.condition + 25),
    };
    const updatedOwned = ownedProperties.map((p) => (p.id === propertyId ? updatedHouse : p));

    const tx: InvestmentTransaction = {
      id: `tx_repair_${Date.now()}`,
      day: game.day,
      type: 'maintenance',
      propertyId: property.id,
      propertyName: property.name,
      propertyType: 'house',
      amount: -cost,
      description: `Bảo trì sửa chữa hư hỏng định kỳ "${property.name}"`,
    };

    audioService.playClick();
    game.showNotification(`Đã sửa chữa và bảo dưỡng ${property.name} hoàn tất!`, 'success');

    set({
      ownedProperties: updatedOwned,
      investmentHistory: [tx, ...investmentHistory],
      selectedPropertyModal: updatedHouse,
    });

    return { success: true };
  },

  convertPropertyToShop: (propertyId: string) => {
    const { ownedProperties } = get();
    const game = useGameStore.getState();

    const property = ownedProperties.find((p) => p.id === propertyId);
    if (!property) return { success: false };

    const updatedOwned = ownedProperties.map((p) => {
      if (p.id === propertyId) {
        return {
          ...p,
          usedForSmoothieShop: true,
          isRented: false,
          activeRentalContract: null,
        };
      }
      return p;
    });

    audioService.playFanfare();
    game.showNotification(`Đã chuyển địa điểm mở tiệm Sinh Tố sang "${property.name}"! Tiền thuê tiệm mỗi ngày trở về 0đ 🎉`, 'success');

    set({
      ownedProperties: updatedOwned,
      selectedPropertyModal: updatedOwned.find((p) => p.id === propertyId) || null,
    });

    return { success: true };
  },

  // ================= GOLD ACTIONS =================
  buyGold: (quantity: number) => {
    if (quantity <= 0) return { success: false, message: 'Số lượng phải lớn hơn 0' };
    const { goldHolding, goldMarket, investmentHistory } = get();
    const econ = useEconomyStore.getState();
    const game = useGameStore.getState();

    const unitPrice = goldMarket.currentPrice;
    const rawCost = quantity * unitPrice;
    const fee = Math.round(rawCost * GOLD_TRANSACTION_FEE);
    const totalCost = rawCost + fee;

    if (econ.cash < totalCost) {
      audioService.playDisappointed();
      game.showNotification('Không đủ tiền mặt để mua số lượng vàng này!', 'error');
      return { success: false, message: 'Không đủ tiền mặt' };
    }

    // Deduct cash
    econ.deductCash(totalCost);

    // Calculate new holdings
    const newQty = Math.round((goldHolding.quantity + quantity) * 1000) / 1000;
    const newTotalInvested = goldHolding.totalInvested + totalCost;
    const newAvgPrice = Math.round(newTotalInvested / newQty);

    const updatedHolding: GoldHolding = {
      ...goldHolding,
      quantity: newQty,
      totalInvested: newTotalInvested,
      averagePurchasePrice: newAvgPrice,
      lastUpdatedDay: game.day,
    };

    const tx: InvestmentTransaction = {
      id: `tx_gold_buy_${Date.now()}`,
      day: game.day,
      type: 'buy',
      propertyId: 'gold_asset',
      propertyName: 'Vàng 9999',
      propertyType: 'gold',
      amount: -totalCost,
      description: `Mua ${quantity} lượng Vàng 9999 (Giá ${formatVND(unitPrice)}/lượng, phí ${formatVND(fee)})`,
    };

    audioService.playCashRegister();
    game.showNotification(`✓ Đã mua thành công ${quantity} lượng Vàng 9999!`, 'success');

    set({
      goldHolding: updatedHolding,
      investmentHistory: [tx, ...investmentHistory],
      isBuyGoldModalOpen: false,
    });

    return { success: true, message: 'Mua vàng thành công', totalCost };
  },

  sellGold: (quantity: number) => {
    if (quantity <= 0) return { success: false, message: 'Số lượng phải lớn hơn 0' };
    const { goldHolding, goldMarket, investmentHistory, totalRealizedProfit } = get();
    const econ = useEconomyStore.getState();
    const game = useGameStore.getState();

    if (quantity > goldHolding.quantity + 0.0001) {
      audioService.playDisappointed();
      game.showNotification('Số lượng bán vượt quá số vàng bạn đang có!', 'error');
      return { success: false, message: 'Không đủ vàng để bán' };
    }

    const actualSellQty = Math.min(quantity, goldHolding.quantity);
    const unitPrice = goldMarket.currentPrice;
    const rawRevenue = actualSellQty * unitPrice;
    const fee = Math.round(rawRevenue * GOLD_TRANSACTION_FEE);
    const netRevenue = rawRevenue - fee;

    // Cost basis of sold portion
    const costBasis = Math.round(actualSellQty * goldHolding.averagePurchasePrice);
    const saleRealizedProfit = netRevenue - costBasis;

    // Add cash
    econ.addCash(netRevenue);

    // Update holding
    const remainingQty = Math.round((goldHolding.quantity - actualSellQty) * 1000) / 1000;
    let updatedHolding: GoldHolding;

    if (remainingQty <= 0.0001) {
      updatedHolding = {
        quantity: 0,
        totalInvested: 0,
        averagePurchasePrice: 0,
        realizedProfit: goldHolding.realizedProfit + saleRealizedProfit,
        lastUpdatedDay: game.day,
      };
    } else {
      const remainingTotalInvested = Math.max(0, goldHolding.totalInvested - costBasis);
      updatedHolding = {
        quantity: remainingQty,
        totalInvested: remainingTotalInvested,
        averagePurchasePrice: goldHolding.averagePurchasePrice,
        realizedProfit: goldHolding.realizedProfit + saleRealizedProfit,
        lastUpdatedDay: game.day,
      };
    }

    const tx: InvestmentTransaction = {
      id: `tx_gold_sell_${Date.now()}`,
      day: game.day,
      type: 'sell',
      propertyId: 'gold_asset',
      propertyName: 'Vàng 9999',
      propertyType: 'gold',
      amount: netRevenue,
      realizedProfit: saleRealizedProfit,
      description: `Bán ${actualSellQty} lượng Vàng 9999 (Thu về ${formatVND(netRevenue)}, ${saleRealizedProfit >= 0 ? 'Lãi' : 'Lỗ'} ${formatVND(Math.abs(saleRealizedProfit))})`,
    };

    if (saleRealizedProfit >= 0) {
      audioService.playCashRegister();
      game.showNotification(`✓ Đã chốt lời ${actualSellQty} lượng vàng: +${formatVND(saleRealizedProfit)}!`, 'success');
    } else {
      audioService.playClick();
      game.showNotification(`✓ Đã bán ${actualSellQty} lượng vàng (Lỗ ${formatVND(Math.abs(saleRealizedProfit))})`, 'info');
    }

    set({
      goldHolding: updatedHolding,
      totalRealizedProfit: totalRealizedProfit + saleRealizedProfit,
      investmentHistory: [tx, ...investmentHistory],
      isSellGoldModalOpen: false,
    });

    return { success: true, message: 'Bán vàng thành công', netRevenue, realizedProfit: saleRealizedProfit };
  },

  tickDailyInvestment: (currentDay: number) => {
    const { ownedProperties, availableLand, availableHouses, investmentHistory, totalRentalIncomeEarned, goldMarket } = get();
    const econ = useEconomyStore.getState();
    const game = useGameStore.getState();

    let totalDailyRentPayout = 0;
    const newTxList: InvestmentTransaction[] = [];

    // 1. Process rental contracts & rent payouts
    const updatedOwned = ownedProperties.map((p) => {
      if (p.isRented && p.activeRentalContract) {
        const contract = p.activeRentalContract;
        const dailyRent = contract.dailyRent;

        // Tenant payment check based on reliability (reliable tenants pay consistently)
        const rollsPayment = contract.paymentReliability >= 80 ? true : Math.random() * 100 <= contract.paymentReliability;

        if (rollsPayment) {
          totalDailyRentPayout += dailyRent;
          newTxList.push({
            id: `tx_rent_${currentDay}_${p.id}`,
            day: currentDay,
            type: 'rent_income',
            propertyId: p.id,
            propertyName: p.name,
            propertyType: p.propertyType,
            amount: dailyRent,
            description: `Tiền thuê ngày ${currentDay} từ ${contract.tenantName} (${p.name})`,
          });
        }

        const daysLeft = contract.daysRemaining - 1;
        if (daysLeft <= 0) {
          // Contract expired
          game.showNotification(`Hợp đồng thuê tại ${p.name} của ${contract.tenantName} đã kết thúc!`, 'info');
          return {
            ...p,
            isRented: false,
            activeRentalContract: null,
          };
        }

        return {
          ...p,
          activeRentalContract: {
            ...contract,
            daysRemaining: daysLeft,
            isPaidToday: rollsPayment,
          },
        };
      }

      // House condition gradual wear & tear
      if (p.propertyType === 'house') {
        const hp = p as HouseProperty;
        const decay = p.isRented ? 0.5 : 0.2;
        return {
          ...hp,
          condition: Math.max(10, hp.condition - decay),
        };
      }

      return p;
    });

    if (totalDailyRentPayout > 0) {
      econ.addCash(totalDailyRentPayout);
      game.showNotification(`💰 Nhận được ${formatVND(totalDailyRentPayout)} tiền cho thuê BĐS hôm nay!`, 'success');
    }

    // 2. Simulate slight market fluctuations for Real Estate
    const updatedLand = PropertyMarket.simulateMarketDay(availableLand) as LandProperty[];
    const updatedHouses = PropertyMarket.simulateMarketDay(availableHouses) as HouseProperty[];
    const updatedOwnedWithMarket = PropertyMarket.simulateMarketDay(updatedOwned);

    // 3. Roll occasional random Real Estate event
    const event = PropertyEventGenerator.rollDailyEvent(updatedOwnedWithMarket);
    if (event) {
      game.showNotification(`${event.icon} ${event.title}: ${event.description}`, 'info');
      if (event.propertyId) {
        const idx = updatedOwnedWithMarket.findIndex((p) => p.id === event.propertyId);
        if (idx !== -1) {
          const p = updatedOwnedWithMarket[idx];
          if (event.valueDeltaPercent) {
            p.currentMarketValue = Math.round(p.currentMarketValue * (1 + event.valueDeltaPercent));
          }
          if (event.rentalDeltaPercent) {
            if (p.propertyType === 'land') {
              p.rentalPotentialMonthly = Math.round(p.rentalPotentialMonthly * (1 + event.rentalDeltaPercent));
            } else {
              p.rentalIncomeMonthly = Math.round(p.rentalIncomeMonthly * (1 + event.rentalDeltaPercent));
            }
          }
          if (event.conditionDelta && p.propertyType === 'house') {
            (p as HouseProperty).condition = Math.max(20, (p as HouseProperty).condition + event.conditionDelta);
          }
        }
      }
    }

    // 4. Simulate Gold Market Daily Price & Events
    const { updatedMarketState, event: goldEvt } = GoldMarket.simulateDailyGoldPrice(goldMarket, currentDay);
    if (goldEvt) {
      game.showNotification(`${goldEvt.icon} ${goldEvt.title}: ${goldEvt.description} (Giá vàng ${goldEvt.effectPercent >= 0 ? '+' : ''}${Math.round(goldEvt.effectPercent * 100)}%)`, 'info');
    }

    set({
      ownedProperties: updatedOwnedWithMarket,
      availableLand: updatedLand,
      availableHouses: updatedHouses,
      goldMarket: updatedMarketState,
      investmentHistory: [...newTxList, ...investmentHistory],
      totalRentalIncomeEarned: totalRentalIncomeEarned + totalDailyRentPayout,
    });
  },

  getTotalPropertyMarketValue: () => {
    return get().ownedProperties.reduce((sum, p) => sum + p.currentMarketValue, 0);
  },

  getGoldCurrentValue: () => {
    const { goldHolding, goldMarket } = get();
    return Math.round(goldHolding.quantity * goldMarket.currentPrice);
  },

  getTotalInvestmentValue: () => {
    return get().getTotalPropertyMarketValue() + get().getGoldCurrentValue();
  },

  getTotalUnrealizedProfit: () => {
    const propertyUnrealized = get().ownedProperties.reduce((sum, p) => {
      const original = p.originalPurchasePrice || p.purchasePrice;
      return sum + (p.currentMarketValue - original);
    }, 0);
    const goldUnrealized = get().getGoldUnrealizedProfit();
    return propertyUnrealized + goldUnrealized;
  },

  getGoldUnrealizedProfit: () => {
    const { goldHolding, goldMarket } = get();
    if (goldHolding.quantity <= 0) return 0;
    return Math.round(goldHolding.quantity * goldMarket.currentPrice - goldHolding.totalInvested);
  },

  getTotalDailyRentalIncome: () => {
    return get().ownedProperties
      .filter((p) => p.isRented && p.activeRentalContract)
      .reduce((sum, p) => sum + (p.activeRentalContract?.dailyRent || 0), 0);
  },

  getTotalMonthlyRentalIncome: () => {
    return get().ownedProperties
      .filter((p) => p.isRented && p.activeRentalContract)
      .reduce((sum, p) => sum + (p.activeRentalContract?.monthlyRent || 0), 0);
  },

  resetInvestment: () => {
    set({
      availableLand: INITIAL_LAND_PROPERTIES,
      availableHouses: INITIAL_HOUSE_PROPERTIES,
      ownedProperties: [],
      investmentHistory: [],
      totalRealizedProfit: 0,
      totalRentalIncomeEarned: 0,
      selectedPropertyModal: null,
      inspectionResultModal: null,
      activeCategoryTab: 'all',
      goldHolding: INITIAL_GOLD_HOLDING,
      goldMarket: INITIAL_GOLD_MARKET,
      isBuyGoldModalOpen: false,
      isSellGoldModalOpen: false,
    });
  },
}));
