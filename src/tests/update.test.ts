import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateService, CURRENT_APP_VERSION, CURRENT_RELEASE_INFO } from '../services/UpdateService';
import { SaveService } from '../services/SaveService';
import { useEconomyStore } from '../stores/economyStore';
import { useGameStore } from '../stores/gameStore';

describe('FEATURE: In-App PWA Safe Update System', () => {
  beforeEach(() => {
    SaveService.clearSave();
  });

  it('TEST 1: Current app version and release notes are configured', () => {
    expect(UpdateService.getVersion()).toBe(CURRENT_APP_VERSION);
    expect(CURRENT_RELEASE_INFO.features.length).toBeGreaterThan(0);
  });

  it('TEST 2: Safe update creates safety backup snapshot before updating', async () => {
    useGameStore.setState({ day: 25, shopName: 'Tiệm Sinh Tố VIP' });
    useEconomyStore.setState({ cash: 75000000 });
    SaveService.saveGame();

    // Mock global window reload
    const reloadMock = vi.fn();
    (globalThis as any).window = {
      location: { reload: reloadMock },
    };

    let progressStep = '';
    await UpdateService.executeSafeUpdate((step) => {
      progressStep = step;
    });

    expect(SaveService.hasSafetyBackup()).toBe(true);
  });

  it('TEST 4: Update cycle strictly retains Day, Cash, and Store Progress without resetting', async () => {
    // Player is at Day 18 with 50,000,000 VND and custom shop name
    useGameStore.setState({ day: 18, shopName: 'Quán Sinh Tố Xịn' });
    useEconomyStore.setState({ cash: 50000000 });
    SaveService.saveGame();

    // Trigger safe update
    (globalThis as any).window = {
      location: { href: '', reload: vi.fn() },
    };
    await UpdateService.executeSafeUpdate();

    // Reset runtime Zustand memory to default (simulating browser reload)
    useGameStore.setState({ day: 1, shopName: 'Sinh Tố Nhà Tui' });
    useEconomyStore.setState({ cash: 500000 });

    // App reloads and hydrates saved data
    const loaded = SaveService.loadGame();
    expect(loaded).toBe(true);
    expect(useGameStore.getState().day).toBe(18);
    expect(useGameStore.getState().shopName).toBe('Quán Sinh Tố Xịn');
    expect(useEconomyStore.getState().cash).toBe(50000000);
  });
});
