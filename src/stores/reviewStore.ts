import { create } from 'zustand';
import { ReviewItem } from '../types';
import { 
  MapReviewModeration, 
  OwnerReplyOption, 
  ReplyResult, 
  ModerationCheckResult,
  ReplyAnalysisResult,
  ReplyGameplayEffect,
  AnalysisLevel
} from '../types/mapReview';
import { 
  BASE_IT_RECOVERY_COST, 
  FAILED_APPEAL_PENALTY, 
  MAX_IT_RECOVERY_COST, 
  REPORT_THRESHOLD_DEFAULT 
} from '../data/replyTemplates';
import { replySentimentAnalyzer } from '../services/mapReview/ReplySentimentAnalyzer';
import { ReplyGameplayCalculator } from '../services/mapReview/ReplyGameplayCalculator';
import { useEconomyStore } from './economyStore';
import { useGameStore } from './gameStore';
import { audioService } from '../services/AudioService';
import { formatVND } from '../utils/format';

export const INITIAL_MAPREVIEW_MODERATION: MapReviewModeration = {
  reportCount: 0,
  reportThreshold: REPORT_THRESHOLD_DEFAULT,
  totalReports: 0,
  suspensionCount: 0,
  isSuspended: false,
  appealAttempts: 0,
  failedAppeals: 0,
  itRecoveryCost: BASE_IT_RECOVERY_COST,
  activeBuzzType: null,
  buzzDaysLeft: 0,
  buzzTrafficModifier: 0,
  buzzDescription: '',
};

export const INITIAL_GOODWILL = 75;
export const INITIAL_PUBLIC_SENTIMENT = 70;

interface ReviewState {
  averageRating: number;
  totalReviews: number;
  reviews: ReviewItem[];
  isViralBoostActive: boolean;
  viralDaysLeft: number;
  isCrisisActive: boolean;

  // MapReview Reputation & Moderation System
  goodwill: number; // 0 - 100%
  publicSentiment: number; // 0 - 100%
  mapReviewModeration: MapReviewModeration;

  // Actions
  addReview: (review: Omit<ReviewItem, 'id' | 'date'>) => void;
  likeReview: (reviewId: string) => void;
  replyToReview: (reviewId: string, replyOption: OwnerReplyOption) => ReplyResult;
  replyToReviewWithCustomText: (reviewId: string, customText: string) => Promise<ReplyResult>;
  performModerationCheck: () => ModerationCheckResult;
  submitAppeal: () => { success: boolean; message: string };
  hireITTeamRecovery: () => { success: boolean; message: string; cost: number };
  tickDailyMapReview: (currentDay: number) => void;
  setGoodwill: (val: number) => void;
  setPublicSentiment: (val: number) => void;
  triggerViralReview: () => void;
  decrementViralDays: () => void;
  resolveCrisis: () => void;
  resetReviews: () => void;
}

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev_1',
    authorName: 'Nguyễn Văn Tuấn',
    avatar: '👨‍💼',
    rating: 5,
    comment: 'Sinh tố bơ sáp siêu ngậy, nhiều sữa béo. Giá rất mềm so với khu này, uống xong tỉnh cả người!',
    date: '3 ngày trước',
    day: 0,
    recipeName: 'Sinh Tố Bơ Sáp',
    helpfulCount: 12,
    aspect: 'quality',
    isViral: true,
  },
  {
    id: 'rev_2',
    authorName: 'Bùi Gia Linh',
    avatar: '🎒',
    rating: 4,
    comment: 'Sinh tố xoài thơm ngọt tự nhiên, không bị gắt đường. Mỗi tội buổi trưa hơi đông phải đợi xíu.',
    date: '5 ngày trước',
    day: 0,
    recipeName: 'Sinh Tố Xoài',
    helpfulCount: 6,
    aspect: 'speed',
  },
  {
    id: 'rev_3',
    authorName: 'Trần Minh Trọng',
    avatar: '🏋️',
    rating: 4,
    comment: 'Anh chủ nhiệt tình, xin ít đường ít đá làm đúng y chang. Ghế nhựa ngồi vỉa hè thoáng mát.',
    date: '1 tuần trước',
    day: 0,
    recipeName: 'Sinh Tố Chuối',
    helpfulCount: 4,
    aspect: 'service',
  },
];

