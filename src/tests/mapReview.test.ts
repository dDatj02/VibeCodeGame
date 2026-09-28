import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useReviewStore, INITIAL_GOODWILL, INITIAL_PUBLIC_SENTIMENT } from '../stores/reviewStore';
import { useEconomyStore } from '../stores/economyStore';
import { useGameStore } from '../stores/gameStore';
import { SaveService } from '../services/SaveService';
import { BackupService } from '../services/BackupService';
import { replySentimentAnalyzer } from '../services/mapReview/ReplySentimentAnalyzer';
import { ReplyGameplayCalculator } from '../services/mapReview/ReplyGameplayCalculator';
import { BASE_IT_RECOVERY_COST } from '../data/replyTemplates';

describe('FEATURE: MapReview AI-Analyzed Custom Owner Replies & Moderation', () => {
  beforeEach(() => {
    SaveService.clearSave();
  });

  it('TEST 1: Positive Vietnamese custom reply increases goodwill and public sentiment', async () => {
    const revStore = useReviewStore.getState();
    const initialGoodwill = revStore.goodwill;
    const initialSentiment = revStore.publicSentiment;
    const reviewId = revStore.reviews[0].id;

    const customText = 'Dạ quán chân thành xin lỗi và cảm ơn bạn! Lần sau ghé quán sẽ tặng bạn 1 ly miễn phí để chuộc lỗi nhé ❤️';
    const res = await useReviewStore.getState().replyToReviewWithCustomText(reviewId, customText);

    expect(res.success).toBe(true);
    expect(res.analysis?.sentiment).toBe('positive');
    expect(res.goodwillChange).toBeGreaterThan(0);
    expect(useReviewStore.getState().goodwill).toBeGreaterThan(initialGoodwill);

    const target = useReviewStore.getState().reviews.find((r) => r.id === reviewId);
    expect(target?.ownerReply).toBe(customText);
    expect(target?.replyAnalysis?.sentiment).toBe('positive');
  });

  it('TEST 2: Neutral Vietnamese reply applies balanced effect', async () => {
    const revStore = useReviewStore.getState();
    const reviewId = revStore.reviews[0].id;

    const customText = 'Quán đã ghi nhận phản hồi của bạn.';
    const res = await useReviewStore.getState().replyToReviewWithCustomText(reviewId, customText);

    expect(res.success).toBe(true);
    expect(res.analysis?.sentiment).toBe('neutral');
    expect(res.wasReported).toBe(false);
  });

  it('TEST 3: Negative Vietnamese custom reply reduces goodwill and public sentiment', async () => {
    const revStore = useReviewStore.getState();
    const initialGoodwill = revStore.goodwill;
    const reviewId = revStore.reviews[0].id;

    const customText = 'Bán rẻ như cho rồi còn đòi hỏi! Không uống được thì đừng ghé quán nữa!';
    const res = await useReviewStore.getState().replyToReviewWithCustomText(reviewId, customText);

    expect(res.success).toBe(true);
    expect(res.analysis?.sentiment).toBe('negative');
    expect(res.goodwillChange).toBeLessThan(0);
    expect(useReviewStore.getState().goodwill).toBeLessThan(initialGoodwill);
  });

  it('TEST 4: Polite disagreement with constructive explanation', async () => {
    const review = useReviewStore.getState().reviews[0];
    const customText = 'Dạ cảm ơn bạn đã góp ý. Sinh tố bơ bên mình dùng 100% bơ sáp Đắk Lắk không pha bột nên vị sẽ béo tự nhiên ạ!';
    const analysis = await replySentimentAnalyzer.analyze(review, customText);

    expect(analysis.sentiment).toBe('positive');
    expect(analysis.politeness).toBe('high');
    expect(analysis.toxicity).toBe('low');
  });

  it('TEST 5: Defensive reply is classified as defensive with penalties', async () => {
    const review = useReviewStore.getState().reviews[0];
    const customText = 'Lỗi tại bạn uống không quen chứ cả trăm người khác khen ngon, mỗi bạn chê!';
    const analysis = await replySentimentAnalyzer.analyze(review, customText);

    expect(analysis.defensive).toBe(true);
    const effect = ReplyGameplayCalculator.calculate(review, analysis);
    expect(effect.goodwillEffect).toBeLessThan(0);
    expect(effect.reportChance).toBeGreaterThan(0.2);
  });

  it('TEST 6: Rude reply results in low politeness and report risk', async () => {
    const review = useReviewStore.getState().reviews[0];
    const customText = 'Bớt bới lông tìm vết đi, rảnh rỗi quá kiếm việc mà làm!';
    const analysis = await replySentimentAnalyzer.analyze(review, customText);

    expect(analysis.sentiment).toBe('negative');
    expect(analysis.politeness).toBe('low');
  });

  it('TEST 7: Highly toxic reply with swear words triggers severe toxicity penalty', async () => {
    const review = useReviewStore.getState().reviews[0];
    const customText = 'Cút đi đồ hãm tài bố láo!';
    const analysis = await replySentimentAnalyzer.analyze(review, customText);

    expect(analysis.toxicity).toBe('high');
    const effect = ReplyGameplayCalculator.calculate(review, analysis);
    expect(effect.goodwillEffect).toBeLessThanOrEqual(-18);
    expect(effect.reportChance).toBeGreaterThanOrEqual(0.5);
  });

  it('TEST 8: Emoji-containing Vietnamese reply parses correctly', async () => {
    const review = useReviewStore.getState().reviews[0];
    const customText = 'Dạ cảm ơn bạn nhiều nha! 🥑🍹 Chúc bạn ngày mới vui vẻ ✨';
    const analysis = await replySentimentAnalyzer.analyze(review, customText);

    expect(analysis.sentiment).toBe('positive');
    expect(analysis.replyText).toBe(customText);
  });

  it('TEST 9: Very short reply handles safely', async () => {
    const review = useReviewStore.getState().reviews[0];
    const customText = 'Dạ';
    const analysis = await replySentimentAnalyzer.analyze(review, customText);

    expect(analysis.sentiment).toBeDefined();
  });

  it('TEST 10: Long reply up to 250 characters processes smoothly', async () => {
    const review = useReviewStore.getState().reviews[0];
    const customText = 'Dạ quán chân thành cảm ơn những đóng góp quý báu của quý khách! Quán luôn đặt chất lượng trái cây tươi sạch lên hàng đầu và sẽ nỗ lực nâng cao tốc độ phục vụ để mang đến trải nghiệm tuyệt vời nhất cho bạn vào những lần ghé thăm tiếp theo ạ!';
    const analysis = await replySentimentAnalyzer.analyze(review, customText);

    expect(analysis.sentiment).toBe('positive');
  });

  it('TEST 11: Empty reply is rejected without errors', async () => {
    const reviewId = useReviewStore.getState().reviews[0].id;
    const res = await useReviewStore.getState().replyToReviewWithCustomText(reviewId, '   ');

    expect(res.success).toBe(false);
  });

  it('TEST 12: API timeout / failure falls back gracefully to local analyzer', async () => {
    const review = useReviewStore.getState().reviews[0];
    
    // Simulate fetch failure
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

    const analysis = await replySentimentAnalyzer.analyze(review, 'Dạ quán cảm ơn bạn rất nhiều ạ!');
    globalThis.fetch = originalFetch;

    expect(analysis.sentiment).toBe('positive');
    expect(analysis.isAiAnalyzed).toBe(false);
  });

  it('TEST 13: Invalid AI JSON falls back cleanly', async () => {
    const review = useReviewStore.getState().reviews[0];
    
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ invalid: 'garbage' }),
    } as any);

    const analysis = await replySentimentAnalyzer.analyze(review, 'Dạ quán cảm ơn bạn ạ!');
    globalThis.fetch = originalFetch;

    expect(analysis.sentiment).toBe('positive');
  });

  it('TEST 14: Save and reload preserves custom typed reply and AI analysis result', async () => {
    const revId = useReviewStore.getState().reviews[0].id;
    const customText = 'Dạ quán xin lỗi và đã đổi công thức mới ạ!';
    await useReviewStore.getState().replyToReviewWithCustomText(revId, customText);

    // Save
    SaveService.saveGame();

    // Clear
    useReviewStore.getState().resetReviews();

    // Load
    SaveService.loadGame();

    const loaded = useReviewStore.getState();
    const target = loaded.reviews.find((r) => r.id === revId);
    expect(target?.ownerReply).toBe(customText);
    expect(target?.replyAnalysis).toBeDefined();
    expect(target?.replyAnalysis?.sentiment).toBe('positive');
  });

  it('TEST 15: MapReview suspension after accumulated reports with custom replies', () => {
    useReviewStore.setState({
      mapReviewModeration: {
        reportCount: 4,
        reportThreshold: 5,
        totalReports: 4,
        suspensionCount: 0,
        isSuspended: false,
        appealAttempts: 0,
        failedAppeals: 0,
        itRecoveryCost: BASE_IT_RECOVERY_COST,
        buzzDaysLeft: 0,
        buzzTrafficModifier: 0,
        buzzDescription: '',
      },
    });

    const check = useReviewStore.getState().performModerationCheck();
    expect(check.triggered).toBe(true);
    expect(useReviewStore.getState().mapReviewModeration.reportCount).toBe(0);
  });

  it('TEST 16: Historical custom owner reply remains preserved during suspension', () => {
    const revStore = useReviewStore.getState();
    const revId = revStore.reviews[0].id;
    const initialCount = revStore.reviews.length;

    useReviewStore.setState({
      reviews: revStore.reviews.map((r) =>
        r.id === revId ? { ...r, ownerReply: 'Phản hồi lưu trữ', ownerReplySentiment: 'positive' } : r
      ),
      mapReviewModeration: {
        ...revStore.mapReviewModeration,
        isSuspended: true,
      },
    });

    const suspendedStore = useReviewStore.getState();
    expect(suspendedStore.reviews.length).toBe(initialCount);
    expect(suspendedStore.reviews.find((r) => r.id === revId)?.ownerReply).toBe('Phản hồi lưu trữ');
  });

  it('TEST 17: Historical custom owner reply remains preserved after recovery', () => {
    useEconomyStore.setState({ cash: 1000000 });
    const revId = useReviewStore.getState().reviews[0].id;

    useReviewStore.setState({
      reviews: useReviewStore.getState().reviews.map((r) =>
        r.id === revId ? { ...r, ownerReply: 'Phản hồi không bao giờ mất' } : r
      ),
      mapReviewModeration: {
        ...useReviewStore.getState().mapReviewModeration,
        isSuspended: true,
        itRecoveryCost: 500000,
      },
    });

    useReviewStore.getState().hireITTeamRecovery();

    const restored = useReviewStore.getState();
    expect(restored.mapReviewModeration.isSuspended).toBe(false);
    expect(restored.reviews.find((r) => r.id === revId)?.ownerReply).toBe('Phản hồi không bao giờ mất');
  });

  it('TEST 18: Backup Code preserves custom replies + analysis data across devices', async () => {
    const revId = useReviewStore.getState().reviews[0].id;
    const customText = 'Cảm ơn quý khách ghé quán!';
    await useReviewStore.getState().replyToReviewWithCustomText(revId, customText);

    // Backup
    const backup = BackupService.generateBackupCode();
    expect(backup.formattedCode).toBeDefined();

    // Reset
    SaveService.clearSave();

    // Restore
    const validation = BackupService.validateBackupCode(backup.formattedCode);
    expect(validation.success).toBe(true);
    BackupService.restoreFromEnvelope(validation.envelope!);

    const restored = useReviewStore.getState();
    const target = restored.reviews.find((r) => r.id === revId);
    expect(target?.ownerReply).toBe(customText);
    expect(target?.replyAnalysis).toBeDefined();
  });
});
