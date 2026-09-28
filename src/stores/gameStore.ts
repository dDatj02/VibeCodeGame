import { create } from 'zustand';
import { WeatherType, DailyReport, DailyQuest } from '../types';
import { EventDefinition } from '../data/events';
import { useCustomerStore } from './customerStore';
import { SaveService } from '../services/SaveService';

export type ShopDayPhase = 'prep' | 'open' | 'day_ended';
export type NavigationTab = 'shop' | 'inventory' | 'recipes' | 'finance' | 'reviews' | 'social' | 'upgrades';

const INITIAL_QUESTS: DailyQuest[] = [
  {
    id: 'quest_1',
    title: 'Bán 10 ly sinh tố hôm nay',
    targetCount: 10,
    currentCount: 0,
    rewardCash: 40000,
    rewardXp: 50,
    completed: false,
  },
  {
    id: 'quest_2',
    title: 'Được 3 khách chấm 5 sao',
    targetCount: 3,
    currentCount: 0,
    rewardCash: 35000,
    rewardXp: 40,
    completed: false,
  },
  {
    id: 'quest_3',
    title: 'Bán 2 ly Sinh Tố Bơ Sáp',
    targetCount: 2,
    currentCount: 0,
    rewardCash: 30000,
    rewardXp: 35,
    completed: false,
  },
];

interface GameState {
  shopName: string;
  shopAvatar: string;
  managerName: string;
  managerAvatar: string;
  xp: number;
  maxXp: number;
  inKitchenMode: boolean;
  quests: DailyQuest[];
  day: number;
  timeMinutes: number; // 480 = 08:00, 1200 = 20:00
  phase: ShopDayPhase;
  gameSpeed: 1 | 2 | 3;
  isPaused: boolean;
  weather: WeatherType;
  activeTab: NavigationTab;
  currentEvent: EventDefinition | null;
  activeDailyReport: DailyReport | null;
  isBankrupt: boolean;
  notification: { id: string; text: string; type?: 'info' | 'success' | 'warning' | 'error' } | null;

