import { create } from 'zustand';
import { LargeOrder, LargeOrderHistoryItem, LargeOrderResult, LargeOrderEvent } from '../types/largeOrder';
import { LargeOrderGenerator } from '../systems/LargeOrderGenerator';
import { LARGE_ORDER_UNLOCK_LEVEL, BOOST_COST, BOOST_SPEED_MULTIPLIER, BLENDER_FIX_COST, RECOVERY_RATE_MIN, RECOVERY_RATE_MAX } from '../config/largeOrderConfig';
import { useShopStore } from './shopStore';
import { useInventoryStore } from './inventoryStore';
import { useEconomyStore } from './economyStore';
import { useCustomerStore } from './customerStore';
import { useReviewStore } from './reviewStore';
import { useGameStore } from './gameStore';
import { audioService } from '../services/AudioService';

interface LargeOrderState {
  activeOffer: LargeOrder | null;
  activeOrder: LargeOrder | null;
  orderHistory: LargeOrderHistoryItem[];
  customerReliabilities: Record<string, { reliability: number; completedOrders: number; cancelledOrders: number }>;
  hasShownUnlockTutorial: boolean;
  showUnlockModal: boolean;
  showOfferModal: boolean;
  showConfirmationModal: boolean;
  showResultModal: boolean;
  showHistoryModal: boolean;
  lastResult: LargeOrderResult | null;
  eventOccurredInCurrentOrder: boolean;
  timeSinceLastOfferMinutes: number;

  // Actions
  checkUnlockStatus: () => boolean;
  generateOffer: (force?: boolean) => LargeOrder | null;
  acceptOffer: () => { success: boolean; reason?: string };
  declineOffer: () => void;
  tickProduction: (deltaSeconds: number) => void;
  boostProduction: () => { success: boolean; cost: number };
  handleEventChoice: (choiceIndex: number) => void;
  confirmOrder: () => void;
  dismissResult: () => void;
  openOfferModal: () => void;
  closeOfferModal: () => void;
  openHistoryModal: () => void;
  closeHistoryModal: () => void;
  closeUnlockModal: () => void;
  recordLostCustomerOpportunity: () => void;
  resetLargeOrders: () => void;
}

