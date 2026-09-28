import LZString from 'lz-string';
import { SaveService, GameSaveDataV1, SAVE_KEY, setStorageItem, getStorageItem } from './SaveService';
import { BackupEnvelope, BackupMetadata, RestoreValidationResult } from '../types/backup';
import { useGameStore } from '../stores/gameStore';
import { useEconomyStore } from '../stores/economyStore';
import { useShopStore } from '../stores/shopStore';
import { useInvestmentStore } from '../stores/investmentStore';
import { useCustomerStore } from '../stores/customerStore';
import { useReviewStore } from '../stores/reviewStore';

const BACKUP_FORMAT = 'smoothie-hustle-backup';
const CURRENT_BACKUP_VERSION = 1;
const GAME_VERSION = '1.0.0';
const CODE_PREFIX = 'SH1';

/**
 * Computes a deterministic 32-bit FNV-1a checksum of any string.
 */
function computeChecksum(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Splits a continuous string into chunks of chunkSize separated by delimiter.
 */
export function formatIntoChunks(str: string, chunkSize: number = 4, delimiter: string = '-'): string {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks.join(delimiter);
}

export class BackupService {
  /**
   * Normalizes a raw user input code by removing all whitespace, hyphens, and line breaks.
   */
  public static normalizeCode(raw: string): string {
    if (!raw) return '';
    return raw.replace(/[\s\r\n\t\-]+/g, '').trim();
  }

  /**
   * Generates a complete backup code from current game progress.
   */
  public static generateBackupCode(): {
    rawCode: string;
    formattedCode: string;
    metadata: BackupMetadata;
    envelope: BackupEnvelope;
  } {
    const saveData = SaveService.getCurrentSaveData();
    const g = useGameStore.getState();
    const e = useEconomyStore.getState();
    const s = useShopStore.getState();
    const inv = useInvestmentStore.getState();
    const cust = useCustomerStore.getState();
    const rev = useReviewStore.getState();

    const equipmentVal = s.getTotalEquipmentValue();
    const propertyVal = inv.getTotalPropertyMarketValue();
    const netWorth = e.calculateNetWorth(equipmentVal, propertyVal);

    const totalCustomersServed = (e.dailyReports || []).reduce((sum: number, r: any) => sum + (r.totalCustomersServed || 0), 0) + (cust.customersServedToday || 0);

    const metadata: BackupMetadata = {
      day: g.day,
      shopName: g.shopName || 'Sinh Tố Nhà Tui',
      shopAvatar: g.shopAvatar || '🍹',
      shopLevel: s.currentShopLevel || 1,
      cash: e.cash,
      netWorth,
      propertiesCount: inv.ownedProperties.length,
      customersServed: totalCustomersServed,
      totalReviews: rev.totalReviews,
      averageRating: rev.averageRating,
    };

    // Calculate checksum of inner saveData
    const saveDataJson = JSON.stringify(saveData);
    const checksum = computeChecksum(saveDataJson);

    const envelope: BackupEnvelope = {
      format: BACKUP_FORMAT,
      version: CURRENT_BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      gameVersion: GAME_VERSION,
      metadata,
      saveData,
      checksum,
    };

    const envelopeJson = JSON.stringify(envelope);
    const compressed = LZString.compressToBase64(envelopeJson);

    // Format with prefix: SH1-<CHUNK>-<CHUNK>...
    const rawCode = `${CODE_PREFIX}${compressed}`;
    const formattedCode = `${CODE_PREFIX}-${formatIntoChunks(compressed, 4, '-')}`;

    return {
      rawCode,
      formattedCode,
      metadata,
      envelope,
    };
  }

  /**
   * Validates a backup code and returns the parsed envelope or an explicit error.
   */
  public static validateBackupCode(rawInput: string): RestoreValidationResult {
    if (!rawInput || !rawInput.trim()) {
      return {
        success: false,
        errorType: 'empty',
        errorMessage: 'Vui lòng nhập mã sao lưu.',
      };
    }

    const normalized = this.normalizeCode(rawInput);

    // Must have at least prefix + content
    if (normalized.length < 10) {
      return {
        success: false,
        errorType: 'invalid',
        errorMessage: 'Mã sao lưu không hợp lệ hoặc quá ngắn. Vui lòng kiểm tra lại.',
      };
    }

    let payload = normalized;
    if (normalized.toUpperCase().startsWith(CODE_PREFIX)) {
      payload = normalized.slice(CODE_PREFIX.length);
    }

    // Try decompressing
    let decompressedJson: string | null = null;
    try {
      decompressedJson = LZString.decompressFromBase64(payload);
    } catch {
      return {
        success: false,
        errorType: 'corrupted',
        errorMessage: 'Mã sao lưu bị hỏng hoặc thiếu ký tự. Vui lòng tạo mã mới từ thiết bị gốc.',
      };
    }

    if (!decompressedJson) {
      return {
        success: false,
        errorType: 'corrupted',
        errorMessage: 'Mã sao lưu không thể giải nén hoặc bị lỗi cấu trúc.',
      };
    }

    // Try JSON parse
    let envelope: BackupEnvelope | null = null;
    try {
      envelope = JSON.parse(decompressedJson) as BackupEnvelope;
    } catch {
      return {
        success: false,
        errorType: 'corrupted',
        errorMessage: 'Dữ liệu mã sao lưu bị biến đổi hoặc không đúng định dạng.',
      };
    }

    // Validate format header
    if (!envelope || envelope.format !== BACKUP_FORMAT) {
      return {
        success: false,
        errorType: 'invalid',
        errorMessage: 'Mã này không phải là mã sao lưu hợp lệ của game Quán Sinh Tố.',
      };
    }

    // Check version
    if (envelope.version > CURRENT_BACKUP_VERSION) {
      return {
        success: false,
        errorType: 'unsupported_version',
        errorMessage: `Mã sao lưu này được tạo từ phiên bản game mới hơn (v${envelope.version}). Vui lòng cập nhật game để khôi phục.`,
      };
    }

    // Validate Checksum
    const calculatedChecksum = computeChecksum(JSON.stringify(envelope.saveData));
    if (calculatedChecksum !== envelope.checksum) {
      return {
        success: false,
        errorType: 'corrupted',
        errorMessage: 'Mã kiểm tra tính toàn vẹn (Checksum) không khớp. Dữ liệu đã bị sửa đổi hoặc hư hỏng.',
      };
    }

    // Validate SaveData structure minimum fields
    if (!envelope.saveData || typeof envelope.saveData !== 'object' || !envelope.saveData.game || !envelope.saveData.economy) {
      return {
        success: false,
        errorType: 'invalid',
        errorMessage: 'Dữ liệu tiến trình trong mã sao lưu bị thiếu các thành phần quan trọng.',
      };
    }

    // Handle migration if older version
    if (envelope.version < CURRENT_BACKUP_VERSION) {
      try {
        envelope = this.migrateBackupEnvelope(envelope);
      } catch {
        return {
          success: false,
          errorType: 'migration_failed',
          errorMessage: 'Không thể chuyển đổi mã sao lưu phiên bản cũ sang định dạng hiện tại.',
        };
      }
    }

    return {
      success: true,
      envelope,
    };
  }

  /**
   * Migrates an older backup envelope to current format deterministically.
   */
  private static migrateBackupEnvelope(envelope: BackupEnvelope): BackupEnvelope {
    // Current version is 1, so this is forward-compatible for future versions
    return {
      ...envelope,
      version: CURRENT_BACKUP_VERSION,
    };
  }

  /**
   * Atomically restores the game from a validated backup envelope.
   * Creates a safety backup of existing local save before replacing.
   */
  public static restoreFromEnvelope(envelope: BackupEnvelope): { success: boolean; errorMessage?: string } {
    try {
      // 1. Create safety backup of existing local save
      SaveService.saveSafetyBackup();

      // 2. Apply save data to stores
      const ok = SaveService.applySaveData(envelope.saveData);
      if (!ok) {
        // Rollback immediately
        SaveService.restoreSafetyBackup();
        return {
          success: false,
          errorMessage: 'Lỗi khi áp dụng dữ liệu vào trò chơi. Đã hoàn tác về bản lưu cũ an toàn.',
        };
      }

      // 3. Write new save to storage
      setStorageItem(SAVE_KEY, JSON.stringify(envelope.saveData));

      return { success: true };
    } catch (err) {
      console.error('Failed to restore backup:', err);
      // Rollback
      SaveService.restoreSafetyBackup();
      return {
        success: false,
        errorMessage: 'Đã xảy ra sự cố trong quá trình khôi phục. Bản lưu hiện tại được giữ nguyên vẹn.',
      };
    }
  }

  /**
   * Quick share via Web Share API or falls back to clipboard.
   */
  public static async shareBackupCode(code: string, shopName: string): Promise<boolean> {
    const textToShare = code;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Mã Sao Lưu Game - ${shopName}`,
          text: `Mã sao lưu tiến trình Quán Sinh Tố (${shopName}):\n\n${textToShare}\n\nDán mã này vào mục Cài Đặt -> Khôi Phục trên máy khác để tiếp tục chơi!`,
        });
        return true;
      } catch (err) {
        // User cancelled share or not supported -> fallback to copy
      }
    }

    return this.copyToClipboard(textToShare);
  }

  /**
   * Copies text safely to clipboard with fallback.
   */
  public static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}

    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  }
}
