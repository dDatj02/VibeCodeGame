import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useShopStore } from '../../stores/shopStore';
import { audioService } from '../../services/AudioService';
import { SaveService } from '../../services/SaveService';
import { formatVND } from '../../utils/format';
import { 
  X, 
  Settings, 
  Volume2, 
  VolumeX, 
  Music, 
  Save, 
  Cloud, 
  RotateCcw, 
  Store, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  Undo2,
  Trash2,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { SaveDataModal } from './SaveDataModal';
import { ShopProfileModal } from './ShopProfileModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    day, 
    shopName, 
    shopAvatar, 
    showNotification 
  } = useGameStore();

  const cash = useEconomyStore((state) => state.cash);
  const currentShopLevel = useShopStore((state) => state.currentShopLevel);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [isSaveDataOpen, setIsSaveDataOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioService.setSoundEnabled(next);
    if (next) audioService.playClick();
  };

  const handleToggleMusic = () => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    audioService.setMusicEnabled(next);
    if (next) audioService.playClick();
  };

  const handleQuickSave = () => {
    audioService.playClick();
    const ok = SaveService.saveGame();
    if (ok) {
      audioService.playCashRegister();
      showNotification('✓ Đã lưu tiến trình quán thành công!', 'success');
    } else {
      showNotification('Lỗi khi lưu game!', 'error');
    }
  };

  const handleSafetyRollback = () => {
    if (!SaveService.hasSafetyBackup()) {
      showNotification('Không tìm thấy bản lưu an toàn trước đó!', 'warning');
      return;
    }

    if (window.confirm('Bạn có muốn khôi phục lại bản lưu an toàn trước đó không?')) {
      audioService.playClick();
      const ok = SaveService.restoreSafetyBackup();
      if (ok) {
        audioService.playFanfare();
        showNotification('✓ Đã hoàn tác về bản lưu an toàn!', 'success');
        onClose();
      } else {
        showNotification('Không thể khôi phục bản lưu an toàn!', 'error');
      }
    }
  };

  const handleResetGame = () => {
    if (window.confirm('⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ dữ liệu và chơi lại tiệm mới từ Ngày 1 không?')) {
      audioService.playClick();
      SaveService.clearSave();
      showNotification('Đã khởi động lại tiệm mới!', 'info');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-[#FAF4ED] border-3 border-[#3D2619] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3D2619] via-[#4F2815] to-[#3D2619] text-[#FAF4ED] px-4 py-3 flex items-center justify-between border-b-2 border-[#261309]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-400 text-[#3D2619] flex items-center justify-center shadow-xs">
              <Settings size={16} />
            </div>
            <div>
              <h3 className="font-['Comfortaa',sans-serif] font-black text-sm text-amber-100 leading-tight">
                Cài Đặt & Chức Năng
              </h3>
              <p className="text-[10px] text-amber-200/80">Tùy chỉnh hệ thống & quản lý dữ liệu quán</p>
            </div>
          </div>

          <button
            onClick={() => {
              audioService.playClick();
              onClose();
            }}
            className="p-1 rounded-full text-amber-200 hover:text-white bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 text-xs text-[#3D2619]">
          
          {/* Shop Card Mini */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#F26440] text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                {shopAvatar || '🍹'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-xs sm:text-sm text-[#3D2619] truncate font-['Comfortaa',sans-serif]">
                    {shopName}
                  </h4>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 shrink-0">
                    Cấp {currentShopLevel}
                  </span>
                </div>
                <p className="text-[10px] text-stone-600">
                  Ngày {day} · Tiền: <span className="font-bold text-emerald-700">{formatVND(cash)}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                audioService.playClick();
                setIsProfileOpen(true);
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-xl text-[10.5px] font-black text-amber-900 shadow-2xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Store size={12} className="text-[#E05338]" />
              <span>Đổi Tên</span>
            </button>
          </div>

          {/* Section 1: Âm Thanh (Audio) */}
          <div className="bg-white border border-[#EEDCC8] rounded-2xl p-3 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between pb-1 border-b border-stone-100">
              <span className="text-[10.5px] font-black text-[#8C624D] uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 size={13} className="text-[#E05338]" />
                <span>Âm Thanh & Hiệu Ứng</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* SFX Toggle */}
              <button
                onClick={handleToggleSound}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                  soundEnabled
                    ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                    : 'bg-stone-50 border-stone-200 text-stone-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 size={15} className="text-[#E05338]" /> : <VolumeX size={15} />}
                  <div className="text-left">
                    <span className="font-black text-[11px] block leading-tight">Hiệu Ứng</span>
                    <span className="text-[9px] text-stone-500">{soundEnabled ? 'Đang bật' : 'Đang tắt'}</span>
                  </div>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full border-2 ${soundEnabled ? 'bg-[#E05338] border-amber-200' : 'bg-stone-300 border-stone-400'}`} />
              </button>

              {/* Music Toggle */}
              <button
                onClick={handleToggleMusic}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                  musicEnabled
                    ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                    : 'bg-stone-50 border-stone-200 text-stone-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Music size={15} className={musicEnabled ? 'text-[#E05338]' : 'text-stone-400'} />
                  <div className="text-left">
                    <span className="font-black text-[11px] block leading-tight">Nhạc Nền</span>
                    <span className="text-[9px] text-stone-500">{musicEnabled ? 'Đang bật' : 'Đang tắt'}</span>
                  </div>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full border-2 ${musicEnabled ? 'bg-[#E05338] border-amber-200' : 'bg-stone-300 border-stone-400'}`} />
              </button>
            </div>
          </div>

          {/* Section 2: Quản Lý Dữ Liệu & Mã Sao Lưu */}
          <div className="bg-white border border-[#EEDCC8] rounded-2xl p-3 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between pb-1 border-b border-stone-100">
              <span className="text-[10.5px] font-black text-[#8C624D] uppercase tracking-wider flex items-center gap-1.5">
                <Cloud size={13} className="text-[#E05338]" />
                <span>Sao Lưu & Dữ Liệu Game</span>
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                Offline 100%
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              {/* Backup / Restore Code Full Menu */}
              <button
                onClick={() => {
                  audioService.playClick();
                  setIsSaveDataOpen(true);
                }}
                className="w-full p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-300 rounded-xl flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E05338] text-white flex items-center justify-center shadow-xs">
                    <Cloud size={16} />
                  </div>
                  <div className="text-left">
                    <span className="font-black text-xs text-[#3D2619] block group-hover:text-[#E05338] transition-colors">
                      Mã Sao Lưu / Khôi Phục Thiết Bị
                    </span>
                    <span className="text-[9.5px] text-stone-500">
                      Chuyển toàn bộ tiến trình sang điện thoại/máy khác
                    </span>
                  </div>
                </div>
                <ChevronRight size={15} className="text-amber-700 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Quick Save button */}
              <button
                onClick={handleQuickSave}
                className="w-full p-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 rounded-xl flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Save size={16} />
                  </div>
                  <div className="text-left">
                    <span className="font-black text-xs text-emerald-950 block">
                      Lưu Nhanh Vào Bộ Nhớ Máy
                    </span>
                    <span className="text-[9.5px] text-emerald-700">
                      Lưu trạng thái hiện tại ngay lập tức
                    </span>
                  </div>
                </div>
                <CheckCircle2 size={15} className="text-emerald-600" />
              </button>

              {/* Safety Backup rollback if available */}
              {SaveService.hasSafetyBackup() && (
                <button
                  onClick={handleSafetyRollback}
                  className="w-full p-2 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-xl flex items-center justify-between transition-all cursor-pointer text-sky-950 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Undo2 size={14} className="text-sky-600" />
                    <span className="font-black text-[10.5px]">Hoàn tác về bản lưu an toàn trước đó</span>
                  </div>
                  <span className="text-[9px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded-md">
                    Snapshot
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Vùng Nguy Hiểm (Reset Game) */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1">
                <Trash2 size={12} className="text-rose-600" />
                <span>Vùng Nguy Hiểm</span>
              </span>
            </div>
            <p className="text-[10px] text-rose-700 leading-tight">
              Xóa sạch toàn bộ tiến trình trên thiết bị này và bắt đầu lại tiệm sinh tố mới từ Ngày 1.
            </p>
            <button
              onClick={handleResetGame}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} />
              <span>Đặt Lại & Chơi Lại Từ Đầu</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#EEDCC8] border-t-2 border-[#D8C2AC] flex items-center justify-between">
          <span className="text-[9.5px] font-bold text-stone-600">Smoothie Hustle v1.0</span>
          <button
            onClick={() => {
              audioService.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-[#3D2619] hover:bg-[#542810] text-amber-100 font-black text-xs rounded-xl shadow-2xs cursor-pointer transition-all active:scale-95"
          >
            Đóng
          </button>
        </div>

      </div>

      {/* Sub modals */}
      <SaveDataModal
        isOpen={isSaveDataOpen}
        onClose={() => setIsSaveDataOpen(false)}
      />

      <ShopProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};
