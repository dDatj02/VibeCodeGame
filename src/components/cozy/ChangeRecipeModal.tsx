import React from 'react';
import { ActiveCustomer, Recipe } from '../../types';
import { useRecipeStore } from '../../stores/recipeStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useCustomerStore } from '../../stores/customerStore';
import { useReviewStore } from '../../stores/reviewStore';
import { useGameStore } from '../../stores/gameStore';
import { audioService } from '../../services/AudioService';
import { CUSTOMER_ARCHETYPES } from '../../data/customers';
import { 
  X, 
  RefreshCw, 
  DoorOpen, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  HeartHandshake,
  Check
} from 'lucide-react';

interface ChangeRecipeModalProps {
  customer: ActiveCustomer | null;
  isOpen: boolean;
  onClose: () => void;
  onRecipeChanged?: () => void;
}

export const ChangeRecipeModal: React.FC<ChangeRecipeModalProps> = ({
  customer,
  isOpen,
  onClose,
  onRecipeChanged,
}) => {
  const recipes = useRecipeStore((state) => state.recipes);
  const ingredients = useInventoryStore((state) => state.ingredients);
  const hasEnoughIngredients = useInventoryStore((state) => state.hasEnoughIngredients);
  const changeCustomerRecipe = useCustomerStore((state) => state.changeCustomerRecipe);
  const customerLeaveOutOfStock = useCustomerStore((state) => state.customerLeaveOutOfStock);
  const goodwill = useReviewStore((state) => state.goodwill);
  const showNotification = useGameStore((state) => state.showNotification);

  if (!isOpen || !customer) return null;

  const currentRecipe = recipes.find((r) => r.id === customer.desiredRecipeId);
  const customerArchetype = CUSTOMER_ARCHETYPES.find((a) => a.id === customer.archetypeId);

  // Unlocked recipes other than the current one
  const unlockedRecipes = recipes.filter((r) => r.unlocked);

  // Helper: check max portions makeable for a recipe
  const getMaxMakeable = (recipe: Recipe): number => {
    let maxPortions = 9999;
    for (const req of recipe.ingredients) {
      const stockItem = ingredients.find((i) => i.id === req.ingredientId);
      if (!stockItem || stockItem.currentStock < req.amount) {
        return 0;
      }
      const makeable = Math.floor(stockItem.currentStock / req.amount);
      if (makeable < maxPortions) {
        maxPortions = makeable;
      }
    }
    return maxPortions;
  };

  // 1. Action: Player suggests a new recipe to customer
  const handleSuggestRecipe = (targetRecipe: Recipe) => {
    if (!customer) return;

    audioService.playClick();

    // Check if kitchen has enough ingredients
    const isMakeable = hasEnoughIngredients(targetRecipe.ingredients);
    if (!isMakeable) {
      audioService.playDisappointed();
      showNotification(`Món ${targetRecipe.name} cũng đang thiếu nguyên liệu!`, 'warning');
      return;
    }

    // Calculate acceptance rate
    let acceptChance = 0.85; // 85% base
    if (customerArchetype?.favoriteRecipes.includes(targetRecipe.id)) {
      acceptChance += 0.15; // 100% if customer favorite
    }
    if (goodwill >= 80) {
      acceptChance += 0.10;
    }
    if (customer.archetypeId === 'difficult') {
      acceptChance -= 0.20; // Grumpy customer is pickier
    }

    const accepted = Math.random() < acceptChance;

    if (accepted) {
      changeCustomerRecipe(customer.id, targetRecipe.id);
      audioService.playCashRegister();
      showNotification(
        `🥤 ${customer.name}: "Dạ được ạ, làm giúp em ly ${targetRecipe.name} nha!"`,
        'success'
      );
      onRecipeChanged?.();
      onClose();
    } else {
      // Customer declined and politely leaves
      customerLeaveOutOfStock(customer.id);
      audioService.playClick();
      showNotification(
        `👋 ${customer.name}: "Dạ em chỉ thèm đúng món này thôi, hẹn quán bữa khác nhé!"`,
        'info'
      );
      onRecipeChanged?.();
      onClose();
    }
  };

  // 2. Action: Player informs out of stock -> customer leaves politely without 1-star rage
  const handlePoliteLeave = () => {
    if (!customer) return;

    audioService.playClick();
    customerLeaveOutOfStock(customer.id);
    showNotification(
      `👋 Đã báo hết món: ${customer.name} thông cảm và hẹn ghé lại lần sau!`,
      'info'
    );
    onRecipeChanged?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-[#FAF4ED] border-3 border-[#3D2619] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#3D2619] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5E2B06] via-[#78350F] to-[#5E2B06] text-white px-4 py-3 flex items-center justify-between border-b-2 border-amber-950 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-xs">
              🔄
            </div>
            <div>
              <h3 className="font-['Comfortaa',sans-serif] font-black text-xs sm:text-sm text-amber-100 leading-tight">
                Xử Lý Hết Món / Đổi Món
              </h3>
              <p className="text-[10px] text-amber-200/80">
                Gợi ý món khác còn nguyên liệu hoặc báo hết lịch sự
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-amber-200 hover:text-white bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 text-xs">
          
          {/* Current Customer & Order Box */}
          <div className="p-3 bg-amber-50/80 border-2 border-amber-200 rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white border border-amber-300 flex items-center justify-center text-2xl shadow-xs shrink-0">
                {currentRecipe?.icon || '🍹'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-stone-900 truncate">
                    {customer.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-200 text-amber-950 font-bold shrink-0">
                    {customerArchetype?.name || 'Khách hàng'}
                  </span>
                </div>
                <div className="text-[11px] text-stone-600 mt-0.5">
                  Đang gọi: <span className="font-black text-rose-700">{currentRecipe?.name || 'Sinh tố'}</span>
                </div>
              </div>
            </div>

            <span className="text-[9.5px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1 rounded-xl shrink-0">
              Thiếu hàng
            </span>
          </div>

          {/* Quick Option 1: Báo Hết Món Khách Rời Đi */}
          <div className="p-2.5 bg-white border border-stone-200 rounded-2xl space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-stone-800 text-[11px] flex items-center gap-1">
                <DoorOpen size={13} className="text-amber-700" />
                <span>Cách 1: Lịch sự báo hết món</span>
              </span>
              <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                Không bị 1⭐
              </span>
            </div>
            <p className="text-[10.5px] text-stone-500 leading-tight">
              Chủ quán xin lỗi khách vì hết nguyên liệu. Khách vui vẻ thông cảm ra về và không đánh giá xấu tiệm.
            </p>
            <button
              onClick={handlePoliteLeave}
              className="w-full mt-1 py-2 bg-stone-100 hover:bg-amber-100/70 border border-stone-300 hover:border-amber-400 text-stone-800 font-black text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <DoorOpen size={13} />
              <span>Báo Hết Món & Hẹn Khách Dịp Khác</span>
            </button>
          </div>

          {/* Quick Option 2: Gợi ý đổi sang món khác */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-stone-800 text-[11px] flex items-center gap-1">
                <RefreshCw size={13} className="text-[#E05338]" />
                <span>Cách 2: Mời khách đổi sang món khác:</span>
              </span>
              <span className="text-[9.5px] text-amber-900 font-bold">
                Tỷ lệ đồng ý: ~85%
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {unlockedRecipes
                .filter((r) => r.id !== customer.desiredRecipeId)
                .map((rec) => {
                  const makeable = getMaxMakeable(rec);
                  const isMakeable = makeable > 0;
                  const isFav = customerArchetype?.favoriteRecipes.includes(rec.id);

                  return (
                    <button
                      key={rec.id}
                      onClick={() => handleSuggestRecipe(rec)}
                      disabled={!isMakeable}
                      className={`p-2 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-2 shadow-2xs ${
                        isMakeable
                          ? 'bg-white hover:bg-amber-50/80 border-amber-200 hover:border-[#E05338] cursor-pointer active:scale-98'
                          : 'bg-stone-100 border-stone-200 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{rec.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-stone-900 truncate">
                              {rec.name}
                            </span>
                            {isFav && (
                              <span className="text-[8.5px] px-1 py-0.2 rounded bg-amber-400 text-amber-950 font-black">
                                Món ruột ⭐
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-stone-500 block truncate">
                            Giá bán: {rec.currentSellingPrice.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isMakeable ? (
                          <span className="inline-flex items-center gap-0.5 text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <Check size={10} /> Đủ làm: {makeable} ly
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-bold text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full">
                            Hết hàng
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#EEDCC8] border-t-2 border-[#D8C2AC] flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#3D2619] hover:bg-[#542810] text-amber-100 font-black text-xs rounded-xl shadow-2xs cursor-pointer transition-all active:scale-95"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
