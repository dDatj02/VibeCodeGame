import React, { useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';

export const NotificationToast: React.FC = () => {
  const notification = useGameStore((state) => state.notification);
  const clearNotification = useGameStore((state) => state.clearNotification);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      clearNotification();
    }, 3200);
    return () => clearTimeout(timer);
  }, [notification, clearNotification]);

  if (!notification) return null;

  const bgColors: Record<string, string> = {
    info: 'bg-stone-800 border-stone-600 text-stone-100',
    success: 'bg-emerald-950 border-emerald-500 text-emerald-200',
    warning: 'bg-amber-950 border-amber-500 text-amber-200',
    error: 'bg-rose-950 border-rose-500 text-rose-200',
  };

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce">
      <div
        className={`px-4 py-2 rounded-lg border shadow-xl text-xs md:text-sm font-semibold max-w-sm text-center backdrop-blur-sm ${
          bgColors[notification.type || 'info']
        }`}
      >
        {notification.text}
      </div>
    </div>
  );
};
