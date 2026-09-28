import { LargeOrderCustomer, LargeOrderCustomerType } from '../types/largeOrder';

export interface CustomerTemplate {
  id: string;
  name: string;
  type: LargeOrderCustomerType;
  avatar: string;
  baseReliability: number;
  description: string;
  preferredRecipeTags?: ('Classic' | 'Signature' | 'Healthy' | 'Special')[];
  quantityMultiplier: number;
  depositChance: number;
}

export const LARGE_ORDER_CUSTOMER_TEMPLATES: CustomerTemplate[] = [
  {
    id: 'comp_vng',
    name: 'Tập Đoàn Tech VNG Center',
    type: 'company',
    avatar: '🏢',
    baseReliability: 94,
    description: 'Doanh nghiệp công nghệ đãi tiệc sinh nhật công ty & team building hàng quý.',
    preferredRecipeTags: ['Classic', 'Signature'],
    quantityMultiplier: 1.2,
    depositChance: 0.8,
  },
  {
    id: 'comp_fpt',
    name: 'Văn Phòng FPT Software',
    type: 'company',
    avatar: '🏢',
    baseReliability: 90,
    description: 'Đặt nước giải khát số lượng lớn cho hội thảo công nghệ.',
    preferredRecipeTags: ['Classic', 'Special'],
    quantityMultiplier: 1.0,
    depositChance: 0.75,
  },
  {
    id: 'school_lhp',
    name: 'Trường THPT Chuyên Lê Hồng Phong',
    type: 'school',
    avatar: '🎓',
    baseReliability: 88,
    description: 'Hội đồng học sinh đặt sinh tố cho Ngày hội Áo Trắng & Lễ Khai Giảng.',
    preferredRecipeTags: ['Classic'],
    quantityMultiplier: 1.5,
    depositChance: 0.5,
  },
  {
    id: 'school_bku',
    name: 'Đoàn Trường ĐH Bách Khoa',
    type: 'school',
    avatar: '🎓',
    baseReliability: 85,
    description: 'Đặt giải khát cho giải thể thao bóng đá sinh viên liên khoa.',
    preferredRecipeTags: ['Classic', 'Healthy'],
    quantityMultiplier: 1.4,
    depositChance: 0.6,
  },
  {
    id: 'gym_cali',
    name: 'Trung Tâm California Fitness',
    type: 'gym',
    avatar: '🏋️',
    baseReliability: 92,
    description: 'Chuỗi phòng gym cao cấp đặt sinh tố bổ sung đạm & năng lượng sau tập luyện.',
    preferredRecipeTags: ['Healthy'],
    quantityMultiplier: 0.9,
    depositChance: 0.85,
  },
  {
    id: 'gym_city',
    name: 'CLB Thể Hình CityGym Center',
    type: 'gym',
    avatar: '💪',
    baseReliability: 86,
    description: 'Đặt thức uống dinh dưỡng cho học viên tham gia thử thách lột xác.',
    preferredRecipeTags: ['Healthy'],
    quantityMultiplier: 0.85,
    depositChance: 0.7,
  },
  {
    id: 'event_wedding',
    name: 'Tiệc Cưới & Sự Kiện Trống Đồng',
    type: 'event',
    avatar: '🎉',
    baseReliability: 72,
    description: 'Đơn hàng tiệc tối gấp gáp cho khách mời sự kiện âm nhạc ngoài trời.',
    preferredRecipeTags: ['Signature', 'Special'],
    quantityMultiplier: 1.3,
    depositChance: 0.4,
  },
  {
    id: 'event_gala',
    name: 'Công Ty Sự Kiện VietEvent Star',
    type: 'event',
    avatar: '🎊',
    baseReliability: 68,
    description: 'Đặt phục vụ nước tiệc cuối năm, thời gian gấp rút và lịch trình dễ đổi.',
    preferredRecipeTags: ['Signature', 'Special'],
    quantityMultiplier: 1.4,
    depositChance: 0.35,
  },
  {
    id: 'birthday_gia_dinh',
    name: 'Tiệc Sinh Nhật Gia Đình Bác Ba',
    type: 'birthday',
    avatar: '🎂',
    baseReliability: 80,
    description: 'Đặt 40-60 ly sinh tố tươi cho đại gia đình và bạn bè liên hoan.',
    preferredRecipeTags: ['Classic', 'Signature'],
    quantityMultiplier: 0.7,
    depositChance: 0.5,
  },
  {
    id: 'sports_marathon',
    name: 'Giải Chạy Marathon Sài Gòn 21K',
    type: 'sports',
    avatar: '🏃',
    baseReliability: 89,
    description: 'Tiếp tế đồ uống trái cây tươi bù khoáng cho vận động viên về đích.',
    preferredRecipeTags: ['Healthy', 'Classic'],
    quantityMultiplier: 1.6,
    depositChance: 0.8,
  },
  {
    id: 'reseller_cafe',
    name: 'Chuỗi Trà & Bánh Ngọt CoCo',
    type: 'reseller',
    avatar: '🛍️',
    baseReliability: 84,
    description: 'Nhập số lượng sỉ sinh tố đóng chai phục vụ khách giờ cao điểm.',
    preferredRecipeTags: ['Classic', 'Signature'],
    quantityMultiplier: 1.1,
    depositChance: 0.65,
  },
];
