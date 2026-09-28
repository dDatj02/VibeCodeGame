import React from 'react';
import { useLargeOrderStore } from '../../stores/largeOrderStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { Zap, AlertTriangle, Users, Clock, PackageCheck } from 'lucide-react';
import { BOOST_COST } from '../../config/largeOrderConfig';

export const LargeOrderBanner: React.FC = () => {
  const activeOrder = useLargeOrderStore((state) => state.activeOrder);
  const boostProduction = useLargeOrderStore((state) => state.boostProduction);
  const handleEventChoice = useLargeOrderStore((state) => state.handleEventChoice);

  if (!activeOrder || activeOrder.status !== 'producing') return null;

  const progressPercent = Math.round((activeOrder.progressCount / activeOrder.quantity) * 100);
  const remainingMinutes = Math.floor(activeOrder.remainingProductionSeconds / 60);
  const remainingSeconds = Math.round(activeOrder.remainingProductionSeconds % 60);
  const timeFormatted = `${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

  const hasEvent = Boolean(activeOrder.activeEvent);

  return (
    <div className="shrink-0 bg-gradient-to-r from-amber-900 via-[#4A2411] to-amber-950 text-white border-b-2 border-amber-600/60 p-2 shadow-md select-none z-20">
      <div className="max-w-2xl mx-auto flex flex-col gap-1.5">
        
        {/* Top Line: Status Badge + Customer info + Time */}
        <div className="flex items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="bg-amber-500 text-stone-900 font-black text-[9.5px] px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-pulse shadow-2xs">
              <span>🔒</span>
              <span>ĐANG ĐÓNG QUẦY LÀM ĐƠN SỈ</span>
            </span>
            <span className="font-bold text-amber-200 truncate text-[11px]">
              {activeOrder.customer.avatar} {activeOrder.customer.name}
            </span>
          </div>

          <div className="flex items-center gap-1 font-black text-amber-300 tabular-nums shrink-0 text-[11px] bg-black/40 px-2 py-0.5 rounded-full border border-amber-700/50">
            <Clock size={11} className="text-amber-400" />
            <span>⏱️ {timeFormatted}</span>
          </div>
        </div>

        {/* Progress Bar & Smoothie Count */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="flex items-center gap-1 text-amber-100">
              <span>{activeOrder.recipeIcon}</span>
              <span>{activeOrder.recipeName}</span>
            </span>
            <span className="text-amber-300 font-black tabular-nums">
              {activeOrder.progressCount} / {activeOrder.quantity} ly ({progressPercent}%)
            </span>
          </div>

          <div className="w-full bg-stone-950/80 h-2.5 rounded-full overflow-hidden border border-amber-700/60 p-0.5">
            <div
              className="bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Bottom Line: Revenue, Lost customers opportunity cost, and Boost button */}
        <div className="flex items-center justify-between gap-1 text-[10px] pt-0.5 border-t border-amber-800/40">
          <div className="flex items-center gap-2 text-amber-200">
            <span className="font-black text-emerald-400">
              💰 +{formatVND(activeOrder.totalRevenue)}
            </span>
            {activeOrder.lostCustomersCount > 0 && (
              <span className="text-rose-300 flex items-center gap-0.5 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-800/40">
                <Users size={10} />
                <span>Từ chối: {activeOrder.lostCustomersCount} khách lẻ</span>
              </span>
            )}
          </div>

          {/* Speed Boost Button */}
          {!activeOrder.isBoosted ? (
            <button
              onClick={() => {
                audioService.playClick();
                boostProduction();
              }}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black px-2 py-0.5 rounded-lg border border-amber-300 shadow-xs cursor-pointer transition-all text-[10px]"
              title="Bật tăng tốc máy xay (+35% tốc độ)"
            >
              <Zap size={10} className="fill-stone-950" />
              <span>Tăng tốc ({formatVND(BOOST_COST)})</span>
            </button>
          ) : (
            <span className="text-[10px] font-black text-amber-300 bg-amber-900/80 px-2 py-0.5 rounded-lg border border-amber-500/60 flex items-center gap-1 animate-pulse">
              <Zap size={10} className="text-amber-400" />
              <span>Đang Tăng Tốc +35%</span>
            </span>
          )}
        </div>

        {/* Business Event Alert inside production */}
        {hasEvent && activeOrder.activeEvent && (
          <div className="mt-1 p-2 bg-gradient-to-r from-red-900/90 to-amber-900/90 border-2 border-amber-400 rounded-xl flex flex-col gap-1.5 shadow-lg animate-bounce-subtle">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-200">
              <span className="text-base">{activeOrder.activeEvent.icon}</span>
              <span className="text-amber-100">{activeOrder.activeEvent.title}</span>
            </div>
            <p className="text-[10px] text-amber-200 leading-tight">
              {activeOrder.activeEvent.description}
            </p>
            <div className="grid grid-cols-2 gap-1.5 mt-0.5">
              {activeOrder.activeEvent.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEventChoice(idx)}
                  className={`px-2 py-1 rounded-lg text-[9.5px] font-black transition-all active:scale-95 cursor-pointer shadow-2xs border ${
                    choice.cost
                      ? 'bg-amber-400 hover:bg-amber-300 text-stone-900 border-amber-200'
                      : 'bg-stone-800 hover:bg-stone-700 text-amber-200 border-stone-600'
                  }`}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
