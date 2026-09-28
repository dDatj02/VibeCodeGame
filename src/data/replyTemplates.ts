import { OwnerReplyOption } from '../types/mapReview';
import { ReviewItem } from '../types';

export const BASE_IT_RECOVERY_COST = 500000; // 500k VND
export const FAILED_APPEAL_PENALTY = 250000; // +250k VND per failed appeal
export const MAX_IT_RECOVERY_COST = 1500000; // Max 1.5M VND
export const REPORT_THRESHOLD_DEFAULT = 5;

/**
 * Returns contextual reply options based on the review's star rating and aspect.
 */
export function getReplyOptionsForReview(review: ReviewItem): OwnerReplyOption[] {
  const isGood = review.rating >= 4;
  const isBad = review.rating <= 2;
  const aspect = review.aspect || 'quality';

  if (isGood) {
    return [
      {
        id: `pos_good_${aspect}`,
        sentiment: 'positive',
        toneTitle: 'Lịch Sự & Tri Ân',
        text: 'Dạ quán chân thành cảm ơn bạn đã yêu thương ủng hộ! Quán sẽ luôn giữ trọn chất lượng tươi ngon và phục vụ chu đáo nhất để bạn luôn hài lòng!',
        goodwillEffect: 4,
        publicSentimentEffect: 3,
        reportChance: 0,
        viralChance: 0.18, // 18% chance for positive community buzz
        trafficBonusPercent: 12,
        explanation: 'Khách hàng cảm thấy được trân trọng, tăng thiện cảm cộng đồng và có cơ hội tạo hiệu ứng truyền miệng tích cực.',
      },
      {
        id: `neu_good_${aspect}`,
        sentiment: 'neutral',
        toneTitle: 'Tiêu Chuẩn',
        text: 'Cảm ơn quý khách đã ghé thăm quán sinh tố và để lại đánh giá tốt.',
        goodwillEffect: 1,
        publicSentimentEffect: 1,
        reportChance: 0,
        viralChance: 0.02,
        trafficBonusPercent: 0,
        explanation: 'Phản hồi lịch sự tiêu chuẩn, giữ vững đánh giá tốt mà không tạo nhiều biến động.',
      },
      {
        id: `neg_good_${aspect}`,
        sentiment: 'negative',
        toneTitle: 'Ngạo Mạn & Bất Cần',
        text: 'Biết quán ngon là tốt rồi! Đã uống ở đây thì khỏi cần đi quán nào khác so sánh làm gì!',
        goodwillEffect: -8,
        publicSentimentEffect: -6,
        reportChance: 0.20,
        viralChance: 0.12,
        trafficBonusPercent: -8,
        explanation: 'Thái độ kiêu ngạo tự phụ khiến cộng đồng mạng khó chịu và có nguy cơ bị tố cáo vì ứng xử phản cảm.',
      },
    ];
  } else if (isBad) {
    return [
      {
        id: `pos_bad_${aspect}`,
        sentiment: 'positive',
        toneTitle: 'Cầu Thị & Đền Bù',
        text: 'Dạ chủ quán chân thành xin lỗi vì trải nghiệm chưa trọn vẹn này! Quán đã chấn chỉnh ngay khâu pha chế và xin phép mời bạn 1 ly miễn phí vào lần sau để chuộc lỗi ạ!',
        goodwillEffect: 5,
        publicSentimentEffect: 4,
        reportChance: 0,
        viralChance: 0.15,
        trafficBonusPercent: 10,
        explanation: 'Xoa dịu khách hàng xuất sắc, thể hiện tinh thần trách nhiệm cao, chuyển nguy thành cơ.',
      },
      {
        id: `neu_bad_${aspect}`,
        sentiment: 'neutral',
        toneTitle: 'Tiếp Thu Trung Lập',
        text: 'Quán đã ghi nhận phản hồi của bạn và sẽ lưu ý cải thiện quy trình phục vụ trong thời gian tới.',
        goodwillEffect: 1,
        publicSentimentEffect: 0,
        reportChance: 0.05,
        viralChance: 0,
        trafficBonusPercent: 0,
        explanation: 'Phản hồi chừng mực, không gây thêm tranh cãi nhưng cũng không tạo ấn tượng nổi bật.',
      },
      {
        id: `neg_bad_${aspect}`,
        sentiment: 'negative',
        toneTitle: 'Công Kích & Thách Thức',
        text: 'Quán bán giá học sinh cả ngày trăm khách khen ngon, có mỗi bạn khó tính vào bới lông tìm vết! Không uống được thì đừng ghé nữa!',
        goodwillEffect: -12,
        publicSentimentEffect: -10,
        reportChance: 0.35, // 35% report chance
        viralChance: 0.20,
        trafficBonusPercent: -12,
        explanation: 'Chửi bới đôi co với khách hàng! Rất dễ bị chụp màn hình bóc phốt trên mạng xã hội và gửi báo cáo lên MapReview.',
      },
    ];
  } else {
    // 3-star (Average)
    return [
      {
        id: `pos_mid_${aspect}`,
        sentiment: 'positive',
        toneTitle: 'Cảm Ơn & Lắng Nghe',
        text: 'Cảm ơn những đóng góp rất chi tiết của bạn! Quán sẽ thử nghiệm công thức cân đối lại để lần tới bạn ghé sẽ tròn vị hơn nhiều nhé!',
        goodwillEffect: 3,
        publicSentimentEffect: 2,
        reportChance: 0,
        viralChance: 0.10,
        trafficBonusPercent: 8,
        explanation: 'Lắng nghe phản hồi xây dựng, tạo niềm tin cho những khách hàng đang cân nhắc ghé quán.',
      },
      {
        id: `neu_mid_${aspect}`,
        sentiment: 'neutral',
        toneTitle: 'Lịch Thiệp Ngắn Gọn',
        text: 'Cảm ơn bạn đã đóng góp ý kiến cho quán.',
        goodwillEffect: 0,
        publicSentimentEffect: 0,
        reportChance: 0,
        viralChance: 0,
        trafficBonusPercent: 0,
        explanation: 'Phản hồi đơn giản, không ảnh hưởng nhiều đến danh tiếng.',
      },
      {
        id: `neg_mid_${aspect}`,
        sentiment: 'negative',
        toneTitle: 'Gắt Gỏng Bực Dọc',
        text: 'Khẩu vị mỗi người mỗi khác, chấm 3 sao làm tụt điểm quán! Rảnh rỗi quá thì đi tìm việc khác làm đi!',
        goodwillEffect: -10,
        publicSentimentEffect: -8,
        reportChance: 0.25,
        viralChance: 0.15,
        trafficBonusPercent: -10,
        explanation: 'Thái độ khó chịu với đánh giá trung tính gây ấn tượng xấu cho người đọc review.',
      },
    ];
  }
}
