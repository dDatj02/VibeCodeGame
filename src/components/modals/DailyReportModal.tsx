import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { CheckCircle2, TrendingUp, TrendingDown, Users, Star } from 'lucide-react';

export const DailyReportModal: React.FC = () => {
  const activeDailyReport = useGameStore((state) => state.activeDailyReport);
  const nextDay = useGameStore((state) => state.nextDay);

  if (!activeDailyReport) return null;

  const isProfitable = activeDailyReport.netProfit >= 0;

  const handleNextDay = () => {
    audioService.playClick();
    nextDay();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 select-none">
      <div className="bg-[#FBF7F0] border-2 border-[#E05338] rounded-3xl shadow-2xl max-w-sm w-full p-4 text-[#3D2619] flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Title */}
        <div className="text-center pb-2.5 border-b border-[#F0D5C3]">
          <span className="text-3xl">📊</span>
          <h2 className="text-base font-black text-[#E05338] font-['Comfortaa',sans-serif] mt-1">
            Tổng Kết Ngày {activeDailyReport.day}
          </h2>
          <p className="text-xs text-[#78513E]">
            Báo cáo doanh thu & chi phí hôm nay
          </p>
        </div>

        {/* Vital Stats Bar */}
        <div className="grid grid-cols-2 gap-2 my-2.5">
          <div className="p-2.5 bg-white border border-[#F0D5C3] rounded-2xl flex items-center gap-2 shadow-xs">
            <Users size={18} className="text-sky-600 shrink-0" />
            <div>
              <div className="text-[10px] text-[#9E735B] font-bold">Khách phục vụ</div>
              <div className="text-xs font-black text-[#3D2619]">
                {activeDailyReport.totalCustomersServed} khách{' '}
                <span className="text-[#E05338] font-bold">
                  ({activeDailyReport.customersLost} bỏ về)
                </span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-white border border-[#F0D5C3] rounded-2xl flex items-center gap-2 shadow-xs">
            <Star size={18} className="text-amber-500 shrink-0" />
            <div>
              <div className="text-[10px] text-[#9E735B] font-bold">Đánh giá tiệm</div>
              <div className="text-xs font-black text-amber-600">
                ⭐ {activeDailyReport.averageRating} / 5.0
              </div>
            </div>
          </div>
        </div>

        {/* Financial Line Items */}
        <div className="space-y-1.5 text-xs text-[#5C3A21] py-2 border-y border-[#F0D5C3]">
          <div className="flex justify-between items-center text-emerald-700 font-bold">
            <span>(+) Doanh thu bán sinh tố:</span>
            <span className="tabular-nums font-black">{formatVND(activeDailyReport.revenue)}</span>
          </div>

          <div className="flex justify-between items-center text-[#78513E]">
            <span>(-) Chi phí nguyên liệu:</span>
            <span className="tabular-nums text-[#E05338] font-bold">-{formatVND(activeDailyReport.ingredientCost)}</span>
          </div>

          {activeDailyReport.employeeSalaries > 0 && (
            <div className="flex justify-between items-center text-[#78513E]">
              <span>(-) Lương nhân viên:</span>
              <span className="tabular-nums text-[#E05338] font-bold">-{formatVND(activeDailyReport.employeeSalaries)}</span>
            </div>
          )}

          {activeDailyReport.rent > 0 && (
            <div className="flex justify-between items-center text-[#78513E]">
              <span>(-) Tiền thuê mặt bằng:</span>
              <span className="tabular-nums text-[#E05338] font-bold">-{formatVND(activeDailyReport.rent)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-[#78513E]">
            <span>(-) Tiền điện máy xay & tủ mát:</span>
            <span className="tabular-nums text-[#E05338] font-bold">-{formatVND(activeDailyReport.electricity)}</span>
          </div>

          {activeDailyReport.loanPayments > 0 && (
            <div className="flex justify-between items-center text-[#78513E]">
              <span>(-) Trả nợ khoản vay:</span>
              <span className="tabular-nums text-[#E05338] font-bold">-{formatVND(activeDailyReport.loanPayments)}</span>
            </div>
          )}

          {activeDailyReport.penalties > 0 && (
            <div className="flex justify-between items-center text-[#78513E]">
              <span>(-) Phí trễ nợ:</span>
              <span className="tabular-nums text-[#E05338] font-bold">-{formatVND(activeDailyReport.penalties)}</span>
            </div>
          )}
        </div>

        {/* Net Profit Highlight */}
        <div className="flex items-center justify-between p-3 my-2.5 rounded-2xl bg-white border border-[#F0D5C3] shadow-xs">
          <div className="flex items-center gap-1.5">
            {isProfitable ? (
              <TrendingUp className="text-emerald-600" size={18} />
            ) : (
              <TrendingDown className="text-[#E05338]" size={18} />
            )}
            <span className="font-extrabold text-xs text-[#3D2619]">LỢI NHUẬN RÒNG:</span>
          </div>
          <span
            className={`text-sm font-black tabular-nums ${
              isProfitable ? 'text-emerald-700' : 'text-[#E05338]'
            }`}
          >
            {isProfitable ? '+' : ''}
            {formatVND(activeDailyReport.netProfit)}
          </span>
        </div>

        {/* Ending Cash */}
        <div className="flex justify-between items-center text-xs text-[#78513E] mb-3 px-1">
          <span>Tiền mặt hiện có:</span>
          <span className="font-black text-[#3D2619] tabular-nums">
            {formatVND(activeDailyReport.endingCash)}
          </span>
        </div>

        {/* Continue Next Day Button */}
        <button
          onClick={handleNextDay}
          className="w-full py-3 bg-gradient-to-r from-[#F26440] to-[#E05338] hover:from-[#E05338] hover:to-[#D2442A] text-white font-black text-xs rounded-2xl shadow-md border border-[#C23315] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 size={16} />
          <span>Sang Ngày Mới (Ngày {activeDailyReport.day + 1})</span>
        </button>
      </div>
    </div>
  );
};
