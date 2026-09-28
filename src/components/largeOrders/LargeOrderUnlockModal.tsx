import React from 'react';
import { useLargeOrderStore } from '../../stores/largeOrderStore';
import { Sparkles, Package, ShieldAlert, ArrowRight, X } from 'lucide-react';

export const LargeOrderUnlockModal: React.FC = () => {
  const showUnlockModal = useLargeOrderStore((state) => state.showUnlockModal);
  const closeUnlockModal = useLargeOrderStore((state) => state.closeUnlockModal);
  const openOfferModal = useLargeOrderStore((state) => state.openOfferModal);
  const activeOffer = useLargeOrderStore((state) => state.activeOffer);

  if (!showUnlockModal) return null;

  const handleOpenFirstOrder = () => {
    closeUnlockModal();
    if (activeOffer) {
      openOfferModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#FAF4ED] text-[#3D2619] w-full max-w-sm rounded-3xl border-3 border-[#542810] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-4 text-center flex flex-col items-center gap-1 border-b-2 border-amber-900">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-3xl shadow-inner animate-bounce">
            📦
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded-full mt-1">
            Cơ Hội Kinh Doanh Mới!
          </span>
          <h3 className="text-base font-black font-['Comfortaa',sans-serif]">
            MỞ KHÓA ĐƠN HÀNG LỚN
          </h3>
          <p className="text-[11px] text-amber-100 font-medium leading-tight">
            Tiệm của bạn đã đủ uy tín để nhận các đơn sỉ từ công ty, trường học & sự kiện!
          </p>
        </div>

        {/* 4 Key Rules */}
        <div className="p-3.5 space-y-2 text-xs">
          
          <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs flex items-center gap-2.5">
            <span className="text-xl shrink-0">💰</span>
            <div>
              <span className="font-black text-[#3D2619] block leading-tight">Doanh thu cực lớn</span>
              <p className="text-[10px] text-stone-600 leading-tight">Mỗi đơn từ 30 đến 100+ ly, mang về lợi nhuận hàng triệu đồng.</p>
            </div>
          </div>

          <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs flex items-center gap-2.5">
            <span className="text-xl shrink-0">🔒</span>
            <div>
              <span className="font-black text-[#3D2619] block leading-tight">Tự động sản xuất</span>
              <p className="text-[10px] text-stone-600 leading-tight">Quán tạm đóng quầy để máy xay tự động làm, không cần pha từng ly.</p>
            </div>
          </div>

          <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs flex items-center gap-2.5">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <span className="font-black text-[#3D2619] block leading-tight">Rủi ro Bom Hàng & Tiền cọc</span>
              <p className="text-[10px] text-stone-600 leading-tight">Có tỷ lệ khách huỷ đơn. Tiền cọc trước sẽ giúp bù đắp thiệt hại.</p>
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div className="bg-[#EEDCC8] p-3 border-t-2 border-[#D8C2AC]">
          <button
            onClick={handleOpenFirstOrder}
            className="w-full py-2.5 bg-[#F26440] hover:bg-[#E05338] active:scale-95 text-white font-black text-xs rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <span>XEM ĐƠN HÀNG ĐẦU TIÊN</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};
