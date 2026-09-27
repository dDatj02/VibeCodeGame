import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Smartphone, CheckCircle } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isStandalone, isInstallable, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  // Do not show anything if already running as standalone app or dismissed
  if (isStandalone || isDismissed) {
    return null;
  }

  // If not installable (e.g. desktop non-Chrome or standard web without prompt), only show if iOS or installable
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Top Floating Banner */}
      <div className="fixed top-[calc(0.5rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white p-2.5 rounded-2xl shadow-xl border border-amber-300/40 backdrop-blur-md animate-fade-in flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/pwa-192x192.png"
            alt="App Icon"
            className="w-10 h-10 rounded-xl shadow-md border border-white/30 shrink-0"
          />
          <div className="min-w-0">
            <div className="text-xs font-black text-white truncate flex items-center gap-1">
              <span>Cài đặt Quán Sinh Tố</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-bold">App</span>
            </div>
            <p className="text-[10.5px] text-amber-100 font-semibold truncate">
              Thêm vào Màn hình chính chơi mượt hơn!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isInstallable && (
            <button
              onClick={install}
              className="px-3 py-1.5 bg-white text-orange-600 font-black text-xs rounded-xl shadow-md hover:bg-amber-50 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download size={13} strokeWidth={2.5} />
              <span>Cài ngay</span>
            </button>
          )}

          {isIOS && !isInstallable && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-3 py-1.5 bg-white text-orange-600 font-black text-xs rounded-xl shadow-md hover:bg-amber-50 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Smartphone size={13} strokeWidth={2.5} />
              <span>Hướng dẫn</span>
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFFDF9] border border-amber-200 p-5 shadow-2xl text-[#3D2619] relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-3 right-3 p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src="/pwa-192x192.png"
                alt="App Icon"
                className="w-12 h-12 rounded-2xl shadow-md border border-amber-300"
              />
              <div>
                <h3 className="text-base font-black text-[#3D2619]">Thêm vào Màn hình chính</h3>
                <p className="text-xs text-amber-800 font-bold">Dành cho iPhone & iPad (Safari)</p>
              </div>
            </div>

            <div className="space-y-3 my-4 text-xs font-semibold text-stone-700 bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/80">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <p className="pt-0.5">
                  Nhấn vào biểu tượng <strong className="text-amber-800 font-bold inline-flex items-center gap-0.5"><Share size={12} className="text-blue-600 inline" /> Chia sẻ (Share)</strong> ở thanh công cụ Safari bên dưới.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <p className="pt-0.5">
                  Cuộn xuống và chọn <strong className="text-amber-800 font-bold inline-flex items-center gap-0.5"><PlusSquare size={12} className="text-stone-800 inline" /> Thêm vào Màn hình chính</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                  3
                </span>
                <p className="pt-0.5">
                  Mở game từ biểu tượng ứng dụng ở Màn hình chính để chơi ở chế độ <strong className="text-emerald-700">Standalone (App đầy đủ)</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSGuide(false);
                handleDismiss();
              }}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <CheckCircle size={14} />
              <span>Đã hiểu</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
