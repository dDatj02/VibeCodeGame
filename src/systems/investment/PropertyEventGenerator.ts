import { InvestmentEvent, PropertyItem } from '../../types/investment';

export class PropertyEventGenerator {
  public static rollDailyEvent(properties: PropertyItem[]): InvestmentEvent | null {
    if (properties.length === 0) return null;
    // 15% chance of an event on any given day
    if (Math.random() > 0.15) return null;

    const targetProp = properties[Math.floor(Math.random() * properties.length)];
    const roll = Math.random();

    if (targetProp.propertyType === 'land') {
      if (roll < 0.4) {
        return {
          id: `evt_land_road_${Date.now()}`,
          title: '🚧 DỰ ÁN MỞ RỘNG ĐƯỜNG LIÊN HUYỆN',
          description: `Khu vực quanh "${targetProp.name}" vừa được phê duyệt mở rộng lộ giới 30m. Giá trị lô đất tăng vọt +25%!`,
          icon: '🚧',
          propertyId: targetProp.id,
          affectedType: 'land',
          valueDeltaPercent: 0.25,
        };
      } else if (roll < 0.7) {
        return {
          id: `evt_land_school_${Date.now()}`,
          title: '🏫 KHỞI CÔNG TRƯỜNG ĐẠI HỌC MỚI',
          description: `Trường đại học quốc tế sắp xây dựng cách "${targetProp.name}" 500m. Nhu cầu thuê mặt bằng tăng mạnh (+20%)!`,
          icon: '🏫',
          propertyId: targetProp.id,
          affectedType: 'land',
          valueDeltaPercent: 0.15,
          rentalDeltaPercent: 0.20,
        };
      } else {
        return {
          id: `evt_land_downturn_${Date.now()}`,
          title: '📉 THỊ TRƯỜNG BẤT ĐỘNG SẢN CHẬM LẠI',
          description: `Lãi suất ngân hàng biến động khiến giao dịch đất nền khu vực "${targetProp.name}" giảm nhẹ (-8%).`,
          icon: '📉',
          propertyId: targetProp.id,
          affectedType: 'land',
          valueDeltaPercent: -0.08,
        };
      }
    } else {
      // House events
      if (roll < 0.35) {
        return {
          id: `evt_house_demand_${Date.now()}`,
          title: '🏘️ NHU CẦU THUÊ NHÀ TĂNG CAO',
          description: `Nhiều chuyên gia công ty chuyển về sinh sống gần "${targetProp.name}". Tiền thuê đề xuất tăng +15%!`,
          icon: '📈',
          propertyId: targetProp.id,
          affectedType: 'house',
          rentalDeltaPercent: 0.15,
          valueDeltaPercent: 0.10,
        };
      } else if (roll < 0.7) {
        return {
          id: `evt_house_plumbing_${Date.now()}`,
          title: '🔧 BẢO DƯỠNG ĐƯỜNG ỐNG NƯỚC ĐỊNH KỲ',
          description: `Căn nhà "${targetProp.name}" cần sửa chữa vòi nước và chống thấm sàn mái nhẹ.`,
          icon: '🔧',
          propertyId: targetProp.id,
          affectedType: 'house',
          conditionDelta: -5,
          cashCost: 450000,
        };
      } else {
        return {
          id: `evt_house_metro_${Date.now()}`,
          title: '🚇 TUYẾN XE BUS NHANH VẬN HÀNH',
          description: `Trạm xe bus nhanh vừa đưa vào hoạt động ngay đầu ngõ của "${targetProp.name}". Giá trị nhà tăng +18%!`,
          icon: '🚇',
          propertyId: targetProp.id,
          affectedType: 'house',
          valueDeltaPercent: 0.18,
        };
      }
    }
  }
}
