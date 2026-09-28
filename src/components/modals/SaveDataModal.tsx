import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useShopStore } from '../../stores/shopStore';
import { useInvestmentStore } from '../../stores/investmentStore';
import { BackupService } from '../../services/BackupService';
import { SaveService } from '../../services/SaveService';
import { BackupEnvelope, BackupMetadata } from '../../types/backup';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { 
  X, 
  Cloud, 
  RotateCcw, 
  Copy, 
  Share2, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  HardDrive, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  Clock,
  Store,
  Trash2,
  FileCheck,
  Undo2
} from 'lucide-react';

interface SaveDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveDataModal: React.FC<SaveDataModalProps> = ({ isOpen, onClose }) => {
  const showNotification = useGameStore((state) => state.showNotification);
  const currentDay = useGameStore((state) => state.day);
  const currentShopName = useGameStore((state) => state.shopName);
  const currentShopAvatar = useGameStore((state) => state.shopAvatar);
  const currentCash = useEconomyStore((state) => state.cash);
  const currentLevel = useShopStore((state) => state.currentShopLevel);
  const currentPropertiesCount = useInvestmentStore((state) => state.ownedProperties.length);

  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'local'>('backup');
  
  // Backup State
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [backupMetadata, setBackupMetadata] = useState<BackupMetadata | null>(null);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  // Restore State
  const [restoreInputCode, setRestoreInputCode] = useState<string>('');
  const [validatedEnvelope, setValidatedEnvelope] = useState<BackupEnvelope | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoredSuccess, setIsRestoredSuccess] = useState<boolean>(false);
  const [showConfirmReplace, setShowConfirmReplace] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerateBackup = () => {
    audioService.playClick();
    const result = BackupService.generateBackupCode();
    setGeneratedCode(result.formattedCode);
    setBackupMetadata(result.metadata);
    setHasCopied(false);
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;
    const ok = await BackupService.copyToClipboard(generatedCode);
    if (ok) {
      audioService.playCashRegister();
      setHasCopied(true);
      showNotification('✓ Đã sao chép mã sao lưu vào bộ nhớ tạm!', 'success');
      setTimeout(() => setHasCopied(false), 3000);
    }
  };

  const handleShareCode = async () => {
    if (!generatedCode) return;
    audioService.playClick();
    await BackupService.shareBackupCode(generatedCode, currentShopName);
  };

  const handleValidateInput = () => {
    audioService.playClick();
    setRestoreError(null);
    setShowConfirmReplace(false);

    const result = BackupService.validateBackupCode(restoreInputCode);
    if (!result.success || !result.envelope) {
      audioService.playDisappointed();
      setRestoreError(result.errorMessage || 'Mã sao lưu không hợp lệ.');
      setValidatedEnvelope(null);
      return;
    }

    setValidatedEnvelope(result.envelope);
    setShowConfirmReplace(true);
  };

  const handleConfirmRestore = () => {
    if (!validatedEnvelope) return;

    audioService.playFanfare();
    const res = BackupService.restoreFromEnvelope(validatedEnvelope);
    if (!res.success) {
      audioService.playDisappointed();
      setRestoreError(res.errorMessage || 'Lỗi khi khôi phục dữ liệu.');
      return;
    }

    setIsRestoredSuccess(true);
    showNotification('🎉 Khôi phục tiến trình quán thành công!', 'success');
  };

  const handleQuickSave = () => {
    audioService.playClick();
    const ok = SaveService.saveGame();
    if (ok) {
      audioService.playCashRegister();
      showNotification('✓ Đã lưu tiến trình quán thành công!', 'success');
    } else {
      showNotification('Lỗi khi lưu game!', 'error');
    }
  };

  const handleRestoreSafetyBackup = () => {
    if (!SaveService.hasSafetyBackup()) {
      showNotification('Không tìm thấy bản lưu an toàn trước đó!', 'warning');
      return;
    }

    if (window.confirm('Bạn có muốn khôi phục lại bản lưu an toàn trước đó không?')) {
      audioService.playClick();
      const ok = SaveService.restoreSafetyBackup();
      if (ok) {
        audioService.playFanfare();
        showNotification('✓ Đã hoàn tác về bản lưu an toàn!', 'success');
        onClose();
      } else {
        showNotification('Không thể khôi phục bản lưu an toàn!', 'error');
      }
    }
  };

  const handleResetGame = () => {
    if (window.confirm('⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ tiến trình và chơi lại tiệm mới từ Ngày 1 không?')) {
      audioService.playClick();
      SaveService.clearSave();
      showNotification('Đã khởi động lại tiệm mới!', 'info');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-[#FAF4ED] border-3 border-[#3D2619] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3D2619] via-[#542810] to-[#3D2619] text-[#FAF4ED] px-3.5 py-2.5 flex items-center justify-between border-b-2 border-[#24130A]">
          <div className="flex items-center gap-2">
            <Cloud className="text-amber-300" size={18} />
            <div>
              <h3 className="font-['Comfortaa',sans-serif] font-black text-xs sm:text-sm text-amber-100 leading-tight">
                Mã Sao Lưu & Dữ Liệu Game
              </h3>
              <p className="text-[10px] text-amber-200/80">Chuyển đổi thiết bị không cần tài khoản</p>
            </div>
          </div>
          <button
            onClick={() => {
              audioService.playClick();
              onClose();
            }}
            className="p-1 rounded-full text-amber-200 hover:text-white bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 bg-[#FAF0E6] p-1 border-b border-[#EEDCC8] gap-1 text-[11px] font-black shrink-0">
          <button
            onClick={() => {
              audioService.playClick();
              setActiveTab('backup');
            }}
            className={`py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'backup'
                ? 'bg-[#E05338] text-white shadow-2xs'
                : 'text-[#8C624D] hover:bg-amber-100/60'
            }`}
          >
            <Cloud size={12} />
            <span>Tạo Mã</span>
          </button>

          <button
            onClick={() => {
              audioService.playClick();
              setActiveTab('restore');
            }}
            className={`py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'restore'
                ? 'bg-[#E05338] text-white shadow-2xs'
                : 'text-[#8C624D] hover:bg-amber-100/60'
            }`}
          >
            <RotateCcw size={12} />
            <span>Khôi Phục</span>
          </button>

          <button
            onClick={() => {
              audioService.playClick();
              setActiveTab('local');
            }}
            className={`py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'local'
                ? 'bg-[#E05338] text-white shadow-2xs'
                : 'text-[#8C624D] hover:bg-amber-100/60'
            }`}
          >
            <HardDrive size={12} />
            <span>Bộ Nhớ Máy</span>
          </button>
        </div>

        {/* Body Content (Internal Scrollable) */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 text-xs text-[#3D2619]">
          
          {/* ================= TAB 1: CREATE BACKUP ================= */}
          {activeTab === 'backup' && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <Sparkles size={14} className="text-[#E05338]" />
                  <span>SAO LƯU TIẾN TRÌNH CỦA BẠN</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Tạo mã sao lưu di động chứa toàn bộ quán, tiền mặt, công thức, máy móc và bất động sản để chơi tiếp trên thiết bị khác bất kỳ lúc nào!
                </p>
              </div>

              {!generatedCode ? (
                <div className="pt-2 text-center">
                  <button
                    onClick={handleGenerateBackup}
                    className="w-full py-3 bg-gradient-to-r from-[#F26440] to-[#E05338] hover:from-[#E05338] hover:to-[#D2442A] text-white font-black text-xs rounded-2xl shadow-md cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Cloud size={16} />
                    <span>Tạo Mã Sao Lưu Tiến Trình</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="bg-white border-2 border-[#3D2619] rounded-2xl p-3 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#8C624D] uppercase tracking-wider">
                        MÃ SAO LƯU CỦA BẠN (BACKUP CODE)
                      </span>
                      <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Đã nén & Xác thực
                      </span>
                    </div>

                    {/* Display Code Box */}
                    <div 
                      onClick={handleCopyCode}
                      className="p-2.5 bg-stone-900 text-amber-200 font-mono text-[11px] leading-relaxed rounded-xl break-all cursor-pointer select-all border border-stone-800 hover:border-amber-400 transition-colors max-h-28 overflow-y-auto no-scrollbar"
                      title="Bấm để sao chép toàn bộ mã"
                    >
                      {generatedCode}
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={handleCopyCode}
                        className={`py-2 px-3 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer ${
                          hasCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#F26440] hover:bg-[#E05338] text-white'
                        }`}
                      >
                        {hasCopied ? <Check size={13} /> : <Copy size={13} />}
                        <span>{hasCopied ? 'Đã Sao Chép!' : 'Sao Chép Mã'}</span>
                      </button>

                      <button
                        onClick={handleShareCode}
                        className="py-2 px-3 bg-white hover:bg-stone-50 border border-stone-300 text-[#3D2619] rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <Share2 size={13} className="text-amber-700" />
                        <span>Chia Sẻ Mã</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary of what's packed */}
                  {backupMetadata && (
                    <div className="p-2.5 bg-white border border-amber-200 rounded-2xl space-y-1 text-[10.5px]">
                      <span className="font-black text-[#3D2619] block">Bao gồm trong bản sao lưu:</span>
                      <div className="grid grid-cols-2 gap-1 text-stone-600 font-medium">
                        <span>• Tiệm: <strong>{backupMetadata.shopName}</strong></span>
                        <span>• Ngày: <strong>{backupMetadata.day}</strong></span>
                        <span>• Tiền mặt: <strong>{formatVND(backupMetadata.cash)}</strong></span>
                        <span>• BĐS sở hữu: <strong>{backupMetadata.propertiesCount}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Privacy reminder */}
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-800 flex items-start gap-1.5">
                    <AlertTriangle size={14} className="shrink-0 text-rose-600 mt-0.5" />
                    <span>Mã này chứa toàn bộ dữ liệu game. Ai có mã này đều có thể khôi phục tiến trình. Hãy cất giữ cẩn thận!</span>
                  </div>

                  <div className="pt-1 flex justify-center">
                    <button
                      onClick={handleGenerateBackup}
                      className="text-[10.5px] font-bold text-stone-500 hover:text-[#E05338] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw size={11} />
                      <span>Tạo lại mã sao lưu mới nhất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: RESTORE BACKUP ================= */}
          {activeTab === 'restore' && (
            <div className="space-y-3">
              {isRestoredSuccess ? (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-2.5 animate-in zoom-in-95 duration-150">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto text-xl shadow-md">
                    ✓
                  </div>
                  <h4 className="font-black text-sm text-emerald-900 font-['Comfortaa',sans-serif]">
                    Khôi Phục Tiến Trình Thành Công!
                  </h4>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Toàn bộ dữ liệu tiệm của bạn đã được nạp lại an toàn.
                  </p>
                  <button
                    onClick={() => {
                      audioService.playClick();
                      onClose();
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    Vào Chơi Game Ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-[#3D2619] block">
                      Dán mã sao lưu (Backup Code):
                    </label>
                    <textarea
                      value={restoreInputCode}
                      onChange={(e) => {
                        setRestoreInputCode(e.target.value);
                        setRestoreError(null);
                        setShowConfirmReplace(false);
                      }}
                      placeholder="Dán mã sao lưu vào đây (Ví dụ: SH1-7K29-XP4M-82QZ...)"
                      rows={3}
                      className="w-full p-2.5 bg-white border-2 border-stone-300 focus:border-[#E05338] rounded-xl text-xs font-mono outline-none transition-colors shadow-inner resize-none text-[#3D2619]"
                    />
                  </div>

                  {restoreError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[10.5px] text-rose-800 flex items-start gap-1.5 font-bold animate-in fade-in duration-100">
                      <AlertTriangle size={14} className="shrink-0 text-rose-600 mt-0.5" />
                      <span>{restoreError}</span>
                    </div>
                  )}

                  {!showConfirmReplace ? (
                    <button
                      onClick={handleValidateInput}
                      disabled={!restoreInputCode.trim()}
                      className={`w-full py-2.5 rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        restoreInputCode.trim()
                          ? 'bg-[#F26440] hover:bg-[#E05338] text-white active:scale-98'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      <FileCheck size={14} />
                      <span>Kiểm Tra & Đọc Mã Sao Lưu</span>
                    </button>
                  ) : (
                    /* CONFIRMATION & COMPARISON VIEW */
                    validatedEnvelope && (
                      <div className="space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                        {/* Backup Found Card */}
                        <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-1 text-[11px]">
                          <div className="flex items-center justify-between font-black text-emerald-900 pb-1 border-b border-emerald-200">
                            <span className="flex items-center gap-1">
                              <Check size={14} className="text-emerald-600" />
                              <span>ĐÃ TÌM THẤY BẢN SAO LƯU HỢP LỆ</span>
                            </span>
                            <span className="text-[10px] text-emerald-700">v{validatedEnvelope.version}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-1 pt-1 text-emerald-950 font-semibold text-[10.5px]">
                            <span>• Tiệm: <strong>{validatedEnvelope.metadata.shopName}</strong></span>
                            <span>• Ngày: <strong>{validatedEnvelope.metadata.day}</strong></span>
                            <span>• Tiền mặt: <strong>{formatVND(validatedEnvelope.metadata.cash)}</strong></span>
                            <span>• Cấp tiệm: <strong>Cấp {validatedEnvelope.metadata.shopLevel}</strong></span>
                            <span>• BĐS / Vàng: <strong>{validatedEnvelope.metadata.propertiesCount} BĐS {validatedEnvelope.metadata.goldQuantity ? `· ${validatedEnvelope.metadata.goldQuantity}L vàng` : ''}</strong></span>
                            <span>• Sao: <strong>{validatedEnvelope.metadata.averageRating}★</strong></span>
                          </div>
                        </div>

                        {/* Replacement warning */}
                        <div className="p-2.5 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-2 text-[10.5px]">
                          <div className="flex items-center gap-1 font-black text-amber-900 text-[11px]">
                            <AlertTriangle size={14} className="text-amber-600" />
                            <span>XÁC NHẬN THAY THẾ TIẾN TRÌNH TRÊN MÁY</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-stone-700 bg-white p-2 rounded-xl border border-amber-200">
                            <div>
                              <span className="text-[9px] font-bold text-stone-400 block uppercase">Tiến trình hiện tại:</span>
                              <strong className="text-stone-900 text-xs block truncate">{currentShopName}</strong>
                              <span className="text-[10px] text-stone-600">Ngày {currentDay} · {formatVND(currentCash)}</span>
                            </div>

                            <div className="border-l pl-2 border-stone-200">
                              <span className="text-[9px] font-bold text-emerald-600 block uppercase">Sẽ thay thế bằng:</span>
                              <strong className="text-emerald-900 text-xs block truncate">{validatedEnvelope.metadata.shopName}</strong>
                              <span className="text-[10px] text-emerald-700 font-bold">Ngày {validatedEnvelope.metadata.day} · {formatVND(validatedEnvelope.metadata.cash)}</span>
                            </div>
                          </div>

                          <p className="text-stone-600 text-[10px] leading-tight">
                            Hệ thống sẽ tự động lưu lại 1 bản dự phòng an toàn trước khi khôi phục để đảm bảo an toàn tuyệt đối.
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowConfirmReplace(false)}
                            className="w-1/3 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            Hủy Bỏ
                          </button>

                          <button
                            onClick={handleConfirmRestore}
                            className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Check size={14} />
                            <span>Xác Nhận Khôi Phục</span>
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: LOCAL STORAGE & SAFETY BACKUP ================= */}
          {activeTab === 'local' && (
            <div className="space-y-2.5">
              
              {/* Quick Save */}
              <div className="p-3 bg-white border border-amber-200 rounded-2xl space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[#3D2619] text-xs flex items-center gap-1.5">
                    <HardDrive size={14} className="text-emerald-600" />
                    <span>Lưu Trữ Cục Bộ (Local Storage)</span>
                  </span>
                  <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Tự động
                  </span>
                </div>
                <p className="text-[10.5px] text-stone-600">
                  Game tự động lưu mỗi khi kết thúc ngày bán. Bạn cũng có thể bấm lưu thủ công bất cứ lúc nào.
                </p>
                <button
                  onClick={handleQuickSave}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  💾 Lưu Nhanh Ngay Bây Giờ
                </button>
              </div>

              {/* Safety Backup Rollback */}
              {SaveService.hasSafetyBackup() && (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sky-950 text-xs flex items-center gap-1.5">
                      <Undo2 size={14} className="text-sky-600" />
                      <span>Bản Lưu Dự Phòng An Toàn</span>
                    </span>
                    <span className="text-[9.5px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                      Có sẵn
                    </span>
                  </div>
                  <p className="text-[10.5px] text-sky-900">
                    Bản lưu snapshot được tự động tạo trước lần khôi phục mã sao lưu gần nhất.
                  </p>
                  <button
                    onClick={handleRestoreSafetyBackup}
                    className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    ⏪ Hoàn Tác Về Bản Lưu An Toàn
                  </button>
                </div>
              )}

              {/* Reset Game */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-rose-950 text-xs flex items-center gap-1.5">
                    <Trash2 size={14} className="text-rose-600" />
                    <span>Khởi Động Lại / Xóa Dữ Liệu</span>
                  </span>
                </div>
                <p className="text-[10.5px] text-rose-800">
                  Xóa toàn bộ dữ liệu trên thiết bị này và bắt đầu lại tiệm sinh tố mới từ Ngày 1.
                </p>
                <button
                  onClick={handleResetGame}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  🗑️ Đặt Lại & Chơi Lại Từ Đầu
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#EEDCC8] border-t-2 border-[#D8C2AC] flex justify-end">
          <button
            onClick={() => {
              audioService.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-[#3D2619] hover:bg-[#542810] text-amber-100 font-black text-xs rounded-xl shadow-2xs cursor-pointer transition-all active:scale-95"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
