import React, { useState, useEffect } from 'react';
import { UpdateService, CURRENT_RELEASE_INFO } from '../../services/UpdateService';
import { audioService } from '../../services/AudioService';
import { Sparkles, RefreshCw, X, ShieldCheck, Check, ArrowRight, Zap } from 'lucide-react';

export const PWAUpdatePrompt: React.FC = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStep, setUpdateStep] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);

  useEffect(() => {
    const unsubscribe = UpdateService.subscribe((updateAvailable) => {
      setHasUpdate(updateAvailable);
      if (updateAvailable) {
        setIsDismissed(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!hasUpdate || isDismissed) return null;

  const handleExecuteUpdate = async () => {
    audioService.playCashRegister();
    setIsUpdating(true);
    await UpdateService.executeSafeUpdate((step) => {
      setUpdateStep(step);
    });
  };

  return (
    <>
      {/* Floating Bottom / Top Update Toast Bar */}
      <div className="fixed bottom-14 sm:bottom-16 left-3 right-3 max-w-lg mx-auto z-50 select-none animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-gradient-to-r from-amber-950 via-[#3D1E10] to-amber-900 border-2 border-amber-400 text-white rounded-2xl p-3 shadow-2xl flex flex-col gap-2">
          
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-[#3D2619] flex items-center justify-center font-black text-sm shrink-0 shadow-xs animate-bounce">
                🚀
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-['Comfortaa',sans-serif] font-black text-xs text-amber-100 leading-tight truncate">
                    Có Bản Cập Nhật Mới!
                  </h4>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 shrink-0">
                    {CURRENT_RELEASE_INFO.version}
                  </span>
                </div>
                <p className="text-[10px] text-amber-200/90 leading-tight mt-0.5">
                  Đã tải sẵn bản mới. Dữ liệu tiệm được bảo toàn 100%.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                audioService.playClick();
                setIsDismissed(true);
              }}
              className="text-amber-300 hover:text-white p-1 rounded-full bg-black/20 hover:bg-black/40 transition-colors cursor-pointer shrink-0"
              title="Để sau"
            >
              <X size={14} />
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-800/80">
            <button
              onClick={() => {
                audioService.playClick();
                setShowChangelogModal(true);
              }}
              className="text-[10px] text-amber-300 hover:text-amber-100 font-bold underline underline-offset-2 transition-colors cursor-pointer"
            >
              Xem tính năng mới →
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  audioService.playClick();
                  setIsDismissed(true);
                }}
                className="px-2.5 py-1 text-[10.5px] font-bold text-amber-200 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Để sau
              </button>

              <button
                onClick={handleExecuteUpdate}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-[#F26440] hover:bg-[#E05338] active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={12} className={isUpdating ? 'animate-spin' : ''} />
                <span>{isUpdating ? updateStep || 'Đang cập nhật...' : 'Cập Nhật Ngay'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Changelog Detail Modal */}
      {showChangelogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div className="bg-[#FAF4ED] border-3 border-[#3D2619] rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col text-[#3D2619] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-950 via-[#4A2411] to-amber-900 text-white px-4 py-3 flex items-center justify-between border-b-2 border-amber-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <div>
                  <h3 className="font-['Comfortaa',sans-serif] font-black text-sm text-amber-100">
                    Bản Cập Nhật {CURRENT_RELEASE_INFO.version}
                  </h3>
                  <span className="text-[10px] text-amber-200/80">{CURRENT_RELEASE_INFO.releaseDate}</span>
                </div>
              </div>
              <button
                onClick={() => setShowChangelogModal(false)}
                className="p-1 rounded-full text-amber-200 hover:text-white bg-black/20 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3 text-xs">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-950">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                <p className="text-[10.5px] leading-tight font-bold">
                  Hệ thống tự động sao lưu an toàn toàn bộ tiến trình quán trước khi áp dụng bản mới!
                </p>
              </div>

              <div className="space-y-1.5 bg-white border border-[#EEDCC8] rounded-2xl p-3">
                <span className="text-[11px] font-black text-[#8C624D] uppercase tracking-wider block">
                  Điểm mới trong bản này:
                </span>
                <ul className="space-y-1.5 text-[11px] text-stone-700">
                  {CURRENT_RELEASE_INFO.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <Check size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#EEDCC8] border-t-2 border-[#D8C2AC] flex items-center justify-end gap-2">
              <button
                onClick={() => setShowChangelogModal(false)}
                className="px-3 py-2 bg-white text-stone-700 font-black text-xs rounded-xl border border-stone-300 cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={handleExecuteUpdate}
                disabled={isUpdating}
                className="px-4 py-2 bg-[#F26440] hover:bg-[#E05338] text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={12} className={isUpdating ? 'animate-spin' : ''} />
                <span>{isUpdating ? 'Đang cập nhật...' : 'Cập Nhật & Nạp Ngay'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
