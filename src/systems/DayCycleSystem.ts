import { useGameStore } from '../stores/gameStore';
import { useCustomerStore } from '../stores/customerStore';
import { useRecipeStore } from '../stores/recipeStore';
import { useShopStore } from '../stores/shopStore';
import { useEconomyStore } from '../stores/economyStore';
import { useReviewStore } from '../stores/reviewStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { SHOP_LEVELS } from '../data/upgrades';
import { GAME_EVENTS } from '../data/events';
import { DailyReport } from '../types';
import { SaveService } from '../services/SaveService';
import { audioService } from '../services/AudioService';

export class DayCycleSystem {
  private static spawnAccumulator = 0;

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

    // Tick active customer patience
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

    // Viral boost impact
    const rev = useReviewStore.getState();
    if (rev.isViralBoostActive) trafficMultiplier *= 1.8;
    if (rev.isCrisisActive) trafficMultiplier *= 0.5;

    // Base spawn interval: e.g. every 5 seconds adjusted by traffic
    const spawnThreshold = Math.max(1.8, 6.0 / trafficMultiplier);
    this.spawnAccumulator += effectiveDelta;

    if (this.spawnAccumulator >= spawnThreshold) {
      this.spawnAccumulator = 0;
      const spawned = custStore.spawnCustomer(unlockedRecipes, currentShopConfig.maxQueueCapacity);
      if (spawned) {
        audioService.playOrderBell();
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
