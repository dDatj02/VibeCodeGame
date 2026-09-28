import React, { useState } from 'react';
import { useInvestmentStore } from '../../stores/investmentStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useShopStore } from '../../stores/shopStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { PropertyItem, LandProperty, HouseProperty } from '../../types/investment';
import { 
  Landmark, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  KeyRound, 
  Plus, 
  ShieldCheck, 
  ShieldAlert, 
  Coins, 
  Building2, 
  FolderLock, 
  History, 
  Home, 
  TreePine,
  DollarSign,
  Store,
  Clock
} from 'lucide-react';

export const InvestmentHub: React.FC = () => {
  const cash = useEconomyStore((state) => state.cash);
  const availableLand = useInvestmentStore((state) => state.availableLand);
  const availableHouses = useInvestmentStore((state) => state.availableHouses);
  const ownedProperties = useInvestmentStore((state) => state.ownedProperties);
  const investmentHistory = useInvestmentStore((state) => state.investmentHistory);
  const totalRealizedProfit = useInvestmentStore((state) => state.totalRealizedProfit);
  const openPropertyModal = useInvestmentStore((state) => state.openPropertyModal);
  const getTotalPropertyMarketValue = useInvestmentStore((state) => state.getTotalPropertyMarketValue);
  const getTotalUnrealizedProfit = useInvestmentStore((state) => state.getTotalUnrealizedProfit);
  const getTotalMonthlyRentalIncome = useInvestmentStore((state) => state.getTotalMonthlyRentalIncome);

  const [subTab, setSubTab] = useState<'land' | 'house' | 'gold' | 'commercial' | 'portfolio' | 'history'>('land');

  const totalPropertyValue = getTotalPropertyMarketValue();
  const totalUnrealized = getTotalUnrealizedProfit();
  const totalMonthlyRent = getTotalMonthlyRentalIncome();
  const activeRentalsCount = ownedProperties.filter((p) => p.isRented).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none text-[#3D2619]">
      
      {/* 1. TOP METRICS DASHBOARD (Compact Grid) */}
      <div className="shrink-0 p-2 bg-gradient-to-r from-amber-950 via-[#4A2411] to-amber-900 text-white rounded-2xl shadow-xs mb-2 border-2 border-amber-800">
        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
          
          <div className="bg-black/30 p-1.5 rounded-xl border border-amber-700/50">
            <span className="text-[9px] text-amber-200/80 font-bold block">Tổng Giá Trị BĐS</span>
            <span className="text-xs font-black text-amber-300 tabular-nums">
              {formatVND(totalPropertyValue)}
            </span>
          </div>

          <div className="bg-black/30 p-1.5 rounded-xl border border-amber-700/50">
            <span className="text-[9px] text-amber-200/80 font-bold block">Thuê ({activeRentalsCount} căn)</span>
            <span className="text-xs font-black text-emerald-400 tabular-nums">
              +{formatVND(totalMonthlyRent)}/th
            </span>
          </div>

          <div className="bg-black/30 p-1.5 rounded-xl border border-amber-700/50">
            <span className="text-[9px] text-amber-200/80 font-bold block">Lãi Đã Chốt</span>
            <span className={`text-xs font-black tabular-nums ${totalRealizedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalRealizedProfit >= 0 ? '+' : ''}{formatVND(totalRealizedProfit)}
            </span>
          </div>

        </div>
      </div>

      {/* 2. CATEGORY PILLS BAR */}
      <div className="shrink-0 flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 mb-1">
        <button
          onClick={() => {
            audioService.playClick();
            setSubTab('land');
          }}
          className={`px-2.5 py-1 text-xs font-black rounded-xl flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer shadow-2xs ${
            subTab === 'land'
              ? 'bg-[#E05338] text-white'
              : 'bg-white text-stone-700 border border-stone-200'
          }`}
        >
          <TreePine size={12} />
          <span>Đất Đai ({availableLand.length})</span>
        </button>

        <button
          onClick={() => {
            audioService.playClick();
            setSubTab('house');
          }}
          className={`px-2.5 py-1 text-xs font-black rounded-xl flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer shadow-2xs ${
            subTab === 'house'
              ? 'bg-[#E05338] text-white'
              : 'bg-white text-stone-700 border border-stone-200'
          }`}
        >
          <Home size={12} />
          <span>Nhà Phố ({availableHouses.length})</span>
        </button>

        <button
          onClick={() => {
            audioService.playClick();
            setSubTab('portfolio');
          }}
          className={`px-2.5 py-1 text-xs font-black rounded-xl flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer shadow-2xs ${
            subTab === 'portfolio'
              ? 'bg-[#E05338] text-white'
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}
        >
          <FolderLock size={12} />
          <span>Đã Sở Hữu ({ownedProperties.length})</span>
        </button>

        <button
          onClick={() => {
            audioService.playClick();
            setSubTab('history');
          }}
          className={`px-2.5 py-1 text-xs font-black rounded-xl flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer shadow-2xs ${
            subTab === 'history'
              ? 'bg-[#E05338] text-white'
              : 'bg-white text-stone-700 border border-stone-200'
          }`}
        >
          <History size={12} />
          <span>Nhật Ký</span>
        </button>

        <button
          onClick={() => {
            audioService.playClick();
            setSubTab('gold');
          }}
          className="px-2 py-1 text-xs font-bold rounded-xl flex items-center gap-1 bg-stone-100 text-stone-400 border border-stone-200 whitespace-nowrap"
        >
          <Coins size={12} />
          <span>Vàng 9999</span>
        </button>

        <button
          onClick={() => {
            audioService.playClick();
            setSubTab('commercial');
          }}
          className="px-2 py-1 text-xs font-bold rounded-xl flex items-center gap-1 bg-stone-100 text-stone-400 border border-stone-200 whitespace-nowrap"
        >
          <Building2 size={12} />
          <span>Toà Nhà Sỉ</span>
        </button>
      </div>

      {/* 3. CONTENT AREA (Internal Scrollable Area) */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-2">
        
        {/* SUBTAB: LAND MARKET */}
        {subTab === 'land' && (
          <div className="space-y-2">
            {availableLand.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 font-bold bg-white rounded-2xl border border-dashed border-stone-300">
                🌳 Bạn đã mua hết các lô đất trên thị trường!
              </div>
            ) : (
              availableLand.map((land) => (
                <div
                  key={land.id}
                  onClick={() => {
                    audioService.playClick();
                    openPropertyModal(land);
                  }}
                  className="p-3 bg-white hover:bg-amber-50/40 rounded-2xl border border-amber-200/80 shadow-xs cursor-pointer transition-all active:scale-98 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl p-1 bg-amber-50 rounded-xl shrink-0">
                        {land.icon}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-[#3D2619] truncate leading-tight">
                          {land.name}
                        </h4>
                        <span className="text-[10px] text-stone-500 font-bold flex items-center gap-1">
                          <MapPin size={9} />
                          <span>{land.location} · {land.area}m²</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-[#E05338] tabular-nums block">
                        {formatVND(land.purchasePrice)}
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                        land.riskLevel === 'low' ? 'bg-emerald-100 text-emerald-800' : land.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {land.riskLevel === 'low' ? 'An toàn' : land.riskLevel === 'medium' ? 'Rủi ro TB' : 'Đầu cơ'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-stone-600 pt-1 border-t border-stone-100">
                    <span>Cho thuê dự kiến: <strong className="text-emerald-700">+{formatVND(land.rentalPotentialMonthly)}/th</strong></span>
                    <span className="text-[10px] text-amber-800 font-bold">
                      {land.isChecked ? '✓ Đã thẩm định' : 'Thẩm định 400k'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SUBTAB: HOUSE MARKET */}
        {subTab === 'house' && (
          <div className="space-y-2">
            {availableHouses.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 font-bold bg-white rounded-2xl border border-dashed border-stone-300">
                🏠 Bạn đã sở hữu toàn bộ nhà phố đang chào bán!
              </div>
            ) : (
              availableHouses.map((house) => (
                <div
                  key={house.id}
                  onClick={() => {
                    audioService.playClick();
                    openPropertyModal(house);
                  }}
                  className="p-3 bg-white hover:bg-amber-50/40 rounded-2xl border border-amber-200/80 shadow-xs cursor-pointer transition-all active:scale-98 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl p-1 bg-amber-50 rounded-xl shrink-0">
                        {house.icon}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-[#3D2619] truncate leading-tight">
                          {house.name}
                        </h4>
                        <span className="text-[10px] text-stone-500 font-bold flex items-center gap-1">
                          <MapPin size={9} />
                          <span>{house.location} · {house.area}m² · Mới {house.condition}%</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-[#E05338] tabular-nums block">
                        {formatVND(house.purchasePrice)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 block">
                        Thuê: +{formatVND(house.rentalIncomeMonthly)}/th
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-stone-600 pt-1 border-t border-stone-100">
                    <span>Độ mới: <strong className="text-amber-800">{house.condition}%</strong></span>
                    <span className="text-[#E05338] font-bold text-[10px]">Xem & Đầu Tư →</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SUBTAB: MY PORTFOLIO */}
        {subTab === 'portfolio' && (
          <div className="space-y-2">
            {ownedProperties.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 font-bold bg-white rounded-2xl border border-dashed border-stone-300 space-y-1">
                <span className="text-2xl block">💼</span>
                <span>Bạn chưa sở hữu bất động sản nào.</span>
                <p className="text-[10px] text-stone-400">Hãy chọn tab Đất Đai hoặc Nhà Phố để mua tích sản và nhận tiền thuê thụ động!</p>
              </div>
            ) : (
              ownedProperties.map((prop) => {
                const diff = prop.currentMarketValue - (prop.originalPurchasePrice || prop.purchasePrice);
                return (
                  <div
                    key={prop.id}
                    onClick={() => {
                      audioService.playClick();
                      openPropertyModal(prop);
                    }}
                    className="p-3 bg-white hover:bg-amber-50/40 rounded-2xl border-2 border-amber-300 shadow-xs cursor-pointer transition-all active:scale-98 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl p-1 bg-amber-50 rounded-xl shrink-0">
                          {prop.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <h4 className="text-xs font-black text-[#3D2619] truncate">
                              {prop.name}
                            </h4>
                            <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-full ${
                              prop.isRented ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {prop.isRented ? 'Đang Thuê' : 'Trống'}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-500 font-bold block">
                            {prop.location} · {prop.area}m²
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-amber-900 tabular-nums block">
                          {formatVND(prop.currentMarketValue)}
                        </span>
                        <span className={`text-[10px] font-bold tabular-nums block ${diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {diff >= 0 ? '+' : ''}{formatVND(diff)}
                        </span>
                      </div>
                    </div>

                    {prop.isRented && prop.activeRentalContract && (
                      <div className="p-1.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[10px] font-bold text-emerald-950 flex items-center justify-between">
                        <span>{prop.activeRentalContract.tenantAvatar} {prop.activeRentalContract.tenantName}</span>
                        <span className="font-black text-emerald-700">+{formatVND(prop.activeRentalContract.dailyRent)}/ngày</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* SUBTAB: HISTORY */}
        {subTab === 'history' && (
          <div className="space-y-1.5">
            {investmentHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 font-bold bg-white rounded-2xl border border-dashed border-stone-300">
                📜 Chưa có lịch sử giao dịch đầu tư bất động sản.
              </div>
            ) : (
              investmentHistory.map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 bg-white rounded-xl border border-amber-200/70 shadow-2xs flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-[#3D2619] block text-[11px]">
                      {tx.description}
                    </span>
                    <span className="text-[9.5px] text-stone-500">
                      Ngày {tx.day} · {tx.type === 'buy' ? 'Mua vào' : tx.type === 'sell' ? 'Bán ra' : tx.type === 'rent_income' ? 'Tiền thuê' : 'Bảo dưỡng/Sửa'}
                    </span>
                  </div>

                  <span className={`font-black tabular-nums text-xs ${tx.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {tx.amount >= 0 ? `+${formatVND(tx.amount)}` : formatVND(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* SUBTAB: GOLD PREVIEW */}
        {subTab === 'gold' && (
          <div className="p-6 bg-amber-50/70 border border-amber-300 rounded-2xl text-center space-y-2">
            <span className="text-3xl block">🪙</span>
            <h4 className="text-xs font-black text-amber-950">Thị Trường Vàng SJC & Nhẫn Trơn</h4>
            <p className="text-[10px] text-stone-600 leading-relaxed">
              Kênh tích sản chống lạm phát và dự trữ phòng thủ cho chuỗi quán sinh tố. Tính năng đang được cập nhật trong bản mở rộng tiếp theo!
            </p>
          </div>
        )}

        {/* SUBTAB: COMMERCIAL PROPERTY PREVIEW */}
        {subTab === 'commercial' && (
          <div className="p-6 bg-amber-50/70 border border-amber-300 rounded-2xl text-center space-y-2">
            <span className="text-3xl block">🏢</span>
            <h4 className="text-xs font-black text-amber-950">Tòa Nhà Văn Phòng & Shophouse</h4>
            <p className="text-[10px] text-stone-600 leading-relaxed">
              Các tổ hợp trung tâm thương mại và tòa nhà văn phòng cho thuê quy mô lớn. Tính năng đang được cập nhật trong bản mở rộng tiếp theo!
            </p>
          </div>
        )}

      </div>

    </div>
  );
};
