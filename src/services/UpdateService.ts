import { SaveService } from './SaveService';

export const CURRENT_APP_VERSION = 'v1.4.0';
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
  title: 'Bản Cập Nhật v1.4.0 - Tự Do Phản Hồi Đánh Giá & Thị Trường Vàng 9999',
  features: [
    '✍️ Tự do gõ phản hồi đánh giá khách hàng bằng tiếng Việt tự nhiên.',
    '⭐ Hệ thống cảnh báo & kiểm duyệt MapReview thông minh, bảo toàn 100% đánh giá cũ.',
    '🪙 Sàn Giao Dịch Vàng 9999 biến động hàng ngày & Danh mục Tài Sản Ròng Net Worth.',
    '⚡ Trung tâm Cài Đặt tập trung, hỗ trợ làm mới xóa cache chống kẹt bản cũ.',
  ],
};

type UpdateListener = (hasUpdate: boolean, updateFn?: () => void) => void;

class UpdateServiceClass {
  private updateListeners: Set<UpdateListener> = new Set();
  private isUpdateAvailable = false;
  private pendingUpdateFn: (() => void) | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private latestRemoteVersion: string = CURRENT_APP_VERSION;

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

  public setUpdateAvailable(updateFn?: () => void, newVer?: string) {
    this.isUpdateAvailable = true;
    this.pendingUpdateFn = updateFn || null;
    if (newVer) {
      this.latestRemoteVersion = newVer;
    }
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
    try {
      // 1. Check Service Worker update
      if ('serviceWorker' in navigator && this.registration) {
        await this.registration.update();
        if (this.registration.waiting) {
          this.setUpdateAvailable(() => {
            this.registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
          });
          return true;
        }
      }

      // 2. Fetch remote version.json to bypass caching
      if (typeof window !== 'undefined') {
        const res = await fetch(`/version.json?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.version && data.version !== CURRENT_APP_VERSION) {
            this.setUpdateAvailable(undefined, data.version);
            return true;
          }
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
   * 3. Purges Service Worker cache storages.
   * 4. Activates the waiting service worker.
   * 5. Hard reloads the application.
   */
  public async executeSafeUpdate(onProgress?: (step: string) => void): Promise<void> {
    try {
      onProgress?.('Đang sao lưu tiến trình an toàn...');
      // 1. Safety snapshot
      SaveService.saveSafetyBackup();

      // 2. Live save
      SaveService.saveGame();

      onProgress?.('Đang xóa bộ nhớ đệm cũ (Cache Storage)...');
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cacheKeys = await window.caches.keys();
          await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
        } catch (e) {
          console.warn('Could not clear caches:', e);
        }
      }

      onProgress?.('Đang kích hoạt phiên bản mới...');
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (this.pendingUpdateFn) {
        this.pendingUpdateFn();
      } else if (this.registration?.waiting) {
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      onProgress?.('Đang tải lại giao diện mới nhất...');
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Hard reload with cache-busting param
      window.location.href = window.location.pathname + `?_update=${Date.now()}`;
    } catch (err) {
      console.error('Safe update execution failed:', err);
      window.location.reload();
    }
  }

  /**
   * Forces a complete cache-purge and reloads latest code from server immediately.
   */
  public async forceReloadLatest(onProgress?: (step: string) => void): Promise<void> {
    await this.executeSafeUpdate(onProgress);
  }

  public getVersion(): string {
    return CURRENT_APP_VERSION;
  }

  public getLatestRemoteVersion(): string {
    return this.latestRemoteVersion;
  }

  public getReleaseInfo(): AppReleaseInfo {
    return CURRENT_RELEASE_INFO;
  }
}

export const UpdateService = new UpdateServiceClass();
