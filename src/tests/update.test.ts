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

  it('TEST 3: Update listeners are notified when update availability changes', () => {
    let notifiedState = false;
    const unsubscribe = UpdateService.subscribe((hasUpdate) => {
      notifiedState = hasUpdate;
    });

    UpdateService.setUpdateAvailable();
    expect(notifiedState).toBe(true);

    unsubscribe();
  });
});
