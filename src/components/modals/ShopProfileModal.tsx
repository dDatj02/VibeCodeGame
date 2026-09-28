import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { SaveService } from '../../services/SaveService';
import { audioService } from '../../services/AudioService';
import { X, Check, Sparkles, Store, Edit3, Cloud } from 'lucide-react';
import { SaveDataModal } from './SaveDataModal';

interface ShopProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_OPTIONS = [
  { icon: '🍹', label: 'Sinh Tố' },
  { icon: '🍉', label: 'Dưa Hấu' },
  { icon: '🥑', label: 'Bơ Sáp' },
  { icon: '🥭', label: 'Xoài Cát' },
  { icon: '🍓', label: 'Dâu Tây' },
  { icon: '🍌', label: 'Chuối Tiêu' },
  { icon: '🥥', label: 'Dừa Xiêm' },
  { icon: '🍍', label: 'Dứa Thơm' },
  { icon: '🐱', label: 'Mèo Béo' },
  { icon: '🐻', label: 'Gấu Trúc' },
  { icon: '🦊', label: 'Cáo Chill' },
  { icon: '🐶', label: 'Cún Cưng' },
  { icon: '🧋', label: 'Trà Sữa' },
  { icon: '🥤', label: 'Ly Mang Đi' },
  { icon: '☕', label: 'Cà Phê' },
  { icon: '🌸', label: 'Hoa Đào' },
];

const NAME_SUGGESTIONS = [
  'Sinh Tố Nhà Tui',
  'Tiệm Trái Cây Nhiệt Đới',
  'Sinh Tố Mèo Béo',
  'Quán Nước Cô Ba',
  'Sinh Tố Dưa Hấu Chill',
  'Bơ Sáp Sài Gòn',
];

export const ShopProfileModal: React.FC<ShopProfileModalProps> = ({ isOpen, onClose }) => {
  const { shopName, shopAvatar, setShopProfile, showNotification } = useGameStore();

  const [name, setName] = useState(shopName);
  const [selectedAvatar, setSelectedAvatar] = useState(shopAvatar || '🍹');
  const [isSaveDataOpen, setIsSaveDataOpen] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showNotification('Vui lòng nhập tên quán!', 'warning');
      return;
    }

    audioService.playClick();
    setShopProfile(trimmed, selectedAvatar);
    SaveService.saveGame();
    showNotification('Đã cập nhật tên và avatar quán thành công! 🎉', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFBF5] border-3 border-[#3D2619] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#3D2619] text-[#FAF4ED] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="text-amber-300" size={20} />
            <h3 className="font-['Comfortaa',sans-serif] font-black text-base text-amber-100">
              Đổi Tên & Avatar Tiệm
            </h3>
          </div>
          <button
            onClick={() => {
              audioService.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-[#3D2619]">
          {/* Live Preview Card */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 flex items-center gap-3 shadow-inner">
            <div className="w-12 h-12 rounded-2xl bg-[#F26440] text-white flex items-center justify-center font-black text-2xl shadow-md ring-2 ring-white shrink-0">
              {selectedAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                Xem trước góc trái
              </span>
              <h4 className="font-black text-base text-[#3D2619] font-['Comfortaa',sans-serif] truncate">
                {name.trim() || 'Tên Quán Sinh Tố'}
              </h4>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-black text-[#5C3A21] mb-1 flex items-center gap-1">
              <Edit3 size={13} />
              <span>Tên quán của bạn:</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 32))}
              placeholder="Nhập tên quán..."
              className="w-full px-3 py-2 bg-white border-2 border-stone-300 focus:border-[#F26440] rounded-xl font-bold text-sm text-[#3D2619] outline-none transition-colors shadow-2xs"
            />
            <div className="flex justify-between text-[10px] text-stone-500 mt-1 font-bold">
              <span>Gợi ý tên nhanh:</span>
              <span>{name.length}/32 ký tự</span>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {NAME_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => {
                    audioService.playClick();
                    setName(sug);
                  }}
                  className={`text-[10.5px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    name === sug
                      ? 'bg-amber-200 text-amber-950 border-amber-400 shadow-xs'
                      : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Grid */}
          <div>
            <label className="block text-xs font-black text-[#5C3A21] mb-1.5 flex items-center gap-1">
              <Sparkles size={13} className="text-amber-600" />
              <span>Chọn biểu tượng Avatar đại diện:</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map((item) => {
                const isSelected = selectedAvatar === item.icon;
                return (
                  <button
                    key={item.icon}
                    type="button"
                    onClick={() => {
                      audioService.playClick();
                      setSelectedAvatar(item.icon);
                    }}
                    className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100 border-[#F26440] ring-2 ring-[#F26440]/30 shadow-md scale-105'
                        : 'bg-white hover:bg-stone-50 border-stone-200 shadow-2xs hover:scale-102'
                    }`}
                    title={item.label}
                  >
                    <span className="text-xl select-none leading-none">{item.icon}</span>
                    <span className="text-[8px] font-black text-stone-600 truncate mt-0.5 leading-none">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#FAF4ED] border-t-2 border-[#EEDCC8] px-4 py-2.5 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              audioService.playClick();
              setIsSaveDataOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200/80 text-amber-900 border border-amber-300 font-black text-[10.5px] cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
          >
            <Cloud size={13} className="text-[#E05338]" />
            <span>Mã Sao Lưu</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                audioService.playClick();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl border-2 border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-[#F26440] hover:bg-[#E05338] text-white font-black text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <Check size={14} />
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </div>
      </div>

      <SaveDataModal
        isOpen={isSaveDataOpen}
        onClose={() => setIsSaveDataOpen(false)}
      />
    </div>
  );
};
