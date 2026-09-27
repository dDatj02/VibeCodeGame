import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useReviewStore } from '../../stores/reviewStore';
import { useShopStore } from '../../stores/shopStore';
import { formatVND, formatGameTime } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { SaveService } from '../../services/SaveService';
import { Volume2, VolumeX, Play, Pause, FastForward, RotateCcw, Save, UtensilsCrossed, Edit2 } from 'lucide-react';
import { ShopProfileModal } from '../modals/ShopProfileModal';

export const Header: React.FC = () => {
  const { 
    day, 
    timeMinutes, 
    phase, 
    gameSpeed, 
    isPaused, 
    weather, 
    shopName, 
    shopAvatar,
    setGameSpeed, 
    togglePause, 
    openShopForDay,
    inKitchenMode,
    setInKitchenMode 
  } = useGameStore();

  const cash = useEconomyStore((state) => state.cash);
  const averageRating = useReviewStore((state) => state.averageRating);
  const totalReviews = useReviewStore((state) => state.totalReviews);
  const currentShopLevel = useShopStore((state) => state.currentShopLevel);

  const [soundOn, setSoundOn] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audioService.setSoundEnabled(next);
    audioService.setMusicEnabled(next);
    if (next) audioService.playClick();
  };

  const handleSave = () => {
    audioService.playClick();
    const success = SaveService.saveGame();
    useGameStore.getState().showNotification(success ? 'Đã lưu tiến trình quán thành công!' : 'Lỗi khi lưu game', success ? 'success' : 'error');
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn đặt lại toàn bộ dữ liệu và chơi lại từ đầu?')) {
      audioService.playClick();
      SaveService.clearSave();
      useGameStore.getState().showNotification('Đã khởi động lại tiệm mới!', 'info');
    }
  };

  return (
    <header className="shrink-0 bg-[#FAF4ED] border-b-2 border-[#EEDCC8] text-[#3D2619] px-2.5 pb-1.5 pt-[calc(0.375rem+env(safe-area-inset-top,0px))] select-none shadow-xs z-30">
      <div className="max-w-5xl mx-auto flex flex-col gap-1">
        {/* Row 1: Brand & Level on the left, ALL Action Tool Buttons on the right */}
        <div className="flex items-center justify-between w-full gap-1">
          {/* Brand & Level (Clickable to customize name & avatar) */}
          <button
            type="button"
            onClick={() => {
              audioService.playClick();
              setIsProfileModalOpen(true);
            }}
            className="flex items-center gap-1.5 min-w-0 px-1 py-0.5 -ml-1 rounded-xl hover:bg-amber-100/70 border border-transparent hover:border-amber-300 transition-all cursor-pointer group text-left"
            title="Bấm để đổi tên & avatar tiệm"
          >
            <div className="w-6 h-6 rounded-lg bg-[#F26440] text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              {shopAvatar || '🍹'}
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-black text-xs sm:text-sm text-[#3D2619] font-['Comfortaa',sans-serif] truncate group-hover:text-[#F26440] transition-colors">
                {shopName}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 shrink-0">
                Cấp {currentShopLevel}
              </span>
              <Edit2 size={10} className="text-stone-400 group-hover:text-[#F26440] shrink-0 ml-0.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* ALL Game Tool Buttons (Never cut off) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Toggle Kitchen mode button */}
            <button
              onClick={() => {
                audioService.playClick();
                setInKitchenMode(!inKitchenMode);
              }}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer ${
                inKitchenMode
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-[#F26440] hover:bg-[#E05338] text-white'
              }`}
              title={inKitchenMode ? 'Về sảnh tiệm' : 'Vào quầy pha chế'}
            >
              <UtensilsCrossed size={12} />
              <span className="text-[10px]">{inKitchenMode ? 'Về sảnh' : 'Vào quầy'}</span>
            </button>

            {/* Speed & Pause Pill */}
            <div className="flex items-center bg-white rounded-lg p-0.5 border border-[#EEDCC8] shadow-2xs">
              <button
                onClick={() => {
                  audioService.playClick();
                  togglePause();
                }}
                className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                  isPaused ? 'bg-amber-400 text-[#3D2619]' : 'text-[#8C624D] hover:text-[#3D2619]'
                }`}
                title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
              >
                {isPaused ? <Play size={11} /> : <Pause size={11} />}
              </button>
              <button
                onClick={() => {
                  audioService.playClick();
                  setGameSpeed(gameSpeed === 1 ? 2 : gameSpeed === 2 ? 3 : 1);
                }}
                className="px-1 text-[10px] font-black text-amber-700 hover:text-amber-800 transition-colors flex items-center cursor-pointer"
                title="Tốc độ game"
              >
                <FastForward size={10} />
                <span>{gameSpeed}x</span>
              </button>
            </div>

            {/* Sound Toggle (Bật/Tắt âm thanh) */}
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-lg border shadow-2xs transition-colors cursor-pointer ${
                soundOn
                  ? 'bg-white hover:bg-amber-50 text-[#8C624D] hover:text-[#3D2619] border-[#EEDCC8]'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
              title={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>

            {/* Save (Lưu game) */}
            <button
              onClick={handleSave}
              className="p-1.5 text-[#8C624D] hover:text-emerald-700 bg-white hover:bg-emerald-50 rounded-lg border border-[#EEDCC8] shadow-2xs transition-colors cursor-pointer"
              title="Lưu game"
            >
              <Save size={13} />
            </button>

            {/* Reset (Chơi lại từ đầu) */}
            <button
              onClick={handleReset}
              className="p-1.5 text-[#8C624D] hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg border border-[#EEDCC8] shadow-2xs transition-colors cursor-pointer"
              title="Chơi lại từ đầu"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* Row 2: Vital Meters (Money, Stars, Clock) */}
        <div className="flex items-center justify-between w-full pt-1 border-t border-[#F0D5C3]/40">
          <div className="flex items-center gap-1.5">
            {/* Money */}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-full border border-[#EEDCC8] shadow-2xs text-emerald-700 tabular-nums font-black text-[11px]">
              <span>💰</span>
              <span>{formatVND(cash)}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded-full border border-[#EEDCC8] shadow-2xs text-amber-700 tabular-nums font-black text-[11px]">
              <span>⭐</span>
              <span>{averageRating}</span>
              <span className="text-[9px] text-[#8C624D] font-medium">({totalReviews})</span>
            </div>
          </div>

          {/* Clock & Day */}
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-full border border-[#EEDCC8] shadow-2xs text-[#3D2619] tabular-nums font-bold text-[10px]">
            <span>🕒</span>
            <span>Ngày {day} · {formatGameTime(timeMinutes)}</span>
          </div>
        </div>
      </div>

      {/* Shop Profile Modal */}
      <ShopProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
};
