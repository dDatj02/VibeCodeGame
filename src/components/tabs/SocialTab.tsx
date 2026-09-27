import React, { useState } from 'react';
import { useSocialStore } from '../../stores/socialStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useGameStore } from '../../stores/gameStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { Video, Heart, Eye, Users, Send, ArrowLeft } from 'lucide-react';

interface CampaignTemplate {
  id: string;
  title: string;
  content: string;
  mediaType: 'photo' | 'video' | 'meme';
  cost: number;
}

const CAMPAIGNS: CampaignTemplate[] = [
  {
    id: 'camp_1',
    title: 'Hậu Trường Chọn Trái Cây Tươi Sáng Sớm',
    content: 'Quay cảnh lựa từng trái xoài cát chín thơm và bơ sáp chuẩn sạch lúc 6h sáng. Tự nhiên, chân thật!',
    mediaType: 'video',
    cost: 0,
  },
  {
    id: 'camp_2',
    title: 'Trend Nhạc Chill & Ly Sinh Tố Bơ Xoay Tròn',
    content: 'Ghé tiệm nghe nhạc lofi, ngắm góc phố Sài Gòn và nhâm nhi ly sinh tố mát rượi.',
    mediaType: 'video',
    cost: 40000,
  },
  {
    id: 'camp_3',
    title: 'Thử Thách Xay 10 Ly Sinh Tố Trong 60 Giây',
    content: 'Khoe đôi tay siêu tốc của barista! Video kịch tính, dễ lọt xu hướng triệu view.',
    mediaType: 'video',
    cost: 75000,
  },
];

export const SocialTab: React.FC = () => {
  const posts = useSocialStore((state) => state.posts);
  const totalViews = useSocialStore((state) => state.totalViews);
  const totalLikes = useSocialStore((state) => state.totalLikes);
  const followerCount = useSocialStore((state) => state.followerCount);
  const publishPost = useSocialStore((state) => state.publishPost);

  const cash = useEconomyStore((state) => state.cash);
  const deductCash = useEconomyStore((state) => state.deductCash);
  const day = useGameStore((state) => state.day);
  const showNotification = useGameStore((state) => state.showNotification);
  const setActiveTab = useGameStore((state) => state.setActiveTab);

  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate>(CAMPAIGNS[0]);

  const handlePublish = () => {
    if (selectedTemplate.cost > 0) {
      if (cash < selectedTemplate.cost) {
        audioService.playDisappointed();
        showNotification('Không đủ tiền mặt để quay video này!', 'error');
        return;
      }
      deductCash(selectedTemplate.cost);
    }

    const res = publishPost(
      selectedTemplate.title,
      selectedTemplate.content,
      selectedTemplate.mediaType,
      selectedTemplate.cost,
      day
    );

    audioService.playFanfare();
    showNotification(
      `Đã đăng lên TrendTok! Video đạt ${res.post.views.toLocaleString('vi-VN')} lượt xem!`,
      'success'
    );
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
            TrendTok Kênh Tiệm Sinh Tố
          </h2>
        </div>

        {/* 1. TrendTok Channel Stats Header (Compact) */}
        <div className="p-2.5 bg-white border border-[#F0D5C3] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFF4E8] border border-[#F0D5C3] flex items-center justify-center text-lg shadow-inner shrink-0">
                📱
              </div>
              <div>
                <h3 className="text-xs font-black text-[#3D2619] font-['Comfortaa',sans-serif]">
                  @SinhToNhaTui · Official
                </h3>
                <p className="text-[9px] text-[#9E735B]">Nền tảng video ngắn thu hút khách</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 mt-1.5 pt-1.5 border-t border-[#F0D5C3]/60 text-center">
            <div>
              <div className="text-[9px] text-[#78513E] flex items-center justify-center gap-0.5 font-bold">
                <Users size={10} className="text-[#E05338]" /> Follow
              </div>
              <div className="text-xs font-black text-[#3D2619] tabular-nums">
                {followerCount.toLocaleString('vi-VN')}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-[#78513E] flex items-center justify-center gap-0.5 font-bold">
                <Eye size={10} className="text-amber-600" /> Lượt xem
              </div>
              <div className="text-xs font-black text-[#E05338] tabular-nums">
                {totalViews.toLocaleString('vi-VN')}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-[#78513E] flex items-center justify-center gap-0.5 font-bold">
                <Heart size={10} className="text-rose-500" /> Thả tim
              </div>
              <div className="text-xs font-black text-rose-600 tabular-nums">
                {totalLikes.toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2 pb-2">
        {/* 2. Create New Video Campaign */}
      <div className="p-3.5 bg-white border border-[#F0D5C3] rounded-2xl mb-4 shadow-xs">
        <h3 className="text-xs font-extrabold text-[#3D2619] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Video size={14} className="text-[#E05338]" />
          <span>Sản Xuất Video Bắt Trend Mới</span>
        </h3>

        <div className="space-y-2">
          {CAMPAIGNS.map((camp) => {
            const isSelected = selectedTemplate.id === camp.id;
            return (
              <div
                key={camp.id}
                onClick={() => setSelectedTemplate(camp)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#FFF4E8] border-[#E05338] ring-1 ring-[#E05338]/30 shadow-xs'
                    : 'bg-[#FFF9F2] border-[#F2DECC] hover:border-[#E05338]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#3D2619]">{camp.title}</span>
                  <span className="text-xs font-black text-[#E05338] tabular-nums">
                    {camp.cost === 0 ? 'Miễn phí' : formatVND(camp.cost)}
                  </span>
                </div>
                <p className="text-[10px] text-[#78513E] mt-1 leading-snug">{camp.content}</p>
              </div>
            );
          })}
        </div>

        <button
          onClick={handlePublish}
          className="w-full mt-3 py-2.5 bg-gradient-to-r from-[#F26440] to-[#E05338] hover:from-[#E05338] hover:to-[#D2442A] text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Send size={13} />
          <span>Đăng Video ({selectedTemplate.cost === 0 ? 'Miễn phí' : formatVND(selectedTemplate.cost)})</span>
        </button>
      </div>

      {/* 3. Published Video Feed */}
      <div className="space-y-2 pb-6">
        <h3 className="text-xs font-extrabold text-[#3D2619] uppercase tracking-wider mb-2">
          Lịch Sử Video Đã Đăng ({posts.length})
        </h3>

        {posts.map((post) => (
          <div
            key={post.id}
            className="p-3 bg-white border border-[#F0D5C3] rounded-2xl flex items-center justify-between gap-3 shadow-xs"
          >
            <div>
              <div className="font-extrabold text-xs text-[#3D2619] flex items-center gap-2">
                <span>🎬 {post.title}</span>
                {post.sentiment === 'viral' && (
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 font-black">
                    🔥 VIRAL
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#9E735B] mt-0.5 line-clamp-1">{post.content}</p>
              <div className="text-[10px] text-[#B8927C] mt-1 font-bold">Ngày {post.day}</div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-black text-[#3D2619] tabular-nums flex items-center gap-1 justify-end">
                <Eye size={12} className="text-[#9E735B]" />
                <span>{post.views.toLocaleString('vi-VN')}</span>
              </div>
              <div className="text-[11px] font-bold text-rose-500 tabular-nums flex items-center gap-1 justify-end mt-0.5">
                <Heart size={11} />
                <span>{post.likes.toLocaleString('vi-VN')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};
