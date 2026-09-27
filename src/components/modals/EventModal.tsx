import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useReviewStore } from '../../stores/reviewStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';

export const EventModal: React.FC = () => {
  const currentEvent = useGameStore((state) => state.currentEvent);
  const dismissEvent = useGameStore((state) => state.dismissEvent);
  const showNotification = useGameStore((state) => state.showNotification);
  const cash = useEconomyStore((state) => state.cash);
  const deductCash = useEconomyStore((state) => state.deductCash);
  const addCash = useEconomyStore((state) => state.addCash);

  if (!currentEvent) return null;

  const handleChoice = (choice: (typeof currentEvent.choices)[0]) => {
    if (choice.cashCost && choice.cashCost > 0) {
      if (cash < choice.cashCost) {
        audioService.playDisappointed();
        showNotification('Bạn không đủ tiền mặt để chọn phương án này!', 'error');
        return;
      }
      deductCash(choice.cashCost);
    }

    if (choice.cashReward && choice.cashReward > 0) {
      addCash(choice.cashReward);
    }

    if (choice.ratingDelta && choice.ratingDelta !== 0) {
      const revStore = useReviewStore.getState();
      const newRating = Math.max(1, Math.min(5, Number((revStore.averageRating + choice.ratingDelta).toFixed(1))));
      useReviewStore.setState({ averageRating: newRating });
    }

    if (choice.trafficModifier && choice.trafficModifier > 1.2) {
      useReviewStore.getState().triggerViralReview();
    }

    audioService.playFanfare();
    showNotification(choice.toastMessage, 'success');
    dismissEvent();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
      <div className="bg-[#FBF7F0] border-2 border-[#E05338] rounded-2xl shadow-2xl max-w-sm w-full p-4 text-[#3D2619] flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-2 pb-2.5 border-b border-[#F0D5C3]">
          <span className="text-3xl">{currentEvent.icon}</span>
          <div>
            <span className="text-[10px] font-bold text-[#E05338] uppercase tracking-wide">
              Sự Kiện Bất Ngờ
            </span>
            <h2 className="text-sm font-extrabold text-[#3D2619] font-['Comfortaa',sans-serif]">
              {currentEvent.title}
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#5C3A21] leading-relaxed my-2.5">
          {currentEvent.description}
        </p>

        {/* Choices */}
        <div className="space-y-2 mt-1">
          {currentEvent.choices.map((choice, idx) => {
            const hasCost = choice.cashCost && choice.cashCost > 0;
            const canAfford = !hasCost || cash >= (choice.cashCost || 0);

            return (
              <button
                key={idx}
                onClick={() => handleChoice(choice)}
                disabled={!canAfford}
                className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  canAfford
                    ? 'bg-white hover:bg-[#FFF4E8] border-[#F0D5C3] hover:border-[#E05338] shadow-2xs active:scale-98'
                    : 'bg-[#FAF4ED] border-stone-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-100">{choice.text}</span>
                  {hasCost && (
                    <span className="text-[11px] font-extrabold text-amber-300 tabular-nums">
                      {formatVND(choice.cashCost!)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-400 mt-1">{choice.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
