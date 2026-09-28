import { describe, it, expect, beforeEach } from 'vitest';
import { useEconomyStore } from '../stores/economyStore';
import { useGameStore } from '../stores/gameStore';
import { useShopStore } from '../stores/shopStore';
import { useInvestmentStore } from '../stores/investmentStore';
import { useRecipeStore } from '../stores/recipeStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { SaveService } from '../services/SaveService';
import { BackupService, formatIntoChunks } from '../services/BackupService';

describe('FEATURE: Backup Code / Restore Code System', () => {
  beforeEach(() => {
    SaveService.clearSave();
  });

  it('TEST 1: Generates valid compact portable backup code with metadata', () => {
    // Setup state
    useGameStore.setState({ day: 12, shopName: 'Sinh Tố Cô Sáu', shopAvatar: '🥑' });
    useEconomyStore.setState({ cash: 75000000 }); // 75M
    useShopStore.setState({ currentShopLevel: 3 });

    const backup = BackupService.generateBackupCode();
    expect(backup).toBeDefined();
    expect(backup.formattedCode).toMatch(/^SH1-/);
    expect(backup.metadata.day).toBe(12);
    expect(backup.metadata.shopName).toBe('Sinh Tố Cô Sáu');
    expect(backup.metadata.cash).toBe(75000000);
    expect(backup.metadata.shopLevel).toBe(3);
    expect(backup.envelope.format).toBe('smoothie-hustle-backup');
    expect(backup.envelope.checksum).toBeDefined();
  });

  it('TEST 2: Cross-device transfer restores complete progress accurately without server', () => {
    // Device A state
    useGameStore.setState({ day: 25, shopName: 'Sinh Tố Đế Chế', shopAvatar: '👑' });
    useEconomyStore.setState({ cash: 1200000000, creditScore: 720 }); // 1.2 Tỷ
    useShopStore.setState({ currentShopLevel: 5, cleanliness: 90 });

    // Buy a property on Device A
    const land = useInvestmentStore.getState().availableLand[0];
    useInvestmentStore.getState().buyProperty(land.id, true);
    expect(useInvestmentStore.getState().ownedProperties.length).toBe(1);

    // Export code on Device A
    const backup = BackupService.generateBackupCode();
    const codeFromDeviceA = backup.formattedCode;

    // Simulate Device B: Reset everything
    SaveService.clearSave();
    expect(useGameStore.getState().day).toBe(1);
    expect(useEconomyStore.getState().cash).toBe(500000);
    expect(useInvestmentStore.getState().ownedProperties.length).toBe(0);

    // Device B validates code
    const validation = BackupService.validateBackupCode(codeFromDeviceA);
    expect(validation.success).toBe(true);
    expect(validation.envelope).toBeDefined();
    expect(validation.envelope?.metadata.day).toBe(25);
    expect(validation.envelope?.metadata.shopName).toBe('Sinh Tố Đế Chế');

    // Device B restores
    const restoreResult = BackupService.restoreFromEnvelope(validation.envelope!);
    expect(restoreResult.success).toBe(true);

    // Verify progress on Device B
    expect(useGameStore.getState().day).toBe(25);
    expect(useGameStore.getState().shopName).toBe('Sinh Tố Đế Chế');
    expect(useEconomyStore.getState().cash).toBe(1200000000 - land.purchasePrice);
    expect(useEconomyStore.getState().creditScore).toBe(720);
    expect(useShopStore.getState().currentShopLevel).toBe(5);
    expect(useInvestmentStore.getState().ownedProperties.length).toBe(1);
    expect(useInvestmentStore.getState().ownedProperties[0].id).toBe(land.id);
  });

  it('TEST 3: Existing save is protected during preview and remains intact if cancelled', () => {
    // Current save on device
    useGameStore.setState({ day: 8, shopName: 'Quán Nhỏ Hiện Tại' });
    useEconomyStore.setState({ cash: 2000000 });
    SaveService.saveGame();

    // Prepare another backup code from another save
    const otherSave = BackupService.generateBackupCode();

    // Validate only (does not restore yet)
    const val = BackupService.validateBackupCode(otherSave.formattedCode);
    expect(val.success).toBe(true);

    // Current save should still be untouched
    expect(useGameStore.getState().day).toBe(8);
    expect(useGameStore.getState().shopName).toBe('Quán Nhỏ Hiện Tại');
    expect(useEconomyStore.getState().cash).toBe(2000000);
  });

  it('TEST 4: Invalid and random codes are safely rejected with clear errors', () => {
    useGameStore.setState({ day: 5, shopName: 'Quán Gốc' });

    // Empty code
    const resEmpty = BackupService.validateBackupCode('');
    expect(resEmpty.success).toBe(false);
    expect(resEmpty.errorType).toBe('empty');

    // Random gibberish code
    const resRandom = BackupService.validateBackupCode('XYZ-1234-5678-INVALID');
    expect(resRandom.success).toBe(false);
    expect(resRandom.errorType).toBe('corrupted');

    // Current save remains untouched
    expect(useGameStore.getState().day).toBe(5);
    expect(useGameStore.getState().shopName).toBe('Quán Gốc');
  });

  it('TEST 5: Corrupted code with modified characters is detected by checksum validation', () => {
    useGameStore.setState({ day: 10 });
    const backup = BackupService.generateBackupCode();

    // Corrupt one character in the middle
    const chars = backup.formattedCode.split('');
    const corruptIdx = Math.floor(chars.length / 2);
    chars[corruptIdx] = chars[corruptIdx] === 'A' ? 'B' : 'A';
    const corruptedCode = chars.join('');

    const validation = BackupService.validateBackupCode(corruptedCode);
    expect(validation.success).toBe(false);
    expect(['corrupted', 'invalid']).toContain(validation.errorType);
  });

  it('TEST 6: Input normalization handles spaces, hyphens, linebreaks, and lowercase prefix', () => {
    useGameStore.setState({ day: 15, shopName: 'Quán Chuẩn Hóa' });
    const backup = BackupService.generateBackupCode();

    // Add extra spaces, newlines, tabs, and lowercase prefix (sh1-)
    const rawWithoutPrefix = backup.formattedCode.replace(/^SH1-/, '');
    const formattedWithNoise = `  \n sh1-${rawWithoutPrefix} \r\n  `;
    const val1 = BackupService.validateBackupCode(formattedWithNoise);
    expect(val1.success).toBe(true);
    expect(val1.envelope?.metadata.day).toBe(15);

    // Strip hyphens completely
    const strippedHyphens = backup.rawCode;
    const val2 = BackupService.validateBackupCode(strippedHyphens);
    expect(val2.success).toBe(true);
    expect(val2.envelope?.metadata.day).toBe(15);
  });

  it('TEST 7: Creates safety backup before restore and supports rollback', () => {
    // Current save
    useGameStore.setState({ day: 7, shopName: 'Tiệm Cũ Cần Bảo Vệ' });
    useEconomyStore.setState({ cash: 3500000 });
    SaveService.saveGame();

    // Generate incoming backup from elsewhere
    useGameStore.setState({ day: 30, shopName: 'Tiệm Mới Khôi Phục' });
    useEconomyStore.setState({ cash: 90000000 });
    const incomingBackup = BackupService.generateBackupCode();

    // Revert state back to current tiệm cũ
    useGameStore.setState({ day: 7, shopName: 'Tiệm Cũ Cần Bảo Vệ' });
    useEconomyStore.setState({ cash: 3500000 });

    // Restore incoming backup
    const ok = BackupService.restoreFromEnvelope(incomingBackup.envelope);
    expect(ok.success).toBe(true);
    expect(useGameStore.getState().day).toBe(30);
    expect(useGameStore.getState().shopName).toBe('Tiệm Mới Khôi Phục');

    // Verify safety backup was created
    expect(SaveService.hasSafetyBackup()).toBe(true);

    // Rollback to safety backup
    const rollbackOk = SaveService.restoreSafetyBackup();
    expect(rollbackOk).toBe(true);
    expect(useGameStore.getState().day).toBe(7);
    expect(useGameStore.getState().shopName).toBe('Tiệm Cũ Cần Bảo Vệ');
    expect(useEconomyStore.getState().cash).toBe(3500000);
  });
});
