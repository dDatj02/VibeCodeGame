import React from 'react';
import { useLargeOrderStore } from '../../stores/largeOrderStore';
import { formatVND } from '../../utils/format';
import { CheckCircle2, AlertOctagon, Store, TrendingUp, TrendingDown, Star, Sparkles, ShieldAlert } from 'lucide-react';

export const LargeOrderResultModal: React.FC = () => {
  const showResultModal = useLargeOrderStore((state) => state.showResultModal);
  const lastResult = useLargeOrderStore((state) => state.lastResult);
  const dismissResult = useLargeOrderStore((state) => state.dismissResult);

  if (!showResultModal || !lastResult) return null;

  const { success, order, revenueReceived, depositRetained, ingredientCost, recoverableAmount, netProfitLoss, customerSatisfaction } = lastResult;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#FAF4ED] text-[#3D2619] w-full max-w-sm rounded-3xl border-3 border-[#542810] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Banner Header */}
        <div className={`p-4 text-center text-white flex flex-col items-center gap-1 ${
          success 
            ? 'bg-gradient-to-b from-emerald-600 to-teal-800 border-b-2 border-emerald-900' 
            : 'bg-gradient-to-b from-rose-600 to-red-800 border-b-2 border-rose-950'
        }`}>
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-3xl shadow-inner animate-bounce">
            {success ? '🎉' : '🚨'}
          </div>
          
          <h3 className="text-base font-black font-['Comfortaa',sans-serif] mt-0.5">
            {success ? 'Giao Đơn Sỉ Thành Công!' : 'Khách Hàng Đã Bom Hàng!'}
          </h3>
          <p className="text-xs text-white/90 font-medium">
            {success
              ? `${order.customer.avatar} ${order.customer.name} đã nhận đủ ${order.quantity} ly và thanh toán!`
              : `${order.customer.avatar} ${order.customer.name} bất ngờ huỷ đơn vào phút chót!`}
          </p>
        </div>

        {/* Breakdown Card */}
        <div className="p-3.5 space-y-2.5">
          
          {/* Review Quote if success */}
          {success && lastResult.reviewComment && (
            <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-300 text-xs shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#3D2619]">{order.customer.name}</span>
                <div className="flex text-amber-500 text-xs">
                  {'★'.repeat(5)}
                </div>
              </div>
              <p className="text-[11px] text-amber-950 italic leading-snug">
                "{lastResult.reviewComment}"
              </p>
            </div>
          )}

          {/* Financial Breakdown Table */}
          <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-xs space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-stone-600 pb-1 border-b border-stone-200 font-bold">
              <span>Món hàng:</span>
              <span className="text-[#3D2619] font-black">{order.quantity} × {order.recipeName}</span>
            </div>

            {success ? (
              <>
                <div className="flex justify-between items-center text-stone-600">
                  <span>Tổng tiền thu về:</span>
                  <span className="font-black text-emerald-700">+{formatVND(revenueReceived)}</span>
                </div>
                <div className="flex justify-between items-center text-stone-600">
                  <span>Chi phí nguyên liệu:</span>
                  <span className="font-bold text-rose-700">-{formatVND(ingredientCost)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-stone-300 text-sm font-black">
                  <span>Lợi nhuận ròng:</span>
                  <span className="text-emerald-700 tabular-nums">+{formatVND(netProfitLoss)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center text-stone-600">
                  <span>Doanh thu dự kiến:</span>
                  <span className="line-through text-stone-400 font-bold">{formatVND(order.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center text-stone-600">
                  <span>Tiền cọc giữ lại:</span>
                  <span className="font-black text-emerald-700">+{formatVND(depositRetained)}</span>
                </div>
                {recoverableAmount > 0 && (
                  <div className="flex justify-between items-center text-stone-600">
                    <span>Bán thanh lý thu hồi (25%):</span>
                    <span className="font-black text-amber-700">+{formatVND(recoverableAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-stone-600">
                  <span>Chi phí nguyên liệu đã làm:</span>
                  <span className="font-bold text-rose-700">-{formatVND(ingredientCost)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-stone-300 text-sm font-black">
                  <span>Tổn thất thực tế:</span>
                  <span className="text-rose-700 tabular-nums">
                    {netProfitLoss >= 0 ? `+${formatVND(netProfitLoss)}` : `${formatVND(netProfitLoss)}`}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Customer Reliability update */}
          <div className="flex items-center justify-between px-3 py-2 bg-stone-100 rounded-xl text-xs font-bold">
            <span className="text-stone-600">Độ uy tín đối tác:</span>
            <span className={`font-black ${success ? 'text-emerald-700' : 'text-rose-700'}`}>
              {success ? '🤝 +5% (Rất đáng tin)' : '⚠️ -18% (Đã vào danh sách đen)'}
            </span>
          </div>

        </div>

        {/* Reopen Shop Button */}
        <div className="bg-[#EEDCC8] p-3 border-t-2 border-[#D8C2AC]">
          <button
            onClick={dismissResult}
            className="w-full py-2.5 bg-[#F26440] hover:bg-[#E05338] active:scale-95 text-white font-black text-xs rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Store size={14} />
            <span>MỞ LẠI QUÁN PHỤC VỤ KHÁCH LẺ</span>
          </button>
        </div>

      </div>
    </div>
  );
};
