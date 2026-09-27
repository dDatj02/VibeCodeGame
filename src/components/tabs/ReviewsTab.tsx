import React from 'react';
import { useReviewStore } from '../../stores/reviewStore';
import { useShopStore } from '../../stores/shopStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useGameStore } from '../../stores/gameStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { ThumbsUp, AlertOctagon, Flame, ArrowLeft, Star } from 'lucide-react';

export const ReviewsTab: React.FC = () => {
  const reviews = useReviewStore((state) => state.reviews);
  const averageRating = useReviewStore((state) => state.averageRating);
  const totalReviews = useReviewStore((state) => state.totalReviews);
  const likeReview = useReviewStore((state) => state.likeReview);
  const isViral = useReviewStore((state) => state.isViralBoostActive);
  const isCrisis = useReviewStore((state) => state.isCrisisActive);
  const resolveCrisis = useReviewStore((state) => state.resolveCrisis);
  const cleanShop = useShopStore((state) => state.cleanShop);
  const deductCash = useEconomyStore((state) => state.deductCash);
  const showNotification = useGameStore((state) => state.showNotification);
  const setActiveTab = useGameStore((state) => state.setActiveTab);

  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  const handleResolveCrisis = () => {
    const cost = 120000;
    const ok = deductCash(cost);
    if (!ok) {
      audioService.playDisappointed();
      showNotification('Không đủ tiền mặt để chạy chiến dịch cứu vãn khủng hoảng!', 'error');
      return;
    }

    cleanShop();
    resolveCrisis();
    audioService.playFanfare();
    showNotification('Đã khử khuẩn toàn quán và gửi voucher xin lỗi! Khủng hoảng đã qua.', 'success');
  };

  return (
    <div className="flex-1 h-full max-h-full flex flex-col bg-[#FBF7F0] text-[#3D2619] p-2 max-w-lg mx-auto w-full select-none overflow-hidden">
      <div className="shrink-0 mb-1.5">
        <div className="flex items-center gap-1.5 mb-1">
          <button
            onClick={() => setActiveTab('shop')}
            className="p-1 hover:bg-[#F0D5C3]/40 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} className="text-[#E05338]" />
          </button>
          <h2 className="text-sm sm:text-base font-extrabold text-[#3D2619] font-['Comfortaa',sans-serif]">
            Đánh Giá Của Khách Hàng
          </h2>
        </div>

        {/* 1. MapReview Profile Header (Compact) */}
        <div className="p-2.5 bg-white border border-[#F0D5C3] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1 text-[10px] text-[#E05338] font-bold uppercase tracking-wide leading-none">
                <span>📍 MapReview · Địa Điểm Ẩm Thực</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xl font-black text-amber-500 tabular-nums">
                  {averageRating}
                </span>
                <div className="flex text-amber-400 text-xs">
                  {'★'.repeat(Math.round(averageRating))}
                  {'☆'.repeat(5 - Math.round(averageRating))}
                </div>
                <span className="text-[10px] text-[#78513E] font-medium">
                  ({totalReviews} đánh giá)
                </span>
              </div>
            </div>

            {/* Star Distribution Mini Bar */}
            <div className="w-28 space-y-0.5 text-[9px] text-[#78513E]">
              {starCounts.map(({ star, count }) => {
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-1">
                    <span className="w-2.5 tabular-nums font-bold">{star}★</span>
                    <div className="flex-1 bg-[#F0D5C3] h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-3 text-right tabular-nums text-[8px] font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Viral Boost or Crisis Banner */}
        {isViral && (
          <div className="p-2 bg-amber-50 border border-amber-300 rounded-xl mt-1 flex items-center justify-between text-amber-900 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <Flame className="text-amber-500 animate-bounce" size={18} />
              <div>
                <span className="text-[11px] font-black text-amber-800">Đang Có Bài Review Viral!</span>
                <p className="text-[9px] text-amber-700">Lượng khách vãng lai tăng vọt +80% trong hôm nay!</p>
              </div>
            </div>
          </div>
        )}

        {isCrisis && (
          <div className="p-2 bg-rose-50 border border-rose-300 rounded-xl mt-1 flex items-center justify-between text-rose-900 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <AlertOctagon className="text-rose-500" size={18} />
              <div>
                <span className="text-[11px] font-black text-rose-800">Khủng Hoảng Đánh Giá!</span>
                <p className="text-[9px] text-rose-700">Điểm sao thấp khiến khách e dè không dám ghé quán.</p>
              </div>
            </div>
            <button
              onClick={handleResolveCrisis}
              className="px-2 py-1 bg-[#E05338] hover:bg-[#D2442A] text-white font-bold text-[10px] rounded-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-2xs"
            >
              Khắc phục ({formatVND(120000)})
            </button>
          </div>
        )}
      </div>

      {/* 3. Reviews Feed (Internal Scrollable Only) */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-1.5 pb-2">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-3 bg-white border border-[#F0D5C3] rounded-2xl space-y-1.5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{rev.avatar}</span>
                <div>
                  <div className="font-extrabold text-xs text-[#3D2619]">{rev.authorName}</div>
                  <div className="flex items-center gap-1 text-amber-500 text-xs">
                    {'★'.repeat(rev.rating)}
                    {'☆'.repeat(5 - rev.rating)}
                    <span className="text-[10px] text-[#9E735B] ml-1">· {rev.date}</span>
                  </div>
                </div>
              </div>

              {rev.recipeName && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF4E8] text-[#E05338] font-bold border border-[#F2DECC]">
                  {rev.recipeName}
                </span>
              )}
            </div>

            <p className="text-xs text-[#5C3A21] leading-relaxed pl-8">
              "{rev.comment}"
            </p>

            <div className="flex items-center justify-end pl-8 pt-1">
              <button
                onClick={() => {
                  audioService.playClick();
                  likeReview(rev.id);
                }}
                className="flex items-center gap-1 text-[11px] text-[#78513E] hover:text-[#E05338] transition-colors cursor-pointer font-bold"
              >
                <ThumbsUp size={11} />
                <span>Hữu ích ({rev.helpfulCount})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
