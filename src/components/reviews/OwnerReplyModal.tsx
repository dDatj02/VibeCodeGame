import React, { useState } from 'react';
import { ReviewItem } from '../../types';
import { useReviewStore } from '../../stores/reviewStore';
import { audioService } from '../../services/AudioService';
import { 
  X, 
  Send, 
  HeartHandshake, 
  TrendingUp, 
  Loader2, 
  Lightbulb
} from 'lucide-react';

interface OwnerReplyModalProps {
  review: ReviewItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_INSPIRATIONS = [
  'Dạ quán chân thành cảm ơn bạn! Lần tới ghé quán sẽ phục vụ thật chu đáo ạ ❤️',
  'Quán xin lỗi vì trải nghiệm chưa tốt, xin phép tặng bạn 1 ly miễn phí lần sau nhé!',
  'Cảm ơn bạn đã góp ý, quán sẽ điều chỉnh lại công thức cho vừa miệng hơn!',
  'Quán bán chuẩn tươi ngon, cảm ơn bạn đã ủng hộ quán nhiều nha!'
];

export const OwnerReplyModal: React.FC<OwnerReplyModalProps> = ({ review, isOpen, onClose }) => {
  const replyToReviewWithCustomText = useReviewStore((state) => state.replyToReviewWithCustomText);
  const goodwill = useReviewStore((state) => state.goodwill);
  const publicSentiment = useReviewStore((state) => state.publicSentiment);

  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !review) return null;

  const trimmed = replyText.trim();
  const isValid = trimmed.length >= 2 && trimmed.length <= 250;

  const handleSend = async () => {
    if (!isValid || isSubmitting) return;

    audioService.playClick();
    setIsSubmitting(true);

    try {
      const result = await replyToReviewWithCustomText(review.id, trimmed);
      if (result.success) {
        if (result.analysis?.sentiment === 'positive') {
          audioService.playFanfare();
        } else if (result.analysis?.sentiment === 'negative' || result.wasReported) {
          audioService.playDisappointed();
        }
      }
      // Close modal immediately after sending
      handleClose();
    } catch (err) {
      console.error('Reply submission failed:', err);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReplyText('');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-[#FAF4ED] border-3 border-[#3D2619] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#3D2619] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4A2411] via-[#632B0F] to-[#78350F] text-white px-4 py-3 flex items-center justify-between border-b-2 border-amber-950 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-xs">
              ✍️
            </div>
            <div>
              <h3 className="font-['Comfortaa',sans-serif] font-black text-xs sm:text-sm text-amber-100 leading-tight">
                Phản Hồi Đánh Giá Khách Hàng
              </h3>
              <span className="text-[10px] text-amber-200/80">Chăm sóc khách hàng & nâng cao uy tín</span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-full text-amber-200 hover:text-white bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 text-xs">
          
          {/* Target Customer Review Card */}
          <div className="p-2.5 bg-white border border-[#EEDCC8] rounded-2xl space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">{review.avatar}</span>
                <div>
                  <div className="font-extrabold text-xs text-[#3D2619]">{review.authorName}</div>
                  <div className="flex items-center gap-1 text-amber-500 text-[11px]">
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                    <span className="text-[9.5px] text-stone-500">· {review.date}</span>
                  </div>
                </div>
              </div>

              {review.recipeName && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 font-bold border border-amber-200">
                  {review.recipeName}
                </span>
              )}
            </div>

            <p className="text-[11px] text-stone-700 italic bg-amber-50/50 p-2 rounded-xl border border-amber-100/80 leading-relaxed">
              "{review.comment}"
            </p>
          </div>

          {/* Goodwill & Sentiment Mini Status */}
          <div className="grid grid-cols-2 gap-2 text-[10.5px]">
            <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
              <div className="flex items-center justify-between text-emerald-950 font-bold">
                <span className="flex items-center gap-1">
                  <HeartHandshake size={12} className="text-emerald-600" />
                  <span>Thiện Cảm Khách</span>
                </span>
                <span className="tabular-nums font-black">{goodwill}%</span>
              </div>
              <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-1 overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${goodwill}%` }} />
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 p-2 rounded-xl">
              <div className="flex items-center justify-between text-sky-950 font-bold">
                <span className="flex items-center gap-1">
                  <TrendingUp size={12} className="text-sky-600" />
                  <span>Dư Luận Mạng</span>
                </span>
                <span className="tabular-nums font-black">{publicSentiment}%</span>
              </div>
              <div className="w-full bg-sky-200 h-1.5 rounded-full mt-1 overflow-hidden">
                <div className="bg-sky-600 h-full rounded-full transition-all" style={{ width: `${publicSentiment}%` }} />
              </div>
            </div>
          </div>

          {/* Textarea for Custom Player Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black text-[#8C624D] uppercase tracking-wider block">
                Soạn câu trả lời của chủ quán:
              </span>
              <span className={`text-[10px] tabular-nums font-bold ${
                replyText.length > 230 ? 'text-rose-600 font-black' : 'text-stone-400'
              }`}>
                {replyText.length} / 250 ký tự
              </span>
            </div>

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value.slice(0, 250))}
              disabled={isSubmitting}
              placeholder="Nhập phản hồi của bạn tới khách hàng (Dạ, xin lỗi, cảm ơn, giải thích, tặng ly mới, v.v.)..."
              rows={4}
              className="w-full p-2.5 bg-white border-2 border-[#D8C2AC] focus:border-[#E05338] rounded-2xl text-xs text-[#3D2619] placeholder-stone-400 outline-none transition-all resize-none shadow-2xs leading-relaxed"
            />

            {/* Quick Inspiration Chips */}
            <div className="space-y-1">
              <span className="text-[9.5px] text-stone-500 font-bold flex items-center gap-1">
                <Lightbulb size={11} className="text-amber-600" />
                <span>Gợi ý nhanh (nhấn để điền):</span>
              </span>
              <div className="flex flex-wrap gap-1">
                {QUICK_INSPIRATIONS.map((insp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      audioService.playClick();
                      setReplyText(insp);
                    }}
                    className="text-[9.5px] px-2 py-1 bg-amber-50/80 hover:bg-amber-100 text-stone-700 border border-amber-200 rounded-lg transition-colors cursor-pointer text-left truncate max-w-full"
                  >
                    {insp}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-[#EEDCC8] border-t-2 border-[#D8C2AC] flex items-center justify-between shrink-0">
          <button
            onClick={handleClose}
            className="px-3 py-2 bg-white hover:bg-stone-100 text-stone-700 font-black text-xs rounded-xl border border-stone-300 transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            onClick={handleSend}
            disabled={!isValid || isSubmitting}
            className={`px-4 py-2 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
              isValid && !isSubmitting
                ? 'bg-[#F26440] hover:bg-[#E05338] active:scale-95 text-white'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Đang Gửi Phản Hồi...</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Đăng Phản Hồi</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