export const useLargeOrderStore = create<LargeOrderState>((set, get) => ({
  activeOffer: null,
  activeOrder: null,
  orderHistory: [],
  customerReliabilities: {},
  hasShownUnlockTutorial: false,
  showUnlockModal: false,
  showOfferModal: false,
  showConfirmationModal: false,
  showResultModal: false,
  showHistoryModal: false,
  lastResult: null,
  eventOccurredInCurrentOrder: false,
  timeSinceLastOfferMinutes: 0,

  checkUnlockStatus: () => {
    const shopLevel = useShopStore.getState().currentShopLevel;
    const isUnlocked = shopLevel >= LARGE_ORDER_UNLOCK_LEVEL;

    const { hasShownUnlockTutorial } = get();
    if (isUnlocked && !hasShownUnlockTutorial) {
      set({ hasShownUnlockTutorial: true, showUnlockModal: true });
      audioService.playFanfare();
      // Generate first introductory order
      get().generateOffer(true);
    }

    return isUnlocked;
  },

  generateOffer: (force = false) => {
    const shopLevel = useShopStore.getState().currentShopLevel;
    if (shopLevel < LARGE_ORDER_UNLOCK_LEVEL) return null;

    const { activeOrder, activeOffer, orderHistory, customerReliabilities } = get();
    if (activeOrder) return null; // Don't offer while producing another large order
    if (activeOffer && !force) return activeOffer;

    const isFirstOrder = orderHistory.length === 0;
    const newOffer = LargeOrderGenerator.generateOrder(isFirstOrder, customerReliabilities);

    if (newOffer) {
      set({ activeOffer: newOffer, timeSinceLastOfferMinutes: 0 });
      audioService.playOrderBell();
      useGameStore.getState().showNotification(
        `📦 CƠ HỘI MỚI: ${newOffer.customer.avatar} ${newOffer.customer.name} gửi đơn đặt sỉ ${newOffer.quantity} ly!`,
        'success'
      );
    }

    return newOffer;
  },

  acceptOffer: () => {
    const { activeOffer } = get();
    if (!activeOffer) return { success: false, reason: 'Không có đơn hàng nào' };

    const invStore = useInventoryStore.getState();
    const econStore = useEconomyStore.getState();

    // 1. Check if enough ingredients
    if (!invStore.hasEnoughIngredients(activeOffer.requiredIngredients)) {
      audioService.playDisappointed();
      useGameStore.getState().showNotification('Không đủ nguyên liệu trong kho! Hãy vào kho mua bổ sung trước.', 'error');
      return { success: false, reason: 'Không đủ nguyên liệu trong kho' };
    }

    // 2. Consume/Reserve ingredients immediately
    invStore.consumeIngredients(activeOffer.requiredIngredients);

    // 3. Collect deposit if any
    if (activeOffer.depositAmount > 0) {
      econStore.addCash(activeOffer.depositAmount);
      useGameStore.getState().showNotification(
        `💳 Đã nhận tiền cọc trước: +${activeOffer.depositAmount.toLocaleString('vi-VN')}đ (${Math.round(activeOffer.depositPercent * 100)}%)!`,
        'success'
      );
    }

    // 4. Set order to producing & close offer modal
    set({
      activeOrder: {
        ...activeOffer,
        status: 'producing',
        progressCount: 0,
        remainingProductionSeconds: activeOffer.totalProductionSeconds,
      },
      activeOffer: null,
      showOfferModal: false,
      eventOccurredInCurrentOrder: false,
    });

    audioService.playBlender(1.2);
    useGameStore.getState().showNotification(
      `🔒 Quán tạm đóng quầy phục vụ lẻ để dồn lực sản xuất ${activeOffer.quantity} ly ${activeOffer.recipeName}!`,
      'info'
    );

    return { success: true };
  },

  declineOffer: () => {
    set({ activeOffer: null, showOfferModal: false });
    audioService.playClick();
    useGameStore.getState().showNotification('Đã từ chối đơn hàng lớn.', 'info');
  },

  tickProduction: (deltaSeconds: number) => {
    const { activeOrder, eventOccurredInCurrentOrder } = get();
    if (!activeOrder || activeOrder.status !== 'producing') return;

    // Production calculation
    const effectiveSpeed = activeOrder.speedMultiplier * (activeOrder.isBoosted ? BOOST_SPEED_MULTIPLIER : 1.0);
    const timeToSubtract = deltaSeconds * effectiveSpeed;
    const newRemaining = Math.max(0, activeOrder.remainingProductionSeconds - timeToSubtract);

    const progressRatio = (activeOrder.totalProductionSeconds - newRemaining) / activeOrder.totalProductionSeconds;
    const progressCount = Math.min(activeOrder.quantity, Math.floor(progressRatio * activeOrder.quantity));

    // Roll rare in-production business event around 40%-60% progress
    let nextEvent = activeOrder.activeEvent;
    if (!eventOccurredInCurrentOrder && progressRatio >= 0.45 && progressRatio <= 0.70 && !nextEvent) {
      if (Math.random() < 0.45) {
        // Generate an event
        const roll = Math.random();
        if (roll < 0.4) {
          // Blender overheating
          nextEvent = {
            id: 'evt_blender_hot',
            title: '⚡ MÁY XAY QUÁ TẢI NHIỆT',
            description: 'Xay liên tục số lượng lớn khiến động cơ nóng ran. Tốc độ làm sinh tố giảm 30%!',
            icon: '🔥',
            choices: [
              {
                text: `Sửa Ngay (-${BLENDER_FIX_COST.toLocaleString('vi-VN')}đ)`,
                actionType: 'fix_speed',
                cost: BLENDER_FIX_COST,
                speedChange: 0,
                effectDescription: 'Khắc phục ngay, giữ vững tốc độ chuẩn.',
              },
              {
                text: 'Chấp Nhận Chậm (-30% tốc độ)',
                actionType: 'ignore',
                speedChange: -0.3,
                effectDescription: 'Không tốn tiền nhưng thời gian giao sẽ lâu hơn.',
              },
            ],
          };
        } else if (roll < 0.75) {
          // Customer requests +10 more smoothies
          const extraQty = Math.max(5, Math.round(activeOrder.quantity * 0.2));
          const extraRev = extraQty * activeOrder.pricePerItem;
          nextEvent = {
            id: 'evt_extra_order',
            title: '📞 KHÁCH XIN TĂNG THÊM SỐ LƯỢNG',
            description: `${activeOrder.customer.name} gọi điện: "Sự kiện đông hơn dự kiến, bạn có thể làm thêm +${extraQty} ly được không?"`,
            icon: '📞',
            choices: [
              {
                text: `Nhận Thêm (+${extraRev.toLocaleString('vi-VN')}đ)`,
                actionType: 'add_quantity',
                extraQuantity: extraQty,
                extraRevenue: extraRev,
                effectDescription: `Tăng số lượng lên ${activeOrder.quantity + extraQty} ly và nhận thêm tiền.`,
              },
              {
                text: 'Từ Chối (Giữ nguyên đơn)',
                actionType: 'ignore',
                effectDescription: 'Giữ nguyên số lượng ban đầu.',
              },
            ],
          };
        } else {
          // Rush deadline change
          nextEvent = {
            id: 'evt_rush_deadline',
            title: '⏱️ KHÁCH DỜI GIỜ SỰ KIỆN SỚM HƠN',
            description: 'Khách yêu cầu giao sớm hơn 5 phút. Cần tăng tốc máy xay để kịp tiến độ!',
            icon: '🏃',
            choices: [
              {
                text: `Tăng Tốc Gấp (-${BOOST_COST.toLocaleString('vi-VN')}đ)`,
                actionType: 'fix_speed',
                cost: BOOST_COST,
                speedChange: 0.35,
                effectDescription: 'Tăng tốc máy xay nhanh hơn +35%.',
              },
              {
                text: 'Cứ Làm Bình Thường',
                actionType: 'ignore',
                effectDescription: 'Tiếp tục làm theo nhịp độ cũ.',
              },
            ],
          };
        }
        audioService.playOrderBell();
      }
      set({ eventOccurredInCurrentOrder: true });
    }

    // Check if finished production
    if (newRemaining <= 0) {
      set({
        activeOrder: {
          ...activeOrder,
          remainingProductionSeconds: 0,
          progressCount: activeOrder.quantity,
          status: 'confirming',
          activeEvent: null,
        },
        showConfirmationModal: true,
      });
      audioService.playFanfare();
    } else {
      set({
        activeOrder: {
          ...activeOrder,
          remainingProductionSeconds: newRemaining,
          progressCount,
          activeEvent: nextEvent,
        },
      });
    }
  },

  boostProduction: () => {
    const { activeOrder } = get();
    if (!activeOrder || activeOrder.isBoosted) return { success: false, cost: 0 };

    const ok = useEconomyStore.getState().deductCash(BOOST_COST);
    if (!ok) {
      audioService.playDisappointed();
      useGameStore.getState().showNotification('Không đủ tiền để bật tăng tốc!', 'error');
      return { success: false, cost: 0 };
    }

    set({
      activeOrder: {
        ...activeOrder,
        isBoosted: true,
      },
    });

    audioService.playCashRegister();
    useGameStore.getState().showNotification(`⚡ Đã bật tăng tốc dây chuyền (+35% tốc độ)!`, 'success');
    return { success: true, cost: BOOST_COST };
  },

  handleEventChoice: (choiceIndex: number) => {
    const { activeOrder } = get();
    if (!activeOrder || !activeOrder.activeEvent) return;

    const choice = activeOrder.activeEvent.choices[choiceIndex];
    if (!choice) return;

    if (choice.cost && choice.cost > 0) {
      const ok = useEconomyStore.getState().deductCash(choice.cost);
      if (!ok) {
        audioService.playDisappointed();
        useGameStore.getState().showNotification('Không đủ tiền thực hiện lựa chọn này!', 'error');
        return;
      }
    }

    let updatedSpeed = activeOrder.speedMultiplier;
    if (choice.speedChange) {
      updatedSpeed = Math.max(0.4, updatedSpeed + choice.speedChange);
    }

    let updatedQuantity = activeOrder.quantity;
    let updatedRevenue = activeOrder.totalRevenue;
    if (choice.extraQuantity && choice.extraRevenue) {
      updatedQuantity += choice.extraQuantity;
      updatedRevenue += choice.extraRevenue;
    }

    set({
      activeOrder: {
        ...activeOrder,
        speedMultiplier: updatedSpeed,
        quantity: updatedQuantity,
        totalRevenue: updatedRevenue,
        activeEvent: null,
      },
    });

    audioService.playClick();
    useGameStore.getState().showNotification(`Đã xử lý: ${choice.text}`, 'info');
  },

  confirmOrder: () => {
    const { activeOrder, customerReliabilities } = get();
    if (!activeOrder) return;

    const roll = Math.random();
    const isSuccess = roll >= activeOrder.cancellationRisk;

    const custId = activeOrder.customer.id;
    const currentHist = customerReliabilities[custId] || {
      reliability: activeOrder.customer.reliability,
      completedOrders: 0,
      cancelledOrders: 0,
    };

    if (isSuccess) {
      // 1. SUCCESS: Customer accepts and pays remaining balance
      const remainingBalance = activeOrder.totalRevenue - activeOrder.depositAmount;
      useEconomyStore.getState().addCash(remainingBalance);
      useCustomerStore.getState().recordSale(activeOrder.totalRevenue, activeOrder.ingredientCostTotal);

      // Customer reliability boost
      const newReliability = Math.min(100, currentHist.reliability + 5);
      const updatedHistoryMap = {
        ...customerReliabilities,
        [custId]: {
          reliability: newReliability,
          completedOrders: currentHist.completedOrders + 1,
          cancelledOrders: currentHist.cancelledOrders,
        },
      };

      // Review generated
      const stars = 5;
      const reviewComment = `Đơn đặt ${activeOrder.quantity} ly ${activeOrder.recipeName} cho ${activeOrder.customer.name} giao đúng giờ, uống siêu ngon mát lạnh! Cả hội trường ai cũng khen nức nở. 5 sao!`;
      useReviewStore.getState().addReview({
        authorName: activeOrder.customer.name,
        avatar: activeOrder.customer.avatar,
        rating: stars,
        comment: reviewComment,
        day: useGameStore.getState().day,
        recipeName: activeOrder.recipeName,
        helpfulCount: 8,
        aspect: 'quality',
      });

      const result: LargeOrderResult = {
        success: true,
        order: activeOrder,
        revenueReceived: activeOrder.totalRevenue,
        depositRetained: activeOrder.depositAmount,
        ingredientCost: activeOrder.ingredientCostTotal,
        recoverableAmount: 0,
        netProfitLoss: activeOrder.totalRevenue - activeOrder.ingredientCostTotal,
        customerSatisfaction: 5.0,
        reliabilityDelta: +5,
        reviewComment,
        reviewStars: 5,
      };

      const historyItem: LargeOrderHistoryItem = {
        id: activeOrder.id,
        customerName: activeOrder.customer.name,
        customerAvatar: activeOrder.customer.avatar,
        customerType: activeOrder.customer.type,
        recipeName: activeOrder.recipeName,
        recipeIcon: activeOrder.recipeIcon,
        quantity: activeOrder.quantity,
        totalRevenue: activeOrder.totalRevenue,
        depositAmount: activeOrder.depositAmount,
        cancellationRisk: activeOrder.cancellationRisk,
        status: 'completed',
        actualRevenue: activeOrder.totalRevenue,
        wastedCost: 0,
        recoveredAmount: 0,
        netProfitLoss: activeOrder.totalRevenue - activeOrder.ingredientCostTotal,
        day: useGameStore.getState().day,
        lostCustomersCount: activeOrder.lostCustomersCount,
      };

      set((state) => ({
        activeOrder: null,
        showConfirmationModal: false,
        showResultModal: true,
        lastResult: result,
        orderHistory: [historyItem, ...state.orderHistory],
        customerReliabilities: updatedHistoryMap,
      }));

      audioService.playFanfare();
    } else {
      // 2. BOM HÀNG / CANCELLED!
      // Deposit retained
      const depositRetained = activeOrder.depositAmount;

      // Partial recovery of ingredients (20% - 35%)
      const recoveryRate = RECOVERY_RATE_MIN + Math.random() * (RECOVERY_RATE_MAX - RECOVERY_RATE_MIN);
      const recoverableAmount = Math.round(activeOrder.ingredientCostTotal * recoveryRate);

      // Add recovered cash to player
      if (recoverableAmount > 0) {
        useEconomyStore.getState().addCash(recoverableAmount);
      }

      // Record ingredient waste loss
      const wastedCost = activeOrder.ingredientCostTotal - recoverableAmount;
      useCustomerStore.getState().recordSale(depositRetained, wastedCost);

      const netLoss = depositRetained + recoverableAmount - activeOrder.ingredientCostTotal;

      // Customer reliability drop
      const newReliability = Math.max(20, currentHist.reliability - 18);
      const updatedHistoryMap = {
        ...customerReliabilities,
        [custId]: {
          reliability: newReliability,
          completedOrders: currentHist.completedOrders,
          cancelledOrders: currentHist.cancelledOrders + 1,
        },
      };

      const result: LargeOrderResult = {
        success: false,
        order: activeOrder,
        revenueReceived: depositRetained,
        depositRetained,
        ingredientCost: activeOrder.ingredientCostTotal,
        recoverableAmount,
        netProfitLoss: netLoss,
        customerSatisfaction: 1.0,
        reliabilityDelta: -18,
      };

      const historyItem: LargeOrderHistoryItem = {
        id: activeOrder.id,
        customerName: activeOrder.customer.name,
        customerAvatar: activeOrder.customer.avatar,
        customerType: activeOrder.customer.type,
        recipeName: activeOrder.recipeName,
        recipeIcon: activeOrder.recipeIcon,
        quantity: activeOrder.quantity,
        totalRevenue: activeOrder.totalRevenue,
        depositAmount: activeOrder.depositAmount,
        cancellationRisk: activeOrder.cancellationRisk,
        status: 'cancelled',
        actualRevenue: depositRetained,
        wastedCost,
        recoveredAmount: recoverableAmount,
        netProfitLoss: netLoss,
        day: useGameStore.getState().day,
        lostCustomersCount: activeOrder.lostCustomersCount,
      };

      set((state) => ({
        activeOrder: null,
        showConfirmationModal: false,
        showResultModal: true,
        lastResult: result,
        orderHistory: [historyItem, ...state.orderHistory],
        customerReliabilities: updatedHistoryMap,
      }));

      audioService.playDisappointed();
    }
  },

  dismissResult: () => {
    set({ showResultModal: false, lastResult: null });
    audioService.playClick();
  },

  openOfferModal: () => set({ showOfferModal: true }),
  closeOfferModal: () => set({ showOfferModal: false }),
  openHistoryModal: () => set({ showHistoryModal: true }),
  closeHistoryModal: () => set({ showHistoryModal: false }),
  closeUnlockModal: () => set({ showUnlockModal: false }),

  recordLostCustomerOpportunity: () => {
    const { activeOrder } = get();
    if (!activeOrder || activeOrder.status !== 'producing') return;
    set({
      activeOrder: {
        ...activeOrder,
        lostCustomersCount: activeOrder.lostCustomersCount + 1,
      },
    });
  },

  resetLargeOrders: () => {
    set({
      activeOffer: null,
      activeOrder: null,
      orderHistory: [],
      customerReliabilities: {},
      hasShownUnlockTutorial: false,
      showUnlockModal: false,
      showOfferModal: false,
      showConfirmationModal: false,
      showResultModal: false,
      showHistoryModal: false,
      lastResult: null,
      eventOccurredInCurrentOrder: false,
      timeSinceLastOfferMinutes: 0,
    });
  },
}));
