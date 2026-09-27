import React from 'react';
import { useGameStore, NavigationTab } from '../../stores/gameStore';
import { useCustomerStore } from '../../stores/customerStore';
import { useReviewStore } from '../../stores/reviewStore';
import { useRecipeStore } from '../../stores/recipeStore';
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
  const recipes = useRecipeStore((state) => state.recipes);

  const unlockableRecipesCount = recipes.filter((r) => !r.unlocked).length;

  const tabs: TabItem[] = [
    {
      id: 'shop',
      label: 'Tiệm',
      icon: <Store size={16} />,
      badge: queueCount > 0 ? queueCount : undefined,
    },
    {
      id: 'inventory',
      label: 'Kho',
      icon: <Package size={16} />,
    },
    {
      id: 'recipes',
      label: 'Menu',
      icon: <BookOpen size={16} />,
      badge: unlockableRecipesCount > 0 ? '✨' : undefined,
    },
    {
      id: 'finance',
      label: 'Vốn',
      icon: <Landmark size={16} />,
    },
    {
      id: 'reviews',
      label: 'Review',
      icon: <Star size={16} />,
      badge: isCrisis ? '⚠️' : isViral ? '🔥' : undefined,
    },
    {
      id: 'social',
      label: 'Trend',
      icon: <Share2 size={16} />,
    },
    {
      id: 'upgrades',
      label: 'Cấp',
      icon: <Sparkles size={16} />,
    },
  ];

  return (
    <nav className="sticky bottom-0 left-0 right-0 shrink-0 bg-[#FAF4ED] border-t-2 border-[#EEDCC8] text-[#3D2619] pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))] px-1 z-40 shadow-lg w-full">
      <div className="flex items-center justify-between w-full max-w-lg mx-auto gap-0.5 px-0.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                audioService.playClick();
                setActiveTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center flex-1 min-w-0 py-1 px-0.5 rounded-xl transition-all cursor-pointer min-h-[42px] select-none ${
                isActive
                  ? 'bg-[#F26440] text-white font-black shadow-xs'
                  : 'text-[#8C624D] hover:text-[#3D2619] hover:bg-white/60 font-bold'
              }`}
            >
              <div className="relative inline-flex items-center justify-center shrink-0">
                {tab.icon}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-amber-400 text-[#3D2619] font-black text-[8px] h-3.5 min-w-[13px] rounded-full inline-flex items-center justify-center px-0.5 shadow-2xs border border-white z-10 leading-none">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[8.5px] sm:text-[9px] tracking-tight leading-none mt-0.5 truncate w-full text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
