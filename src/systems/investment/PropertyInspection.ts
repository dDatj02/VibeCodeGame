import { PropertyItem, InspectionReport } from '../../types/investment';

export class PropertyInspection {
  public static inspect(property: PropertyItem): InspectionReport {
    const isClean = property.riskLevel === 'low' ? Math.random() < 0.9 : property.riskLevel === 'medium' ? Math.random() < 0.7 : Math.random() < 0.4;
    const confidence = property.riskLevel === 'low' ? 95 : property.riskLevel === 'medium' ? 88 : 80;

    if (property.propertyType === 'land') {
      return {
        verifiedOwner: true,
        zoningNotes: isClean 
          ? 'Đất thổ cư/vườn sạch, không tranh chấp, không nằm trong diện giải tỏa trắng.'
          : 'Khu vực có dự án mở rộng lòng đường hoặc quy hoạch cây xanh trong 3 năm tới.',
        roadRisk: isClean ? 'none' : property.riskLevel === 'high' ? 'high' : 'medium',
        growthForecast: property.developmentPotential === 'exceptional'
          ? 'Dự báo tăng trưởng vượt trội +30% khi hạ tầng giao thông kết nối.'
          : 'Dự báo tăng giá ổn định 10-15%/năm theo đà đô thị hóa.',
        confidencePercent: confidence,
      };
    } else {
      return {
        verifiedOwner: true,
        zoningNotes: 'Pháp lý sổ hồng riêng hoàn công đầy đủ, xây dựng đúng chỉ giới.',
        roadRisk: 'none',
        structureQuality: property.condition >= 75 
          ? 'Móng bê tông cốt thép kiên cố, tường sơn mới, không nứt lún.'
          : 'Tường hơi ẩm mốc, trần thạch cao cần gia cố lại trước khi cho thuê.',
        electricalPlumbing: property.condition >= 75
          ? 'Hệ thống điện nước âm tường hoạt động hoàn hảo, đồng hồ riêng.'
          : 'Đường ống nước cũ có dấu hiệu rò rỉ nhẹ, nên bảo dưỡng sớm.',
        growthForecast: 'Thanh khoản cao, dễ cho thuê chuyên gia hoặc gia đình thuê ở ngay.',
        confidencePercent: confidence,
      };
    }
  }
}
