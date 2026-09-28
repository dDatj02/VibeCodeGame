import React from 'react';
import { useInvestmentStore } from '../../stores/investmentStore';
import { formatVND } from '../../utils/format';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2, TrendingUp, X } from 'lucide-react';

export const PropertyInspectionModal: React.FC = () => {
  const inspectionResult = useInvestmentStore((state) => state.inspectionResultModal);
  const closeInspectionModal = useInvestmentStore((state) => state.closeInspectionModal);

  if (!inspectionResult) return null;

  const { property, report } = inspectionResult;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#FAF4ED] text-[#3D2619] w-full max-w-sm rounded-3xl border-3 border-[#542810] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-800 text-white p-3.5 flex items-center justify-between border-b-2 border-emerald-950">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="text-sm font-black font-['Comfortaa',sans-serif] text-emerald-100 leading-tight">
                Báo Cáo Thẩm Định Pháp Lý
              </h3>
              <p className="text-[10px] text-emerald-200/90">
                Độ tin cậy: <span className="font-black text-amber-300">{report.confidencePercent}%</span>
              </p>
            </div>
          </div>
          <button
            onClick={closeInspectionModal}
            className="p-1 text-emerald-200 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 space-y-2.5 text-xs">
          
          {/* Property header badge */}
          <div className="bg-white p-2.5 rounded-2xl border border-amber-200 shadow-2xs flex items-center gap-2">
            <span className="text-2xl shrink-0">{property.icon}</span>
            <div className="min-w-0">
              <span className="font-black text-[#3D2619] block truncate text-xs">
                {property.name}
              </span>
              <span className="text-[10px] text-stone-500 font-bold">
                {property.location} · {property.area}m²
              </span>
            </div>
          </div>

          {/* Legal & Owner verification */}
          <div className="bg-white p-2.5 rounded-2xl border border-amber-200 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-black text-emerald-800 text-[11px]">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Xác minh chủ quyền & Quy hoạch:</span>
            </div>
            <p className="text-[10.5px] text-stone-700 leading-relaxed pl-5">
              {report.zoningNotes}
            </p>
          </div>

          {/* Structure / Plumbing if House */}
          {report.structureQuality && (
            <div className="bg-white p-2.5 rounded-2xl border border-amber-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-sky-800 text-[11px]">
                <CheckCircle2 size={14} className="text-sky-600" />
                <span>Kết cấu & Điện nước:</span>
              </div>
              <p className="text-[10.5px] text-stone-700 leading-relaxed pl-5">
                {report.structureQuality}
              </p>
            </div>
          )}

          {/* Growth forecast */}
          <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-300 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 font-black text-amber-900 text-[11px]">
              <TrendingUp size={14} className="text-amber-700" />
              <span>Đánh giá tiềm năng tăng trưởng:</span>
            </div>
            <p className="text-[10.5px] text-amber-950 font-bold leading-relaxed pl-5">
              {report.growthForecast}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-[#EEDCC8] border-t-2 border-[#D8C2AC]">
          <button
            onClick={closeInspectionModal}
            className="w-full py-2 bg-[#F26440] hover:bg-[#E05338] text-white font-black text-xs rounded-2xl shadow-xs cursor-pointer transition-all active:scale-95"
          >
            Đã Hiểu & Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
