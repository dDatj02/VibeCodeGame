import { ShopLevelConfig } from '../types';

export const SHOP_LEVELS: ShopLevelConfig[] = [
  {
    level: 1,
    title: 'Xe Đẩy Cũ Kỹ Vỉa Hè',
    description: 'Chiếc xe sinh tố mộc mạc bên lề đường. Không tốn tiền thuê mặt bằng, vừa sức khởi nghiệp.',
    upgradeCost: 0,
    maxQueueCapacity: 4,
    dailyRent: 0,
    trafficMultiplier: 1.0,
    spriteKey: 'cart_lv1',
  },
  {
    level: 2,
    title: 'Xe Inox Mới Kèm Dù Che Lớn',
    description: 'Thùng xe sạch sẽ, bóng bẩy với dù che mưa nắng và quầy trưng bày trái cây hấp dẫn.',
    upgradeCost: 800000,
    maxQueueCapacity: 6,
    dailyRent: 25000, // phí vỉa hè
    trafficMultiplier: 1.35,
    spriteKey: 'cart_lv2',
  },
  {
    level: 3,
    title: 'Kiosk Góc Phố Bàn Ghế Đỏ',
    description: 'Có chỗ ngồi cho khách uống tại chỗ, vị trí ngã tư đông đúc gần trường học và văn phòng.',
    upgradeCost: 2500000,
    maxQueueCapacity: 8,
    dailyRent: 80000,
    trafficMultiplier: 1.85,
    spriteKey: 'cart_lv3',
  },
  {
    level: 4,
    title: 'Quán Mặt Tiền Máy Lạnh',
    description: 'Không gian mát rượi, decor trẻ trung bắt mắt, thu hút khách gia đình và dân văn phòng.',
    upgradeCost: 8000000,
    maxQueueCapacity: 12,
    dailyRent: 250000,
    trafficMultiplier: 2.6,
    spriteKey: 'cart_lv4',
  },
  {
    level: 5,
    title: 'Boutique Smoothie Flagship',
    description: 'Cửa hàng biểu tượng phong cách hiện đại với quầy bar chuyên nghiệp và menu đa dạng.',
    upgradeCost: 20000000,
    maxQueueCapacity: 16,
    dailyRent: 600000,
    trafficMultiplier: 3.8,
    spriteKey: 'cart_lv5',
  },
];
