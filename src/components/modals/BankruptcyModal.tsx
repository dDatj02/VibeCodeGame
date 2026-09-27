import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useEconomyStore } from '../../stores/economyStore';
import { SaveService } from '../../services/SaveService';
import { audioService } from '../../services/AudioService';
import { AlertTriangle, RotateCcw, HeartHandshake } from 'lucide-react';

export const BankruptcyModal: React.FC = () => {
  const isBankrupt = useGameStore((state) => state.isBankrupt);
  const setBankrupt = useGameStore((state) => state.setBankrupt);
  const addCash = useEconomyStore((state) => state.addCash);

  if (!isBankrupt) return null;

  const handleBailout = () => {
    audioService.playFanfare();
    addCash(400000);
    setBankrupt(false);
    useGameStore.getState().showNotification('Bạn bè gom góp 400.000đ cứu nguy! Hãy quản lý dòng tiền cẩn trọng hơn.', 'success');
  };

  const handleRestart = () => {
    audioService.playClick();
    SaveService.clearSave();
    setBankrupt(false);
    useGameStore.getState().showNotification('Đã bắt đầu hành trình khởi nghiệp mới!', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
      <div className="bg-[#FBF7F0] border-2 border-rose-500 rounded-2xl shadow-2xl max-w-sm w-full p-4 text-[#3D2619] text-center">
        <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-300 mx-auto flex items-center justify-center text-rose-500 mb-2">
          <AlertTriangle size={20} />
        </div>

        <h2 className="text-base font-extrabold text-rose-600 font-['Comfortaa',sans-serif]">
          Cạn Kiệt Dòng Tiền & Áp Lực Nợ!
        </h2>

        <p className="text-xs text-[#5C3A21] mt-1.5 leading-relaxed">
          Quán đã hết sạch tiền mặt trong khi các khoản nợ hàng ngày vẫn tiếp tục phát sinh.
          Trong kinh doanh, kiểm soát dòng tiền sống còn hơn cả lợi nhuận trên giấy!
        </p>

        <div className="space-y-2 mt-4">
          <button
            onClick={handleBailout}
            className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-white font-black text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <HeartHandshake size={14} />
            <span>Nhận Trợ Cấp Khẩn Cấp (400.000đ Tiếp Tục)</span>
          </button>

          <button
            onClick={handleRestart}
            className="w-full py-2 bg-white hover:bg-stone-50 text-[#8C624D] hover:text-[#3D2619] border border-[#F0D5C3] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Làm Lại Từ Đầu Với Xe Sinh Tố Cũ (500.000đ)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
