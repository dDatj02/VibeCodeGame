import React from 'react';
import { useRecipeStore } from '../../stores/recipeStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useGameStore } from '../../stores/gameStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { Lock, Unlock, Minus, Plus, TrendingUp, ArrowLeft } from 'lucide-react';

export const RecipesTab: React.FC = () => {
  const recipes = useRecipeStore((state) => state.recipes);
  const updateSellingPrice = useRecipeStore((state) => state.updateSellingPrice);
  const unlockRecipe = useRecipeStore((state) => state.unlockRecipe);
  const calculateCost = useInventoryStore((state) => state.calculateRecipeIngredientCost);
  const ingredients = useInventoryStore((state) => state.ingredients);
  const cash = useEconomyStore((state) => state.cash);
  const deductCash = useEconomyStore((state) => state.deductCash);
  const showNotification = useGameStore((state) => state.showNotification);
  const setActiveTab = useGameStore((state) => state.setActiveTab);

  const handleAdjustPrice = (recipeId: string, currentPrice: number, delta: number) => {
    audioService.playClick();
    updateSellingPrice(recipeId, currentPrice + delta);
  };

  const handleUnlock = (recipeId: string, cost?: number) => {
    if (cost && cost > 0) {
      if (cash < cost) {
        audioService.playDisappointed();
        showNotification('Không đủ tiền mặt để nghiên cứu công thức mới!', 'error');
        return;
      }
      deductCash(cost);
    }
    unlockRecipe(recipeId);
    audioService.playFanfare();
    showNotification('Đã mở khóa công thức sinh tố mới vào menu!', 'success');
  };

  return (
    <div className="flex-1 h-full max-h-full flex flex-col bg-[#FBF7F0] text-[#3D2619] p-2 max-w-lg mx-auto w-full select-none overflow-hidden">
      <div className="shrink-0 mb-1.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <button
            onClick={() => setActiveTab('shop')}
            className="p-1 hover:bg-[#F0D5C3]/40 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} className="text-[#E05338]" />
          </button>
          <h2 className="text-sm sm:text-base font-extrabold text-[#3D2619] font-['Comfortaa',sans-serif]">
            Menu Nước & Giá Bán
          </h2>
        </div>
        <p className="text-[11px] text-[#78513E] leading-tight">
          Tùy chỉnh giá bán từng món. Giá cao tăng lãi nhưng khách có thể chọn món rẻ hơn!
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2 pb-2">
        {recipes.map((recipe) => {
          const cost = calculateCost(recipe.ingredients);
          const profit = recipe.currentSellingPrice - cost;
          const marginPct = Math.round((profit / recipe.currentSellingPrice) * 100);

          return (
            <div
              key={recipe.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                recipe.unlocked
                  ? 'bg-white border-[#F0D5C3] hover:border-[#E05338]/40'
                  : 'bg-white/50 border-[#F0D5C3]/60 opacity-80'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FFF9F2] border border-[#F2DECC] flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-inner">
                      {recipe.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-xs text-[#3D2619] flex items-center gap-1 flex-wrap">
                        <span className="truncate">{recipe.name}</span>
                        <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-bold shrink-0">
                          {recipe.tag}
                        </span>
                      </h3>
                      <p className="text-[10.5px] sm:text-[11px] text-[#9E735B] mt-0.5 line-clamp-1">
                        {recipe.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-[#E05338] tabular-nums">
                      {formatVND(recipe.currentSellingPrice)}
                    </div>
                    <span className="text-[9.5px] text-emerald-700 font-semibold block">
                      Lãi: {formatVND(profit)} ({marginPct}%)
                    </span>
                  </div>
                </div>

                {/* Recipe Ingredients List */}
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {recipe.ingredients.map((req) => {
                    const ing = ingredients.find((i) => i.id === req.ingredientId);
                    return (
                      <span
                        key={req.ingredientId}
                        className="text-[9.5px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-[#FFF9F2] border border-[#F2DECC] text-[#78513E] flex items-center gap-0.5 font-bold shrink-0"
                      >
                        <span className="shrink-0">{ing?.icon || '📦'}</span>
                        <span className="truncate">{ing?.name.split(' ')[0] || req.ingredientId}</span>
                        <span className="text-[#9E735B] shrink-0">x{req.amount}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Price Controls & Status */}
              <div className="mt-3 pt-2.5 border-t border-[#F0D5C3]/60 flex items-center justify-between">
                {recipe.unlocked ? (
                  <>
                    <div className="flex items-center gap-1 text-[11px] text-[#78513E] font-semibold">
                      <TrendingUp size={12} className="text-amber-600" />
                      <span>Độ chuộng:</span>
                      <span className="font-black text-[#3D2619] tabular-nums">
                        {recipe.popularity}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdjustPrice(recipe.id, recipe.currentSellingPrice, -1000)}
                        className="w-7 h-7 rounded-xl bg-[#FFF9F2] hover:bg-amber-400 hover:text-white border border-[#F0D5C3] text-[#3D2619] flex items-center justify-center cursor-pointer transition-colors active:scale-95 font-bold"
                        title="Giảm 1.000đ"
                      >
                        <Minus size={13} />
                      </button>

                      <span className="text-xs font-black text-[#3D2619] tabular-nums min-w-[75px] text-center">
                        {formatVND(recipe.currentSellingPrice)}
                      </span>

                      <button
                        onClick={() => handleAdjustPrice(recipe.id, recipe.currentSellingPrice, 1000)}
                        className="w-7 h-7 rounded-xl bg-[#FFF9F2] hover:bg-amber-400 hover:text-white border border-[#F0D5C3] text-[#3D2619] flex items-center justify-center cursor-pointer transition-colors active:scale-95 font-bold"
                        title="Tăng 1.000đ"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-between">
                    <div className="text-[11px] text-amber-800 flex items-center gap-1 font-bold">
                      <Lock size={12} />
                      <span>{recipe.unlockRequirement || 'Chưa mở khóa'}</span>
                    </div>

                    <button
                      onClick={() => handleUnlock(recipe.id, recipe.unlockCost)}
                      className="px-3 py-1.5 text-xs font-bold bg-[#F26440] hover:bg-[#E05338] text-white rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                    >
                      <Unlock size={12} />
                      <span>Mở khóa ({formatVND(recipe.unlockCost || 0)})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
