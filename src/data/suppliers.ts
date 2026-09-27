export interface Supplier {
  id: string;
  name: string;
  shortName: string;
  description: string;
  priceModifier: number; // 0.8 = 20% discount, 1.35 = 35% markup
  qualityModifier: number; // impact on ingredient quality
  freshnessGuarantee: number; // 85%, 95%, 100%
  defectRate: number; // 0.20 = 20% rotten/spoiled fruit rate, 0.05 = 5%, 0.0 = 0%
  shelfLifeBonus: number; // -1 day, 0 days, +1 day
  riskBadge: string;
  riskColor: string;
  minOrderQuantity: number;
  deliverySpeed: 'instant' | 'next_day';
}

export const SUPPLIERS: Supplier[] = [
  {
    id: 'binh_dien_market',
    name: 'Chợ Đầu Mối Bình Điền',
    shortName: 'Chợ Đầu Mối',
    description: 'Giá buôn tận gốc cực rẻ (-20%), nhưng nguy cơ trái cây dập hỏng lên tới 20% và hạn dùng ngắn hơn 1 ngày.',
    priceModifier: 0.8, // 20% discount
    qualityModifier: 0.85,
    freshnessGuarantee: 75,
    defectRate: 0.20, // 20% fruits spoiled out of the box
    shelfLifeBonus: -1, // -1 day shelf life
    riskBadge: 'Rủi ro hỏng cao (20%)',
    riskColor: 'bg-red-100 text-red-800 border-red-300',
    minOrderQuantity: 10,
    deliverySpeed: 'instant',
  },
  {
    id: 'minh_tam_store',
    name: 'Đại Lý Phân Phối Minh Tâm',
    shortName: 'Đại Lý',
    description: 'Nhà cung cấp uy tín nhiều năm. Tỉ lệ hàng dập nhẹ 5%, hạn sử dụng tiêu chuẩn, giá cả niêm yết.',
    priceModifier: 1.0, // standard
    qualityModifier: 1.0,
    freshnessGuarantee: 90,
    defectRate: 0.05, // 5% defect rate
    shelfLifeBonus: 0,
    riskBadge: 'Tỷ lệ dập thấp (5%)',
    riskColor: 'bg-amber-100 text-amber-900 border-amber-300',
    minOrderQuantity: 5,
    deliverySpeed: 'instant',
  },
  {
    id: 'organic_farm',
    name: 'Nông Trại Hữu Cơ VietGAP',
    shortName: 'VietGAP',
    description: 'Trái cây sạch chuẩn VietGAP 100% tươi nguyên, không dập hỏng (0%) và có màng sinh học giúp tươi lâu hơn +1 ngày.',
    priceModifier: 1.35, // 35% higher
    qualityModifier: 1.3,
    freshnessGuarantee: 100,
    defectRate: 0.0, // 0% defect rate
    shelfLifeBonus: 1, // +1 day shelf life bonus
    riskBadge: 'VietGAP 100% Tươi (0% hỏng)',
    riskColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    minOrderQuantity: 3,
    deliverySpeed: 'instant',
  },
];
