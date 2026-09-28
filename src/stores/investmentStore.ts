import { create } from 'zustand';
import { 
  LandProperty, 
  HouseProperty, 
  PropertyItem, 
  InvestmentTransaction, 
  InspectionReport,
  TenantType,
  RentalContract,
  InvestmentEvent 
} from '../types/investment';
import { INITIAL_LAND_PROPERTIES, INITIAL_HOUSE_PROPERTIES } from '../data/properties';
import { PropertyMarket } from '../systems/investment/PropertyMarket';
import { PropertyInspection } from '../systems/investment/PropertyInspection';
import { RentalManager } from '../systems/investment/RentalManager';
import { PropertyMaintenance } from '../systems/investment/PropertyMaintenance';
import { PropertyEventGenerator } from '../systems/investment/PropertyEventGenerator';
import { useEconomyStore } from './economyStore';
import { useGameStore } from './gameStore';
import { audioService } from '../services/AudioService';
import { formatVND } from '../utils/format';

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

  // Actions
  setActiveCategoryTab: (tab: 'all' | 'land' | 'house' | 'gold' | 'commercial') => void;
  openPropertyModal: (property: PropertyItem) => void;
  closePropertyModal: () => void;
  closeInspectionModal: () => void;
  
  buyProperty: (propertyId: string, bypassInspection: boolean) => { success: boolean; message: string };
  inspectProperty: (propertyId: string) => { success: boolean; report?: InspectionReport };
  sellProperty: (propertyId: string) => { success: boolean; netReceived: number; realizedProfit: number };
  rentOutProperty: (propertyId: string, tenantType?: TenantType) => { success: boolean; contract?: RentalContract };
  terminateRental: (propertyId: string) => { success: boolean };
  renovateHouse: (propertyId: string) => { success: boolean; cost: number };
  repairMaintenance: (propertyId: string, cost: number) => { success: boolean };
  convertPropertyToShop: (propertyId: string) => { success: boolean };

  tickDailyInvestment: (currentDay: number) => void;
  getTotalPropertyMarketValue: () => number;
  getTotalUnrealizedProfit: () => number;
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

  setActiveCategoryTab: (tab) => set({ activeCategoryTab: tab }),
  openPropertyModal: (property) => set({ selectedPropertyModal: property }),
  closePropertyModal: () => set({ selectedPropertyModal: null }),
  closeInspectionModal: () => set({ inspectionResultModal: null }),

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

    set({
      availableLand: newAvailableLand,
      availableHouses: newAvailableHouses,
      ownedProperties: newOwned,
      investmentHistory: [tx, ...investmentHistory],
      selectedPropertyModal: null,
    });

    audioService.playCashRegister();
    game.showNotification(
      `🎉 Chúc mừng bạn đã sở hữu ${property.propertyType === 'land' ? 'lô đất' : 'căn nhà'} "${property.name}"!`,
      'success'
    );

    return { success: true, message: 'Mua thành công' };
  },

  inspectProperty: (propertyId: string) => {
    const { availableLand, availableHouses, ownedProperties, investmentHistory } = get();
    const econ = useEconomyStore.getState();
    const game = useGameStore.getState();

    let target = availableLand.find((p) => p.id === propertyId) 
      || availableHouses.find((p) => p.id === propertyId)
      || ownedProperties.find((p) => p.id === propertyId);

    if (!target) return { success: false };

    if (econ.cash < target.inspectionCost) {
      audioService.playDisappointed();
      game.showNotification('Không đủ tiền mặt để thuê chuyên gia thẩm định!', 'error');
      return { success: false };
    }

    econ.deductCash(target.inspectionCost);
    const report = PropertyInspection.inspect(target);

    // Update property with inspected status
    const updateProp = (p: PropertyItem) => p.id === propertyId ? { ...p, isChecked: true, inspectionReport: report } : p;

    const tx: InvestmentTransaction = {
      id: `tx_inspect_${Date.now()}`,
      day: game.day,
      type: 'inspection',
      propertyId: target.id,
      propertyName: target.name,
      propertyType: target.propertyType,
      amount: -target.inspectionCost,
      description: `Thẩm định pháp lý & quy hoạch "${target.name}"`,
    };

    const updatedTarget = { ...target, isChecked: true, inspectionReport: report };

    set({
      availableLand: availableLand.map((p) => updateProp(p) as LandProperty),
      availableHouses: availableHouses.map((p) => updateProp(p) as HouseProperty),
      ownedProperties: ownedProperties.map(updateProp),
      investmentHistory: [tx, ...investmentHistory],
      inspectionResultModal: { property: updatedTarget, report },
      selectedPropertyModal: updatedTarget,
    });

    audioService.playFanfare();
    game.showNotification(`Đã hoàn tất báo cáo thẩm định cho "${target.name}"!`, 'success');

    return { success: true, report };
  },

  sellProperty: (propertyId: string) => {
    const { ownedProperties, investmentHistory, totalRealizedProfit } = get();
    const econ = useEconomyStore.getState();
    const game = useGameStore.getState();

    const target = ownedProperties.find((p) => p.id === propertyId);
    if (!target) return { success: false, netReceived: 0, realizedProfit: 0 };

    if (target.isRented) {
      audioService.playDisappointed();
      game.showNotification('Không thể bán khi đang có hợp đồng cho thuê hiệu lực! Hãy chấm dứt hợp đồng thuê trước.', 'warning');
      return { success: false, netReceived: 0, realizedProfit: 0 };
    }

    const { netReceived, fee, realizedProfit } = PropertyMarket.calculateSellingProceeds(target);

    // Add proceeds to cash
    econ.addCash(netReceived);

    const newOwned = ownedProperties.filter((p) => p.id !== propertyId);

    const tx: InvestmentTransaction = {
      id: `tx_sell_${Date.now()}`,
      day: game.day,
      type: 'sell',
      propertyId: target.id,
      propertyName: target.name,
      propertyType: target.propertyType,
      amount: netReceived,
      realizedProfit,
      description: `Bán "${target.name}" thu về ${formatVND(netReceived)} (Lãi: ${realizedProfit >= 0 ? '+' : ''}${formatVND(realizedProfit)})`,
    };

    set({
      ownedProperties: newOwned,
      investmentHistory: [tx, ...investmentHistory],
      totalRealizedProfit: totalRealizedProfit + realizedProfit,
      selectedPropertyModal: null,
    });

    audioService.playCashRegister();
    game.showNotification(
      `Đã chuyển nhượng "${target.name}". Thu về ${formatVND(netReceived)} (${realizedProfit >= 0 ? 'Lãi +' : 'Lỗ '}${formatVND(realizedProfit)})!`,
      realizedProfit >= 0 ? 'success' : 'warning'
    );

    return { success: true, netReceived, realizedProfit };
  },

  rentOutProperty: (propertyId: string, preferredType?: TenantType) => {
    const { ownedProperties, investmentHistory } = get();
    const game = useGameStore.getState();
    const econ = useEconomyStore.getState();

    const target = ownedProperties.find((p) => p.id === propertyId);
    if (!target || target.isRented) return { success: false };

    const contract = RentalManager.createContract(target, preferredType);
    
    // Receive 1st day rent + deposit
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
      id: `tx_rent_start_${Date.now()}`,
      day: game.day,
      type: 'rent_income',
      propertyId: target.id,
      propertyName: target.name,
      propertyType: target.propertyType,
      amount: contract.depositAmount,
      description: `Nhận tiền cọc thuê (+${formatVND(contract.depositAmount)}) từ ${contract.tenantAvatar} ${contract.tenantName}`,
    };

    set({
      ownedProperties: updatedOwned,
      investmentHistory: [tx, ...investmentHistory],
      selectedPropertyModal: null,
    });

    audioService.playCashRegister();
    game.showNotification(
      `Đã cho ${contract.tenantAvatar} ${contract.tenantName} thuê với giá ${formatVND(contract.monthlyRent)}/tháng!`,
      'success'
    );

    return { success: true, contract };
  },

  terminateRental: (propertyId: string) => {
    const { ownedProperties } = get();
    const game = useGameStore.getState();

    const target = ownedProperties.find((p) => p.id === propertyId);
    if (!target || !target.isRented) return { success: false };

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

    set({
      ownedProperties: updatedOwned,
      selectedPropertyModal: null,
    });

    audioService.playClick();
    game.showNotification(`Đã chấm dứt hợp đồng thuê cho "${target.name}". Bất động sản đã sẵn sàng để bán hoặc cho thuê mới.`, 'info');

    return { success: true };
  },

  renovateHouse: (propertyId: string) => {
    const { ownedProperties, investmentHistory } = get();
    const econ = useEconomyStore.getState();
    const game = useGameStore.getState();

    const target = ownedProperties.find((p) => p.id === propertyId && p.propertyType === 'house') as HouseProperty | undefined;
    if (!target) return { success: false, cost: 0 };

    if (econ.cash < target.renovationCost) {
      audioService.playDisappointed();
      game.showNotification('Không đủ tiền mặt để cải tạo căn nhà này!', 'error');
      return { success: false, cost: 0 };
    }

    econ.deductCash(target.renovationCost);
    const { newCondition, newMarketValue, newRentalIncome } = PropertyMaintenance.calculateRenovationImpact(target);

    const updatedOwned = ownedProperties.map((p) => {
      if (p.id === propertyId) {
        return {
          ...p,
          condition: newCondition,
          currentMarketValue: newMarketValue,
          rentalIncomeMonthly: newRentalIncome,
        };
      }
      return p;
    });

    const tx: InvestmentTransaction = {
      id: `tx_renovate_${Date.now()}`,
      day: game.day,
      type: 'renovation',
      propertyId: target.id,
      propertyName: target.name,
      propertyType: 'house',
      amount: -target.renovationCost,
      description: `Cải tạo nâng cấp toàn diện "${target.name}" (Độ mới 100%, Định giá tăng +${formatVND(newMarketValue - target.currentMarketValue)})`,
    };

    set({
      ownedProperties: updatedOwned,
      investmentHistory: [tx, ...investmentHistory],
      selectedPropertyModal: null,
    });

    audioService.playFanfare();
    game.showNotification(`Đã hoàn tất cải tạo "${target.name}" đẹp như mới!`, 'success');

    return { success: true, cost: target.renovationCost };
  },

  repairMaintenance: (propertyId: string, cost: number) => {
    const { ownedProperties, investmentHistory } = get();
    const econ = useEconomyStore.getState();
    const game = useGameStore.getState();

    const target = ownedProperties.find((p) => p.id === propertyId);
    if (!target) return { success: false };

    if (econ.cash < cost) {
      audioService.playDisappointed();
      game.showNotification('Không đủ tiền mặt để thanh toán chi phí bảo dưỡng!', 'error');
      return { success: false };
    }

    econ.deductCash(cost);

    const updatedOwned = ownedProperties.map((p) => {
      if (p.id === propertyId && p.propertyType === 'house') {
        const h = p as HouseProperty;
        return { ...h, condition: Math.min(100, h.condition + 10) };
      }
      return p;
    });

    const tx: InvestmentTransaction = {
      id: `tx_maint_${Date.now()}`,
      day: game.day,
      type: 'maintenance',
      propertyId: target.id,
      propertyName: target.name,
      propertyType: target.propertyType,
      amount: -cost,
      description: `Bảo dưỡng định kỳ "${target.name}"`,
    };

    set({
      ownedProperties: updatedOwned,
      investmentHistory: [tx, ...investmentHistory],
    });

    audioService.playClick();
    game.showNotification(`Đã bảo dưỡng thành công "${target.name}"!`, 'success');

    return { success: true };
  },

  convertPropertyToShop: (propertyId: string) => {
    const { ownedProperties } = get();
    const game = useGameStore.getState();

    const target = ownedProperties.find((p) => p.id === propertyId);
    if (!target) return { success: false };

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

    set({
      ownedProperties: updatedOwned,
      selectedPropertyModal: null,
    });

    audioService.playFanfare();
    game.showNotification(
      `Đã chuyển đổi "${target.name}" thành Cơ Sở Chi Nhánh Sinh Tố! Chi phí thuê mặt bằng khu vực này giảm về 0đ!`,
      'success'
    );

    return { success: true };
  },

  tickDailyInvestment: (currentDay: number) => {
    const { ownedProperties, availableLand, availableHouses, investmentHistory, totalRentalIncomeEarned } = get();
    const econ = useEconomyStore.getState();
    const game = useGameStore.getState();

    let totalDailyRentPayout = 0;
    const newTxList: InvestmentTransaction[] = [];

    // 1. Process active rentals
    const updatedOwned = ownedProperties.map((prop) => {
      let updated = { ...prop };

      if (updated.isRented && updated.activeRentalContract) {
        const contract = updated.activeRentalContract;
        const dailyRent = contract.dailyRent;
        totalDailyRentPayout += dailyRent;

        const daysLeft = contract.daysRemaining - 1;

        if (daysLeft <= 0) {
          // Contract expired
          updated.isRented = false;
          updated.activeRentalContract = null;
          game.showNotification(`Hợp đồng thuê "${updated.name}" của ${contract.tenantName} đã kết thúc kỳ hạn!`, 'info');
        } else {
          updated.activeRentalContract = {
            ...contract,
            daysRemaining: daysLeft,
          };
        }
      }

      // Condition decay for houses
      if (updated.propertyType === 'house') {
        updated = PropertyMaintenance.decayHouseCondition(updated as HouseProperty);
      }

      return updated;
    });

    // Payout rental income to cash
    if (totalDailyRentPayout > 0) {
      econ.addCash(totalDailyRentPayout);
      newTxList.push({
        id: `tx_rent_daily_${Date.now()}`,
        day: currentDay,
        type: 'rent_income',
        propertyId: 'all_rentals',
        propertyName: 'Tiền Thuê BĐS Hôm Nay',
        propertyType: 'commercial',
        amount: totalDailyRentPayout,
        description: `Thu nhập thụ động từ ${ownedProperties.filter((p) => p.isRented).length} bất động sản đang cho thuê`,
      });
    }

    // 2. Simulate slight market fluctuations
    const updatedLand = PropertyMarket.simulateMarketDay(availableLand) as LandProperty[];
    const updatedHouses = PropertyMarket.simulateMarketDay(availableHouses) as HouseProperty[];
    const updatedOwnedWithMarket = PropertyMarket.simulateMarketDay(updatedOwned);

    // 3. Roll occasional random investment event
    const event = PropertyEventGenerator.rollDailyEvent(updatedOwnedWithMarket);
    if (event) {
      game.showNotification(`${event.icon} ${event.title}: ${event.description}`, 'info');
      // Apply event modifications
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

    set({
      ownedProperties: updatedOwnedWithMarket,
      availableLand: updatedLand,
      availableHouses: updatedHouses,
      investmentHistory: [...newTxList, ...investmentHistory],
      totalRentalIncomeEarned: totalRentalIncomeEarned + totalDailyRentPayout,
    });
  },

  getTotalPropertyMarketValue: () => {
    return get().ownedProperties.reduce((sum, p) => sum + p.currentMarketValue, 0);
  },

  getTotalUnrealizedProfit: () => {
    return get().ownedProperties.reduce((sum, p) => {
      const original = p.originalPurchasePrice || p.purchasePrice;
      return sum + (p.currentMarketValue - original);
    }, 0);
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
    });
  },
}));
