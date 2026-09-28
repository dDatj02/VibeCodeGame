import { useGameStore } from '../stores/gameStore';
import { useCustomerStore } from '../stores/customerStore';
import { useRecipeStore } from '../stores/recipeStore';
import { useShopStore } from '../stores/shopStore';
import { useEconomyStore } from '../stores/economyStore';
import { useReviewStore } from '../stores/reviewStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useLargeOrderStore } from '../stores/largeOrderStore';
import { useInvestmentStore } from '../stores/investmentStore';
import { SHOP_LEVELS } from '../data/upgrades';
import { GAME_EVENTS } from '../data/events';
import { DailyReport } from '../types';
import { SaveService } from '../services/SaveService';
import { audioService } from '../services/AudioService';
import { LARGE_ORDER_SPAWN_INTERVAL_MINUTES, LARGE_ORDER_UNLOCK_LEVEL } from '../config/largeOrderConfig';

export class DayCycleSystem {
  private static spawnAccumulator = 0;
  private static largeOrderAccumulatorMinutes = 0;

  public static tick(deltaSeconds: number) {
    const game = useGameStore.getState();
    if (game.phase !== 'open' || game.isPaused) return;

    const speed = game.gameSpeed;
    const effectiveDelta = deltaSeconds * speed;

    // Advance clock: 1 real second = 4 in-game minutes at 1x speed
    // (a 12-hour day 08:00 to 20:00 = 720 game minutes takes ~180 seconds at 1x, or 60s at 3x)
    const minutesDelta = effectiveDelta * 4;
    const { isEndOfDay } = game.tickGameTime(minutesDelta);

    if (isEndOfDay) {
      this.finishDay();
      return;
    }

    // 1. Large Order System Tick & Unlock Check
    const largeOrderStore = useLargeOrderStore.getState();
    largeOrderStore.checkUnlockStatus();

    const isProducingLargeOrder = Boolean(
      largeOrderStore.activeOrder && largeOrderStore.activeOrder.status === 'producing'
    );

    if (isProducingLargeOrder) {
      // Production is running automatically in background
      largeOrderStore.tickProduction(effectiveDelta);
    } else {
      // Check periodic generation of new large order offers when unlocked
      const shopLevel = useShopStore.getState().currentShopLevel;
      if (shopLevel >= LARGE_ORDER_UNLOCK_LEVEL && !largeOrderStore.activeOffer && !largeOrderStore.activeOrder) {
        this.largeOrderAccumulatorMinutes += minutesDelta;
        if (this.largeOrderAccumulatorMinutes >= LARGE_ORDER_SPAWN_INTERVAL_MINUTES) {
          this.largeOrderAccumulatorMinutes = 0;
          if (Math.random() < 0.7) {
            largeOrderStore.generateOffer();
          }
        }
      }
    }

    // Tick active customer patience (if any in queue)
    const custStore = useCustomerStore.getState();
    const { expiredCustomers } = custStore.tickPatience(effectiveDelta);

    // If customers expired, generate dissatisfied reviews with 50% probability
    if (expiredCustomers.length > 0) {
      expiredCustomers.forEach((cust) => {
        audioService.playDisappointed();
        useGameStore.getState().showNotification(`${cust.name} bực tức bỏ về vì chờ quá lâu!`, 'warning');

        if (Math.random() < 0.5) {
          useReviewStore.getState().addReview({
            authorName: cust.name,
            avatar: '😡',
            rating: 1,
            comment: `Quán phục vụ quá chậm! Xếp hàng chờ gần nửa tiếng mà chưa thấy nước đâu. Rất thất vọng!`,
            day: game.day,
            helpfulCount: 2,
            aspect: 'speed',
          });
          useGameStore.getState().showNotification(`⭐ ${cust.name} đã để lại đánh giá 1 sao vì chờ quá lâu!`, 'error');
        }
      });
    }

    // Customer Spawning Logic
    const shop = useShopStore.getState();
    const currentShopConfig = SHOP_LEVELS.find((cfg) => cfg.level === shop.currentShopLevel) || SHOP_LEVELS[0];
    const unlockedRecipes = useRecipeStore.getState().getUnlockedRecipes().map((r) => r.id);

    // Traffic calculation modifiers
    let trafficMultiplier = currentShopConfig.trafficMultiplier;

    // Weather impact
    if (game.weather === 'heatwave') trafficMultiplier *= 1.4;
    else if (game.weather === 'rain') trafficMultiplier *= 0.75;
    else if (game.weather === 'storm') trafficMultiplier *= 0.5;

    // Rating impact: starts reducing traffic progressively when averageRating < 3.5
    const rev = useReviewStore.getState();
    const avgRating = rev.averageRating;
    let ratingMultiplier = 1.0;

    if (avgRating < 3.5) {
      // Linear penalty from 1.0 (at 3.5★) down to 0.1 (at 1.0★)
      const drop = (3.5 - avgRating) / 2.5;
      ratingMultiplier = Math.max(0.1, Number((1.0 - drop * 0.9).toFixed(2)));
    } else if (avgRating >= 4.5) {
      // High rating popularity boost
      ratingMultiplier = 1.15;
    }

    trafficMultiplier *= ratingMultiplier;

    // Viral boost impact
    if (rev.isViralBoostActive) trafficMultiplier *= 1.8;
    if (rev.isCrisisActive) trafficMultiplier *= 0.5;

    // Base spawn interval: e.g. every 5 seconds adjusted by traffic
    const spawnThreshold = Math.max(1.8, 6.0 / trafficMultiplier);
    this.spawnAccumulator += effectiveDelta;

    if (this.spawnAccumulator >= spawnThreshold) {
      this.spawnAccumulator = 0;

      if (isProducingLargeOrder) {
        // Shop is closed for bulk production -> Record opportunity cost!
        largeOrderStore.recordLostCustomerOpportunity();
      } else {
        const spawned = custStore.spawnCustomer(unlockedRecipes, currentShopConfig.maxQueueCapacity);
        if (spawned) {
          audioService.playOrderBell();
        }
      }
    }
  }

