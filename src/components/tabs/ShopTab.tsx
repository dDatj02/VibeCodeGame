import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { CozyShopLobby } from '../cozy/CozyShopLobby';
import { CozyKitchenCounter } from '../cozy/CozyKitchenCounter';

export const ShopTab: React.FC = () => {
  const inKitchenMode = useGameStore((state) => state.inKitchenMode);
  const setInKitchenMode = useGameStore((state) => state.setInKitchenMode);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAF4ED]">
      {inKitchenMode ? (
        <CozyKitchenCounter onBackToLobby={() => setInKitchenMode(false)} />
      ) : (
        <CozyShopLobby onOpenKitchen={() => setInKitchenMode(true)} />
      )}
    </div>
  );
};
