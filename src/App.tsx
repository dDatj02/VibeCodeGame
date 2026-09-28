import React, { useEffect, useRef } from 'react';
import { useGameStore } from './stores/gameStore';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { NotificationToast } from './components/common/NotificationToast';
import { ShopTab } from './components/tabs/ShopTab';
import { InventoryTab } from './components/tabs/InventoryTab';
import { RecipesTab } from './components/tabs/RecipesTab';
import { FinanceTab } from './components/tabs/FinanceTab';
import { ReviewsTab } from './components/tabs/ReviewsTab';
import { SocialTab } from './components/tabs/SocialTab';
import { UpgradesTab } from './components/tabs/UpgradesTab';
import { DailyReportModal } from './components/modals/DailyReportModal';
import { EventModal } from './components/modals/EventModal';
import { BankruptcyModal } from './components/modals/BankruptcyModal';
import { LargeOrderOfferModal } from './components/largeOrders/LargeOrderOfferModal';
import { LargeOrderConfirmModal } from './components/largeOrders/LargeOrderConfirmModal';
import { LargeOrderResultModal } from './components/largeOrders/LargeOrderResultModal';
import { LargeOrderUnlockModal } from './components/largeOrders/LargeOrderUnlockModal';
import { LargeOrderHistoryModal } from './components/largeOrders/LargeOrderHistoryModal';
import { PropertyDetailModal } from './components/investment/PropertyDetailModal';
import { PropertyInspectionModal } from './components/investment/PropertyInspectionModal';
import { BuyGoldModal } from './components/investment/BuyGoldModal';
import { SellGoldModal } from './components/investment/SellGoldModal';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { PWAUpdatePrompt } from './components/common/PWAUpdatePrompt';
import { DayCycleSystem } from './systems/DayCycleSystem';
import { SaveService } from './services/SaveService';

export const App: React.FC = () => {
  const activeTab = useGameStore((state) => state.activeTab);
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  // Initialize saved progress on startup
  useEffect(() => {
    SaveService.loadGame();

    // Auto-save on window blur, page hide, beforeunload or visibility change
    const handleAutoSave = () => {
      SaveService.saveGame();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        SaveService.saveGame();
      }
    };

    window.addEventListener('beforeunload', handleAutoSave);
    window.addEventListener('pagehide', handleAutoSave);
    window.addEventListener('blur', handleAutoSave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic background auto-save every 20 seconds
    const interval = setInterval(() => {
      SaveService.saveGame();
    }, 20000);

    return () => {
      window.removeEventListener('beforeunload', handleAutoSave);
      window.removeEventListener('pagehide', handleAutoSave);
      window.removeEventListener('blur', handleAutoSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  // Main Simulation Loop
  useEffect(() => {
    const loop = (currentTime: number) => {
      const deltaMs = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Delta in seconds, clamp to avoid huge jumps if tab was backgrounded
      const deltaSeconds = Math.min(0.2, deltaMs / 1000);
      DayCycleSystem.tick(deltaSeconds);

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col overflow-hidden bg-[#FAF4ED] font-['Nunito',sans-serif] text-[#3D2619] select-none antialiased">
      {/* 1. Header (Top Bar Contract: wordmark, vital meters, controls) */}
      <Header />

      {/* 2. Main Game Body Screen */}
      <main className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
        {activeTab === 'shop' && <ShopTab />}
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'recipes' && <RecipesTab />}
        {activeTab === 'finance' && <FinanceTab />}
        {activeTab === 'reviews' && <ReviewsTab />}
        {activeTab === 'social' && <SocialTab />}
        {activeTab === 'upgrades' && <UpgradesTab />}
      </main>

      {/* 3. Bottom Navigation Bar */}
      <Navigation />

      {/* 4. Global Modals & Feedback */}
      <PWAInstallBanner />
      <PWAUpdatePrompt />
      <NotificationToast />
      <DailyReportModal />
      <EventModal />
      <BankruptcyModal />
      <LargeOrderUnlockModal />
      <LargeOrderOfferModal />
      <LargeOrderConfirmModal />
      <LargeOrderResultModal />
      <LargeOrderHistoryModal />
      <PropertyDetailModal />
      <PropertyInspectionModal />
      <BuyGoldModal />
      <SellGoldModal />
    </div>
  );
};

export default App;
