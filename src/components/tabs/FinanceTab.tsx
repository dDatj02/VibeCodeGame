import React, { useState } from 'react';
import { useEconomyStore } from '../../stores/economyStore';
import { useShopStore } from '../../stores/shopStore';
import { useGameStore } from '../../stores/gameStore';
import { useInvestmentStore } from '../../stores/investmentStore';
import { LOAN_PRODUCTS } from '../../data/loans';
import { LoanProduct } from '../../types';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { InvestmentHub } from '../investment/InvestmentHub';
import { Landmark, AlertTriangle, CheckCircle, Clock, ArrowLeft } from 'lucide-react';

export const FinanceTab: React.FC = () => {
  const cash = useEconomyStore((state) => state.cash);
  const creditScore = useEconomyStore((state) => state.creditScore);
  const activeLoans = useEconomyStore((state) => state.activeLoans);
  const takeLoan = useEconomyStore((state) => state.takeLoan);
  const repayFullLoan = useEconomyStore((state) => state.repayFullLoan);
  const calculateNetWorth = useEconomyStore((state) => state.calculateNetWorth);
  const getTotalEquipmentValue = useShopStore((state) => state.getTotalEquipmentValue);
  const getTotalPropertyMarketValue = useInvestmentStore((state) => state.getTotalPropertyMarketValue);
  const showNotification = useGameStore((state) => state.showNotification);
  const setActiveTab = useGameStore((state) => state.setActiveTab);

  const [activeFinanceSection, setActiveFinanceSection] = useState<'investment' | 'loans'>('investment');

  const equipmentValue = getTotalEquipmentValue();
  const propertyValue = getTotalPropertyMarketValue();
  const totalAssets = equipmentValue + propertyValue;
  const netWorth = calculateNetWorth(equipmentValue, propertyValue);
  const totalDebt = activeLoans.reduce((sum, l) => sum + l.remainingPrincipal, 0);

  const handleTakeLoan = (product: LoanProduct) => {
    if (creditScore < product.requiredCreditScore) {
      audioService.playDisappointed();
      showNotification(`Điểm tín dụng chưa đạt (Cần ${product.requiredCreditScore} điểm)!`, 'error');
      return;
    }

    const ok = takeLoan(product);
    if (ok) {
      audioService.playFanfare();
      showNotification(`Đã nhận giải ngân ${formatVND(product.principal)} từ ${product.lenderName}!`, 'success');
    }
  };

  const handleRepayFull = (loanId: string, remaining: number) => {
    if (cash < remaining) {
      audioService.playDisappointed();
      showNotification('Không đủ tiền mặt để tất toán khoản vay!', 'error');
      return;
    }

    const ok = repayFullLoan(loanId);
    if (ok) {
      audioService.playCashRegister();
      showNotification('Đã tất toán toàn bộ khoản vay sớm! Điểm tín dụng +15', 'success');
    }
  };

  return (
    <div className="flex-1 h-full max-h-full flex flex-col bg-[#FBF7F0] text-[#3D2619] p-2 max-w-lg mx-auto w-full select-none overflow-hidden">
      <div className="shrink-0 mb-1.5">
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => setActiveTab('shop')}
              className="p-1 hover:bg-[#F0D5C3]/40 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} className="text-[#E05338]" />
            </button>
            <h2 className="text-sm sm:text-base font-extrabold text-[#3D2619] font-['Comfortaa',sans-serif] truncate">
              Vốn & Đầu Tư
            </h2>
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex items-center p-0.5 bg-[#FAF0E6] rounded-xl border border-[#EEDCC8] shrink-0">
            <button
              onClick={() => {
                audioService.playClick();
                setActiveFinanceSection('investment');
              }}
              className={`px-2 py-0.5 text-[10.5px] font-black rounded-lg transition-all cursor-pointer ${
                activeFinanceSection === 'investment'
                  ? 'bg-[#E05338] text-white shadow-2xs'
                  : 'text-[#8C624D] hover:text-[#3D2619]'
              }`}
            >
              🏠 Đầu Tư BĐS
            </button>
            <button
              onClick={() => {
                audioService.playClick();
                setActiveFinanceSection('loans');
              }}
              className={`px-2 py-0.5 text-[10.5px] font-black rounded-lg transition-all cursor-pointer ${
                activeFinanceSection === 'loans'
                  ? 'bg-[#E05338] text-white shadow-2xs'
                  : 'text-[#8C624D] hover:text-[#3D2619]'
              }`}
            >
              🏦 Vay Vốn
            </button>
          </div>
        </div>

        {/* 1. Financial Overview Cards (Compact 4-col) */}
        <div className="grid grid-cols-4 gap-1">
          <div className="p-1.5 bg-white border border-[#F0D5C3] rounded-lg shadow-2xs text-center">
            <div className="text-[9px] text-[#78513E] font-bold">Tiền Mặt</div>
            <div className="text-[11px] font-black text-emerald-700 tabular-nums truncate mt-0.5">
              {formatVND(cash)}
            </div>
          </div>

          <div className="p-1.5 bg-white border border-[#F0D5C3] rounded-lg shadow-2xs text-center">
            <div className="text-[9px] text-[#78513E] font-bold">Tổng Nợ</div>
            <div className="text-[11px] font-black text-[#E05338] tabular-nums truncate mt-0.5">
              {formatVND(totalDebt)}
            </div>
          </div>

          <div className="p-1.5 bg-white border border-[#F0D5C3] rounded-lg shadow-2xs text-center">
            <div className="text-[9px] text-[#78513E] font-bold">Tài Sản BĐS+Máy</div>
            <div className="text-[11px] font-black text-amber-700 tabular-nums truncate mt-0.5">
              {formatVND(totalAssets)}
            </div>
          </div>

          <div className="p-1.5 bg-white border border-[#F0D5C3] rounded-lg shadow-2xs text-center">
            <div className="text-[9px] text-[#78513E] font-bold">Điểm TD</div>
            <div className="text-[11px] font-black text-sky-700 tabular-nums mt-0.5">
              {creditScore}
            </div>
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE SECTION */}
      {activeFinanceSection === 'investment' ? (
        <InvestmentHub />
      ) : (
        /* Loans & Financial Books View */
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2 pb-2">
          {/* Net Worth Banner */}
          <div className="p-2 bg-[#FFF4E8] border border-[#F2DECC] rounded-xl flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] font-black text-[#E05338]">Giá Trị Ròng Quán (Net Worth)</span>
              <p className="text-[9px] text-[#78513E]">Tiền mặt + Bất động sản + Máy móc - Dư nợ</p>
            </div>
            <div className="text-xs font-black text-[#3D2619] tabular-nums">
              {formatVND(netWorth)}
            </div>
          </div>

          {/* Active Loans Section */}
          <div className="mb-2">
            <h3 className="text-xs font-extrabold text-[#3D2619] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock size={14} className="text-amber-600" />
              <span>Khoản Vay Đang Hoạt Động ({activeLoans.length})</span>
            </h3>

            {activeLoans.length === 0 ? (
              <div className="p-4 bg-white border border-[#F0D5C3] rounded-2xl text-xs text-[#9E735B] text-center shadow-xs">
                Bạn hiện không có khoản nợ nào. Quán đang hoàn toàn tự chủ tài chính!
              </div>
            ) : (
              <div className="space-y-2">
                {activeLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-3 bg-white border border-[#F0D5C3] rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="font-extrabold text-xs text-[#3D2619] flex items-center gap-1.5">
                        <span>{loan.title}</span>
                        <span className="text-[10px] text-[#9E735B] font-normal">({loan.lenderName})</span>
                      </div>
                      <div className="text-[11px] text-[#78513E] mt-0.5">
                        Còn lại: <span className="text-[#E05338] font-bold tabular-nums">{formatVND(loan.remainingPrincipal)}</span> · Trả hàng ngày: <span className="tabular-nums font-semibold">{formatVND(loan.dailyPayment)}</span>
                      </div>
                      <div className="text-[10px] text-amber-800 mt-0.5 font-bold">
                        Kỳ hạn còn lại: {loan.daysRemaining} ngày
                        {loan.missedPayments > 0 && (
                          <span className="text-rose-600 ml-2 font-black">
                            (Trễ hạn {loan.missedPayments} lần!)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRepayFull(loan.id, loan.remainingPrincipal)}
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      Tất toán
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Loan Products */}
          <div>
            <h3 className="text-xs font-extrabold text-[#3D2619] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Landmark size={14} className="text-amber-600" />
              <span>Gói Vay Khởi Nghiệp & Ứng Vốn</span>
            </h3>

            <div className="space-y-2 pb-6">
              {LOAN_PRODUCTS.map((prod) => {
                const hasEnoughScore = creditScore >= prod.requiredCreditScore;

                return (
                  <div
                    key={prod.id}
                    className="p-3 bg-white border border-[#F0D5C3] rounded-2xl flex flex-col justify-between shadow-xs hover:border-[#E05338]/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-extrabold text-xs text-[#3D2619]">{prod.title}</h4>
                          <span className="text-[11px] text-[#E05338] font-bold">{prod.lenderName}</span>
                        </div>
                        <span className="text-xs font-black text-emerald-700 tabular-nums">
                          {formatVND(prod.principal)}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#78513E] mt-1">{prod.description}</p>

                      <div className="mt-2 text-[10px] text-[#5C3A21] space-y-0.5 bg-[#FFF9F2] p-2 rounded-xl border border-[#F2DECC]">
                        <div>Lãi suất: <span className="font-bold text-[#3D2619]">{Math.round(prod.interestRate * 100)}%</span> / kỳ hạn</div>
                        <div>Thời hạn: <span className="font-bold text-[#3D2619]">{prod.durationDays} ngày</span> (trả {formatVND(prod.dailyPayment)}/ngày)</div>
                        <div>Yêu cầu tín dụng: <span className="font-bold text-sky-800">{prod.requiredCreditScore} điểm</span></div>
                      </div>

                      {prod.riskNotice && (
                        <div className="mt-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-[10px] text-rose-800 flex items-center gap-1 font-bold">
                          <AlertTriangle size={12} className="shrink-0 text-rose-600" />
                          <span>{prod.riskNotice}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#F0D5C3]/60 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        {hasEnoughScore ? (
                          <span className="text-emerald-700 flex items-center gap-0.5">
                            <CheckCircle size={12} /> Đủ điều kiện
                          </span>
                        ) : (
                          <span className="text-rose-600">Điểm chưa đủ</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleTakeLoan(prod)}
                        disabled={!hasEnoughScore}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          hasEnoughScore
                            ? 'bg-[#F26440] hover:bg-[#E05338] text-white shadow-xs active:scale-95'
                            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        }`}
                      >
                        Vay Ngay ({formatVND(prod.principal)})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
