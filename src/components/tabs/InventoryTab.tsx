import React, { useState } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useGameStore } from '../../stores/gameStore';
import { SUPPLIERS, Supplier } from '../../data/suppliers';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { Plus, ShoppingCart, ShieldCheck, ArrowLeft } from 'lucide-react';

export const InventoryTab: React.FC = () => {
  const ingredients = useInventoryStore((state) => state.ingredients);
  const buyIngredient = useInventoryStore((state) => state.buyIngredient);
  const cash = useEconomyStore((state) => state.cash);
  const deductCash = useEconomyStore((state) => state.deductCash);
  const showNotification = useGameStore((state) => state.showNotification);
  const setActiveTab = useGameStore((state) => state.setActiveTab);

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier>(SUPPLIERS[1]); // Minh Tam default

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
    buyIngredient(ingredientId, quantity, selectedSupplier);
    audioService.playCashRegister();
    showNotification(`Đã nhập +${quantity} ${item.unit} ${item.name} từ ${selectedSupplier.name}`, 'success');
  };

  return (
    <div className="flex-1 h-full max-h-full flex flex-col bg-[#FBF7F0] text-[#3D2619] p-2 max-w-lg mx-auto w-full select-none overflow-hidden">
      {/* 1. Header & Supplier Selector (Fixed) */}
      <div className="shrink-0 mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('shop')}
              className="p-1 hover:bg-[#F0D5C3]/40 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} className="text-[#E05338]" />
            </button>
            <h2 className="text-sm sm:text-base font-extrabold text-[#3D2619] font-['Comfortaa',sans-serif]">
              Kho Hàng & Nhà Cung Cấp
            </h2>
          </div>
          <div className="text-[11px] text-[#78513E]">
            Tiền: <span className="font-extrabold text-emerald-700 tabular-nums">{formatVND(cash)}</span>
          </div>
        </div>

        {/* Suppliers Selector Tabs (Compact 3-col) */}
        <div className="grid grid-cols-3 gap-1">
          {SUPPLIERS.map((sup) => {
            const isSelected = selectedSupplier.id === sup.id;
            return (
              <button
                key={sup.id}
                onClick={() => {
                  audioService.playClick();
                  setSelectedSupplier(sup);
                }}
                className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#FFF4E8] border-[#E05338] text-[#3D2619] shadow-2xs ring-1 ring-[#E05338]/30'
                    : 'bg-white border-[#F0D5C3] text-[#78513E] hover:border-[#E05338]/40'
                }`}
              >
                <div className="flex items-center justify-between leading-none">
                  <span className="font-bold text-[10px] text-[#E05338] truncate">{sup.name.split(' ')[0]}</span>
                  <span className="text-[8px] px-1 rounded bg-amber-100 text-amber-900 font-bold">
                    {sup.priceModifier < 1
                      ? `-${Math.round((1 - sup.priceModifier) * 100)}%`
                      : sup.priceModifier > 1
                      ? `+${Math.round((sup.priceModifier - 1) * 100)}%`
                      : 'Chuẩn'}
                  </span>
                </div>
                <div className="text-[8px] text-emerald-700 font-semibold mt-1 truncate">
                  Tươi: {sup.freshnessGuarantee}%
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Ingredients Inventory Grid (Internal Scrollable Only) */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-1.5 pb-2">
        {ingredients.map((ing) => {
          const unitPrice = Math.round(ing.basePrice * selectedSupplier.priceModifier);
          const isLowStock = ing.currentStock <= 5;
          const freshnessColor =
            ing.freshness > 70
              ? 'bg-emerald-500'
              : ing.freshness > 40
              ? 'bg-amber-500'
              : 'bg-[#E05338]';

          return (
            <div
              key={ing.id}
              className="p-3 bg-white border border-[#F0D5C3] rounded-2xl flex flex-col justify-between shadow-xs hover:border-[#E05338]/40 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF9F2] border border-[#F2DECC] flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {ing.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-[#3D2619]">{ing.name}</h3>
                      <span className="text-[11px] text-[#9E735B]">
                        {formatVND(unitPrice)} / {ing.unit}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs font-black tabular-nums ${
                        isLowStock ? 'text-[#E05338] animate-pulse' : 'text-[#3D2619]'
                      }`}
                    >
                      Tồn: {ing.currentStock} {ing.unit}
                    </div>
                    {isLowStock && (
                      <span className="text-[10px] text-[#E05338] font-bold">Sắp hết!</span>
                    )}
                  </div>
                </div>

                {/* Freshness Bar */}
                {ing.shelfLifeDays < 365 && (
                  <div className="mt-2 text-[10px] text-[#9E735B]">
                    <div className="flex justify-between mb-0.5 font-semibold">
                      <span>Độ tươi ngon</span>
                      <span className="tabular-nums">{ing.freshness}%</span>
                    </div>
                    <div className="w-full bg-[#F0D5C3] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${freshnessColor}`}
                        style={{ width: `${ing.freshness}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase Quick Buttons */}
              <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[#F0D5C3]/60">
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
