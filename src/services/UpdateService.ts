import { SaveService } from './SaveService';

export const CURRENT_APP_VERSION = 'v1.3.0';
export const APP_BUILD_DATE = '2026-09-28';

export interface AppReleaseInfo {
  version: string;
  releaseDate: string;
  title: string;
  features: string[];
}

export const CURRENT_RELEASE_INFO: AppReleaseInfo = {
  version: CURRENT_APP_VERSION,
  releaseDate: 'Hôm nay',
  title: 'Bản Cập Nhật Sàn Giao Dịch Vàng 9999 & Tối Ưu Tiến Trình',
  features: [
    '🪙 Sàn Vàng 9999: Mua, nắm giữ và bán chốt lời theo giá thị trường biến động hàng ngày.',
    '💼 Tích hợp danh mục tài sản ròng (Net Worth) kết hợp Tiền mặt, Bất động sản và Vàng.',
    '⚡ Tinh gọn thanh công cụ trên cùng với Trung Tâm Cài Đặt (Settings) tập trung.',
    '🛡️ Bảo toàn 100% dữ liệu tiến trình chơi, tự động sao lưu an toàn khi nạp bản cập nhật.',
  ],
};

type UpdateListener = (hasUpdate: boolean, updateFn?: () => void) => void;

class UpdateServiceClass {
  private updateListeners: Set<UpdateListener> = new Set();
  private isUpdateAvailable = false;
  private pendingUpdateFn: (() => void) | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      this.initServiceWorkerListener();
    }
  }

  public subscribe(listener: UpdateListener): () => void {
    this.updateListeners.add(listener);
    // Notify immediately with current state
    listener(this.isUpdateAvailable, this.pendingUpdateFn || undefined);

    return () => {
      this.updateListeners.delete(listener);
    };
  }

  public setUpdateAvailable(updateFn?: () => void) {
    this.isUpdateAvailable = true;
    this.pendingUpdateFn = updateFn || null;
    this.notifyAll();
  }

  private notifyAll() {
    this.updateListeners.forEach((listener) => {
      listener(this.isUpdateAvailable, this.pendingUpdateFn || undefined);
    });
  }

  /**
   * Initializes Service Worker update listeners.
   */
  private initServiceWorkerListener() {
    navigator.serviceWorker.ready.then((reg) => {
      this.registration = reg;

      // Check if there's already a waiting worker
      if (reg.waiting) {
        this.setUpdateAvailable(() => {
          reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
        });
      }

      // Listen for new worker installed
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version ready to be activated
            this.setUpdateAvailable(() => {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            });
          }
        });
      });
    });

    // When the controller changes (new service worker active), reload safely
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    // Check for updates on tab focus
    window.addEventListener('focus', () => {
      this.checkForUpdates();
    });
  }

  /**
   * Manually checks if a new version is available from server / service worker.
   */
  public async checkForUpdates(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) return false;

    try {
      if (this.registration) {
        await this.registration.update();
        if (this.registration.waiting) {
          this.setUpdateAvailable(() => {
            this.registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
          });
          return true;
        }
      }
    } catch (err) {
      console.warn('Update check error:', err);
    }
    return this.isUpdateAvailable;
  }

  /**
   * Executes a safe update:
   * 1. Creates a safety rollback snapshot in storage.
   * 2. Saves current live Zustand game state.
   * 3. Activates the waiting service worker.
   * 4. Reloads the application.
   */
  public async executeSafeUpdate(onProgress?: (step: string) => void): Promise<void> {
    try {
      onProgress?.('Đang sao lưu tiến trình an toàn...');
      // 1. Safety snapshot
      SaveService.saveSafetyBackup();

      // 2. Live save
      SaveService.saveGame();

      onProgress?.('Đang kích hoạt phiên bản mới...');
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (this.pendingUpdateFn) {
        this.pendingUpdateFn();
      } else if (this.registration?.waiting) {
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      onProgress?.('Đang nạp lại giao diện mới...');
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Hard reload if controllerchange didn't fire
      window.location.reload();
    } catch (err) {
      console.error('Safe update execution failed:', err);
      // Fallback reload
      window.location.reload();
    }
  }

  public getVersion(): string {
    return CURRENT_APP_VERSION;
  }

  public getReleaseInfo(): AppReleaseInfo {
    return CURRENT_RELEASE_INFO;
  }
}

export const UpdateService = new UpdateServiceClass();