  // Actions
  setShopName: (name: string) => void;
  setShopAvatar: (avatar: string) => void;
  setShopProfile: (name: string, avatar: string) => void;
  setManagerProfile: (name: string, avatar: string) => void;
  addXp: (amount: number) => void;
  setInKitchenMode: (inKitchen: boolean) => void;
  progressQuest: (questIndex: number, delta?: number) => void;
  claimQuest: (questId: string) => void;
  setGameSpeed: (speed: 1 | 2 | 3) => void;
  togglePause: () => void;
  setActiveTab: (tab: NavigationTab) => void;
  openShopForDay: () => void;
  tickGameTime: (deltaMinutes: number) => { isEndOfDay: boolean };
  closeShopDay: () => void;
  nextDay: () => void;
  triggerEvent: (event: EventDefinition) => void;
  dismissEvent: () => void;
  dismissDailyReport: () => void;
  showNotification: (text: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  clearNotification: () => void;
  setBankrupt: (bankrupt: boolean) => void;
  resetGame: () => void;
}

const START_TIME = 480; // 08:00 AM
const CLOSE_TIME = 1200; // 20:00 PM

const WEATHERS: WeatherType[] = ['sunny', 'sunny', 'heatwave', 'sunny', 'rain', 'heatwave'];

export const useGameStore = create<GameState>((set, get) => ({
  shopName: 'Sinh Tố Nhà Tui',
  shopAvatar: '🍹',
  managerName: 'Bé Bơ',
  managerAvatar: '🥑',
  xp: 120,
  maxXp: 500,
  inKitchenMode: false,
  quests: INITIAL_QUESTS,
  day: 1,
  timeMinutes: START_TIME,
  phase: 'prep',
  gameSpeed: 1,
  isPaused: false,
  weather: 'sunny',
  activeTab: 'shop',
  currentEvent: null,
  activeDailyReport: null,
  isBankrupt: false,
  notification: null,

  setShopName: (name) => set({ shopName: name }),
  setShopAvatar: (avatar) => set({ shopAvatar: avatar }),
  setShopProfile: (name, avatar) => set({ shopName: name, shopAvatar: avatar }),
  setManagerProfile: (name, avatar) => set({ managerName: name, managerAvatar: avatar }),

  addXp: (amount) => {
    set((state) => {
      const newXp = state.xp + amount;
      if (newXp >= state.maxXp) {
        return {
          xp: newXp - state.maxXp,
          maxXp: Math.round(state.maxXp * 1.5),
        };
      }
      return { xp: newXp };
    });
  },

  setInKitchenMode: (inKitchen) => set({ inKitchenMode: inKitchen }),

  progressQuest: (questIndex, delta = 1) => {
    set((state) => {
      const quests = [...state.quests];
      if (quests[questIndex] && !quests[questIndex].completed) {
        const next = Math.min(quests[questIndex].targetCount, quests[questIndex].currentCount + delta);
        quests[questIndex] = {
          ...quests[questIndex],
          currentCount: next,
        };
      }
      return { quests };
    });
  },

  claimQuest: (questId) => {
    set((state) => {
      const q = state.quests.find((item) => item.id === questId);
      if (!q || q.completed || q.currentCount < q.targetCount) return state;
      return {
        quests: state.quests.map((item) => item.id === questId ? { ...item, completed: true } : item)
      };
    });
  },

  setGameSpeed: (speed) => set({ gameSpeed: speed }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  setActiveTab: (tab) => set({ activeTab: tab }),

  openShopForDay: () => {
    set((state) => ({
      phase: 'open',
      timeMinutes: state.phase === 'prep' ? START_TIME : state.timeMinutes,
      isPaused: false,
      activeTab: 'shop',
    }));
  },

  tickGameTime: (deltaMinutes: number) => {
    const { timeMinutes, phase, isPaused } = get();
    if (phase !== 'open' || isPaused) {
      return { isEndOfDay: false };
    }

    const nextTime = timeMinutes + deltaMinutes;
    if (nextTime >= CLOSE_TIME) {
      set({ timeMinutes: CLOSE_TIME, phase: 'day_ended', isPaused: true });
      return { isEndOfDay: true };
    }

    set({ timeMinutes: nextTime });
    return { isEndOfDay: false };
  },

  closeShopDay: () => {
    set({ phase: 'day_ended', isPaused: true });
  },

  nextDay: () => {
    const nextDayNum = get().day + 1;
    const randomWeather = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];

    // Reset customer daily metrics & clear queue for new day
    const custStore = useCustomerStore.getState();
    custStore.resetDailyCustomerMetrics();
    custStore.clearQueue();

    set({
      day: nextDayNum,
      timeMinutes: START_TIME,
      phase: 'prep',
      weather: randomWeather,
      activeDailyReport: null,
      isPaused: false,
    });

    // Auto-save new day state immediately to prevent rollback if user closes app
    SaveService.saveGame();
  },

  triggerEvent: (event) => set({ currentEvent: event, isPaused: true }),

  dismissEvent: () => set({ currentEvent: null, isPaused: false }),

  dismissDailyReport: () => set({ activeDailyReport: null }),

  showNotification: (text, type = 'info') => {
    set({
      notification: {
        id: `notif_${Date.now()}`,
        text,
        type,
      },
    });
  },

  clearNotification: () => set({ notification: null }),

  setBankrupt: (bankrupt) => set({ isBankrupt: bankrupt, isPaused: true }),

  resetGame: () => {
    set({
      day: 1,
      timeMinutes: START_TIME,
      phase: 'prep',
      gameSpeed: 1,
      isPaused: false,
      weather: 'sunny',
      activeTab: 'shop',
      currentEvent: null,
      activeDailyReport: null,
      isBankrupt: false,
      notification: null,
    });
  },
}));
