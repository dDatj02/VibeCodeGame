export interface Supplier {
  id: string;
  name: string;
  description: string;
  priceModifier: number; // 0.85 = 15% discount, 1.3 = 30% markup
  qualityModifier: number; // impact on ingredient quality
  freshnessGuarantee: number; // 90%, 100%
  minOrderQuantity: number;
  deliverySpeed: 'instant' | 'next_day';
}

export const SUPPLIERS: Supplier[] = [
  {
    id: 'binh_dien_market',
    name: 'Chợ Đầu Mối Bình Điền',
    description: 'Giá buôn tận gốc cực rẻ nhưng chất lượng biến động theo từng đợt hàng.',
    priceModifier: 0.8, // 20% discount
    qualityModifier: 0.88,
    freshnessGuarantee: 85,
    minOrderQuantity: 10,
    deliverySpeed: 'instant',
  },
  {
    id: 'minh_tam_store',
    name: 'Đại Lý Nguyên Liệu Minh Tâm',
    description: 'Nhà cung cấp uy tín nhiều năm, giá cả niêm yết ổn định và giao hàng chuẩn chỉ.',
    priceModifier: 1.0, // standard
    qualityModifier: 1.0,
    freshnessGuarantee: 95,
    minOrderQuantity: 5,
    deliverySpeed: 'instant',
  },
  {
    id: 'organic_farm',
    name: 'Nông Trại Hữu Cơ GreenFarm',
    description: 'Trái cây sạch chuẩn VietGAP, tươi ngon mọng nước giúp tăng điểm review của thực khách.',
    priceModifier: 1.35, // 35% higher
    qualityModifier: 1.25,
    freshnessGuarantee: 100,
    minOrderQuantity: 3,
    deliverySpeed: 'instant',
  },
];
