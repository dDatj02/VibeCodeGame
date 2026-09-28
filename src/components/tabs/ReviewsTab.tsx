import React, { useState } from 'react';
import { useReviewStore } from '../../stores/reviewStore';
import { useShopStore } from '../../stores/shopStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useGameStore } from '../../stores/gameStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { ReviewItem } from '../../types';
import { OwnerReplyModal } from '../reviews/OwnerReplyModal';
import { MapReviewSuspensionModal } from '../reviews/MapReviewSuspensionModal';
import { 
  ThumbsUp, 
  AlertOctagon, 
  Flame, 
  ArrowLeft, 
  Star, 
  MessageSquare, 
  HeartHandshake, 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck, 
  Wrench, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export const ReviewsTab: React.FC = () => {
  const reviews = useReviewStore((state) => state.reviews);
  const averageRating = useReviewStore((state) => state.averageRating);
  const totalReviews = useReviewStore((state) => state.totalReviews);
  const likeReview = useReviewStore((state) => state.likeReview);
  const isViral = useReviewStore((state) => state.isViralBoostActive);
  const isCrisis = useReviewStore((state) => state.isCrisisActive);
  const resolveCrisis = useReviewStore((state) => state.resolveCrisis);
  const goodwill = useReviewStore((state) => state.goodwill);
  const publicSentiment = useReviewStore((state) => state.publicSentiment);
  const mapReviewModeration = useReviewStore((state) => state.mapReviewModeration);

  const cleanShop = useShopStore((state) => state.cleanShop);
  const deductCash = useEconomyStore((state) => state.deductCash);
  const showNotification = useGameStore((state) => state.showNotification);
  const setActiveTab = useGameStore((state) => state.setActiveTab);

  const [selectedReviewForReply, setSelectedReviewForReply] = useState<ReviewItem | null>(null);
  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);

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
      {/* Top Header & Metrics */}
      <div className="shrink-0 mb-1.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('shop')}
              className="p-1 hover:bg-[#F0D5C3]/40 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} className="text-[#E05338]" />
            </button>
            <h2 className="text-sm sm:text-base font-extrabold text-[#3D2619] font-['Comfortaa',sans-serif]">
              Đánh Giá & Tương Tác Khách Hàng
            </h2>
          </div>

          {/* Report Counter Pill if > 0 */}
          {mapReviewModeration.reportCount > 0 && !mapReviewModeration.isSuspended && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
              <ShieldAlert size={12} className="text-rose-600" />
              <span>Báo cáo: {mapReviewModeration.reportCount}/{mapReviewModeration.reportThreshold}</span>
            </span>
          )}
        </div>

        {/* 1. MapReview Status & Rating Card */}
        <div className="p-2.5 bg-white border border-[#F0D5C3] rounded-2xl shadow-2xs space-y-2">
          
          {/* Top Line: Platform Status */}
          <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-[#F5E6D8]">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${mapReviewModeration.isSuspended ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
              <span className="font-extrabold text-[11px] text-[#3D2619]">
                📍 MapReview: {mapReviewModeration.isSuspended ? (
                  <span className="text-rose-600">BỊ ĐÌNH CHỈ</span>
                ) : (
                  <span className="text-emerald-700">Đang Hoạt Động</span>
                )}
              </span>
            </div>

            {mapReviewModeration.isSuspended ? (
              <button
                onClick={() => {
                  audioService.playClick();
                  setIsSuspensionModalOpen(true);
                }}
                className="px-2.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer animate-bounce"
              >
                <Wrench size={10} />
                <span>Khôi Phục Ngay</span>
              </button>
            ) : (
              <span className="text-[9.5px] font-bold text-stone-500">
                Hiển thị công khai
              </span>
            )}
          </div>

          {/* Rating Summary & Stars */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-amber-500 tabular-nums leading-none">
                  {averageRating}
                </span>
                <div>
                  <div className="flex text-amber-400 text-xs">
                    {'★'.repeat(Math.round(averageRating))}
                    {'☆'.repeat(5 - Math.round(averageRating))}
                  </div>
                  <span className="text-[10px] text-[#78513E] font-bold">
                    ({totalReviews} đánh giá được bảo lưu)
                  </span>
                </div>
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

          {/* 2. Customer Goodwill & Public Sentiment Dual Gauges */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 text-[10px]">
            <div className="bg-emerald-50/80 p-1.5 rounded-xl border border-emerald-200">
              <div className="flex items-center justify-between text-emerald-950 font-bold">
                <span className="flex items-center gap-1">
                  <HeartHandshake size={11} className="text-emerald-600" />
                  <span>Thiện Cảm Khách</span>
                </span>
                <span className="tabular-nums font-black">{goodwill}%</span>
              </div>
              <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-1 overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${goodwill}%` }} />
              </div>
            </div>

            <div className="bg-sky-50/80 p-1.5 rounded-xl border border-sky-200">
              <div className="flex items-center justify-between text-sky-950 font-bold">
                <span className="flex items-center gap-1">
                  <TrendingUp size={11} className="text-sky-600" />
                  <span>Dư Luận Mạng</span>
                </span>
                <span className="tabular-nums font-black">{publicSentiment}%</span>
              </div>
              <div className="w-full bg-sky-200 h-1.5 rounded-full mt-1 overflow-hidden">
                <div className="bg-sky-600 h-full rounded-full transition-all" style={{ width: `${publicSentiment}%` }} />
              </div>
            </div>
          </div>

        </div>

        {/* 3. Platform Suspension Warning Banner */}
        {mapReviewModeration.isSuspended && (
          <div 
            onClick={() => {
              audioService.playClick();
              setIsSuspensionModalOpen(true);
            }}
            className="p-2.5 bg-rose-50 border-2 border-rose-400 rounded-2xl flex items-center justify-between text-rose-950 shadow-xs cursor-pointer hover:bg-rose-100/80 transition-all"
          >
            <div className="flex items-center gap-2">
              <AlertOctagon className="text-rose-600 shrink-0" size={20} />
              <div>
                <span className="text-[11px] font-black text-rose-900 block leading-tight">
                  MapReview Đang Bị Tạm Khóa (-25% Lượng Khách)!
                </span>
                <p className="text-[9.5px] text-rose-800 font-medium">
                  {reviews.length} đánh giá cũ vẫn an toàn 100%. Bấm vào đây để Kháng Cáo hoặc Thuê IT khôi phục!
                </p>
              </div>
            </div>
            <button className="px-2.5 py-1 bg-rose-600 text-white font-black text-[10.5px] rounded-xl shadow-xs shrink-0 cursor-pointer">
              Khôi phục →
            </button>
          </div>
        )}

        {/* 4. Viral Community Buzz Banner */}
        {mapReviewModeration.buzzDaysLeft > 0 && (
          <div className={`p-2 rounded-xl flex items-center justify-between border shadow-2xs ${
            mapReviewModeration.activeBuzzType === 'positive'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}>
            <div className="flex items-center gap-1.5">
              <Flame className={mapReviewModeration.activeBuzzType === 'positive' ? 'text-amber-500 animate-bounce' : 'text-rose-500'} size={18} />
              <div>
                <span className="text-[11px] font-black">
                  {mapReviewModeration.activeBuzzType === 'positive' ? '🔥 Hiệu Ứng Cộng Đồng Tích Cực!' : '💢 Phốt Thái Độ Chủ Quán!'}
                </span>
                <p className="text-[9.5px]">
                  {mapReviewModeration.buzzDescription} (Còn {mapReviewModeration.buzzDaysLeft} ngày)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. Rating Traffic Impact Banner */}
        {!mapReviewModeration.isSuspended && averageRating < 3.5 && (
          <div className="p-2 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between text-rose-950 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <AlertOctagon className="text-rose-600 shrink-0" size={18} />
              <div>
                <span className="text-[11px] font-black text-rose-900">
                  Lượng Khách Giảm Do Đánh Giá Thấp! ({averageRating}★)
                </span>
                <p className="text-[9.5px] text-rose-800 font-medium">
                  Điểm sao dưới 3.5★ khiến khách e dè. Lượng khách tới tiệm bị sụt giảm -{Math.round(((3.5 - averageRating) / 2.5) * 90)}%!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 6. Viral Boost Banner */}
        {isViral && (
          <div className="p-2 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-amber-900 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <Flame className="text-amber-500 animate-bounce" size={18} />
              <div>
                <span className="text-[11px] font-black text-amber-800">Đang Có Bài Review Viral!</span>
                <p className="text-[9px] text-amber-700">Lượng khách vãng lai tăng vọt +80% trong hôm nay!</p>
              </div>
            </div>
          </div>
        )}

        {/* 7. Crisis Banner */}
        {isCrisis && (
          <div className="p-2 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between text-rose-900 shadow-2xs">
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

      {/* Reviews Feed (Internal Scrollable Only) */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2 pb-2">
        {reviews.map((rev) => {
          const hasOwnerReply = Boolean(rev.ownerReply);
          const isPositiveReply = rev.ownerReplySentiment === 'positive';
          const isNeutralReply = rev.ownerReplySentiment === 'neutral';
          const isNegativeReply = rev.ownerReplySentiment === 'negative';

          return (
            <div
              key={rev.id}
              className="p-3 bg-white border border-[#F0D5C3] rounded-2xl space-y-2 shadow-xs"
            >
              {/* Review Author & Recipe */}
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

              {/* Customer Comment Text */}
              <p className="text-xs text-[#5C3A21] leading-relaxed pl-8">
                "{rev.comment}"
              </p>

              {/* Owner Reply Bubble (If exists) */}
              {hasOwnerReply && (
                <div className={`ml-8 p-2.5 rounded-xl border space-y-1 ${
                  isPositiveReply
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : isNeutralReply
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-rose-50/80 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-black">
                    <span className="flex items-center gap-1">
                      <span>{isPositiveReply ? '🌟' : isNeutralReply ? '⚖️' : '💥'}</span>
                      <span className={isPositiveReply ? 'text-emerald-800' : isNeutralReply ? 'text-amber-800' : 'text-rose-800'}>
                        Chủ quán phản hồi:
                      </span>
                    </span>
                    <span className="text-[9px] text-stone-500 font-normal">
                      {rev.ownerReplyAt || 'Gần đây'}
                    </span>
                  </div>

                  <p className="text-[10.5px] leading-relaxed italic">
                    "{rev.ownerReply}"
                  </p>

                  {rev.wasReported && (
                    <div className="flex items-center gap-1 text-[9.5px] text-rose-700 font-bold pt-0.5">
                      <ShieldAlert size={11} />
                      <span>Phản hồi này đã bị khách hàng báo cáo vi phạm</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions Row */}
              <div className="flex items-center justify-between pl-8 pt-1 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  {!hasOwnerReply ? (
                    <button
                      onClick={() => {
                        audioService.playClick();
                        setSelectedReviewForReply(rev);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100/90 text-amber-900 border border-amber-300 text-[11px] font-black transition-all active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <MessageSquare size={12} className="text-[#E05338]" />
                      <span>Phản Hồi</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle size={11} />
                      <span>Đã phản hồi</span>
                    </span>
                  )}
                </div>

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
          );
        })}
      </div>

      {/* Sub Modals */}
      <OwnerReplyModal
        review={selectedReviewForReply}
        isOpen={Boolean(selectedReviewForReply)}
        onClose={() => setSelectedReviewForReply(null)}
      />

      <MapReviewSuspensionModal
        isOpen={isSuspensionModalOpen}
        onClose={() => setIsSuspensionModalOpen(false)}
      />
    </div>
  );
};