export const useReviewStore = create<ReviewState>((set, get) => ({
  averageRating: 4.3,
  totalReviews: 3,
  reviews: INITIAL_REVIEWS,
  isViralBoostActive: false,
  viralDaysLeft: 0,
  isCrisisActive: false,
  goodwill: INITIAL_GOODWILL,
  publicSentiment: INITIAL_PUBLIC_SENTIMENT,
  mapReviewModeration: INITIAL_MAPREVIEW_MODERATION,

  addReview: (review) => {
    const { mapReviewModeration } = get();
    // When MapReview is suspended, new incoming customer reviews on MapReview are paused
    if (mapReviewModeration.isSuspended) {
      return;
    }

    const newId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newReviewItem: ReviewItem = {
      ...review,
      id: newId,
      date: 'Hôm nay',
    };

    set((state) => {
      const updatedReviews = [newReviewItem, ...state.reviews];
      const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
      const newAvg = Number((sum / updatedReviews.length).toFixed(1));
      const isCrisis = newAvg < 2.8;

      // New reviews slightly influence Public Sentiment
      const sentimentDelta = review.rating >= 4 ? 1 : review.rating <= 2 ? -2 : 0;
      const nextSentiment = Math.max(10, Math.min(100, state.publicSentiment + sentimentDelta));

      return {
        reviews: updatedReviews,
        totalReviews: state.totalReviews + 1,
        averageRating: newAvg,
        publicSentiment: nextSentiment,
        isCrisisActive: isCrisis,
      };
    });
  },

  likeReview: (reviewId: string) => {
    set((state) => ({
      reviews: state.reviews.map((r) =>
        r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
      ),
    }));
  },

  replyToReviewWithCustomText: async (reviewId: string, customText: string): Promise<ReplyResult> => {
    const { reviews, goodwill, publicSentiment, mapReviewModeration } = get();
    const game = useGameStore.getState();

    const targetReview = reviews.find((r) => r.id === reviewId);
    if (!targetReview) {
      return {
        success: false,
        goodwillChange: 0,
        publicSentimentChange: 0,
        wasReported: false,
        newReportCount: mapReviewModeration.reportCount,
        viralTriggered: false,
      };
    }

    const trimmed = customText.trim();
    if (!trimmed) {
      return {
        success: false,
        goodwillChange: 0,
        publicSentimentChange: 0,
        wasReported: false,
        newReportCount: mapReviewModeration.reportCount,
        viralTriggered: false,
      };
    }

    // 1. Run AI / NLP Analysis
    const analysis: ReplyAnalysisResult = await replySentimentAnalyzer.analyze(targetReview, trimmed);

    // 2. Compute Deterministic Gameplay Effects
    const effect: ReplyGameplayEffect = ReplyGameplayCalculator.calculate(targetReview, analysis);

    // 3. Calculate Goodwill & Public Sentiment deltas
    const newGoodwill = Math.max(0, Math.min(100, goodwill + effect.goodwillEffect));
    const newSentiment = Math.max(0, Math.min(100, publicSentiment + effect.publicSentimentEffect));

    // 4. Roll Report Probability
    const wasReported = effect.reportChance > 0 && Math.random() < effect.reportChance;
    let nextReportCount = mapReviewModeration.reportCount + (wasReported ? 1 : 0);
    let nextTotalReports = mapReviewModeration.totalReports + (wasReported ? 1 : 0);

    // 5. Roll Positive/Negative Viral Community Buzz Chance
    let viralTriggered = false;
    let viralMessage = '';
    let nextBuzzType: 'positive' | 'negative' | null = mapReviewModeration.activeBuzzType || null;
    let nextBuzzDays = mapReviewModeration.buzzDaysLeft || 0;
    let nextBuzzModifier = mapReviewModeration.buzzTrafficModifier || 0;
    let nextBuzzDesc = mapReviewModeration.buzzDescription || '';

    if (effect.viralChance > 0 && Math.random() < effect.viralChance) {
      viralTriggered = true;
      if (analysis.sentiment === 'positive') {
        nextBuzzType = 'positive';
        nextBuzzDays = 2;
        nextBuzzModifier = effect.trafficBonusPercent || 12;
        nextBuzzDesc = `Khách hàng tán dương phản hồi chu đáo của quán! (+${nextBuzzModifier}% khách trong 2 ngày)`;
        viralMessage = `🔥 HIỆU ỨNG TÍCH CỰC: ${nextBuzzDesc}`;
        audioService.playFanfare();
        game.showNotification(viralMessage, 'success');
      } else if (analysis.sentiment === 'negative' || analysis.defensive || analysis.toxicity !== 'low') {
        nextBuzzType = 'negative';
        nextBuzzDays = 2;
        nextBuzzModifier = effect.trafficBonusPercent || -10;
        nextBuzzDesc = `Cộng đồng mạng bức xúc vì phản hồi của quán! (${nextBuzzModifier}% khách trong 2 ngày)`;
        viralMessage = `💢 PHỐT MẠNG XÃ HỘI: ${nextBuzzDesc}`;
        audioService.playDisappointed();
        game.showNotification(viralMessage, 'warning');
      }
    }

    // Update review item with custom reply & structured analysis data
    const updatedReviews = reviews.map((r) => {
      if (r.id === reviewId) {
        return {
          ...r,
          ownerReply: trimmed,
          ownerReplySentiment: analysis.sentiment,
          ownerReplyAt: `Ngày ${game.day}`,
          wasReported: wasReported,
          replyAnalysis: analysis,
        };
      }
      return r;
    });

    let modResult: ModerationCheckResult | undefined = undefined;

    // 6. Check if 5-Report Threshold Reached
    if (nextReportCount >= mapReviewModeration.reportThreshold) {
      // Trigger Platform Moderation Check
      let suspensionRisk = 35;
      if (newGoodwill < 50) suspensionRisk += 15;
      if (newSentiment < 50) suspensionRisk += 10;
      if (mapReviewModeration.suspensionCount > 0) suspensionRisk += 15;
      if (newGoodwill > 80) suspensionRisk -= 15;
      suspensionRisk = Math.max(10, Math.min(85, suspensionRisk));

      const isSuspendedNow = Math.random() * 100 < suspensionRisk;
      const currentSuspensionCount = mapReviewModeration.suspensionCount + (isSuspendedNow ? 1 : 0);

      modResult = {
        triggered: true,
        suspensionChance: suspensionRisk,
        isSuspended: isSuspendedNow,
        reportsReset: true,
        message: isSuspendedNow
          ? `🚫 ĐÃ BỊ ĐÌNH CHỈ: MapReview phát hiện nhiều vi phạm và tạm khóa quán! (Lịch sử đánh giá ${updatedReviews.length} bài vẫn được giữ nguyên 100%).`
          : `⚠️ CẢNH CÁO NỀN TẢNG: MapReview đã kiểm tra và nhắc nhở. Bạn tạm thời thoát án phạt đình chỉ! Báo cáo đã được xóa về 0.`,
      };

      if (isSuspendedNow) {
        audioService.playDisappointed();
        game.showNotification(modResult.message, 'error');
      } else {
        audioService.playClick();
        game.showNotification(modResult.message, 'warning');
      }

      set({
        reviews: updatedReviews,
        goodwill: newGoodwill,
        publicSentiment: newSentiment,
        mapReviewModeration: {
          ...mapReviewModeration,
          reportCount: 0, // RESET to 0 immediately!
          totalReports: nextTotalReports,
          suspensionCount: currentSuspensionCount,
          isSuspended: isSuspendedNow,
          suspensionStartedAtDay: isSuspendedNow ? game.day : undefined,
          failedAppeals: isSuspendedNow ? 0 : mapReviewModeration.failedAppeals,
          itRecoveryCost: isSuspendedNow ? BASE_IT_RECOVERY_COST : mapReviewModeration.itRecoveryCost,
          activeBuzzType: nextBuzzType,
          buzzDaysLeft: nextBuzzDays,
          buzzTrafficModifier: nextBuzzModifier,
          buzzDescription: nextBuzzDesc,
        },
      });
    } else {
      const gwStr = effect.goodwillEffect >= 0 ? `+${effect.goodwillEffect}%` : `${effect.goodwillEffect}%`;
      const sentStr = effect.publicSentimentEffect >= 0 ? `+${effect.publicSentimentEffect}%` : `${effect.publicSentimentEffect}%`;

      if (wasReported) {
        audioService.playDisappointed();
        game.showNotification(
          `⚠️ BỊ KHIẾU NẠI: Thiện cảm ${gwStr}, Dư luận ${sentStr} (Vi phạm: ${nextReportCount}/${mapReviewModeration.reportThreshold})`,
          'warning'
        );
      } else {
        audioService.playClick();
        game.showNotification(
          `✓ Đã phản hồi: Thiện cảm ${gwStr}, Dư luận ${sentStr}`,
          effect.goodwillEffect >= 0 ? 'success' : 'warning'
        );
      }

      set({
        reviews: updatedReviews,
        goodwill: newGoodwill,
        publicSentiment: newSentiment,
        mapReviewModeration: {
          ...mapReviewModeration,
          reportCount: nextReportCount,
          totalReports: nextTotalReports,
          activeBuzzType: nextBuzzType,
          buzzDaysLeft: nextBuzzDays,
          buzzTrafficModifier: nextBuzzModifier,
          buzzDescription: nextBuzzDesc,
        },
      });
    }

    return {
      success: true,
      goodwillChange: effect.goodwillEffect,
      publicSentimentChange: effect.publicSentimentEffect,
      wasReported,
      newReportCount: get().mapReviewModeration.reportCount,
      viralTriggered,
      viralMessage,
      moderationResult: modResult,
      analysis,
      gameplayEffect: effect,
    };
  },

  replyToReview: (reviewId: string, replyOption: OwnerReplyOption): ReplyResult => {
    const { reviews, goodwill, publicSentiment, mapReviewModeration } = get();
    const game = useGameStore.getState();

    const targetReview = reviews.find((r) => r.id === reviewId);
    if (!targetReview) {
      return {
        success: false,
        goodwillChange: 0,
        publicSentimentChange: 0,
        wasReported: false,
        newReportCount: mapReviewModeration.reportCount,
        viralTriggered: false,
      };
    }

    // 1. Calculate Goodwill & Public Sentiment deltas
    const newGoodwill = Math.max(0, Math.min(100, goodwill + replyOption.goodwillEffect));
    const newSentiment = Math.max(0, Math.min(100, publicSentiment + replyOption.publicSentimentEffect));

    // 2. Roll Report Probability
    const wasReported = replyOption.reportChance > 0 && Math.random() < replyOption.reportChance;
    let nextReportCount = mapReviewModeration.reportCount + (wasReported ? 1 : 0);
    let nextTotalReports = mapReviewModeration.totalReports + (wasReported ? 1 : 0);

    // 3. Roll Positive/Negative Viral Community Buzz Chance
    let viralTriggered = false;
    let viralMessage = '';
    let nextBuzzType: 'positive' | 'negative' | null = mapReviewModeration.activeBuzzType || null;
    let nextBuzzDays = mapReviewModeration.buzzDaysLeft || 0;
    let nextBuzzModifier = mapReviewModeration.buzzTrafficModifier || 0;
    let nextBuzzDesc = mapReviewModeration.buzzDescription || '';

    if (replyOption.viralChance > 0 && Math.random() < replyOption.viralChance) {
      viralTriggered = true;
      if (replyOption.sentiment === 'positive') {
        nextBuzzType = 'positive';
        nextBuzzDays = 2;
        nextBuzzModifier = replyOption.trafficBonusPercent || 12;
        nextBuzzDesc = `Khách hàng tán dương phản hồi chu đáo của quán! (+${nextBuzzModifier}% khách trong 2 ngày)`;
        viralMessage = `🔥 HIỆU ỨNG TÍCH CỰC: ${nextBuzzDesc}`;
        audioService.playFanfare();
        game.showNotification(viralMessage, 'success');
      } else if (replyOption.sentiment === 'negative') {
        nextBuzzType = 'negative';
        nextBuzzDays = 2;
        nextBuzzModifier = replyOption.trafficBonusPercent || -10;
        nextBuzzDesc = `Cộng đồng mạng bức xúc vì phản hồi gắt gỏng của quán! (${nextBuzzModifier}% khách trong 2 ngày)`;
        viralMessage = `💢 PHỐT MẠNG XÃ HỘI: ${nextBuzzDesc}`;
        audioService.playDisappointed();
        game.showNotification(viralMessage, 'warning');
      }
    }

    // Update review item with reply data
    const updatedReviews = reviews.map((r) => {
      if (r.id === reviewId) {
        return {
          ...r,
          ownerReply: replyOption.text,
          ownerReplySentiment: replyOption.sentiment,
          ownerReplyAt: `Ngày ${game.day}`,
          wasReported: wasReported,
          replyAnalysis: {
            replyText: replyOption.text,
            createdAt: Date.now(),
            sentiment: replyOption.sentiment,
            politeness: (replyOption.sentiment === 'positive' ? 'high' : replyOption.sentiment === 'neutral' ? 'medium' : 'low') as AnalysisLevel,
            empathy: (replyOption.sentiment === 'positive' ? 'high' : 'medium') as AnalysisLevel,
            defensive: replyOption.sentiment === 'negative',
            toxicity: (replyOption.sentiment === 'negative' ? 'medium' : 'low') as AnalysisLevel,
            isAiAnalyzed: false,
          },
        };
      }
      return r;
    });

    let modResult: ModerationCheckResult | undefined = undefined;

    // 4. Check if 5-Report Threshold Reached
    if (nextReportCount >= mapReviewModeration.reportThreshold) {
      let suspensionRisk = 35;
      if (newGoodwill < 50) suspensionRisk += 15;
      if (newSentiment < 50) suspensionRisk += 10;
      if (mapReviewModeration.suspensionCount > 0) suspensionRisk += 15;
      if (newGoodwill > 80) suspensionRisk -= 15;
      suspensionRisk = Math.max(10, Math.min(85, suspensionRisk));

      const isSuspendedNow = Math.random() * 100 < suspensionRisk;
      const currentSuspensionCount = mapReviewModeration.suspensionCount + (isSuspendedNow ? 1 : 0);

      modResult = {
        triggered: true,
        suspensionChance: suspensionRisk,
        isSuspended: isSuspendedNow,
        reportsReset: true,
        message: isSuspendedNow
          ? `🚫 ĐÃ BỊ ĐÌNH CHỈ: MapReview phát hiện nhiều vi phạm và tạm khóa quán! (Lịch sử đánh giá ${updatedReviews.length} bài vẫn được giữ nguyên 100%).`
          : `⚠️ CẢNH CÁO NỀN TẢNG: MapReview đã kiểm tra và nhắc nhở. Bạn tạm thời thoát án phạt đình chỉ! Báo cáo đã được xóa về 0.`,
      };

      if (isSuspendedNow) {
        audioService.playDisappointed();
        game.showNotification(modResult.message, 'error');
      } else {
        audioService.playClick();
        game.showNotification(modResult.message, 'warning');
      }

      set({
        reviews: updatedReviews,
        goodwill: newGoodwill,
        publicSentiment: newSentiment,
        mapReviewModeration: {
          ...mapReviewModeration,
          reportCount: 0,
          totalReports: nextTotalReports,
          suspensionCount: currentSuspensionCount,
          isSuspended: isSuspendedNow,
          suspensionStartedAtDay: isSuspendedNow ? game.day : undefined,
          failedAppeals: isSuspendedNow ? 0 : mapReviewModeration.failedAppeals,
          itRecoveryCost: isSuspendedNow ? BASE_IT_RECOVERY_COST : mapReviewModeration.itRecoveryCost,
          activeBuzzType: nextBuzzType,
          buzzDaysLeft: nextBuzzDays,
          buzzTrafficModifier: nextBuzzModifier,
          buzzDescription: nextBuzzDesc,
        },
      });
    } else {
      if (wasReported) {
        audioService.playDisappointed();
        game.showNotification(
          `⚠️ BỊ KHIẾU NẠI: Khách hàng đã báo cáo phản hồi thô lỗ lên MapReview! (Vi phạm: ${nextReportCount}/${mapReviewModeration.reportThreshold})`,
          'warning'
        );
      } else {
        audioService.playClick();
        game.showNotification('✓ Đã đăng phản hồi cho khách hàng!', 'success');
      }

      set({
        reviews: updatedReviews,
        goodwill: newGoodwill,
        publicSentiment: newSentiment,
        mapReviewModeration: {
          ...mapReviewModeration,
          reportCount: nextReportCount,
          totalReports: nextTotalReports,
          activeBuzzType: nextBuzzType,
          buzzDaysLeft: nextBuzzDays,
          buzzTrafficModifier: nextBuzzModifier,
          buzzDescription: nextBuzzDesc,
        },
      });
    }

    return {
      success: true,
      goodwillChange: replyOption.goodwillEffect,
      publicSentimentChange: replyOption.publicSentimentEffect,
      wasReported,
      newReportCount: get().mapReviewModeration.reportCount,
      viralTriggered,
      viralMessage,
      moderationResult: modResult,
    };
  },

  performModerationCheck: (): ModerationCheckResult => {
    const { mapReviewModeration, goodwill, publicSentiment, reviews } = get();
    const game = useGameStore.getState();

    let suspensionRisk = 35;
    if (goodwill < 50) suspensionRisk += 15;
    if (publicSentiment < 50) suspensionRisk += 10;
    if (mapReviewModeration.suspensionCount > 0) suspensionRisk += 15;
    if (goodwill > 80) suspensionRisk -= 15;
    suspensionRisk = Math.max(10, Math.min(85, suspensionRisk));

    const isSuspendedNow = Math.random() * 100 < suspensionRisk;
    const currentSuspensionCount = mapReviewModeration.suspensionCount + (isSuspendedNow ? 1 : 0);

    const message = isSuspendedNow
      ? `🚫 MapReview đã quyết định tạm đình chỉ hiển thị quán do các phản hồi không chuẩn mực. Toàn bộ ${reviews.length} đánh giá cũ vẫn được bảo lưu.`
      : `✓ Nền tảng MapReview gửi cảnh cáo nhắc nhở nhưng không đình chỉ quán. Báo cáo vi phạm đã được thiết lập lại.`;

    set({
      mapReviewModeration: {
        ...mapReviewModeration,
        reportCount: 0,
        suspensionCount: currentSuspensionCount,
        isSuspended: isSuspendedNow,
        suspensionStartedAtDay: isSuspendedNow ? game.day : undefined,
        failedAppeals: isSuspendedNow ? 0 : mapReviewModeration.failedAppeals,
        itRecoveryCost: isSuspendedNow ? BASE_IT_RECOVERY_COST : mapReviewModeration.itRecoveryCost,
      },
    });

    return {
      triggered: true,
      suspensionChance: suspensionRisk,
      isSuspended: isSuspendedNow,
      reportsReset: true,
      message,
    };
  },

  submitAppeal: () => {
    const { mapReviewModeration, reviews, averageRating } = get();
    const game = useGameStore.getState();

    if (!mapReviewModeration.isSuspended) {
      return { success: false, message: 'Quán không trong trạng thái bị đình chỉ!' };
    }

    const isSuccess = Math.random() < 0.5;

    if (isSuccess) {
      audioService.playFanfare();
      game.showNotification('🎉 KHÁNG CÁO THÀNH CÔNG! MapReview đã mở lại gian hàng cho quán!', 'success');

      set({
        mapReviewModeration: {
          ...mapReviewModeration,
          isSuspended: false,
          appealAttempts: mapReviewModeration.appealAttempts + 1,
          failedAppeals: 0,
          itRecoveryCost: BASE_IT_RECOVERY_COST,
        },
      });

      return {
        success: true,
        message: `✓ Kháng cáo thành công! Quán đã xuất hiện trở lại trên MapReview với đầy đủ ${reviews.length} đánh giá (${averageRating}★).`,
      };
    } else {
      const nextFailed = mapReviewModeration.failedAppeals + 1;
      const nextItCost = Math.min(
        MAX_IT_RECOVERY_COST,
        BASE_IT_RECOVERY_COST + nextFailed * FAILED_APPEAL_PENALTY
      );

      audioService.playDisappointed();
      game.showNotification(
        `❌ KHÁNG CÁO BỊ BÁC BỎ: Nền tảng giữ nguyên quyết định. Phí thuê IT khôi phục tăng lên ${formatVND(nextItCost)}.`,
        'error'
      );

      set({
        mapReviewModeration: {
          ...mapReviewModeration,
          appealAttempts: mapReviewModeration.appealAttempts + 1,
          failedAppeals: nextFailed,
          itRecoveryCost: nextItCost,
        },
      });

      return {
        success: false,
        message: `Kháng cáo thất bại. Phí thuê IT đã tăng lên ${formatVND(nextItCost)}.`,
      };
    }
  },

  hireITTeamRecovery: () => {
    const { mapReviewModeration, reviews, averageRating } = get();
    const econ = useEconomyStore.getState();
    const game = useGameStore.getState();

    if (!mapReviewModeration.isSuspended) {
      return { success: false, message: 'Quán không trong trạng thái bị đình chỉ!', cost: 0 };
    }

    const cost = mapReviewModeration.itRecoveryCost || BASE_IT_RECOVERY_COST;

    if (econ.cash < cost) {
      audioService.playDisappointed();
      game.showNotification(`Không đủ tiền mặt (${formatVND(cost)}) để thuê đội IT can thiệp!`, 'error');
      return { success: false, message: 'Không đủ tiền mặt', cost };
    }

    econ.deductCash(cost);

    audioService.playCashRegister();
    game.showNotification(
      `✓ ĐÃ KHÔI PHỤC MAPREVIEW: Đội ngũ IT đã xử lý gỡ phong tỏa thành công! (${reviews.length} đánh giá giữ nguyên)`,
      'success'
    );

    set({
      mapReviewModeration: {
        ...mapReviewModeration,
        isSuspended: false,
        failedAppeals: 0,
        itRecoveryCost: BASE_IT_RECOVERY_COST,
      },
    });

    return {
      success: true,
      message: `Khôi phục thành công với chi phí ${formatVND(cost)}. Toàn bộ ${reviews.length} đánh giá (${averageRating}★) đã kích hoạt lại bình thường!`,
      cost,
    };
  },

  tickDailyMapReview: (currentDay: number) => {
    set((state) => {
      let nextViralDays = state.viralDaysLeft;
      let nextViralActive = state.isViralBoostActive;
      if (nextViralActive) {
        nextViralDays -= 1;
        if (nextViralDays <= 0) {
          nextViralActive = false;
          nextViralDays = 0;
        }
      }

      let buzzDays = state.mapReviewModeration.buzzDaysLeft;
      let buzzType = state.mapReviewModeration.activeBuzzType;
      let buzzMod = state.mapReviewModeration.buzzTrafficModifier;
      let buzzDesc = state.mapReviewModeration.buzzDescription;

      if (buzzDays > 0) {
        buzzDays -= 1;
        if (buzzDays <= 0) {
          buzzType = null;
          buzzMod = 0;
          buzzDesc = '';
        }
      }

      return {
        viralDaysLeft: nextViralDays,
        isViralBoostActive: nextViralActive,
        mapReviewModeration: {
          ...state.mapReviewModeration,
          buzzDaysLeft: buzzDays,
          activeBuzzType: buzzType,
          buzzTrafficModifier: buzzMod,
          buzzDescription: buzzDesc,
        },
      };
    });
  },

  setGoodwill: (val: number) => {
    set({ goodwill: Math.max(0, Math.min(100, val)) });
  },

  setPublicSentiment: (val: number) => {
    set({ publicSentiment: Math.max(0, Math.min(100, val)) });
  },

  triggerViralReview: () => {
    set({
      isViralBoostActive: true,
      viralDaysLeft: 2,
    });
  },

  decrementViralDays: () => {
    set((state) => {
      if (state.viralDaysLeft <= 1) {
        return { isViralBoostActive: false, viralDaysLeft: 0 };
      }
      return { viralDaysLeft: state.viralDaysLeft - 1 };
    });
  },

  resolveCrisis: () => {
    set({ isCrisisActive: false });
  },

  resetReviews: () => {
    set({
      averageRating: 4.3,
      totalReviews: 3,
      reviews: INITIAL_REVIEWS,
      isViralBoostActive: false,
      viralDaysLeft: 0,
      isCrisisActive: false,
      goodwill: INITIAL_GOODWILL,
      publicSentiment: INITIAL_PUBLIC_SENTIMENT,
      mapReviewModeration: INITIAL_MAPREVIEW_MODERATION,
    });
  },
}));
