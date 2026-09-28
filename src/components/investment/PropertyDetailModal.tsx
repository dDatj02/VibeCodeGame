import React from 'react';
import { useInvestmentStore } from '../../stores/investmentStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useGameStore } from '../../stores/gameStore';
import { PropertyItem, HouseProperty, LandProperty } from '../../types/investment';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { PropertyMarket } from '../../systems/investment/PropertyMarket';
import { 
  X, 
  MapPin, 
  Maximize2, 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck, 
  KeyRound, 
  Wrench, 
  Store, 
  Trash2, 
  CreditCard,
  DollarSign,
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';

export const PropertyDetailModal: React.FC = () => {
  const selectedProperty = useInvestmentStore((state) => state.selectedPropertyModal);
  const closePropertyModal = useInvestmentStore((state) => state.closePropertyModal);
  const buyProperty = useInvestmentStore((state) => state.buyProperty);
  const inspectProperty = useInvestmentStore((state) => state.inspectProperty);
  const sellProperty = useInvestmentStore((state) => state.sellProperty);
  const rentOutProperty = useInvestmentStore((state) => state.rentOutProperty);
  const terminateRental = useInvestmentStore((state) => state.terminateRental);
  const renovateHouse = useInvestmentStore((state) => state.renovateHouse);
  const convertPropertyToShop = useInvestmentStore((state) => state.convertPropertyToShop);

  const cash = useEconomyStore((state) => state.cash);

  if (!selectedProperty) return null;

  const isHouse = selectedProperty.propertyType === 'house';
  const house = isHouse ? (selectedProperty as HouseProperty) : null;
  const isOwned = selectedProperty.isOwned;
  const isRented = selectedProperty.isRented;

  const { netReceived, fee, realizedProfit } = PropertyMarket.calculateSellingProceeds(selectedProperty);
  const originalCost = selectedProperty.originalPurchasePrice || selectedProperty.purchasePrice;
  const unrealizedDiff = selectedProperty.currentMarketValue - originalCost;

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low': return { label: '🟢 Rủi ro thấp', bg: 'bg-emerald-100 text-emerald-800' };
      case 'medium': return { label: '🟡 Rủi ro trung bình', bg: 'bg-amber-100 text-amber-800' };
      case 'high': return { label: '🔴 Rủi ro cao', bg: 'bg-rose-100 text-rose-800' };
      default: return { label: '💀 Cực cao', bg: 'bg-purple-100 text-purple-800' };
    }
  };

  const riskBadge = getRiskBadge(selectedProperty.riskLevel);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#FAF4ED] text-[#3D2619] w-full max-w-md rounded-3xl border-3 border-[#542810] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#542810] via-[#6D3416] to-[#542810] text-amber-100 px-3.5 py-2.5 flex items-center justify-between border-b-2 border-[#3D1E0B]">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedProperty.icon}</span>
            <div>
              <h3 className="text-xs sm:text-sm font-black font-['Comfortaa',sans-serif] text-amber-200 leading-tight">
                {selectedProperty.name}
              </h3>
              <p className="text-[10px] text-amber-300/80 flex items-center gap-1">
                <MapPin size={10} />
                <span>{selectedProperty.location} · {selectedProperty.area}m²</span>
              </p>
            </div>
          </div>
          <button
            onClick={closePropertyModal}
            className="p-1 text-amber-200 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2.5 text-xs">
          
          {/* 1. Value & Ownership Status Banner */}
          <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
              <div>
                <span className="text-[9.5px] font-bold text-stone-500 block">
                  {isOwned ? 'Định Giá Thị Trường Hiện Tại' : 'Giá Chào Bán'}
                </span>
                <span className="text-base font-black text-[#E05338] tabular-nums">
                  {formatVND(selectedProperty.currentMarketValue)}
                </span>
              </div>

              <div className="text-right">
                <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${riskBadge.bg}`}>
                  {riskBadge.label}
                </span>
                {isOwned && (
                  <span className={`block text-[10px] font-bold mt-1 ${unrealizedDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    Lãi tạm tính: {unrealizedDiff >= 0 ? '+' : ''}{formatVND(unrealizedDiff)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-stone-600 italic leading-relaxed">
              "{selectedProperty.description}"
            </p>
          </div>

          {/* 2. Inspection & Legal Status */}
          <div className="bg-white p-2.5 rounded-2xl border border-amber-200 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-[#3D2619] text-[11px] flex items-center gap-1">
                {selectedProperty.isChecked ? (
                  <ShieldCheck size={14} className="text-emerald-600" />
                ) : (
                  <ShieldAlert size={14} className="text-amber-600" />
                )}
                <span>Tình trạng thẩm định pháp lý:</span>
              </span>

              <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${
                selectedProperty.isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedProperty.isChecked ? '✓ Đã thẩm định' : 'Chưa thẩm định'}
              </span>
            </div>

            {selectedProperty.isChecked && selectedProperty.inspectionReport ? (
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[10.5px] space-y-1 text-emerald-950">
                <p className="font-bold">✓ {selectedProperty.inspectionReport.zoningNotes}</p>
                <p className="text-stone-600 font-medium">📈 {selectedProperty.inspectionReport.growthForecast}</p>
              </div>
            ) : (
              <div className="p-2 bg-amber-50/80 rounded-xl border border-amber-200 text-[10.5px] text-amber-950 leading-snug">
                ⚠️ Mua trực tiếp có thể gặp cơ hội tăng giá khủng hoặc dính quy hoạch treo. Bạn có thể thuê chuyên gia thẩm định trước với phí {formatVND(selectedProperty.inspectionCost)}.
              </div>
            )}
          </div>

          {/* 3. House Condition & Renovation if House */}
          {house && (
            <div className="bg-white p-2.5 rounded-2xl border border-amber-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-[#3D2619] text-[11px] flex items-center gap-1">
                  <Wrench size={13} className="text-amber-700" />
                  <span>Chất lượng công trình:</span>
                </span>
                <span className="font-black text-amber-900 text-xs tabular-nums">
                  {house.condition}%
                </span>
              </div>

              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    house.condition >= 80 ? 'bg-emerald-500' : house.condition >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${house.condition}%` }}
                />
              </div>

              {isOwned && house.condition < 95 && (
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-stone-500 font-medium">
                    Cải tạo lại 100% (+20% giá trị, +25% tiền thuê):
                  </span>
                  <button
                    onClick={() => renovateHouse(house.id)}
                    className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-stone-900 font-black text-[10px] rounded-lg shadow-2xs active:scale-95 cursor-pointer"
                  >
                    Sửa ({formatVND(house.renovationCost)})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. Rental Status & Potential */}
          <div className="bg-white p-2.5 rounded-2xl border border-amber-200 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-[#3D2619] text-[11px] flex items-center gap-1">
                <KeyRound size={13} className="text-amber-700" />
                <span>Khai thác cho thuê:</span>
              </span>
              <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${
                isRented ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'
              }`}>
                {isRented ? '🟢 Đang cho thuê' : 'Đang trống'}
              </span>
            </div>

            {isRented && selectedProperty.activeRentalContract ? (
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[10.5px] space-y-1 text-emerald-950">
                <div className="flex items-center justify-between font-bold">
                  <span>Khách thuê: {selectedProperty.activeRentalContract.tenantAvatar} {selectedProperty.activeRentalContract.tenantName}</span>
                  <span className="font-black text-emerald-700">+{formatVND(selectedProperty.activeRentalContract.monthlyRent)}/tháng</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-stone-600">
                  <span>Thời hạn còn lại: {selectedProperty.activeRentalContract.daysRemaining} ngày</span>
                  <span>Độ uy tín: {selectedProperty.activeRentalContract.paymentReliability}%</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[10.5px] text-stone-600">
                <span>Tiềm năng thu nhập:</span>
                <span className="font-black text-emerald-700">
                  ~{formatVND(isHouse ? house!.rentalIncomeMonthly : (selectedProperty as LandProperty).rentalPotentialMonthly)} / tháng
                </span>
              </div>
            )}
          </div>

          {/* 5. Smoothie Shop Branch Conversion */}
          {isOwned && selectedProperty.usedForSmoothieShop && (
            <div className="p-2.5 bg-gradient-to-r from-orange-100 to-amber-100 rounded-2xl border border-orange-300 text-xs font-bold text-amber-950 flex items-center gap-2">
              <Store size={18} className="text-[#F26440] shrink-0" />
              <div>
                <span className="block font-black text-xs">Cơ sở chi nhánh sinh tố</span>
                <p className="text-[10px] text-stone-600 font-medium">Bất động sản này đang làm mặt bằng quán, giúp tiết kiệm tiền thuê!</p>
              </div>
            </div>
          )}

        </div>

        {/* Action Footer */}
        <div className="bg-[#EEDCC8] p-3 border-t-2 border-[#D8C2AC] flex flex-col gap-1.5">
          
          {/* CASE 1: NOT OWNED -> BUY / INSPECT ACTIONS */}
          {!isOwned ? (
            <div className="flex items-center gap-2">
              {!selectedProperty.isChecked && (
                <button
                  onClick={() => inspectProperty(selectedProperty.id)}
                  className="w-1/2 py-2.5 bg-white hover:bg-stone-100 text-stone-800 font-black text-xs rounded-2xl border border-stone-300 shadow-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span>Thẩm Định ({formatVND(selectedProperty.inspectionCost)})</span>
                </button>
              )}

              <button
                onClick={() => buyProperty(selectedProperty.id, true)}
                className={`py-2.5 bg-[#F26440] hover:bg-[#E05338] active:scale-95 text-white font-black text-xs rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1 ${
                  selectedProperty.isChecked ? 'w-full' : 'w-1/2'
                }`}
              >
                <DollarSign size={14} />
                <span>MUA NGAY ({formatVND(selectedProperty.purchasePrice)})</span>
              </button>
            </div>
          ) : (
            /* CASE 2: OWNED -> RENT / SELL / USE ACTIONS */
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                {!isRented ? (
                  <button
                    onClick={() => rentOutProperty(selectedProperty.id)}
                    className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    <KeyRound size={12} />
                    <span>Cho Thuê Ngay</span>
                  </button>
                ) : (
                  <button
                    onClick={() => terminateRental(selectedProperty.id)}
                    className="py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    <X size={12} />
                    <span>Dừng Cho Thuê</span>
                  </button>
                )}

                {!selectedProperty.usedForSmoothieShop ? (
                  <button
                    onClick={() => convertPropertyToShop(selectedProperty.id)}
                    className="py-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    <Store size={12} />
                    <span>Mở Quán Sinh Tố</span>
                  </button>
                ) : (
                  <span className="py-2 bg-amber-200 text-amber-900 font-black text-xs rounded-xl flex items-center justify-center gap-1">
                    ✓ Đang Mở Quán
                  </span>
                )}
              </div>

              {/* Sell button */}
              <button
                onClick={() => sellProperty(selectedProperty.id)}
                disabled={isRented}
                className={`w-full py-2.5 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1 ${
                  isRented
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 text-amber-200 active:scale-95 cursor-pointer'
                }`}
              >
                <span>CHUYỂN NHƯỢNG / BÁN</span>
                <span className="text-white">({formatVND(netReceived)})</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
