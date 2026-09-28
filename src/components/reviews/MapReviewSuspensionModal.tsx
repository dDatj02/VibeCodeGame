import React, { useState } from 'react';
import { useReviewStore } from '../../stores/reviewStore';
import { useEconomyStore } from '../../stores/economyStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Laptop, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface MapReviewSuspensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MapReviewSuspensionModal: React.FC<MapReviewSuspensionModalProps> = ({ isOpen, onClose }) => {
  const reviews = useReviewStore((state) => state.reviews);
  const averageRating = useReviewStore((state) => state.averageRating);
  const mapReviewModeration = useReviewStore((state) => state.mapReviewModeration);
  const submitAppeal = useReviewStore((state) => state.submitAppeal);
  const hireITTeamRecovery = useReviewStore((state) => state.hireITTeamRecovery);
  const cash = useEconomyStore((state) => state.cash);

  const [appealResult, setAppealResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const itCost = mapReviewModeration.itRecoveryCost || 500000;
  const canAffordIT = cash >= itCost;

  const handleAppeal = () => {
    setIsProcessing(true);
    audioService.playClick();

    setTimeout(() => {
      const res = submitAppeal();
      setAppealResult(res);
      setIsProcessing(false);
    }, 600);
  };

  const handleHireIT = () => {
    setIsProcessing(true);
    audioService.playClick();

    setTimeout(() => {
      const res = hireITTeamRecovery();
      setIsProcessing(false);
      if (res.success) {
        onClose();
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-[#FAF4ED] border-3 border-[#3D2619] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#3D2619] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-950 text-white px-4 py-3 flex items-center justify-between border-b-2 border-rose-950 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black text-sm shadow-xs animate-pulse">
              🚫
            </div>
            <div>
              <h3 className="font-['Comfortaa',sans-serif] font-black text-xs sm:text-sm text-rose-100 leading-tight">
                Đình Chỉ Nền Tảng MapReview
              </h3>
              <span className="text-[10px] text-rose-200/90">Gian hàng tạm thời bị gỡ khỏi bản đồ tìm kiếm</span>
            </div>
          </div>

          <button
            onClick={() => {
              audioService.playClick();
              onClose();
            }}
            className="p-1 rounded-full text-rose-200 hover:text-white bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 text-xs">
          
          {/* Data Preservation Safety Notice */}
          <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-start gap-2.5 text-emerald-950 shadow-2xs">
            <ShieldCheck size={22} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-black text-[11.5px] text-emerald-900 block">
                DỮ LIỆU ĐÁNH GIÁ ĐƯỢC BẢO LƯU NGUYÊN VẸN 100%
              </span>
              <p className="text-[10px] text-emerald-800 leading-tight">
                Toàn bộ <strong>{reviews.length} đánh giá lịch sử</strong>, xếp hạng <strong>{averageRating}★</strong> và phản hồi của bạn <strong>KHÔNG HỀ BỊ MẤT</strong>. Chỉ cần khôi phục quyền truy cập là gian hàng sẽ xuất hiện lại như cũ!
              </p>
            </div>
          </div>

          {/* Traffic Penalty Alert */}
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-950">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <p className="text-[10.5px] leading-tight text-rose-900 font-semibold">
              Trong thời gian đình chỉ: Lượng khách ghé tiệm bị giảm <strong>-25%</strong> do khách không tìm thấy quán trên MapReview.
            </p>
          </div>

          {/* Appeal Feedback Notice if Any */}
          {appealResult && (
            <div className={`p-3 rounded-2xl border-2 animate-in slide-in-from-top-2 duration-200 ${
              appealResult.success 
                ? 'bg-emerald-50 border-emerald-400 text-emerald-950' 
                : 'bg-amber-50 border-amber-400 text-amber-950'
            }`}>
              <div className="flex items-center gap-2 font-black text-xs">
                {appealResult.success ? <CheckCircle2 size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-rose-600" />}
                <span>{appealResult.success ? 'KHÁNG CÁO THÀNH CÔNG!' : 'KHÁNG CÁO BỊ TỪ CHỐI'}</span>
              </div>
              <p className="text-[10.5px] mt-1 text-stone-700 leading-tight">
                {appealResult.message}
              </p>
            </div>
          )}

          {/* Option A: Free Appeal */}
          <div className="p-3 bg-white border-2 border-stone-200 hover:border-amber-300 rounded-2xl space-y-2 shadow-2xs transition-all">
            <div className="flex items-center justify-between pb-1 border-b border-stone-100">
              <div className="flex items-center gap-1.5">
                <FileText size={16} className="text-amber-600" />
                <span className="font-black text-xs text-[#3D2619]">Phương Án 1: Tự Gửi Kháng Cáo</span>
              </div>
              <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                MIỄN PHÍ
              </span>
            </div>

            <div className="text-[10.5px] text-stone-600 space-y-1 leading-relaxed">
              <p>• Gửi giải trình lên ban quản trị nền tảng MapReview để xin gỡ đình chỉ.</p>
              <p>• <strong>Tỷ lệ thành công:</strong> <span className="text-amber-700 font-black">50%</span>.</p>
              <p className="text-rose-700 font-medium">
                • <em>Lưu ý: Nếu kháng cáo thất bại, hồ sơ sẽ chuyển sang diện kiểm toán vi phạm và phí thuê IT sẽ tăng thêm +250.000đ/lần.</em>
              </p>
            </div>

            <button
              onClick={handleAppeal}
              disabled={isProcessing}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <FileText size={13} />
              <span>{isProcessing ? 'Đang gửi kháng cáo...' : 'Gửi Đơn Kháng Cáo (Miễn phí - 50% cơ hội)'}</span>
            </button>
          </div>

          {/* Option B: Hire IT Recovery */}
          <div className="p-3 bg-white border-2 border-sky-300 rounded-2xl space-y-2 shadow-2xs">
            <div className="flex items-center justify-between pb-1 border-b border-stone-100">
              <div className="flex items-center gap-1.5">
                <Laptop size={16} className="text-sky-600" />
                <span className="font-black text-xs text-[#3D2619]">Phương Án 2: Thuê Đội IT Khôi Phục</span>
              </div>
              <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                100% THÀNH CÔNG
              </span>
            </div>

            <div className="text-[10.5px] text-stone-600 space-y-1 leading-relaxed">
              <p>• Thuê chuyên gia can thiệp kỹ thuật và xử lý khiếu nại trực tiếp với nền tảng.</p>
              <p>• <strong>Kết quả:</strong> <span className="text-emerald-700 font-black">Mở lại gian hàng tức thì 100%</span>, bảo lưu đầy đủ mọi đánh giá.</p>
              <div className="flex items-center justify-between pt-1 font-black text-xs text-[#3D2619]">
                <span>Chi phí can thiệp:</span>
                <span className="text-[#E05338] text-sm tabular-nums">{formatVND(itCost)}</span>
              </div>
              {mapReviewModeration.failedAppeals > 0 && (
                <p className="text-[9.5px] text-rose-600 font-bold">
                  (Đã cộng thêm {formatVND(mapReviewModeration.failedAppeals * 250000)} do có {mapReviewModeration.failedAppeals} lần kháng cáo thất bại)
                </p>
              )}
            </div>

            <button
              onClick={handleHireIT}
              disabled={isProcessing || !canAffordIT}
              className={`w-full py-2.5 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                canAffordIT
                  ? 'bg-sky-600 hover:bg-sky-700 text-white'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <Laptop size={14} />
              <span>
                {isProcessing
                  ? 'Đang tiến hành khôi phục...'
                  : canAffordIT
                  ? `Thuê IT Khôi Phục (${formatVND(itCost)})`
                  : `Không đủ tiền mặt (${formatVND(itCost)})`}
              </span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#EEDCC8] border-t-2 border-[#D8C2AC] flex items-center justify-end shrink-0">
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
