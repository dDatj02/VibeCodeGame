import React from 'react';
import { useGameStore, NavigationTab } from '../../stores/gameStore';
import { useCustomerStore } from '../../stores/customerStore';
import { useReviewStore } from '../../stores/reviewStore';
import { audioService } from '../../services/AudioService';
import { Store, Package, BookOpen, Landmark, Star, Share2, Sparkles } from 'lucide-react';

interface TabItem {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab } = useGameStore();
  const queueCount = useCustomerStore((state) => state.activeCustomers.length);
  const isViral = useReviewStore((state) => state.isViralBoostActive);
  const isCrisis = useReviewStore((state) => state.isCrisisActive);

  const tabs: TabItem[] = [
    {
      id: 'shop',
      label: 'Tiệm',
      icon: <Store size={17} />,
      badge: queueCount > 0 ? queueCount : undefined,
    },
    {
      id: 'inventory',
      label: 'Kho',
      icon: <Package size={17} />,
    },
    {
      id: 'recipes',
      label: 'Menu',
      icon: <BookOpen size={17} />,
    },
    {
      id: 'finance',
      label: 'Vốn',
      icon: <Landmark size={17} />,
    },
    {
      id: 'reviews',
      label: 'Review',
      icon: <Star size={17} />,
      badge: isCrisis ? '⚠️' : isViral ? '🔥' : undefined,
    },
    {
      id: 'social',
      label: 'Trend',
      icon: <Share2 size={17} />,
    },
    {
      id: 'upgrades',
      label: 'Cấp',
      icon: <Sparkles size={17} />,
    },
  ];

  return (
    <nav className="shrink-0 bg-[#FAF4ED] border-t-2 border-[#EEDCC8] text-[#3D2619] py-1 px-1 z-30 shadow-md w-full overflow-hidden">
      <div className="flex items-center justify-between w-full max-w-lg mx-auto gap-0.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                audioService.playClick();
                setActiveTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-all cursor-pointer min-h-[44px] select-none ${
                isActive
                  ? 'bg-[#F26440] text-white font-black shadow-xs'
                  : 'text-[#8C624D] hover:text-[#3D2619] hover:bg-white/60 font-bold'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-amber-400 text-[#3D2619] font-black text-[9px] min-w-[14px] h-3.5 rounded-full flex items-center justify-center px-0.5 shadow-xs border border-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] tracking-tight leading-none mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
