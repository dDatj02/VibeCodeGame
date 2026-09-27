import React, { useState } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useGameStore } from '../../stores/gameStore';
import { SUPPLIERS, Supplier } from '../../data/suppliers';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { 
  Plus, 
  ShoppingCart, 
  ShieldCheck, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2,
  Info,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const InventoryTab: React.FC = () => {
  const ingredients = useInventoryStore((state) => state.ingredients);
  const buyIngredient = useInventoryStore((state) => state.buyIngredient);
  const clearSpoiledIngredients = useInventoryStore((state) => state.clearSpoiledIngredients);
  const cash = useEconomyStore((state) => state.cash);
  const deductCash = useEconomyStore((state) => state.deductCash);
  const showNotification = useGameStore((state) => state.showNotification);
  const setActiveTab = useGameStore((state) => state.setActiveTab);

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier>(SUPPLIERS[1]); // Minh Tam default
  const [lastBuyReport, setLastBuyReport] = useState<{
    supplierName: string;
    ingredientName: string;
    bought: number;
    good: number;
    defective: number;
  } | null>(null);

  const handleBuy = (ingredientId: string, quantity: number) => {
    const item = ingredients.find((i) => i.id === ingredientId);
    if (!item) return;

    const unitPrice = Math.round(item.basePrice * selectedSupplier.priceModifier);
    const totalCost = unitPrice * quantity;

    if (cash < totalCost) {
      audioService.playDisappointed();
      showNotification('Không đủ tiền mặt để nhập thêm nguyên liệu!', 'error');
      return;
    }

    deductCash(totalCost);
    const buyResult = buyIngredient(ingredientId, quantity, selectedSupplier);

    if (buyResult.defectiveQuantity > 0) {
      audioService.playDisappointed();
      setLastBuyReport({
        supplierName: selectedSupplier.name,
        ingredientName: item.name,
        bought: quantity,
        good: buyResult.goodQuantity,
        defective: buyResult.defectiveQuantity,
      });
      showNotification(buyResult.message, 'warning');
    } else {
      audioService.playCashRegister();
      setLastBuyReport({
        supplierName: selectedSupplier.name,
        ingredientName: item.name,
        bought: quantity,
        good: buyResult.goodQuantity,
        defective: 0,
      });
      showNotification(`Đã nhập +${buyResult.goodQuantity} ${item.unit} ${item.name} tươi 100%!`, 'success');
    }
  };

  const handleClearSpoiled = (ingId?: string) => {
    const res = clearSpoiledIngredients(ingId);
    if (res.clearedCount > 0) {
      audioService.playCashRegister();
      showNotification(`Đã lọc bỏ ${res.clearedCount} phần trái cây bị hỏng/úng!`, 'success');
    } else {
      showNotification(`Không có nguyên liệu nào bị hỏng trong kho.`, 'info');
    }
  };

  return (
    <div className="flex-1 h-full max-h-full flex flex-col bg-[#FBF7F0] text-[#3D2619] p-2 max-w-lg mx-auto w-full select-none overflow-hidden">
      {/* 1. Header & Back Button */}
      <div className="shrink-0 mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('shop')}
              className="p-1 hover:bg-[#F0D5C3]/40 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} className="text-[#E05338]" />
            </button>
            <h2 className="text-sm sm:text-base font-black text-[#3D2619] font-['Comfortaa',sans-serif]">
              Kho Hàng & Nguồn Trái Cây
            </h2>
          </div>
          <div className="text-[11px] text-[#78513E]">
            Tiền mặt: <span className="font-extrabold text-emerald-700 tabular-nums">{formatVND(cash)}</span>
          </div>
        </div>

        {/* Supplier Selector Cards with Defect Rate Risk Badges */}
        <div className="grid grid-cols-3 gap-1.5">
          {SUPPLIERS.map((sup) => {
            const isSelected = selectedSupplier.id === sup.id;
            return (
              <button
                key={sup.id}
                onClick={() => {
                  audioService.playClick();
                  setSelectedSupplier(sup);
                }}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer select-none relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#FFF4E8] border-[#E05338] text-[#3D2619] shadow-sm ring-2 ring-[#E05338]/30 scale-[1.01]'
                    : 'bg-white border-[#F0D5C3] text-[#78513E] hover:border-[#E05338]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between leading-tight mb-1">
                    <span className="font-black text-[10.5px] text-[#3D2619] truncate">{sup.shortName}</span>
                    <span className="text-[8.5px] px-1 py-0.2 rounded font-black bg-amber-100 text-amber-900 shrink-0">
                      {sup.priceModifier < 1
                        ? `-${Math.round((1 - sup.priceModifier) * 100)}%`
                        : sup.priceModifier > 1
                        ? `+${Math.round((sup.priceModifier - 1) * 100)}%`
                        : 'Chuẩn'}
                    </span>
                  </div>

                  {/* Defect Risk Indicator */}
                  <div className={`text-[8.5px] font-black px-1.5 py-0.5 rounded border inline-block max-w-full truncate ${sup.riskColor}`}>
                    {sup.riskBadge}
                  </div>
                </div>

                <div className="text-[8.5px] text-[#9E735B] font-bold mt-1.5 flex items-center justify-between border-t border-[#F0D5C3]/60 pt-1">
                  <span>Hạn dùng:</span>
                  <span className="font-extrabold text-[#3D2619]">
                    {sup.shelfLifeBonus > 0 ? `+${sup.shelfLifeBonus} ngày` : sup.shelfLifeBonus < 0 ? `${sup.shelfLifeBonus} ngày` : 'Chuẩn'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Supplier Info Banner */}
        <div className="mt-1.5 p-2 bg-amber-50/90 border border-amber-200 rounded-xl text-[10.5px] text-[#5C3A21] flex items-start gap-1.5 shadow-2xs">
          <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-black text-[#3D2619]">{selectedSupplier.name}: </span>
            <span>{selectedSupplier.description}</span>
          </div>
        </div>

        {/* Last Inspection Result Notice (If fruit was bought) */}
        {lastBuyReport && (
          <div className="mt-1.5 p-2 bg-white border border-[#E05338]/40 rounded-xl shadow-xs text-xs flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{lastBuyReport.defective > 0 ? '⚠️' : '✅'}</span>
              <div className="min-w-0">
                <div className="font-bold text-[#3D2619] truncate">
                  Kiểm hàng mua từ {lastBuyReport.supplierName}:
                </div>
                <div className="text-[10.5px] text-[#78513E]">
                  Thực nhận <strong className="text-emerald-700">{lastBuyReport.good} phần tươi</strong>
                  {lastBuyReport.defective > 0 && (
                    <span className="text-[#E05338] font-bold"> · {lastBuyReport.defective} phần dập hỏng (bỏ rác)</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setLastBuyReport(null)}
              className="text-[10px] text-[#9E735B] hover:text-[#3D2619] font-bold underline shrink-0 pl-2 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}
      </div>

      {/* 2. Ingredients Inventory Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2 pb-2">
        {ingredients.map((ing) => {
          const unitPrice = Math.round(ing.basePrice * selectedSupplier.priceModifier);
          const isLowStock = ing.currentStock <= 5;
          const isFruit = ing.category === 'fruit';
          const isSpoilingSoon = ing.freshness < 40 && isFruit;
          const isCriticalSpoiled = ing.freshness < 25 && isFruit;

          const freshnessColor =
            ing.freshness > 70
              ? 'bg-emerald-500'
              : ing.freshness > 40
              ? 'bg-amber-500'
              : 'bg-[#E05338]';

          return (
            <div
              key={ing.id}
              className={`p-3 bg-white border rounded-2xl flex flex-col justify-between shadow-xs transition-colors ${
                isCriticalSpoiled
                  ? 'border-red-400 bg-red-50/30'
                  : isSpoilingSoon
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-[#F0D5C3] hover:border-[#E05338]/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF9F2] border border-[#F2DECC] flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {ing.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs text-[#3D2619] truncate flex items-center gap-1">
                        <span>{ing.name}</span>
                        {isCriticalSpoiled && (
                          <span className="text-[9px] bg-red-100 text-red-800 font-extrabold px-1.5 py-0.2 rounded-full border border-red-300">
                            Sắp ủng!
                          </span>
                        )}
                      </h3>
                      <span className="text-[11px] text-[#9E735B]">
                        {formatVND(unitPrice)} / {ing.unit}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs font-black tabular-nums ${
                        isLowStock ? 'text-[#E05338] animate-pulse' : 'text-[#3D2619]'
                      }`}
                    >
                      Tồn: {ing.currentStock} {ing.unit}
                    </div>
                    {isLowStock && (
                      <span className="text-[10px] text-[#E05338] font-bold block">Sắp hết!</span>
                    )}
                  </div>
                </div>

                {/* Freshness Bar & Expiration Shelf Life */}
                {ing.shelfLifeDays < 365 && (
                  <div className="mt-2 text-[10px] text-[#9E735B] bg-[#FFF9F2] p-1.5 rounded-xl border border-[#F2DECC]/80">
                    <div className="flex justify-between items-center mb-1 font-bold">
                      <span className="flex items-center gap-1">
                        <span>{isFruit ? '🍋 Độ tươi trái cây:' : '🥛 Hạn dùng sữa/đá:'}</span>
                        <span className="text-stone-700">({ing.shelfLifeDays} ngày)</span>
                      </span>
                      <span className={`tabular-nums font-black ${ing.freshness < 40 ? 'text-[#E05338]' : 'text-emerald-700'}`}>
                        {ing.freshness}% tươi
                      </span>
                    </div>

                    <div className="w-full bg-[#EEDCC8] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${freshnessColor}`}
                        style={{ width: `${ing.freshness}%` }}
                      />
                    </div>

                    {isSpoilingSoon && (
                      <div className="mt-1 flex items-center justify-between text-[9.5px] font-extrabold text-amber-900">
                        <span className="flex items-center gap-1">
                          <AlertTriangle size={11} className="text-amber-600" />
                          <span>Nguy cơ ủng hỏng khi qua ngày mới!</span>
                        </span>
                        <button
                          onClick={() => handleClearSpoiled(ing.id)}
                          className="text-[9px] bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded font-black shadow-2xs active:scale-95 cursor-pointer flex items-center gap-0.5"
                        >
                          <Trash2 size={9} />
                          <span>Lọc rác</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Purchase Action Buttons */}
              <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[#F0D5C3]/60">
                <span className="text-[11px] text-[#78513E] mr-auto flex items-center gap-1 font-bold">
                  <ShoppingCart size={12} className="text-[#E05338]" />
                  <span>Mua:</span>
                </span>

                <button
                  onClick={() => handleBuy(ing.id, 1)}
                  className="px-2.5 py-1 text-xs font-bold bg-[#FFF9F2] hover:bg-amber-400 hover:text-white text-[#3D2619] rounded-xl border border-[#F0D5C3] transition-colors flex items-center gap-0.5 cursor-pointer active:scale-95"
                >
                  <Plus size={11} />
                  <span>1 ({formatVND(unitPrice)})</span>
                </button>

                <button
                  onClick={() => handleBuy(ing.id, 5)}
                  className="px-2.5 py-1 text-xs font-bold bg-[#FFF9F2] hover:bg-amber-400 hover:text-white text-[#3D2619] rounded-xl border border-[#F0D5C3] transition-colors flex items-center gap-0.5 cursor-pointer active:scale-95"
                >
                  <Plus size={11} />
                  <span>5 ({formatVND(unitPrice * 5)})</span>
                </button>

                <button
                  onClick={() => handleBuy(ing.id, 10)}
                  className="px-2.5 py-1 text-xs font-bold bg-[#F26440] hover:bg-[#E05338] text-white rounded-xl shadow-xs transition-colors flex items-center gap-0.5 cursor-pointer active:scale-95"
                >
                  <Plus size={11} />
                  <span>10 ({formatVND(unitPrice * 10)})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
