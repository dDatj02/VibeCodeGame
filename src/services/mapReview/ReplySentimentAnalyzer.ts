import { ReviewItem } from '../../types';
import { ReplyAnalysisResult, ReplySentiment, AnalysisLevel } from '../../types/mapReview';

export interface IReplySentimentAnalyzer {
  analyze(review: ReviewItem, replyText: string): Promise<ReplyAnalysisResult>;
}

export class ReplySentimentAnalyzer implements IReplySentimentAnalyzer {
  /**
   * Analyzes player's custom typed reply against customer review context.
   * Tries Gemini server-side API first; seamlessly falls back to local NLP heuristics on any failure.
   */
  public async analyze(review: ReviewItem, replyText: string): Promise<ReplyAnalysisResult> {
    const trimmed = replyText.trim();
    if (!trimmed) {
      return {
        replyText: '',
        createdAt: Date.now(),
        sentiment: 'neutral',
        politeness: 'medium',
        empathy: 'medium',
        defensive: false,
        toxicity: 'low',
        isAiAnalyzed: false,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const apiUrl = typeof window !== 'undefined' && window.location?.origin
        ? `${window.location.origin}/api/analyze-reply`
        : '/api/analyze-reply';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: review.comment,
          replyText: trimmed,
          rating: review.rating,
          aspect: review.aspect,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.sentiment) {
          return {
            replyText: trimmed,
            createdAt: Date.now(),
            sentiment: (['positive', 'neutral', 'negative'].includes(data.sentiment)
              ? data.sentiment
              : 'neutral') as ReplySentiment,
            politeness: (['high', 'medium', 'low'].includes(data.politeness)
              ? data.politeness
              : 'medium') as AnalysisLevel,
            empathy: (['high', 'medium', 'low'].includes(data.empathy)
              ? data.empathy
              : 'medium') as AnalysisLevel,
            defensive: Boolean(data.defensive),
            toxicity: (['low', 'medium', 'high'].includes(data.toxicity)
              ? data.toxicity
              : 'low') as AnalysisLevel,
            isAiAnalyzed: true,
          };
        }
      }
    } catch (err) {
      console.warn('AI analysis unavailable or timed out, using local fallback:', err);
    }

    // Reliable Local Fallback
    return this.fallbackLocalAnalyze(review, trimmed);
  }

  /**
   * Local rule-based NLP classifier for Vietnamese customer service text.
   * Evaluates politeness words, gratitude/apology tokens, hostility/toxicity tokens, and defensive phrasing.
   */
  public fallbackLocalAnalyze(review: ReviewItem, replyText: string): ReplyAnalysisResult {
    const lower = replyText.toLowerCase();

    // 1. Toxicity / Insult / Rude tokens
    const highToxicTokens = [
      'cút', 'đm', 'vcl', 'đcm', 'chó', 'mẹ mày', 'ngu', 'óc chó', 'khùng', 
      'hãm', 'bố láo', 'mất dạy', 'biến đi', 'đồ khốn', 'chửi'
    ];
    const medToxicTokens = [
      'đừng ghé', 'bớt bới', 'rảnh rỗi', 'vớ vẩn', 'dìm hàng', 'kệ bạn', 
      'đi chỗ khác', 'không cần', 'tự làm', 'tự xay', 'bới lông', 'khó tính'
    ];

    const hasHighToxic = highToxicTokens.some((t) => lower.includes(t));
    const hasMedToxic = medToxicTokens.some((t) => lower.includes(t));

    // 2. Defensive tokens
    const defensiveTokens = [
      'lỗi do bạn', 'tại bạn', 'do bạn', 'ai cũng khen', 'mỗi bạn chê', 
      'trăm khách khen', 'người khác khen', 'không biết thưởng thức', 'đòi hỏi',
      'quán không sai', 'đúng chuẩn rồi', 'đắt gì mà đắt'
    ];
    const isDefensive = defensiveTokens.some((t) => lower.includes(t)) || hasMedToxic || hasHighToxic;

    // 3. Positive / Polite / Empathetic tokens
    const gratitudeOrApologyTokens = ['cảm ơn', 'xin lỗi', 'rất tiếc', 'chân thành', 'tri ân', 'yêu quý', 'ủng hộ', 'hoan nghênh', 'tuyệt vời', 'chu đáo'];
    const remedyTokens = ['đền bù', 'hoàn tiền', 'tặng', 'chuộc lỗi', 'rút kinh nghiệm', 'chấn chỉnh', 'khắc phục', 'cải thiện', 'miễn phí'];
    const politeHonorifics = ['dạ', 'ạ', 'quý khách', 'thưa', 'kính'];

    const hasGratitudeOrApology = gratitudeOrApologyTokens.some((t) => lower.includes(t));
    const hasRemedy = remedyTokens.some((t) => lower.includes(t));
    const hasHonorific = politeHonorifics.some((t) => lower.includes(t));

    let sentiment: ReplySentiment = 'neutral';
    let politeness: AnalysisLevel = 'medium';
    let empathy: AnalysisLevel = 'medium';
    let toxicity: AnalysisLevel = 'low';

    if (hasHighToxic) {
      sentiment = 'negative';
      politeness = 'low';
      empathy = 'low';
      toxicity = 'high';
    } else if (hasMedToxic || isDefensive) {
      sentiment = 'negative';
      politeness = 'low';
      empathy = 'low';
      toxicity = 'medium';
    } else if (hasGratitudeOrApology || hasRemedy) {
      sentiment = 'positive';
      politeness = hasHonorific ? 'high' : 'medium';
      empathy = hasRemedy ? 'high' : 'medium';
      toxicity = 'low';
    } else {
      sentiment = 'neutral';
      politeness = hasHonorific ? 'high' : 'medium';
      empathy = 'medium';
      toxicity = 'low';
    }

    return {
      replyText,
      createdAt: Date.now(),
      sentiment,
      politeness,
      empathy,
      defensive: isDefensive,
      toxicity,
      isAiAnalyzed: false,
    };
  }
}

export const replySentimentAnalyzer = new ReplySentimentAnalyzer();
