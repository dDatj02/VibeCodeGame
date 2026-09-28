import React, { useState } from 'react';
import { useInvestmentStore } from '../../stores/investmentStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { GOLD_TRANSACTION_FEE } from '../../systems/investment/GoldMarket';
import { X, Coins, DollarSign, AlertTriangle, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';

export const SellGoldModal: React.FC = () => {
  const isSellGoldModalOpen = useInvestmentStore((state) => state.isSellGoldModalOpen);
  const closeSellGoldModal = useInvestmentStore((state) => state.closeSellGoldModal);
  const goldHolding = useInvestmentStore((state) => state.goldHolding);
  const goldMarket = useInvestmentStore((state) => state.goldMarket);
  const sellGold = useInvestmentStore((state) => state.sellGold);

  const [quantity, setQuantity] = useState<number>(Math.min(1.0, goldHolding.quantity || 0.1));

  if (!isSellGoldModalOpen) return null;

  const currentPrice = goldMarket.currentPrice;
  const ownedQty = goldHolding.quantity;
  const avgPrice = goldHolding.averagePurchasePrice;

  const actualQty = Math.min(quantity, ownedQty);
  const rawRevenue = Math.round(actualQty * currentPrice);
  const fee = Math.round(rawRevenue * GOLD_TRANSACTION_FEE);
  const netRevenue = rawRevenue - fee;

  const costBasis = Math.round(actualQty * avgPrice);
  const estimatedProfit = netRevenue - costBasis;
  const isValid = quantity > 0 && quantity <= ownedQty + 0.0001 && ownedQty > 0;

  const handleQuickAdd = (amount: number) => {
    audioService.playClick();
    const next = Math.max(0.1, Math.min(ownedQty, Math.round((quantity + amount) * 10) / 10));
    setQuantity(next);
  };

  const handleSetMax = () => {
    audioService.playClick();
    setQuantity(ownedQty);
  };

  const handleConfirmSell = () => {
    if (!isValid) return;
    sellGold(quantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-[#FAF4ED] border-3 border-[#3D2619] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-[#3D2619]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#1A3D2E] to-emerald-900 text-[#FAF4ED] px-4 py-3 flex items-center justify-between border-b-2 border-emerald-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-400 text-emerald-950 flex items-center justify-center font-black shadow-xs">
              <DollarSign size={18} />
            </div>
            <div>
              <h3 className="font-['Comfortaa',sans-serif] font-black text-sm text-emerald-100 leading-tight">
                Bán Vàng Chốt Lời
              </h3>
              <p className="text-[10px] text-emerald-200/80">Quy đổi vàng sang tiền mặt tức thì</p>
            </div>
          </div>
          <button
            onClick={() => {
              audioService.playClick();
              closeSellGoldModal();
            }}
            className="p-1 rounded-full text-emerald-200 hover:text-white bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3 overflow-y-auto no-scrollbar text-xs">
          
          {/* Status Overview */}
          <div className="grid grid-cols-2 gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 shadow-2xs">
            <div>
              <span className="text-[10px] text-emerald-800 font-bold block uppercase">Vàng đang sở hữu</span>
              <span className="text-sm font-black text-emerald-950 tabular-nums">
                {ownedQty} lượng
              </span>
              <span className="text-[9.5px] text-stone-500 block">
                Giá vốn: {formatVND(avgPrice)}/L
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-800 font-bold block uppercase">Giá thị trường</span>
              <span className="text-sm font-black text-amber-800 tabular-nums">
                {formatVND(currentPrice)}/L
              </span>
            </div>
          </div>

          {/* Amount to Sell */}
          <div className="bg-white border border-[#EEDCC8] rounded-2xl p-3 space-y-2.5 shadow-2xs">
            <label className="text-[11px] font-black text-[#3D2619] block">
              Số lượng vàng muốn bán:
            </label>

            {/* Numeric Input & Steppers */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuickAdd(-0.5)}
                disabled={quantity <= 0.1}
                className="w-9 h-9 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 rounded-xl font-black text-sm flex items-center justify-center border border-stone-300 cursor-pointer active:scale-95"
              >
                -
              </button>

              <div className="flex-1 relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={ownedQty}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setQuantity(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="w-full py-1.5 px-3 bg-stone-50 border-2 border-stone-300 focus:border-emerald-600 rounded-xl text-center font-black text-sm text-[#3D2619] outline-none tabular-nums shadow-inner"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-bold pointer-events-none">
                  lượng
                </span>
              </div>

              <button
                onClick={() => handleQuickAdd(0.5)}
                disabled={quantity >= ownedQty}
                className="w-9 h-9 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 rounded-xl font-black text-sm flex items-center justify-center border border-stone-300 cursor-pointer active:scale-95"
              >
                +
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              {[0.5, 1.0, 2.0, 5.0].filter(v => v <= ownedQty).map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    audioService.playClick();
                    setQuantity(val);
                  }}
                  className={`flex-1 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
                    quantity === val
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-black shadow-2xs'
                      : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  {val}L
                </button>
              ))}
              <button
                onClick={handleSetMax}
                className="flex-1 py-1 text-[10px] font-black rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer"
              >
                Bán Hết ({ownedQty}L)
              </button>
            </div>
          </div>

          {/* Revenue and Profit Breakdown */}
          <div className="bg-white border border-[#EEDCC8] rounded-2xl p-3 space-y-1.5 shadow-2xs text-[11px]">
            <div className="flex justify-between items-center text-stone-600">
              <span>Doanh thu ({actualQty} lượng):</span>
              <span className="font-bold tabular-nums text-stone-900">{formatVND(rawRevenue)}</span>
            </div>
            <div className="flex justify-between items-center text-stone-600">
              <span>Phí giao dịch sàn (1%):</span>
              <span className="font-bold tabular-nums text-stone-900">-{formatVND(fee)}</span>
            </div>
            <div className="flex justify-between items-center text-stone-700 pt-1 border-t border-stone-100">
              <span>Tiền thực nhận vào ví:</span>
              <span className="font-black tabular-nums text-emerald-700 text-xs">{formatVND(netRevenue)}</span>
            </div>
            
            {/* Realized Profit Box */}
            <div className={`p-2 rounded-xl flex items-center justify-between font-black text-xs ${
              estimatedProfit >= 0 ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}>
              <span className="flex items-center gap-1">
                {estimatedProfit >= 0 ? <TrendingUp size={14} className="text-emerald-600" /> : <TrendingDown size={14} className="text-rose-600" />}
                <span>{estimatedProfit >= 0 ? 'Lãi thực tế chốt được:' : 'Lỗ thực tế:'}</span>
              </span>
              <span className="tabular-nums font-black text-sm">
                {estimatedProfit >= 0 ? '+' : ''}{formatVND(estimatedProfit)}
              </span>
            </div>
          </div>

          {!isValid && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[10.5px] text-rose-800 flex items-center gap-1.5 font-bold animate-in fade-in duration-100">
              <AlertTriangle size={14} className="shrink-0 text-rose-600" />
              <span>Số lượng bán không hợp lệ hoặc bạn không đủ vàng!</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#EEDCC8] border-t-2 border-[#D8C2AC] flex items-center gap-2">
          <button
            onClick={() => {
              audioService.playClick();
              closeSellGoldModal();
            }}
            className="w-1/3 py-2.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirmSell}
            disabled={!isValid}
            className={`w-2/3 py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 ${
              isValid
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Xác Nhận Bán Vàng</span>
          </button>
        </div>

      </div>
    </div>
  );
};
