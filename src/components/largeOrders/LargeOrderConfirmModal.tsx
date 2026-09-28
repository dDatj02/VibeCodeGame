import React, { useState } from 'react';
import { useLargeOrderStore } from '../../stores/largeOrderStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { PhoneCall, CheckCheck, Sparkles, Loader2 } from 'lucide-react';

export const LargeOrderConfirmModal: React.FC = () => {
  const showConfirmationModal = useLargeOrderStore((state) => state.showConfirmationModal);
  const activeOrder = useLargeOrderStore((state) => state.activeOrder);
  const confirmOrder = useLargeOrderStore((state) => state.confirmOrder);

  const [isDialing, setIsDialing] = useState(false);

  if (!showConfirmationModal || !activeOrder) return null;

  const handleConfirm = () => {
    setIsDialing(true);
    audioService.playClick();

    setTimeout(() => {
      confirmOrder();
      setIsDialing(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#FAF4ED] text-[#3D2619] w-full max-w-sm rounded-3xl border-3 border-[#542810] shadow-2xl p-4 flex flex-col items-center text-center gap-3 animate-in zoom-in-95 duration-200">
        
        {/* Animated Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg animate-bounce">
            {activeOrder.customer.avatar}
          </div>
          <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full text-xs shadow-md animate-pulse">
            📞
          </span>
        </div>

        {/* Title */}
        <div>
          <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
            Sản Xuất Hoàn Tất!
          </span>
          <h3 className="text-base font-black text-[#3D2619] font-['Comfortaa',sans-serif] mt-1">
            Xác Nhận Giao Đơn Hàng
          </h3>
          <p className="text-xs text-stone-600 mt-0.5">
            Đang gọi điện cho <span className="font-black text-amber-950">{activeOrder.customer.name}</span> để chốt địa điểm giao nhận.
          </p>
        </div>

        {/* Batch info badge */}
        <div className="w-full bg-white p-2.5 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-xl">{activeOrder.recipeIcon}</span>
            <span>{activeOrder.quantity} ly {activeOrder.recipeName}</span>
          </div>
          <span className="font-black text-emerald-700">
            +{formatVND(activeOrder.totalRevenue)}
          </span>
        </div>

        {/* Suspense dial button */}
        <button
          onClick={handleConfirm}
          disabled={isDialing}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white font-black text-sm rounded-2xl border-2 border-emerald-900 shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
        >
          {isDialing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Đang kết nối với khách hàng...</span>
            </>
          ) : (
            <>
              <PhoneCall size={16} />
              <span>GỌI XÁC NHẬN GIAO HÀNG</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
