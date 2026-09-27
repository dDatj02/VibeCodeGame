import React, { useState } from 'react';
import { useCustomerStore } from '../../stores/customerStore';
import { useRecipeStore } from '../../stores/recipeStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useGameStore } from '../../stores/gameStore';
import { useShopStore } from '../../stores/shopStore';
import { OrderSystem } from '../../systems/OrderSystem';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { CUSTOMER_ARCHETYPES } from '../../data/customers';
import { CozyCustomerCharacter } from './CozyCustomerCharacter';
import { 
  ArrowLeft, 
  Trash2, 
  Clock, 
  Zap, 
  Users,
  RotateCcw
} from 'lucide-react';

interface CozyKitchenCounterProps {
  onBackToLobby: () => void;
}

export const CozyKitchenCounter: React.FC<CozyKitchenCounterProps> = ({ onBackToLobby }) => {
  const activeCustomers = useCustomerStore((state) => state.activeCustomers);
  const recipes = useRecipeStore((state) => state.recipes);
  const ingredients = useInventoryStore((state) => state.ingredients);
  const getBlenderSpeedBonus = useShopStore((state) => state.getBlenderSpeedBonus);
  const blenderSpeedBonus = getBlenderSpeedBonus();
  const { showNotification } = useGameStore();

  // Active customer selected to serve (default first in queue)
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(0);

  // Cup assembly state
  const [hasCup, setHasCup] = useState(false);
  const [addedIngredients, setAddedIngredients] = useState<string[]>([]);
  const [isBlending, setIsBlending] = useState(false);
  const [blendProgress, setBlendProgress] = useState(0);
  const [isBlended, setIsBlended] = useState(false);
  const [fridgeOpen, setFridgeOpen] = useState(false);

  // Fallback to first customer if index out of bounds
  const currentIdx = selectedCustomerIndex < activeCustomers.length ? selectedCustomerIndex : 0;
  const selectedCustomer = activeCustomers[currentIdx] || null;
  const desiredRecipe = selectedCustomer ? recipes.find((r) => r.id === selectedCustomer.desiredRecipeId) : null;
  const customerArchetype = selectedCustomer ? CUSTOMER_ARCHETYPES.find((a) => a.id === selectedCustomer.archetypeId) : null;

  // Cup count in inventory
  const cupItem = ingredients.find((i) => i.id === 'cup');
  const cupStock = cupItem ? cupItem.currentStock : 0;

  // Take cup from dispenser stack
  const handleTakeCup = () => {
    if (hasCup) return;
    if (cupStock <= 0) {
      audioService.playDisappointed();
      showNotification('Đã hết ly mang đi! Vào kho để nhập thêm.', 'error');
      return;
    }
    setHasCup(true);
    setAddedIngredients([]);
    setIsBlended(false);
    audioService.playCupDrop();
    showNotification('Đã lấy 1 ly mới lên thảm pha chế!', 'info');
  };

  // Add an ingredient into active cup
  const handleAddIngredient = (ingId: string) => {
    if (!hasCup) {
      audioService.playDisappointed();
      showNotification('Chạm vào "Chồng Ly" để lấy ly trước nhé!', 'warning');
      return;
    }
    if (isBlended || isBlending) {
      showNotification('Ly đã xay rồi! Bấm chuông vàng để giao món hoặc Đổ bỏ để làm lại.', 'info');
      return;
    }

    const stockId = ingId.startsWith('ice') ? 'ice' : ingId.startsWith('sugar') ? 'sugar' : ingId;
    const ing = ingredients.find((i) => i.id === stockId);
    if (!ing || ing.currentStock <= 0) {
      audioService.playDisappointed();
      showNotification(`Đã hết ${ing?.name || 'nguyên liệu'} trong kho!`, 'error');
      return;
    }

    if (ingId === 'milk') {
      setFridgeOpen(true);
      setTimeout(() => setFridgeOpen(false), 500);
    }

    if (ingId.startsWith('ice')) {
      setAddedIngredients((prev) => [...prev.filter((id) => !id.startsWith('ice')), ingId]);
      showNotification(ingId === 'ice_less' ? '🧊 Đã chọn lượng: Ít đá!' : '🧊🧊 Đã chọn lượng: Đá chuẩn!', 'info');
    } else if (ingId.startsWith('sugar')) {
      setAddedIngredients((prev) => [...prev.filter((id) => !id.startsWith('sugar')), ingId]);
      showNotification(ingId === 'sugar_less' ? '🧂 Đã chọn lượng: Ít đường!' : '🧂🧂 Đã chọn lượng: Đường chuẩn!', 'info');
    } else {
      setAddedIngredients((prev) => [...prev, ingId]);
    }
    audioService.playIceClink();
  };

  // Run the Blender
  const handleStartBlender = () => {
    if (!hasCup || addedIngredients.length === 0 || isBlending || isBlended) return;

    setIsBlending(true);
    setBlendProgress(0);
    audioService.playBlender(1.2);

    const duration = Math.max(600, 1500 * (1 - blenderSpeedBonus));
    const intervalTime = 40;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setBlendProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          setIsBlending(false);
          setIsBlended(true);
          audioService.playCashRegister();
          return 100;
        }
        return next;
      });
    }, intervalTime);
  };

  // Serve drink to active customer
  // Serve drink to active customer
  const handleServeDrink = () => {
    if (!selectedCustomer || !desiredRecipe) return;

    if (!isBlended) {
      showNotification('Chưa xay sinh tố! Bấm máy xay màu tím để xay trước.', 'warning');
      return;
    }

    audioService.playBell();
    const res = OrderSystem.serveOrder(selectedCustomer.id, addedIngredients);
    if (res.success) {
      setHasCup(false);
      setAddedIngredients([]);
      setIsBlended(false);
      setBlendProgress(0);
      setSelectedCustomerIndex(0);
      useGameStore.getState().progressQuest(0, 1);
      if (desiredRecipe.id === 'smoothie_avocado') {
        useGameStore.getState().progressQuest(2, 1);
      }
    }
  };

  // Clear / trash current cup
  const handleTrashCup = () => {
    if (!hasCup) return;
    setHasCup(false);
    setAddedIngredients([]);
    setIsBlending(false);
    setIsBlended(false);
    setBlendProgress(0);
    audioService.playClick();
    showNotification('Đã đổ ly để pha lại ly mới!', 'info');
  };

  // Determine cup color from added ingredients
  const getSmoothieColor = () => {
    if (!hasCup) return 'transparent';
    if (addedIngredients.includes('avocado')) return '#86EFAC';
    if (addedIngredients.includes('strawberry')) return '#F472B6';
    if (addedIngredients.includes('mango')) return '#FBBF24';
    if (addedIngredients.includes('banana')) return '#FEF08A';
    if (addedIngredients.includes('milk')) return '#FFFBEB';
    return '#E2E8F0';
  };

  // Helper: Get friendly Vietnamese name for ingredients
  const getIngredientViName = (id: string): string => {
    switch (id) {
      case 'avocado': return 'Bơ sáp';
      case 'mango': return 'Xoài cát';
      case 'strawberry': return 'Dâu tây';
      case 'banana': return 'Chuối chín';
      case 'coconut_milk': return 'Cốt dừa';
      case 'whey_protein': return 'Đạm Whey';
      case 'chia_seeds': return 'Hạt chia';
      case 'milk': return 'Sữa tươi';
      case 'sugar': return 'Đường';
      case 'ice': return 'Đá bi';
      case 'cup': return 'Ly mang đi';
      default: return ingredients.find((i) => i.id === id)?.name || id;
    }
  };

  // Checklist verification for active recipe & custom customer preferences
  const hasIceLess = addedIngredients.includes('ice_less');
  const hasIceRegular = addedIngredients.includes('ice_regular') || addedIngredients.includes('ice');
  const hasAnyIce = hasIceLess || hasIceRegular;

  const hasSugarLess = addedIngredients.includes('sugar_less');
  const hasSugarRegular = addedIngredients.includes('sugar_regular') || addedIngredients.includes('sugar');
  const hasAnySugar = hasSugarLess || hasSugarRegular;

  const hasMilk = addedIngredients.includes('milk');

  // Customer custom preferences
  const wantsNoSugar = selectedCustomer?.sugarPreference === 'no_sugar';
  const wantsLessSugar = selectedCustomer?.sugarPreference === 'less_sugar';
  const wantsLessIce = selectedCustomer?.icePreference === 'less_ice';
  const wantsNoMilk = selectedCustomer?.milkPreference === 'no_milk';

  // Find all fruit/special ingredients in the recipe
  const requiredFruits = desiredRecipe?.ingredients.filter(
    (i) => i.ingredientId !== 'milk' && i.ingredientId !== 'sugar' && i.ingredientId !== 'ice' && i.ingredientId !== 'cup'
  ) || [];

  const fruitTextVi = requiredFruits.length > 0
    ? requiredFruits.map((rf) => getIngredientViName(rf.ingredientId)).join(' & ')
    : 'Trái cây';

  const hasAllFruits = requiredFruits.length > 0
    ? requiredFruits.every((rf) => addedIngredients.includes(rf.ingredientId))
    : addedIngredients.some((id) => id === 'mango' || id === 'avocado' || id === 'strawberry' || id === 'banana');

  // Step fulfillment states
  // Ice status (smoothies always have ice: Ít đá vs Đá chuẩn)
  const iceStatus = wantsLessIce
    ? (hasIceLess ? 'correct' : hasIceRegular ? 'warning' : 'pending')
    : (hasIceRegular ? 'correct' : hasIceLess ? 'warning' : 'pending');

  // Milk status
  const milkStatus = wantsNoMilk
    ? (!hasMilk ? 'correct' : 'violated')
    : (hasMilk ? 'correct' : 'pending');

  // Sugar status
  const sugarStatus = wantsNoSugar
    ? (!hasAnySugar ? 'correct' : 'violated')
    : wantsLessSugar
    ? (hasSugarLess ? 'correct' : hasSugarRegular ? 'warning' : 'pending')
    : (hasSugarRegular ? 'correct' : hasSugarLess ? 'warning' : 'pending');

  // Customer patience percentage
  const patiencePct = selectedCustomer 
    ? Math.round((selectedCustomer.remainingPatience / selectedCustomer.maxPatience) * 100) 
    : 100;

  return (
    <div className="flex-1 h-full max-h-full w-full max-w-2xl mx-auto flex flex-col justify-between select-none overflow-hidden bg-[#24130A] text-[#3D2619]">
      
      {/* 1. TOP NAV BAR: Back button & Queue indicator */}
      <div className="shrink-0 bg-[#351A0B] border-b-2 border-[#542810] px-3 py-1.5 flex items-center justify-between text-white z-20 shadow-xs">
        <button
          onClick={() => {
            audioService.playClick();
            onBackToLobby();
          }}
          className="flex items-center gap-1.5 text-xs font-black text-amber-200 hover:text-white bg-[#542810] hover:bg-[#6D3416] px-3 py-1 rounded-full border border-amber-900/60 shadow-2xs active:scale-95 cursor-pointer transition-all"
        >
          <ArrowLeft size={13} />
          <span>Về sảnh tiệm</span>
        </button>

        {/* Customer Queue tabs */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-[#200E05] px-2.5 py-1 rounded-full border border-amber-900/40 text-xs font-bold text-amber-100">
            <Users size={12} className="text-amber-400" />
            <span>Đang chờ:</span>
            <span className="font-black text-amber-300">{activeCustomers.length}</span>
          </div>

          {/* Quick customer switch avatars */}
          {activeCustomers.length > 1 && (
            <div className="flex items-center gap-1">
              {activeCustomers.slice(0, 3).map((cust, idx) => (
                <button
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomerIndex(idx);
                    audioService.playClick();
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border transition-all cursor-pointer ${
                    idx === currentIdx
                      ? 'bg-amber-400 border-white text-stone-900 ring-2 ring-amber-400 scale-105'
                      : 'bg-[#542810] border-amber-900/80 text-amber-200 opacity-70 hover:opacity-100'
                  }`}
                  title={cust.name}
                >
                  {CUSTOMER_ARCHETYPES.find((a) => a.id === cust.archetypeId)?.avatar || '🐱'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. CUSTOMER COUNTER & ORDER BOARD (Spacious 2-column layout) */}
      <div className="relative flex-1 min-h-[175px] max-h-[220px] bg-gradient-to-b from-[#A96A3D] via-[#92552B] to-[#7B421E] px-3 py-2 flex items-center justify-between gap-3 overflow-hidden border-b-4 border-[#45200C]">
        
        {/* Background Wooden Paneling & Arched Windows */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="w-full h-full flex justify-around">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-px h-full bg-[#3D1E0B]" />
            ))}
          </div>
        </div>

        {/* Left Side: Animated Animal Customer Behind Counter */}
        <div className="relative z-10 flex flex-col items-center justify-end h-full shrink-0 w-28 sm:w-36">
          {selectedCustomer ? (
            <div className="flex flex-col items-center">
              <CozyCustomerCharacter
                archetypeId={selectedCustomer.archetypeId}
                isSelected={true}
                size="md"
                isPatienceLow={patiencePct <= 35}
              />
              <span className="text-[11px] font-black text-amber-100 bg-[#351A0B]/80 px-2 py-0.5 rounded-full border border-amber-900/60 mt-0.5 shadow-xs truncate max-w-[120px]">
                {selectedCustomer.name}
              </span>
            </div>
          ) : (
            <div className="py-6 px-3 bg-amber-50/90 rounded-2xl border-2 border-dashed border-amber-600/40 text-center text-xs text-[#5E2B06] font-bold shadow-md">
              🐱 Quán đang vắng khách... Sắp có khách ghé ngay thôi!
            </div>
          )}
        </div>

        {/* Right Side: The Order Ticket (Cafe Clipboard Note) */}
        {selectedCustomer && desiredRecipe ? (
          <div className="relative z-10 flex-1 max-w-[290px] bg-[#FFFBF0] border-2 border-[#3D1E0B] rounded-2xl p-2 sm:p-2.5 shadow-xl flex flex-col justify-between">
            {/* Ticket Header */}
            <div className="bg-[#3D1E0B] text-amber-200 -mx-2 -mt-2 sm:-mx-2.5 sm:-mt-2.5 px-3 py-1.5 rounded-t-xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-base">{desiredRecipe.icon}</span>
                <span className="font-['Comfortaa'] text-xs font-black text-amber-100 truncate">
                  {desiredRecipe.name}
                </span>
              </div>
              <span className="bg-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded tabular-nums shrink-0 ml-1">
                {formatVND(desiredRecipe.currentSellingPrice)}
              </span>
            </div>

            {/* Special Request Dialogue / Note */}
            {selectedCustomer.customNote && (
              <div className="mt-1 px-2 py-0.5 rounded-md bg-amber-100/90 border border-amber-300 text-[9.5px] font-black text-amber-950 flex items-center gap-1 truncate shadow-2xs">
                <span>💬</span>
                <span className="truncate">{selectedCustomer.customNote}</span>
              </div>
            )}

            {/* Checklist of 6 Steps (2 Columns, Dynamic Customization & Vietnamese Fruits) */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 my-1.5 text-[11px] font-black">
              {/* Step 1: Cup */}
              <div className={`flex items-center gap-1.5 ${hasCup ? 'text-emerald-700' : 'text-stone-600'}`}>
                <span>{hasCup ? '✅' : '⚪'}</span>
                <span>1. Lấy ly</span>
              </div>

              {/* Step 2: Ice (Always required in smoothies: Ít đá vs Đá chuẩn) */}
              <div
                className={`flex items-center gap-1.5 ${
                  iceStatus === 'correct'
                    ? 'text-emerald-700'
                    : iceStatus === 'warning'
                    ? 'text-amber-700'
                    : 'text-stone-600'
                }`}
              >
                <span>{iceStatus === 'correct' ? '✅' : iceStatus === 'warning' ? '⚠️' : '⚪'}</span>
                <span className="truncate">
                  {wantsLessIce
                    ? hasIceLess
                      ? '2. Đã cho Ít đá'
                      : hasIceRegular
                      ? '2. Dư đá (khách dặn ít đá)'
                      : '2. Ít đá'
                    : hasIceRegular
                    ? '2. Đã cho Đá chuẩn'
                    : hasIceLess
                    ? '2. Thiếu đá (khách dặn chuẩn)'
                    : '2. Đá chuẩn'}
                </span>
              </div>

              {/* Step 3: Milk (Customizable: No milk / Regular) */}
              <div
                className={`flex items-center gap-1.5 ${
                  milkStatus === 'violated'
                    ? 'text-rose-600 font-black'
                    : milkStatus === 'correct'
                    ? 'text-emerald-700'
                    : 'text-stone-600'
                }`}
              >
                <span>{milkStatus === 'violated' ? '❌' : milkStatus === 'correct' ? '✅' : '⚪'}</span>
                <span className="truncate">
                  {milkStatus === 'violated'
                    ? '3. Lỡ cho sữa!'
                    : wantsNoMilk
                    ? '3. Không sữa'
                    : '3. Sữa tươi'}
                </span>
              </div>

              {/* Step 4: Sugar (Customizable: No sugar / Less sugar / Regular) */}
              <div
                className={`flex items-center gap-1.5 ${
                  sugarStatus === 'violated'
                    ? 'text-rose-600 font-black'
                    : sugarStatus === 'correct'
                    ? 'text-emerald-700'
                    : sugarStatus === 'warning'
                    ? 'text-amber-700'
                    : 'text-stone-600'
                }`}
              >
                <span>
                  {sugarStatus === 'violated'
                    ? '❌'
                    : sugarStatus === 'correct'
                    ? '✅'
                    : sugarStatus === 'warning'
                    ? '⚠️'
                    : '⚪'}
                </span>
                <span className="truncate">
                  {wantsNoSugar
                    ? hasAnySugar
                      ? '4. Lỡ cho đường!'
                      : '4. Không đường'
                    : wantsLessSugar
                    ? hasSugarLess
                      ? '4. Đã cho Ít đường'
                      : hasSugarRegular
                      ? '4. Quá ngọt (khách dặn ít)'
                      : '4. Ít đường'
                    : hasSugarRegular
                    ? '4. Đã cho Đường chuẩn'
                    : hasSugarLess
                    ? '4. Thiếu ngọt (khách dặn chuẩn)'
                    : '4. Đường ngọt'}
                </span>
              </div>

              {/* Step 5: Vietnamese Fruit(s) & Mix Combo */}
              <div className={`flex items-center gap-1.5 ${hasAllFruits ? 'text-emerald-700' : 'text-stone-600'}`}>
                <span>{hasAllFruits ? '✅' : '⚪'}</span>
                <span className="truncate" title={fruitTextVi}>
                  5. {fruitTextVi}
                </span>
              </div>

              {/* Step 6: Blender */}
              <div className={`flex items-center gap-1.5 ${isBlended ? 'text-emerald-700' : 'text-stone-600'}`}>
                <span>{isBlended ? '✅' : '⚪'}</span>
                <span>6. Xay nhuyễn</span>
              </div>
            </div>

            {/* Customer Patience Bar */}
            <div className="pt-1 border-t border-[#E8D0BA] flex items-center gap-1.5 text-[10px] text-stone-700">
              <Clock size={11} className="text-amber-800 shrink-0" />
              <div className="flex-1 bg-stone-200 h-2 rounded-full overflow-hidden border border-stone-300">
                <div
                  className={`h-full transition-all duration-300 ${
                    patiencePct > 35 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${patiencePct}%` }}
                />
              </div>
              <span className="tabular-nums font-black text-stone-900 shrink-0">
                {Math.ceil(selectedCustomer.remainingPatience)}s
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs font-bold text-amber-100">
            Đang chờ lượt khách tiếp theo...
          </div>
        )}
      </div>

      {/* 3. THE PREP COUNTERTOP (Clear Left-to-Right Workstations) */}
      <div className="shrink-0 bg-[#D98236] border-t-4 border-[#FCD39B] border-b-4 border-[#5E2B06] shadow-md px-3 py-2 flex items-center justify-between gap-2 relative z-20">
        
        {/* Counter Highlight Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 pointer-events-none" />

        {/* WORKSTATION 1: Cup Dispenser (Step 1) */}
        <button
          onClick={handleTakeCup}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer select-none min-w-[70px] sm:min-w-[80px] ${
            hasCup
              ? 'bg-[#B26422]/40 border-2 border-[#5E2B06]/40 opacity-70'
              : 'bg-white hover:bg-amber-50 border-2 border-[#3D1E0B] shadow-md active:scale-95'
          }`}
          title="Lấy 1 ly mới lên thảm"
        >
          <div className="relative w-8 h-9 flex flex-col items-center justify-center">
            <div className="w-7 h-2 bg-sky-200 rounded-t-sm border border-sky-400 opacity-80 -mb-1" />
            <div className="w-7 h-2 bg-sky-200 rounded-t-sm border border-sky-400 opacity-90 -mb-1" />
            <div className="w-7 h-7 bg-sky-100 rounded-b-md border-2 border-sky-400 flex items-center justify-center shadow-xs">
              <span className="text-sm">🥤</span>
            </div>
          </div>
          <span className="text-xs font-black text-stone-900 mt-1 leading-tight">
            {hasCup ? 'Đã lấy ly' : 'Chồng Ly'}
          </span>
          <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded mt-0.5">
            Còn: {cupStock}
          </span>
        </button>

        {/* WORKSTATION 2: The Prep Mat & Active Smoothie Cup (Step 2 - Center) */}
        <div className="flex-1 max-w-[200px] bg-[#0F766E] border-2 border-[#042F2E] rounded-2xl p-2 shadow-inner flex flex-col items-center justify-center min-h-[85px] relative">
          
          {!hasCup ? (
            <div
              onClick={handleTakeCup}
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer group py-1"
            >
              <div className="w-10 h-12 border-2 border-dashed border-white rounded-b-xl rounded-t-xs flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition-colors">
                <span className="text-xl opacity-70">🥤</span>
              </div>
              <span className="text-xs font-black text-white mt-1 drop-shadow-xs">Chạm lấy ly</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* The Working Smoothie Cup */}
              <div
                className="relative w-12 h-15 rounded-b-2xl rounded-t-xs border-2 border-stone-800 shadow-xl flex flex-col justify-end p-1 transition-colors duration-300 overflow-hidden"
                style={{ backgroundColor: getSmoothieColor() }}
              >
                {/* Striped Straw */}
                <div className="absolute -top-3 right-1.5 w-1.5 h-7 bg-rose-500 rotate-12 rounded-full border border-white z-20 shadow-2xs">
                  <div className="w-full h-1 bg-white my-1" />
                </div>

                {/* Floating Ingredients inside cup */}
                <div className="flex flex-wrap gap-0.5 justify-center z-10">
                  {addedIngredients.slice(-4).map((ingId, i) => {
                    const item = ingredients.find((ing) => ing.id === ingId);
                    return (
                      <span key={i} className="text-xs leading-none bg-white/90 rounded-full px-0.5 shadow-2xs">
                        {item?.icon}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-stone-900 text-white shadow-xs leading-none text-center">
                  {isBlended ? '✨ Đã xay' : isBlending ? '🌪️ Đang xay' : `${addedIngredients.length} món`}
                </span>

                {/* Quick Trash / Reset Cup button */}
                <button
                  onClick={handleTrashCup}
                  className="flex items-center gap-1 text-[9.5px] font-black text-rose-200 bg-rose-700/80 hover:bg-rose-600 px-2 py-0.5 rounded-lg border border-rose-900 shadow-2xs active:scale-95 cursor-pointer"
                  title="Đổ ly làm lại"
                >
                  <Trash2 size={10} />
                  <span>Đổ ly</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* WORKSTATION 3: Commercial Purple Blender Machine (Step 3) */}
        <div className="flex flex-col items-center">
          <div
            className={`relative w-13 h-14 bg-gradient-to-b from-purple-100 to-purple-200 border-2 border-[#3D1E0B] rounded-xl flex flex-col items-center justify-end pb-1 shadow-md transition-all ${
              isBlending ? 'animate-bounce ring-2 ring-amber-400' : ''
            }`}
          >
            <div className="absolute -top-1 w-7 h-1.5 bg-purple-700 rounded-full" />
            <span className={`text-xl transition-transform ${isBlending ? 'animate-spin' : ''}`}>
              🌪️
            </span>
            {isBlending && (
              <span className="text-[9px] font-black text-purple-950 bg-amber-300 px-1.5 rounded-full shadow-2xs">
                {Math.round(blendProgress)}%
              </span>
            )}
          </div>

          <button
            onClick={handleStartBlender}
            disabled={!hasCup || addedIngredients.length === 0 || isBlending || isBlended}
            className={`mt-1 py-1 px-2.5 rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1 ${
              hasCup && addedIngredients.length > 0 && !isBlended
                ? 'bg-purple-700 hover:bg-purple-600 text-white active:scale-95 cursor-pointer border border-[#3D1E0B]'
                : 'bg-stone-300 text-stone-600 cursor-not-allowed opacity-60'
            }`}
          >
            <Zap size={11} />
            <span>{isBlended ? 'Đã Xay' : 'Bật Máy'}</span>
          </button>
        </div>

        {/* WORKSTATION 4: Golden Serving Bell (Step 4 - Ding!) */}
        <button
          onClick={handleServeDrink}
          disabled={!selectedCustomer}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all cursor-pointer select-none min-w-[70px] sm:min-w-[80px] ${
            isBlended
              ? 'bg-gradient-to-b from-amber-300 to-amber-500 border-[#3D1E0B] text-stone-900 shadow-xl animate-pulse ring-2 ring-white active:scale-95'
              : 'bg-white border-[#3D1E0B] text-stone-900 shadow-md'
          }`}
          title="Bấm chuông để giao món cho khách"
        >
          <div className="w-8 h-8 rounded-full bg-amber-400 border border-amber-600 flex items-center justify-center text-lg shadow-sm">
            🛎️
          </div>
          <span className="text-xs font-black mt-0.5 leading-tight text-stone-900">
            {isBlended ? 'GIAO MÓN' : 'Chuông'}
          </span>
          <span className="text-[9px] font-bold text-amber-950">Bấm giao</span>
        </button>
      </div>

      {/* 4. UNDER-COUNTER INGREDIENTS PANTRY (2 Organized Tiers) */}
      <div className="shrink-0 bg-[#2D1609] border-t-3 border-[#1A0B04] p-2.5 flex flex-col gap-2 shadow-inner">
        
        {/* Tier 1: Essentials Bar (Ice with Ít/Đá Chuẩn, Milk, Sugar with Ít/Đường Chuẩn) */}
        <div className="grid grid-cols-3 gap-2">
          
          {/* Machine 1: Blue Ice Maker with 2 options (Ít Đá / Đá Chuẩn) */}
          <div className="bg-white border-2 border-sky-500 rounded-xl p-1.5 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between text-[11px] font-black text-sky-950 px-0.5 leading-none">
              <span className="flex items-center gap-1">
                <span>🧊</span>
                <span>Máy Đá</span>
              </span>
              <span className="text-[9.5px] font-black text-sky-700 bg-sky-100 px-1 py-0.2 rounded">
                Còn: {ingredients.find((i) => i.id === 'ice')?.currentStock || 0}
              </span>
            </div>
            {/* 2 Ice Buttons: Ít đá vs Đá chuẩn */}
            <div className="grid grid-cols-2 gap-1 mt-1">
              <button
                onClick={() => handleAddIngredient('ice_less')}
                className={`py-1 rounded-lg text-[9.5px] font-black border transition-all active:scale-95 cursor-pointer text-center leading-tight flex flex-col items-center justify-center ${
                  hasIceLess
                    ? 'bg-sky-500 text-white border-sky-700 shadow-xs ring-1 ring-sky-300'
                    : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300'
                }`}
                title="Cho 1/2 muỗng đá (Ít đá)"
              >
                <span>🧊</span>
                <span>Ít Đá</span>
              </button>
              <button
                onClick={() => handleAddIngredient('ice_regular')}
                className={`py-1 rounded-lg text-[9.5px] font-black border transition-all active:scale-95 cursor-pointer text-center leading-tight flex flex-col items-center justify-center ${
                  hasIceRegular
                    ? 'bg-sky-600 text-white border-sky-800 shadow-xs ring-1 ring-sky-300'
                    : 'bg-sky-100 hover:bg-sky-200 text-sky-950 border-sky-400'
                }`}
                title="Cho 1 muỗng đá đầy đủ (Đá chuẩn)"
              >
                <span>🧊🧊</span>
                <span>Đá Chuẩn</span>
              </button>
            </div>
          </div>

          {/* Machine 2: Milk Fridge */}
          <button
            onClick={() => handleAddIngredient('milk')}
            className={`border-2 border-emerald-600 rounded-xl p-1.5 flex flex-col justify-between shadow-md active:scale-95 cursor-pointer transition-all ${
              hasMilk
                ? 'bg-emerald-600 text-white border-emerald-800 shadow-md ring-1 ring-emerald-300'
                : fridgeOpen
                ? 'bg-white ring-2 ring-emerald-400'
                : 'bg-gradient-to-b from-[#ECFDF5] to-[#D1FAE5]'
            }`}
            title="Thêm sữa tươi"
          >
            <div className="flex items-center justify-between text-[11px] font-black px-0.5 leading-none w-full">
              <span className={`flex items-center gap-1 ${hasMilk ? 'text-white' : 'text-emerald-950'}`}>
                <span>🥛</span>
                <span>Tủ Sữa</span>
              </span>
              <span className={`text-[9.5px] font-black px-1 py-0.2 rounded ${hasMilk ? 'text-emerald-100 bg-emerald-700' : 'text-emerald-700 bg-emerald-200'}`}>
                Còn: {ingredients.find((i) => i.id === 'milk')?.currentStock || 0}
              </span>
            </div>
            <div className={`mt-1 py-1 rounded-lg text-[10px] font-black text-center w-full border ${
              hasMilk
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-white/80 hover:bg-white text-emerald-950 border-emerald-400 shadow-2xs'
            }`}>
              {hasMilk ? '✓ Đã Cho Sữa' : '+ Cho Sữa Tươi'}
            </div>
          </button>

          {/* Machine 3: Sugar Jar with 2 options (Ít Đường / Đường Chuẩn) */}
          <div className="bg-white border-2 border-amber-500 rounded-xl p-1.5 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between text-[11px] font-black text-amber-950 px-0.5 leading-none">
              <span className="flex items-center gap-1">
                <span>🍬</span>
                <span>Hũ Đường</span>
              </span>
              <span className="text-[9.5px] font-black text-amber-700 bg-amber-100 px-1 py-0.2 rounded">
                Còn: {ingredients.find((i) => i.id === 'sugar')?.currentStock || 0}
              </span>
            </div>
            {/* 2 Sugar Buttons: Ít đường vs Đường chuẩn */}
            <div className="grid grid-cols-2 gap-1 mt-1">
              <button
                onClick={() => handleAddIngredient('sugar_less')}
                className={`py-1 rounded-lg text-[9.5px] font-black border transition-all active:scale-95 cursor-pointer text-center leading-tight flex flex-col items-center justify-center ${
                  hasSugarLess
                    ? 'bg-amber-500 text-white border-amber-700 shadow-xs ring-1 ring-amber-300'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                }`}
                title="Cho 1/2 muỗng đường (Ít đường)"
              >
                <span>🧂</span>
                <span>Ít Đường</span>
              </button>
              <button
                onClick={() => handleAddIngredient('sugar_regular')}
                className={`py-1 rounded-lg text-[9.5px] font-black border transition-all active:scale-95 cursor-pointer text-center leading-tight flex flex-col items-center justify-center ${
                  hasSugarRegular
                    ? 'bg-amber-600 text-white border-amber-800 shadow-xs ring-1 ring-amber-300'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400'
                }`}
                title="Cho 1 muỗng đường đầy đủ (Đường chuẩn)"
              >
                <span>🧂🧂</span>
                <span>Đường Chuẩn</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Fresh Fruit Crates (4 Large, Clear Fruit Buttons) */}
        <div className="grid grid-cols-4 gap-2">
          {ingredients
            .filter((i) => i.id === 'avocado' || i.id === 'mango' || i.id === 'strawberry' || i.id === 'banana')
            .map((ing) => {
              const hasStock = ing.currentStock > 0;
              const fruitStyles = {
                avocado: {
                  bg: 'bg-[#ECFDF5] hover:bg-[#D1FAE5] border-emerald-600',
                  text: 'text-emerald-950',
                  badge: 'bg-emerald-700 text-white',
                  label: 'Bơ sáp',
                },
                mango: {
                  bg: 'bg-[#FEFCE8] hover:bg-[#FEF9C3] border-amber-500',
                  text: 'text-amber-950',
                  badge: 'bg-amber-600 text-white',
                  label: 'Xoài cát',
                },
                strawberry: {
                  bg: 'bg-[#FFF1F2] hover:bg-[#FFE4E6] border-rose-500',
                  text: 'text-rose-950',
                  badge: 'bg-rose-600 text-white',
                  label: 'Dâu tây',
                },
                banana: {
                  bg: 'bg-[#FEF9C3] hover:bg-[#FEF08A] border-yellow-500',
                  text: 'text-yellow-950',
                  badge: 'bg-yellow-700 text-white',
                  label: 'Chuối chín',
                },
              }[ing.id] || {
                bg: 'bg-white border-stone-400',
                text: 'text-stone-900',
                badge: 'bg-stone-800 text-white',
                label: ing.name,
              };

              return (
                <button
                  key={ing.id}
                  onClick={() => handleAddIngredient(ing.id)}
                  disabled={!hasStock}
                  className={`py-1.5 px-1 rounded-xl border-2 flex flex-col items-center justify-between text-center transition-all select-none cursor-pointer ${
                    hasStock
                      ? `${fruitStyles.bg} shadow-md active:scale-95`
                      : 'bg-stone-800 border-stone-900 opacity-40 cursor-not-allowed'
                  }`}
                  title={`Cho ${ing.name} vào ly`}
                >
                  <span className="text-xl leading-none drop-shadow-sm">{ing.icon}</span>
                  <span className={`text-xs font-black ${fruitStyles.text} truncate max-w-[55px] leading-tight mt-0.5`}>
                    {fruitStyles.label}
                  </span>
                  <span className={`text-[10px] font-black ${fruitStyles.badge} px-2 py-0.2 rounded-full tabular-nums leading-none mt-0.5 shadow-2xs`}>
                    {ing.currentStock}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};
