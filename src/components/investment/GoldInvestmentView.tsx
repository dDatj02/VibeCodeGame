import React from 'react';
import { useInvestmentStore } from '../../stores/investmentStore';
import { useEconomyStore } from '../../stores/economyStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  History, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const GoldInvestmentView: React.FC = () => {
  const goldHolding = useInvestmentStore((state) => state.goldHolding);
  const goldMarket = useInvestmentStore((state) => state.goldMarket);
  const openBuyGoldModal = useInvestmentStore((state) => state.openBuyGoldModal);
  const openSellGoldModal = useInvestmentStore((state) => state.openSellGoldModal);
  const getGoldCurrentValue = useInvestmentStore((state) => state.getGoldCurrentValue);
  const getGoldUnrealizedProfit = useInvestmentStore((state) => state.getGoldUnrealizedProfit);
  const cash = useEconomyStore((state) => state.cash);

  const currentValue = getGoldCurrentValue();
  const unrealizedProfit = getGoldUnrealizedProfit();
  const isUpToday = goldMarket.todayChangePercent >= 0;
  const unrealizedPercent = goldHolding.totalInvested > 0 
    ? Math.round(((currentValue - goldHolding.totalInvested) / goldHolding.totalInvested) * 1000) / 10
    : 0;

  return (
    <div className="space-y-2.5 select-none text-[#3D2619] animate-in fade-in duration-150">
      
      {/* 1. CURRENT MARKET PRICE & TREND CARD */}
      <div className="bg-gradient-to-r from-amber-500 via-[#E05338] to-amber-600 text-white p-3.5 rounded-2xl shadow-md border-2 border-amber-300 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-['Comfortaa',sans-serif]">
            <span className="text-xl">🪙</span>
            <span className="font-black text-xs uppercase tracking-wider text-amber-100">
              SÀN VÀNG 9999 (IN-GAME GOLD)
            </span>
          </div>
          <span className="text-[10px] font-bold bg-black/25 px-2 py-0.5 rounded-full border border-white/20">
            Biến động mỗi ngày
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-[10px] text-amber-100/80 font-bold block uppercase">
              Giá Vàng Hôm Nay
            </span>
            <span className="text-xl sm:text-2xl font-black text-white tabular-nums tracking-tight">
              {formatVND(goldMarket.currentPrice)}
              <span className="text-xs font-bold text-amber-200 ml-1">/lượng</span>
            </span>
          </div>

          <div className="text-right">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black shadow-xs ${
              isUpToday ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-400/40' : 'bg-rose-950/80 text-rose-300 border border-rose-400/40'
            }`}>
              {isUpToday ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span>{isUpToday ? '+' : ''}{goldMarket.todayChangePercent}%</span>
            </span>
            <span className="text-[9.5px] text-amber-100/80 font-medium block mt-0.5">
              Hôm qua: {formatVND(goldMarket.yesterdayPrice)}
            </span>
          </div>
        </div>

        {/* Active Market Event Notice */}
        {goldMarket.activeMarketEvent && (
          <div className="bg-black/30 border border-white/25 rounded-xl p-2 flex items-center gap-2 text-[10.5px]">
            <span className="text-base shrink-0">{goldMarket.activeMarketEvent.icon}</span>
            <div className="min-w-0">
              <strong className="text-amber-200 block truncate">{goldMarket.activeMarketEvent.title}</strong>
              <p className="text-white/90 leading-tight text-[10px] truncate">{goldMarket.activeMarketEvent.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. PLAYER'S GOLD HOLDINGS CARD */}
      <div className="bg-white border-2 border-amber-300 rounded-2xl p-3 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
          <span className="font-black text-xs text-[#3D2619] flex items-center gap-1.5">
            <Coins size={15} className="text-[#E05338]" />
            <span>Tài Khoản Vàng Của Bạn</span>
          </span>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            {goldHolding.quantity > 0 ? 'Đang Nắm Giữ' : 'Chưa Có Vàng'}
          </span>
        </div>

        {/* Holdings Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-200/70">
            <span className="text-[9.5px] font-bold text-stone-500 block uppercase">Số lượng vàng</span>
            <strong className="text-sm font-black text-amber-950 tabular-nums">
              {goldHolding.quantity} <span className="text-[10px] font-bold text-stone-600">lượng</span>
            </strong>
          </div>

          <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-200/70">
            <span className="text-[9.5px] font-bold text-stone-500 block uppercase">Giá trị hiện tại</span>
            <strong className="text-sm font-black text-amber-950 tabular-nums">
              {formatVND(currentValue)}
            </strong>
          </div>

          <div className="bg-stone-50 p-2 rounded-xl border border-stone-200/70">
            <span className="text-[9.5px] font-bold text-stone-500 block uppercase">Giá vốn trung bình</span>
            <strong className="text-xs font-bold text-stone-800 tabular-nums">
              {goldHolding.quantity > 0 ? formatVND(goldHolding.averagePurchasePrice) : '0đ'}
            </strong>
          </div>

          <div className={`p-2 rounded-xl border ${
            unrealizedProfit >= 0 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}>
            <span className="text-[9.5px] font-bold text-stone-500 block uppercase">Lãi/Lỗ tạm tính</span>
            <strong className="text-xs font-black tabular-nums">
              {goldHolding.quantity > 0 ? (
                <>
                  {unrealizedProfit >= 0 ? '+' : ''}{formatVND(unrealizedProfit)} ({unrealizedPercent >= 0 ? '+' : ''}{unrealizedPercent}%)
                </>
              ) : (
                '0đ'
              )}
            </strong>
          </div>
        </div>

        {/* Realized Profit Badge */}
        {goldHolding.realizedProfit !== 0 && (
          <div className="flex items-center justify-between text-[10.5px] pt-1 border-t border-stone-100">
            <span className="text-stone-500 font-bold">Tổng lãi đã chốt từ vàng:</span>
            <span className={`font-black tabular-nums ${goldHolding.realizedProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {goldHolding.realizedProfit >= 0 ? '+' : ''}{formatVND(goldHolding.realizedProfit)}
            </span>
          </div>
        )}

        {/* Action Buttons: Buy & Sell */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => {
              audioService.playClick();
              openBuyGoldModal();
            }}
            className="py-2.5 px-3 bg-gradient-to-r from-[#F26440] to-[#E05338] hover:from-[#E05338] hover:to-[#D2442A] text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ShoppingCart size={14} />
            <span>Mua Vàng</span>
          </button>

          <button
            onClick={() => {
              audioService.playClick();
              openSellGoldModal();
            }}
            disabled={goldHolding.quantity <= 0}
            className={`py-2.5 px-3 rounded-xl font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 ${
              goldHolding.quantity > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <DollarSign size={14} />
            <span>Bán Vàng</span>
          </button>
        </div>
      </div>

      {/* 3. PRICE HISTORY TIMELINE */}
      <div className="bg-white border border-[#EEDCC8] rounded-2xl p-3 shadow-xs space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-stone-100">
          <span className="font-black text-[11px] text-[#8C624D] uppercase tracking-wider flex items-center gap-1">
            <History size={12} className="text-[#E05338]" />
            <span>Lịch Sử Giá Vàng Gần Đây</span>
          </span>
          <span className="text-[9.5px] text-stone-500 font-bold">7 - 14 phiên gần nhất</span>
        </div>

        <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar">
          {goldMarket.priceHistory.map((item, idx) => (
            <div 
              key={`${item.day}_${idx}`}
              className="flex items-center justify-between p-1.5 bg-stone-50/70 hover:bg-amber-50/50 rounded-xl text-[10.5px] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-500 text-[10px] w-12">
                  Ngày {item.day}
                </span>
                <span className="font-black text-stone-900 tabular-nums">
                  {formatVND(item.price)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.reason && (
                  <span className="text-[9px] text-stone-500 hidden sm:inline max-w-[120px] truncate">
                    {item.reason}
                  </span>
                )}
                <span className={`font-black text-[10px] tabular-nums px-1.5 py-0.2 rounded-md ${
                  item.changePercent >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                }`}>
                  {item.changePercent >= 0 ? '+' : ''}{item.changePercent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. CASUAL STRATEGY TIP */}
      <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-2 text-[10.5px] text-amber-900">
        <Sparkles size={15} className="shrink-0 text-[#E05338] mt-0.5" />
        <div className="space-y-0.5">
          <strong className="font-black block">Kinh nghiệm đầu tư vàng:</strong>
          <p className="text-stone-600 leading-relaxed text-[10px]">
            Vàng có tính thanh khoản tức thì (bán nhận tiền ngay không cần tìm khách thuê). Mua tích lũy khi giá giảm và chốt lời khi xảy ra các sự kiện thị trường biến động để tối ưu dòng vốn!
          </p>
        </div>
      </div>

    </div>
  );
};
