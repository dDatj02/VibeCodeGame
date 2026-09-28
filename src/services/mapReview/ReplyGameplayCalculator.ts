import { ReviewItem } from '../../types';
import { ReplyAnalysisResult, ReplyGameplayEffect } from '../../types/mapReview';

export class ReplyGameplayCalculator {
  /**
   * Translates structured AI / NLP analysis into deterministic game rules.
   * Ensures game balance is 100% code-driven and predictable.
   */
  public static calculate(review: ReviewItem, analysis: ReplyAnalysisResult): ReplyGameplayEffect {
    const { sentiment, politeness, empathy, defensive, toxicity } = analysis;

    let goodwillEffect = 0;
    let publicSentimentEffect = 0;
    let reportChance = 0;
    let viralChance = 0;
    let trafficBonusPercent = 0;
    let toneTitle = 'Trung Lập';
    let explanation = '';

    if (toxicity === 'high') {
      goodwillEffect = -18;
      publicSentimentEffect = -15;
      reportChance = 0.60; // 60% chance of customer report
      viralChance = 0.30;
      trafficBonusPercent = -15;
      toneTitle = 'Cực Kỳ Độc Hại & Xúc Phạm';
      explanation = 'Chửi bới, xúc phạm khách hàng gây phẫn nộ dữ dội, nguy cơ bị báo cáo và tẩy chay cực cao!';
    } else if (sentiment === 'negative' || toxicity === 'medium' || defensive) {
      goodwillEffect = defensive ? -12 : -10;
      publicSentimentEffect = defensive ? -9 : -8;
      reportChance = 0.35; // 35% report chance
      viralChance = 0.18;
      trafficBonusPercent = -10;
      toneTitle = defensive ? 'Đôi Co & Biện Hộ' : 'Gắt Gỏng & Bất Cần';
      explanation = 'Thái độ thiếu chuyên nghiệp khiến khách hàng khó chịu và dễ bị khiếu nại lên MapReview.';
    } else if (sentiment === 'positive') {
      if (politeness === 'high' && empathy === 'high') {
        goodwillEffect = 5;
        publicSentimentEffect = 4;
        reportChance = 0;
        viralChance = 0.20; // 20% positive buzz chance
        trafficBonusPercent = 12;
        toneTitle = 'Chân Thành & Cầu Thị';
        explanation = 'Phản hồi lịch thiệp, biết lắng nghe và tạo thiện cảm tuyệt vời cho cộng đồng mạng.';
      } else {
        goodwillEffect = 3;
        publicSentimentEffect = 2;
        reportChance = 0;
        viralChance = 0.10;
        trafficBonusPercent = 8;
        toneTitle = 'Lịch Sự & Cảm Ơn';
        explanation = 'Phản hồi thân thiện, củng cố hình ảnh đẹp của quán.';
      }
    } else {
      // Neutral
      goodwillEffect = politeness === 'high' ? 1 : 0;
      publicSentimentEffect = 0;
      reportChance = 0.02;
      viralChance = 0.01;
      trafficBonusPercent = 0;
      toneTitle = 'Tiêu Chuẩn & Chừng Mực';
      explanation = 'Phản hồi bình thường, không gây ảnh hưởng lớn đến tâm lý khách hàng.';
    }

    return {
      goodwillEffect,
      publicSentimentEffect,
      reportChance,
      viralChance,
      trafficBonusPercent,
      toneTitle,
      explanation,
    };
  }
}
