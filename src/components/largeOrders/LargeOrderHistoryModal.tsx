import React from 'react';
import { useLargeOrderStore } from '../../stores/largeOrderStore';
import { formatVND } from '../../utils/format';
import { X, Package, CheckCircle2, XCircle, TrendingUp, TrendingDown, Users } from 'lucide-react';

export const LargeOrderHistoryModal: React.FC = () => {
  const showHistoryModal = useLargeOrderStore((state) => state.showHistoryModal);
  const closeHistoryModal = useLargeOrderStore((state) => state.closeHistoryModal);
  const orderHistory = useLargeOrderStore((state) => state.orderHistory);

  if (!showHistoryModal) return null;

  const totalCompleted = orderHistory.filter((o) => o.status === 'completed').length;
  const totalCancelled = orderHistory.filter((o) => o.status === 'cancelled').length;
  const totalNetProfit = orderHistory.reduce((sum, o) => sum + o.netProfitLoss, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#FAF4ED] text-[#3D2619] w-full max-w-md rounded-3xl border-3 border-[#542810] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#542810] via-[#6D3416] to-[#542810] text-amber-100 px-3.5 py-2.5 flex items-center justify-between border-b-2 border-[#3D1E0B]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <div>
              <h3 className="text-sm font-black font-['Comfortaa',sans-serif] text-amber-200 leading-tight">
                Lịch Sử Đơn Hàng Lớn
              </h3>
              <p className="text-[10px] text-amber-300/80">Nhật ký các hợp đồng sỉ & tiệc sự kiện</p>
            </div>
          </div>
          <button
            onClick={closeHistoryModal}
            className="p-1 text-amber-200 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="p-3 bg-amber-50/90 border-b border-amber-200 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-[9px] text-stone-500 font-bold block">Thành công</span>
            <span className="text-sm font-black text-emerald-700">{totalCompleted} đơn</span>
          </div>
          <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-[9px] text-stone-500 font-bold block">Bị huỷ / bom</span>
            <span className="text-sm font-black text-rose-700">{totalCancelled} đơn</span>
          </div>
          <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-[9px] text-stone-500 font-bold block">Tổng lãi ròng</span>
            <span className={`text-xs font-black tabular-nums block truncate ${totalNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {totalNetProfit >= 0 ? `+${formatVND(totalNetProfit)}` : formatVND(totalNetProfit)}
            </span>
          </div>
        </div>

        {/* Internal Scrollable History List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
          {orderHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500 font-bold bg-white rounded-2xl border border-dashed border-stone-300">
              📦 Chưa có đơn hàng lớn nào được thực hiện. Khi đạt Cấp 5, các đối tác công ty & sự kiện sẽ liên hệ đặt hàng!
            </div>
          ) : (
            orderHistory.map((item) => (
              <div
                key={item.id}
                className="bg-white p-2.5 rounded-2xl border border-amber-200/80 shadow-2xs space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0">{item.customerAvatar}</span>
                    <div className="min-w-0">
                      <span className="font-black text-[#3D2619] block truncate text-[11.5px]">
                        {item.customerName}
                      </span>
                      <span className="text-[10px] text-stone-500 font-bold">
                        Ngày {item.day} · {item.quantity} ly {item.recipeName}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full font-black text-[10px] shrink-0 flex items-center gap-1 ${
                    item.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {item.status === 'completed' ? '✓ Hoàn tất' : '✕ Bị huỷ'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[10.5px]">
                  <span className="text-stone-500">
                    {item.status === 'completed' ? 'Doanh thu thu về:' : 'Khoản bồi thường cọc/thu hồi:'}
                  </span>
                  <span className={`font-black ${item.netProfitLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {item.netProfitLoss >= 0 ? `+${formatVND(item.netProfitLoss)}` : formatVND(item.netProfitLoss)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#EEDCC8] border-t-2 border-[#D8C2AC]">
          <button
            onClick={closeHistoryModal}
            className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-white font-black text-xs rounded-2xl shadow-xs cursor-pointer transition-all"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
