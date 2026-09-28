import React from 'react';
import { useLargeOrderStore } from '../../stores/largeOrderStore';
import { useShopStore } from '../../stores/shopStore';
import { LARGE_ORDER_UNLOCK_LEVEL } from '../../config/largeOrderConfig';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { Package, Lock, Clock, Sparkles, ArrowRight, History, Zap, CheckCircle2 } from 'lucide-react';

interface LargeOrderLobbyCardProps {
  onOpenKitchen?: () => void;
}

export const LargeOrderLobbyCard: React.FC<LargeOrderLobbyCardProps> = ({ onOpenKitchen }) => {
  const currentShopLevel = useShopStore((state) => state.currentShopLevel);
  const activeOffer = useLargeOrderStore((state) => state.activeOffer);
  const activeOrder = useLargeOrderStore((state) => state.activeOrder);
  const openOfferModal = useLargeOrderStore((state) => state.openOfferModal);
  const openHistoryModal = useLargeOrderStore((state) => state.openHistoryModal);
  const generateOffer = useLargeOrderStore((state) => state.generateOffer);

  const isUnlocked = currentShopLevel >= LARGE_ORDER_UNLOCK_LEVEL;

  // 1. LOCKED STATE (Level 1 to 4)
  if (!isUnlocked) {
    return (
      <div className="bg-gradient-to-r from-stone-100 to-amber-50/60 p-3 rounded-2xl border border-stone-300 shadow-2xs select-none flex items-center justify-between gap-2.5 opacity-90">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-stone-200 text-stone-600 flex items-center justify-center text-xl shrink-0 border border-stone-300">
            🔒
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-stone-800">Đơn Hàng Lớn (Catering)</span>
              <span className="text-[9px] font-black bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded-full">
                Khóa
              </span>
            </div>
            <p className="text-[10px] text-stone-500 line-clamp-1 leading-tight mt-0.5">
              Mở khóa ở <span className="font-bold text-amber-900">Cấp {LARGE_ORDER_UNLOCK_LEVEL}</span>. Nhận đơn sỉ công ty & sự kiện siêu lợi nhuận!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVELY PRODUCING STATE
  if (activeOrder && activeOrder.status === 'producing') {
    const progressPercent = Math.round((activeOrder.progressCount / activeOrder.quantity) * 100);
    return (
      <div className="bg-gradient-to-r from-amber-950 via-[#4A2411] to-amber-900 text-amber-100 p-3 rounded-2xl border-2 border-amber-500 shadow-md select-none flex flex-col gap-2 animate-pulse-slow">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-lg">📦</span>
            <span className="font-black text-amber-200 text-xs truncate">
              {activeOrder.customer.avatar} {activeOrder.customer.name}
            </span>
          </div>
          <span className="bg-amber-500 text-stone-950 text-[9.5px] font-black px-2 py-0.5 rounded-full">
            Đang sản xuất {progressPercent}%
          </span>
        </div>

        <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-amber-600/50">
          <div
            className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-amber-200/90 pt-0.5">
          <span>{activeOrder.progressCount} / {activeOrder.quantity} ly {activeOrder.recipeName}</span>
          <span className="font-black text-emerald-400">+{formatVND(activeOrder.totalRevenue)}</span>
        </div>
      </div>
    );
  }

  // 3. NEW OFFER ARRIVED STATE
  if (activeOffer) {
    return (
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-[#F26440] text-white p-3 rounded-2xl border-2 border-white shadow-lg select-none flex items-center justify-between gap-2.5 animate-bounce-subtle">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-3xl p-1 bg-white/20 rounded-xl shrink-0">
            {activeOffer.customer.avatar}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[9.5px] font-black uppercase tracking-wider bg-black/30 px-1.5 py-0.2 rounded-full">
                Cơ hội mới
              </span>
              <span className="text-[10px] font-bold text-amber-100">
                {activeOffer.quantity} ly {activeOffer.recipeName}
              </span>
            </div>
            <h4 className="text-xs font-black truncate mt-0.5">
              {activeOffer.customer.name}
            </h4>
            <span className="text-[11px] font-black text-amber-100">
              +{formatVND(activeOffer.totalRevenue)}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            audioService.playClick();
            openOfferModal();
          }}
          className="px-3 py-2 bg-white text-stone-900 hover:bg-amber-100 active:scale-95 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all shrink-0 flex items-center gap-1"
        >
          <span>Xem Đơn</span>
          <ArrowRight size={13} />
        </button>
      </div>
    );
  }

  // 4. UNLOCKED & WAITING FOR NEXT CLIENT
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50/70 p-2.5 sm:p-3 rounded-2xl border border-amber-200 shadow-2xs select-none flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shrink-0 border border-amber-300">
          📦
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-[#3D2619]">Đơn Hàng Sỉ & Sự Kiện</span>
            <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
              Sẵn sàng
            </span>
          </div>
          <p className="text-[10px] text-stone-500 truncate mt-0.5">
            Đang kết nối đối tác công ty, trường học & tiệc liên hoan...
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => {
            audioService.playClick();
            openHistoryModal();
          }}
          className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 rounded-xl border border-stone-300 text-xs font-bold transition-colors cursor-pointer"
          title="Xem lịch sử hợp đồng sỉ"
        >
          <History size={14} />
        </button>

        <button
          onClick={() => {
            audioService.playClick();
            generateOffer(true);
          }}
          className="px-2.5 py-1.5 bg-[#F26440] hover:bg-[#E05338] text-white active:scale-95 font-bold text-[10px] rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          Tìm đơn
        </button>
      </div>
    </div>
  );
};
