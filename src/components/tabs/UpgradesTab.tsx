import React from 'react';
import { useShopStore } from '../../stores/shopStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useGameStore } from '../../stores/gameStore';
import { SHOP_LEVELS } from '../../data/upgrades';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { Sparkles, Users, Wrench, ArrowUpRight, Check, ArrowLeft } from 'lucide-react';

export const UpgradesTab: React.FC = () => {
  const currentShopLevel = useShopStore((state) => state.currentShopLevel);
  const equipment = useShopStore((state) => state.equipment);
  const employees = useShopStore((state) => state.employees);
  const upgradeEquipment = useShopStore((state) => state.upgradeEquipment);
  const hireEmployee = useShopStore((state) => state.hireEmployee);
  const fireEmployee = useShopStore((state) => state.fireEmployee);
  const upgradeShopLevel = useShopStore((state) => state.upgradeShopLevel);

  const cash = useEconomyStore((state) => state.cash);
  const deductCash = useEconomyStore((state) => state.deductCash);
  const showNotification = useGameStore((state) => state.showNotification);
  const setActiveTab = useGameStore((state) => state.setActiveTab);

  const currentLevelConfig = SHOP_LEVELS.find((l) => l.level === currentShopLevel);
  const nextLevelConfig = SHOP_LEVELS.find((l) => l.level === currentShopLevel + 1);

  const handleUpgradeShop = () => {
    if (!nextLevelConfig) return;
    if (cash < nextLevelConfig.upgradeCost) {
      audioService.playDisappointed();
      showNotification('Chưa đủ tiền mặt để nâng cấp mặt bằng tiệm!', 'error');
      return;
    }

    deductCash(nextLevelConfig.upgradeCost);
    upgradeShopLevel();
    audioService.playFanfare();
    showNotification(`Chúc mừng! Quán đã nâng cấp lên: ${nextLevelConfig.title}!`, 'success');
  };

  const handleUpgradeEquipment = (equipmentId: string) => {
    const item = equipment.find((e) => e.id === equipmentId);
    if (!item || item.level >= item.maxLevel) return;

    if (cash < item.currentCost) {
      audioService.playDisappointed();
      showNotification('Không đủ tiền mặt để nâng cấp thiết bị này!', 'error');
      return;
    }

    deductCash(item.currentCost);
    upgradeEquipment(equipmentId);
    audioService.playCashRegister();
    showNotification(`Đã nâng cấp ${item.name} lên cấp ${item.level + 1}!`, 'success');
  };

  const handleToggleEmployee = (empId: string, hired: boolean, salary: number) => {
    if (hired) {
      fireEmployee(empId);
      audioService.playClick();
      showNotification('Đã cho nhân viên nghỉ việc.', 'info');
    } else {
      if (cash < salary) {
        audioService.playDisappointed();
        showNotification('Cần có đủ tiền mặt ít nhất cho 1 ngày lương để tuyển!', 'error');
        return;
      }
      hireEmployee(empId);
      audioService.playFanfare();
      showNotification('Đã tuyển nhân viên mới thành công!', 'success');
    }
  };

  return (
    <div className="flex-1 h-full max-h-full flex flex-col bg-[#FBF7F0] text-[#3D2619] p-2 max-w-lg mx-auto w-full select-none overflow-hidden">
      <div className="shrink-0 mb-1.5">
        <div className="flex items-center gap-1.5 mb-1">
          <button
            onClick={() => setActiveTab('shop')}
            className="p-1 hover:bg-[#F0D5C3]/40 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} className="text-[#E05338]" />
          </button>
          <h2 className="text-sm sm:text-base font-extrabold text-[#3D2619] font-['Comfortaa',sans-serif]">
            Nâng Cấp & Tuyển Nhân Viên
          </h2>
        </div>
      </div>

      {/* Internal Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2 pb-2">

      {/* 1. Shop Level Progression Banner */}
      <div className="p-4 bg-gradient-to-r from-[#F26440] to-[#E05338] text-white rounded-2xl mb-4 shadow-sm border border-[#D2442A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-amber-200 font-extrabold uppercase tracking-wide">
              <Sparkles size={14} />
              <span>Tiến Trình Phát Triển Mặt Bằng</span>
            </div>
            <h3 className="text-base font-black font-['Comfortaa',sans-serif] mt-0.5">
              Cấp {currentShopLevel}: {currentLevelConfig?.title}
            </h3>
            <p className="text-xs text-white/90 mt-1 max-w-xl">
              {currentLevelConfig?.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-white/90 mt-2 font-bold">
              <span>Hàng đợi: <strong>{currentLevelConfig?.maxQueueCapacity} khách</strong></span>
              <span>·</span>
              <span>Thuê: <strong>{formatVND(currentLevelConfig?.dailyRent || 0)}/ngày</strong></span>
              <span>·</span>
              <span>Khách: <strong className="text-amber-200">x{currentLevelConfig?.trafficMultiplier}</strong></span>
            </div>
          </div>

          {nextLevelConfig && (
            <button
              onClick={handleUpgradeShop}
              className="px-4 py-2 bg-amber-300 hover:bg-amber-200 text-[#3D2619] font-black text-xs rounded-xl shadow active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              Lên Cấp {nextLevelConfig.level} ({formatVND(nextLevelConfig.upgradeCost)})
            </button>
          )}
        </div>
      </div>

      {/* 2. Equipment Upgrades Grid */}
      <div className="mb-5">
        <h3 className="text-xs font-extrabold text-[#3D2619] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Wrench size={14} className="text-[#E05338]" />
          <span>Nâng Cấp Thiết Bị Tiệm</span>
        </h3>

        <div className="space-y-2">
          {equipment.map((eq) => {
            const isMax = eq.level >= eq.maxLevel;
            return (
              <div
                key={eq.id}
                className="p-3 bg-white border border-[#F0D5C3] rounded-2xl flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-[#FFF9F2] border border-[#F2DECC] flex items-center justify-center text-2xl shrink-0">
                        {eq.icon}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-[#3D2619] flex items-center gap-1.5">
                          <span>{eq.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-bold">
                            Cấp {eq.level}/{eq.maxLevel}
                          </span>
                        </h4>
                        <span className="text-[10px] text-[#9E735B]">
                          Tiền điện: {formatVND(eq.electricityCostPerDay * eq.level)}/ngày
                        </span>
                      </div>
                    </div>

                    {!isMax && (
                      <span className="text-xs font-black text-[#E05338] tabular-nums">
                        {formatVND(eq.currentCost)}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#78513E] mt-2 leading-snug">{eq.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#F0D5C3]/60 flex items-center justify-end">
                  <button
                    onClick={() => handleUpgradeEquipment(eq.id)}
                    disabled={isMax}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                      isMax
                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        : 'bg-[#F26440] hover:bg-[#E05338] text-white shadow-xs active:scale-95'
                    }`}
                  >
                    {isMax ? (
                      <>
                        <Check size={12} /> <span>Đạt cấp tối đa</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight size={12} />
                        <span>Nâng Cấp ({formatVND(eq.currentCost)})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Employee Hiring */}
      <div className="pb-8">
        <h3 className="text-xs font-extrabold text-[#3D2619] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Users size={14} className="text-[#E05338]" />
          <span>Đội Ngũ Nhân Viên ({employees.filter((e) => e.hired).length} đang làm)</span>
        </h3>

        <div className="space-y-2">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className={`p-3 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                emp.hired
                  ? 'bg-[#FFF9F2] border-[#E05338]'
                  : 'bg-white border-[#F0D5C3]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-[#F0D5C3] flex items-center justify-center text-2xl shrink-0">
                      {emp.avatar}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-[#3D2619] flex items-center gap-1.5">
                        <span>{emp.name}</span>
                        <span className="text-[10px] text-[#9E735B]">
                          ({emp.role === 'barista' ? 'Pha chế' : emp.role === 'server' ? 'Phục vụ' : 'Dọn dẹp'})
                        </span>
                      </h4>
                      <span className="text-[11px] text-emerald-700 font-bold">
                        Lương: {formatVND(emp.salaryPerDay)} / ngày
                      </span>
                    </div>
                  </div>

                  {emp.hired && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      Đang làm việc
                    </span>
                  )}
                </div>

                <div className="mt-2 text-[11px] text-[#5C3A21]">
                  <span className="font-bold text-[#E05338]">Đặc điểm: {emp.trait}</span>
                  <p className="text-[10px] text-[#78513E] mt-0.5">{emp.traitDescription}</p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#F0D5C3]/60 flex items-center justify-end">
                <button
                  onClick={() => handleToggleEmployee(emp.id, emp.hired, emp.salaryPerDay)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    emp.hired
                      ? 'bg-stone-200 hover:bg-rose-600 hover:text-white text-stone-700'
                      : 'bg-[#F26440] hover:bg-[#E05338] text-white shadow-xs active:scale-95'
                  }`}
                >
                  {emp.hired ? 'Cho Nghỉ Việc' : `Tuyển Dụng (${formatVND(emp.salaryPerDay)}/ngày)`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};
