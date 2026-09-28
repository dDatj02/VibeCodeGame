import React from 'react';
import { useLargeOrderStore } from '../../stores/largeOrderStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useGameStore } from '../../stores/gameStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { LargeOrderRiskCalculator } from '../../systems/LargeOrderRiskCalculator';
import { 
  X, 
  Package, 
  Clock, 
  AlertTriangle, 
  CreditCard, 
  ShieldCheck, 
  ShoppingBag, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Sparkles,
  Users
} from 'lucide-react';

export const LargeOrderOfferModal: React.FC = () => {
  const showOfferModal = useLargeOrderStore((state) => state.showOfferModal);
  const activeOffer = useLargeOrderStore((state) => state.activeOffer);
  const acceptOffer = useLargeOrderStore((state) => state.acceptOffer);
  const declineOffer = useLargeOrderStore((state) => state.declineOffer);
  const closeOfferModal = useLargeOrderStore((state) => state.closeOfferModal);

  const ingredients = useInventoryStore((state) => state.ingredients);
  const buyIngredient = useInventoryStore((state) => state.buyIngredient);
  const deductCash = useEconomyStore((state) => state.deductCash);
  const setActiveTab = useGameStore((state) => state.setActiveTab);

  if (!showOfferModal || !activeOffer) return null;

  const riskInfo = LargeOrderRiskCalculator.getRiskTier(activeOffer.cancellationRisk);

  // Check ingredient fulfillment
  const ingredientStatus = activeOffer.requiredIngredients.map((req) => {
    const stockItem = ingredients.find((i) => i.id === req.ingredientId);
    const available = stockItem ? stockItem.currentStock : 0;
    const isEnough = available >= req.amount;
    const missing = Math.max(0, req.amount - available);
    return {
      id: req.ingredientId,
      name: stockItem?.name || req.ingredientId,
      icon: stockItem?.icon || '📦',
      unit: req.unit,
      required: req.amount,
      available,
      isEnough,
      missing,
      basePrice: stockItem?.basePrice || 10000,
    };
  });

  const hasAllIngredients = ingredientStatus.every((i) => i.isEnough);

  // Quick buy missing ingredients handler
  const handleQuickBuyAllMissing = () => {
    const missingItems = ingredientStatus.filter((i) => !i.isEnough);
    let totalCost = 0;

    missingItems.forEach((m) => {
      totalCost += m.missing * m.basePrice;
    });

    const cash = useEconomyStore.getState().cash;
    if (cash < totalCost) {
      audioService.playDisappointed();
      useGameStore.getState().showNotification(`Không đủ tiền mua bổ sung! Cần ${formatVND(totalCost)}.`, 'error');
      return;
    }

    // Purchase each missing ingredient
    missingItems.forEach((m) => {
      const res = buyIngredient(m.id, m.missing);
      if (res.success) {
        deductCash(res.totalCost);
      }
    });

    audioService.playCashRegister();
    useGameStore.getState().showNotification(`Đã mua nhanh đủ toàn bộ nguyên liệu cho đơn hàng lớn!`, 'success');
  };

  const handleAccept = () => {
    const res = acceptOffer();
    if (res.success) {
      audioService.playFanfare();
    }
  };

  const getCustomerTypeLabel = (type: string) => {
    switch (type) {
      case 'company': return '🏢 Doanh nghiệp / Công ty';
      case 'school': return '🎓 Trường học / Hội sinh viên';
      case 'gym': return '🏋️ Trung tâm Thể hình & Yoga';
      case 'event': return '🎉 Sự kiện & Hội nghị';
      case 'birthday': return '🎂 Tiệc sinh nhật & Gia đình';
      case 'sports': return '🏃 Giải chạy & Thể thao';
      case 'reseller': return '🛍️ Chuỗi đại lý / Bán lẻ';
      default: return '👤 Khách hàng thân thiết';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 select-none">
      <div className="bg-[#FAF4ED] text-[#3D2619] w-full max-w-md rounded-3xl border-3 border-[#542810] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#542810] via-[#6D3416] to-[#542810] text-amber-100 px-3.5 py-2.5 flex items-center justify-between border-b-2 border-[#3D1E0B]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <div>
              <h3 className="text-sm font-black font-['Comfortaa',sans-serif] text-amber-200 leading-tight">
                Cơ Hội Đơn Hàng Lớn
              </h3>
              <p className="text-[10px] text-amber-300/80">Đặt sỉ số lượng lớn từ đối tác</p>
            </div>
          </div>
          <button
            onClick={closeOfferModal}
            className="p-1 text-amber-200 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2.5">
          
          {/* 1. Client Card */}
          <div className="bg-white p-2.5 rounded-2xl border border-amber-900/20 shadow-xs flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl p-1 bg-amber-50 rounded-xl border border-amber-200 shadow-2xs shrink-0">
                {activeOffer.customer.avatar}
              </span>
              <div>
                <h4 className="text-xs font-black text-[#3D2619] leading-tight">
                  {activeOffer.customer.name}
                </h4>
                <p className="text-[10px] text-amber-900 font-bold mt-0.5">
                  {getCustomerTypeLabel(activeOffer.customer.type)}
                </p>
                <p className="text-[9.5px] text-stone-500 line-clamp-1 italic mt-0.5">
                  "{activeOffer.customer.description}"
                </p>
              </div>
            </div>

            {/* Reliability Badge */}
            <div className="text-right shrink-0 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200">
              <span className="text-[9px] text-stone-500 font-bold block">Độ uy tín</span>
              <span className="text-xs font-black text-emerald-700">
                🤝 {activeOffer.customer.reliability}%
              </span>
            </div>
          </div>

          {/* 2. Order Details: Quantity, Revenue & Deposit */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 p-3 rounded-2xl border-2 border-amber-300 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/80">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl">{activeOffer.recipeIcon}</span>
                <div>
                  <span className="text-xs font-black text-[#3D2619] block leading-tight">
                    {activeOffer.quantity} × {activeOffer.recipeName}
                  </span>
                  <span className="text-[10px] text-stone-600 font-bold">
                    Đơn giá sỉ: {formatVND(activeOffer.pricePerItem)} / ly
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9.5px] font-bold text-stone-500 block">Tổng doanh thu</span>
                <span className="text-base font-black text-[#E05338] tabular-nums">
                  +{formatVND(activeOffer.totalRevenue)}
                </span>
              </div>
            </div>

            {/* Deposit & Risk Metrics */}
            <div className="grid grid-cols-2 gap-2 text-[10.5px]">
              <div className="bg-white p-2 rounded-xl border border-amber-200/70 flex flex-col justify-between">
                <span className="text-[9px] text-stone-500 font-bold flex items-center gap-1">
                  <CreditCard size={11} className="text-amber-600" />
                  <span>Tiền cọc trước</span>
                </span>
                <span className={`font-black mt-0.5 ${activeOffer.depositAmount > 0 ? 'text-emerald-700' : 'text-stone-500'}`}>
                  {activeOffer.depositAmount > 0 
                    ? `+${formatVND(activeOffer.depositAmount)} (${Math.round(activeOffer.depositPercent * 100)}%)` 
                    : 'Không cọc'}
                </span>
              </div>

              <div className="bg-white p-2 rounded-xl border border-amber-200/70 flex flex-col justify-between">
                <span className="text-[9px] text-stone-500 font-bold flex items-center gap-1">
                  <AlertTriangle size={11} className="text-rose-600" />
                  <span>Tỷ lệ bom hàng</span>
                </span>
                <span className={`font-black mt-0.5 ${riskInfo.colorClass}`}>
                  {Math.round(activeOffer.cancellationRisk * 100)}% ({riskInfo.label.split(' ')[1]})
                </span>
              </div>
            </div>

            {/* Opportunity cost notice */}
            <div className="p-2 rounded-xl bg-amber-100/70 border border-amber-300/80 text-[10px] text-amber-950 flex items-start gap-1.5">
              <Users size={13} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-tight">
                <span className="font-bold">Chi phí cơ hội: </span>
                <span>Quán sẽ tạm đóng quầy phục vụ khách lẻ trong khoảng </span>
                <span className="font-black text-amber-900">{activeOffer.productionDurationMinutes} phút</span>
                <span> (Ước tính mất ~{formatVND(activeOffer.opportunityCostEstimate)} doanh thu khách lẻ).</span>
              </div>
            </div>
          </div>

          {/* 3. Required Ingredients Status */}
          <div className="bg-white p-2.5 rounded-2xl border border-amber-900/20 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#3D2619] flex items-center gap-1">
                <Package size={13} className="text-amber-700" />
                <span>Kiểm tra nguyên liệu trong kho</span>
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${hasAllIngredients ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {hasAllIngredients ? '✅ Đủ nguyên liệu' : '⚠️ Thiếu nguyên liệu'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {ingredientStatus.map((ing) => (
                <div
                  key={ing.id}
                  className={`p-1.5 rounded-xl border flex items-center justify-between text-[10.5px] ${
                    ing.isEnough
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    <span>{ing.icon}</span>
                    <span className="font-bold truncate text-[10px]">{ing.name}</span>
                  </div>
                  <span className="font-black tabular-nums shrink-0 ml-1 text-[10px]">
                    {ing.available}/{ing.required} {ing.unit} {ing.isEnough ? '✓' : '❌'}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick buy button if missing */}
            {!hasAllIngredients && (
              <div className="pt-1.5 flex gap-1.5">
                <button
                  onClick={handleQuickBuyAllMissing}
                  className="flex-1 py-1.5 px-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <ShoppingBag size={12} />
                  <span>Mua nhanh các món thiếu</span>
                </button>
                <button
                  onClick={() => {
                    closeOfferModal();
                    setActiveTab('inventory');
                  }}
                  className="px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Vào kho
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Action Footer */}
        <div className="bg-[#EEDCC8] px-3.5 py-2.5 border-t-2 border-[#D8C2AC] flex items-center gap-2">
          <button
            onClick={declineOffer}
            className="w-1/3 py-2 bg-stone-200 hover:bg-stone-300 active:scale-95 text-stone-700 font-black text-xs rounded-2xl border border-stone-400/60 transition-all cursor-pointer shadow-2xs"
          >
            Từ chối
          </button>
          
          <button
            onClick={handleAccept}
            disabled={!hasAllIngredients}
            className={`w-2/3 py-2 font-black text-xs rounded-2xl border transition-all flex items-center justify-center gap-1.5 shadow-md ${
              hasAllIngredients
                ? 'bg-gradient-to-r from-[#F26440] to-[#E05338] hover:from-[#E05338] hover:to-[#D2442A] text-white border-amber-900 active:scale-95 cursor-pointer animate-pulse'
                : 'bg-stone-300 text-stone-500 border-stone-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>{hasAllIngredients ? 'NHẬN ĐƠN NGAY' : 'CHƯA ĐỦ NGUYÊN LIỆU'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
