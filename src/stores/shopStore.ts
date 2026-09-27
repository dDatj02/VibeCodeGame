import { create } from 'zustand';
import { Equipment, Employee, ShopLevelConfig } from '../types';
import { INITIAL_EQUIPMENT } from '../data/equipment';
import { INITIAL_EMPLOYEES } from '../data/employees';
import { SHOP_LEVELS } from '../data/upgrades';

interface ShopState {
  currentShopLevel: number;
  equipment: Equipment[];
  employees: Employee[];
  cleanliness: number; // 0-100%

  // Actions
  upgradeEquipment: (equipmentId: string) => { success: boolean; cost: number };
  hireEmployee: (employeeId: string) => boolean;
  fireEmployee: (employeeId: string) => void;
  upgradeShopLevel: () => { success: boolean; nextLevelConfig?: ShopLevelConfig };
  cleanShop: () => void;
  decayCleanliness: () => void;
  getBlenderSpeedBonus: () => number;
  getCoolerFreshnessBonus: () => number;
  getTotalDailyRent: () => number;
  getTotalDailySalaries: () => number;
  getTotalDailyElectricity: () => number;
  getTotalEquipmentValue: () => number;
  resetShop: () => void;
}

export const useShopStore = create<ShopState>((set, get) => ({
  currentShopLevel: 1,
  equipment: INITIAL_EQUIPMENT,
  employees: INITIAL_EMPLOYEES,
  cleanliness: 95,

  upgradeEquipment: (equipmentId: string) => {
    const { equipment } = get();
    const item = equipment.find((e) => e.id === equipmentId);
    if (!item || item.level >= item.maxLevel) {
      return { success: false, cost: 0 };
    }

    const cost = item.currentCost;
    set((state) => ({
      equipment: state.equipment.map((eq) => {
        if (eq.id === equipmentId) {
          const newLevel = eq.level + 1;
          const nextCost = Math.round(eq.currentCost * 1.6);
          return {
            ...eq,
            level: newLevel,
            currentCost: nextCost,
            electricityCostPerDay: Math.round(eq.electricityCostPerDay * 1.3),
          };
        }
        return eq;
      }),
    }));

    return { success: true, cost };
  },

  hireEmployee: (employeeId: string) => {
    const { employees } = get();
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp || emp.hired) return false;

    set((state) => ({
      employees: state.employees.map((e) =>
        e.id === employeeId ? { ...e, hired: true } : e
      ),
    }));
    return true;
  },

  fireEmployee: (employeeId: string) => {
    set((state) => ({
      employees: state.employees.map((e) =>
        e.id === employeeId ? { ...e, hired: false } : e
      ),
    }));
  },

  upgradeShopLevel: () => {
    const { currentShopLevel } = get();
    if (currentShopLevel >= SHOP_LEVELS.length) {
      return { success: false };
    }

    const nextLevel = currentShopLevel + 1;
    const nextConfig = SHOP_LEVELS.find((cfg) => cfg.level === nextLevel);
    if (!nextConfig) return { success: false };

    set({ currentShopLevel: nextLevel });
    return { success: true, nextLevelConfig: nextConfig };
  },

  cleanShop: () => {
    set({ cleanliness: 100 });
  },

  decayCleanliness: () => {
    const hasCleaner = get().employees.some((e) => e.hired && e.role === 'cleaner');
    const decayAmount = hasCleaner ? 3 : 12;
    set((state) => ({
      cleanliness: Math.max(10, state.cleanliness - decayAmount),
    }));
  },

  getBlenderSpeedBonus: () => {
    const blender = get().equipment.find((e) => e.id === 'blender');
    const level = blender ? blender.level : 1;
    const baristaHired = get().employees.some((e) => e.hired && e.role === 'barista');
    const employeeBonus = baristaHired ? 0.35 : 0;
    return (level - 1) * 0.18 + employeeBonus;
  },

  getCoolerFreshnessBonus: () => {
    const cooler = get().equipment.find((e) => e.id === 'cooler');
    if (!cooler) return 0.20;
    // Level 1: 0.20 (20%), Level 2: 0.40 (40%), Level 3: 0.55 (55%), Level 4: 0.70 (70% max retention bonus!)
    const bonuses = [0, 0.20, 0.40, 0.55, 0.70];
    return bonuses[cooler.level] || 0.20;
  },

  getTotalDailyRent: () => {
    const currentCfg = SHOP_LEVELS.find((s) => s.level === get().currentShopLevel);
    return currentCfg ? currentCfg.dailyRent : 0;
  },

  getTotalDailySalaries: () => {
    return get().employees
      .filter((e) => e.hired)
      .reduce((sum, e) => sum + e.salaryPerDay, 0);
  },

  getTotalDailyElectricity: () => {
    return get().equipment.reduce((sum, e) => sum + e.electricityCostPerDay * e.level, 0);
  },

  getTotalEquipmentValue: () => {
    const equipmentVal = get().equipment.reduce((sum, e) => sum + e.currentCost * e.level * 0.6, 0);
    const shopVal = (get().currentShopLevel - 1) * 1500000;
    return Math.round(equipmentVal + shopVal);
  },

  resetShop: () => {
    set({
      currentShopLevel: 1,
      equipment: INITIAL_EQUIPMENT,
      employees: INITIAL_EMPLOYEES,
      cleanliness: 95,
    });
  },
}));
