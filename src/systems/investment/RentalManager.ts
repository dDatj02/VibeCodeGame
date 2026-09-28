import { PropertyItem, RentalContract, TenantType } from '../../types/investment';

export interface TenantTemplate {
  type: TenantType;
  name: string;
  avatar: string;
  rentModifier: number; // Multiplier vs base property rent
  reliability: number; // 0 to 100
  durationDays: number;
}

export const TENANT_TEMPLATES: Record<TenantType, TenantTemplate> = {
  food_vendor: {
    type: 'food_vendor',
    name: 'Quầy Nước Sâm & Bánh Tráng Chú Bảy',
    avatar: '👨‍🍳',
    rentModifier: 0.95,
    reliability: 92,
    durationDays: 30,
  },
  local_business: {
    type: 'local_business',
    name: 'Công Ty Chuyển Phát Nhanh Giao Hàng Xanh',
    avatar: '🚚',
    rentModifier: 1.1,
    reliability: 96,
    durationDays: 60,
  },
  small_shop: {
    type: 'small_shop',
    name: 'Tiệm Tạp Hóa Cô Mai',
    avatar: '🏪',
    rentModifier: 1.0,
    reliability: 95,
    durationDays: 45,
  },
  storage: {
    type: 'storage',
    name: 'Kho Chứa Nông Sản Sạch Minh Phát',
    avatar: '📦',
    rentModifier: 0.9,
    reliability: 98,
    durationDays: 60,
  },
  family: {
    type: 'family',
    name: 'Gia Đình Anh Tuấn & Chị Thảo',
    avatar: '👨‍👩‍👧',
    rentModifier: 1.0,
    reliability: 94,
    durationDays: 60,
  },
  event_organizer: {
    type: 'event_organizer',
    name: 'Ban Tổ Chức Hội Chợ Cuối Tuần',
    avatar: '🎪',
    rentModifier: 1.25,
    reliability: 85,
    durationDays: 15,
  },
  office: {
    type: 'office',
    name: 'Văn Phòng Thiết Kế Kiến Trúc Không Gian Việt',
    avatar: '🏢',
    rentModifier: 1.15,
    reliability: 97,
    durationDays: 90,
  },
};

export class RentalManager {
  public static createContract(property: PropertyItem, preferredType?: TenantType): RentalContract {
    const baseMonthly = property.propertyType === 'land' 
      ? property.rentalPotentialMonthly 
      : property.rentalIncomeMonthly;

    // Pick tenant template
    let tenantType = preferredType;
    if (!tenantType) {
      if (property.propertyType === 'land') {
        const landTypes: TenantType[] = ['food_vendor', 'storage', 'small_shop', 'event_organizer'];
        tenantType = landTypes[Math.floor(Math.random() * landTypes.length)];
      } else {
        const houseTypes: TenantType[] = ['family', 'office', 'local_business', 'small_shop'];
        tenantType = houseTypes[Math.floor(Math.random() * houseTypes.length)];
      }
    }

    const template = TENANT_TEMPLATES[tenantType];
    const conditionFactor = property.propertyType === 'house' ? (property.condition / 100) : 1.0;
    const finalMonthlyRent = Math.round((baseMonthly * template.rentModifier * (0.8 + 0.2 * conditionFactor)) / 50000) * 50000;
    const dailyRent = Math.max(10000, Math.round(finalMonthlyRent / 30));

    return {
      propertyId: property.id,
      tenantType: template.type,
      tenantName: template.name,
      tenantAvatar: template.avatar,
      monthlyRent: finalMonthlyRent,
      dailyRent,
      durationDays: template.durationDays,
      daysRemaining: template.durationDays,
      paymentReliability: template.reliability,
      startDate: 1,
      depositAmount: finalMonthlyRent, // 1 month deposit
      isPaidToday: true,
    };
  }
}