  public static finishDay() {
    const game = useGameStore.getState();
    const cust = useCustomerStore.getState();
    const econ = useEconomyStore.getState();
    const shop = useShopStore.getState();
    const inv = useInventoryStore.getState();
    const rev = useReviewStore.getState();

    const startingCash = econ.cash;
    const revenue = cust.dailyRevenueToday;
    const ingredientCost = cust.dailyIngredientCostToday;

    // Fixed daily operating expenses
    const rent = shop.getTotalDailyRent();
    const employeeSalaries = shop.getTotalDailySalaries();
    const electricity = shop.getTotalDailyElectricity();

    // Loan repayments
    const loanResult = econ.payLoanDaily();
    const loanPayments = loanResult.totalPaid;
    const penalties = loanResult.missed * 10000;

    // Deduct operating expenses from cash
    const totalDeductions = rent + employeeSalaries + electricity;
    econ.deductCash(totalDeductions);

    // Cleanliness decay & ingredient aging
    shop.decayCleanliness();
    const coolerBonus = shop.getCoolerFreshnessBonus();
    inv.ageIngredientsDaily(coolerBonus);

    // Decrement viral days
    rev.decrementViralDays();

    // Tick daily real estate investment income & market updates
    useInvestmentStore.getState().tickDailyInvestment(game.day);

    const endingCash = econ.cash;
    const netProfit = revenue - (ingredientCost + employeeSalaries + rent + electricity + loanPayments + penalties);

    const report: DailyReport = {
      day: game.day,
      revenue,
      ingredientCost,
      employeeSalaries,
      rent,
      electricity,
      loanPayments,
      penalties,
      maintenance: 0,
      marketingExpenses: 0,
      netProfit,
      startingCash,
      endingCash,
      totalCustomersServed: cust.customersServedToday,
      customersLost: cust.customersLostToday,
      averageRating: rev.averageRating,
      newReviewsCount: rev.reviews.filter((r) => r.day === game.day).length,
    };

    econ.addDailyReport(report);
    useGameStore.setState({ activeDailyReport: report });

    // Check for random event chance (e.g. 40%)
    if (Math.random() < 0.4) {
      const randomEvt = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
      setTimeout(() => {
        useGameStore.getState().triggerEvent(randomEvt);
      }, 500);
    }

    // Check bankruptcy condition (negative cash and severe debt)
    if (endingCash < 0 && econ.activeLoans.length > 0) {
      useGameStore.getState().setBankrupt(true);
    }

    // Auto save game state
    SaveService.saveGame();
    audioService.playFanfare();
  }
}
