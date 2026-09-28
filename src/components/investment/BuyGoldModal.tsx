import React, { useState } from 'react';
import { useInvestmentStore } from '../../stores/investmentStore';
import { useEconomyStore } from '../../stores/economyStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { GOLD_TRANSACTION_FEE } from '../../systems/investment/GoldMarket';
import { X, Coins, ShoppingCart, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export const BuyGoldModal: React.FC = () => {
  const isBuyGoldModalOpen = useInvestmentStore((state) => state.isBuyGoldModalOpen);
  const closeBuyGoldModal = useInvestmentStore((state) => state.closeBuyGoldModal);
  const goldMarket = useInvestmentStore((state) => state.goldMarket);
  const buyGold = useInvestmentStore((state) => state.buyGold);
  const cash = useEconomyStore((state) => state.cash);

  const [quantity, setQuantity] = useState<number>(1.0);

  if (!isBuyGoldModalOpen) return null;

  const currentPrice = goldMarket.currentPrice;
  const rawCost = Math.round(quantity * currentPrice);
  const fee = Math.round(rawCost * GOLD_TRANSACTION_FEE);
  const totalCost = rawCost + fee;
  const maxAffordable = Math.max(0, Math.floor((cash / (currentPrice * (1 + GOLD_TRANSACTION_FEE))) * 10) / 10);
  const isAffordable = cash >= totalCost && quantity > 0;

  const handleQuickAdd = (amount: number) => {
    audioService.playClick();
    const next = Math.max(0.1, Math.round((quantity + amount) * 10) / 10);
    setQuantity(next);
  };

  const handleSetMax = () => {
    audioService.playClick();
    if (maxAffordable > 0) {
      setQuantity(maxAffordable);
    }
  };

  const handleConfirmBuy = () => {
    if (!isAffordable) return;
    buyGold(quantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-[#FAF4ED] border-3 border-[#3D2619] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-[#3D2619]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-[#4A2411] to-amber-900 text-[#FAF4ED] px-4 py-3 flex items-center justify-between border-b-2 border-amber-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-[#3D2619] flex items-center justify-center font-black shadow-xs">
              <Coins size={18} />
            </div>
            <div>
              <h3 className="font-['Comfortaa',sans-serif] font-black text-sm text-amber-100 leading-tight">
                Mua Vàng 9999
              </h3>
              <p className="text-[10px] text-amber-200/80">Đầu tư kim loại quý bảo toàn giá trị</p>
            </div>
          </div>
          <button
            onClick={() => {
              audioService.playClick();
              closeBuyGoldModal();
            }}
            className="p-1 rounded-full text-amber-200 hover:text-white bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3 overflow-y-auto no-scrollbar text-xs">
          
          {/* Price & Cash Status Card */}
          <div className="grid grid-cols-2 gap-2 bg-amber-50 border border-amber-200 rounded-2xl p-3 shadow-2xs">
            <div>
              <span className="text-[10px] text-[#8C624D] font-bold block uppercase">Giá vàng hiện tại</span>
              <span className="text-sm font-black text-amber-900 tabular-nums">
                {formatVND(currentPrice)}<span className="text-[10px] font-normal text-stone-600">/lượng</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#8C624D] font-bold block uppercase">Tiền mặt khả dụng</span>
              <span className="text-sm font-black text-emerald-700 tabular-nums">
                {formatVND(cash)}
              </span>
            </div>
          </div>

          {/* Quantity Selection Area */}
          <div className="bg-white border border-[#EEDCC8] rounded-2xl p-3 space-y-2.5 shadow-2xs">
            <label className="text-[11px] font-black text-[#3D2619] block">
              Số lượng muốn mua (Lượng):
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
                  max="100"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setQuantity(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="w-full py-1.5 px-3 bg-stone-50 border-2 border-stone-300 focus:border-[#E05338] rounded-xl text-center font-black text-sm text-[#3D2619] outline-none tabular-nums shadow-inner"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-bold pointer-events-none">
                  lượng
                </span>
              </div>

              <button
                onClick={() => handleQuickAdd(0.5)}
                className="w-9 h-9 bg-stone-100 hover:bg-stone-200 rounded-xl font-black text-sm flex items-center justify-center border border-stone-300 cursor-pointer active:scale-95"
              >
                +
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              {[0.1, 0.5, 1.0, 2.0, 5.0].map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    audioService.playClick();
                    setQuantity(val);
                  }}
                  className={`flex-1 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
                    quantity === val
                      ? 'bg-amber-100 text-amber-900 border-amber-400 font-black shadow-2xs'
                      : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  {val}L
                </button>
              ))}
              <button
                onClick={handleSetMax}
                disabled={maxAffordable <= 0}
                className="flex-1 py-1 text-[10px] font-black rounded-lg bg-[#E05338] hover:bg-[#D2442A] disabled:opacity-40 text-white shadow-2xs transition-all cursor-pointer"
              >
                Tối đa
              </button>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white border border-[#EEDCC8] rounded-2xl p-3 space-y-1.5 shadow-2xs text-[11px]">
            <div className="flex justify-between items-center text-stone-600">
              <span>Giá trị vàng ({quantity} lượng):</span>
              <span className="font-bold tabular-nums text-stone-900">{formatVND(rawCost)}</span>
            </div>
            <div className="flex justify-between items-center text-stone-600">
              <span>Phí sàn giao dịch (1%):</span>
              <span className="font-bold tabular-nums text-stone-900">{formatVND(fee)}</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-stone-100 font-black text-xs text-[#3D2619]">
              <span>Tổng thanh toán:</span>
              <span className="text-sm font-black text-[#E05338] tabular-nums">{formatVND(totalCost)}</span>
            </div>
          </div>

          {!isAffordable && quantity > 0 && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[10.5px] text-rose-800 flex items-center gap-1.5 font-bold animate-in fade-in duration-100">
              <AlertTriangle size={14} className="shrink-0 text-rose-600" />
              <span>Số tiền hiện có không đủ để mua {quantity} lượng vàng! (Thiếu {formatVND(totalCost - cash)})</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#EEDCC8] border-t-2 border-[#D8C2AC] flex items-center gap-2">
          <button
            onClick={() => {
              audioService.playClick();
              closeBuyGoldModal();
            }}
            className="w-1/3 py-2.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirmBuy}
            disabled={!isAffordable}
            className={`w-2/3 py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 ${
              isAffordable
                ? 'bg-[#F26440] hover:bg-[#E05338] text-white cursor-pointer active:scale-95'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={14} />
            <span>Xác Nhận Mua Vàng</span>
          </button>
        </div>

      </div>
    </div>
  );
};
