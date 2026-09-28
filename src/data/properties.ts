import { LandProperty, HouseProperty } from '../types/investment';

export const INITIAL_LAND_PROPERTIES: LandProperty[] = [
  {
    id: 'land_hocmon_1',
    name: 'Đất Vườn Ngoại Thành Hóc Môn',
    location: 'Hóc Môn, TP.HCM',
    area: 150,
    propertyType: 'land',
    icon: '🌳',
    purchasePrice: 650000000, // 650 Triệu VNĐ
    currentMarketValue: 650000000,
    estimatedMarketValue: 780000000,
    zoningStatus: 'unverified',
    developmentPotential: 'medium',
    rentalPotentialMonthly: 4500000, // 4.5 Triệu/tháng
    rentalDemand: 'medium',
    isRented: false,
    isOwned: false,
    isChecked: false,
    inspectionCost: 5000000, // 5 Triệu
    riskLevel: 'medium',
    description: 'Lô đất vườn 150m² vùng ven rợp bóng cây, thích hợp làm kho hàng hoặc cho thuê bãi đậu xe, quán nước giải khát.',
  },
  {
    id: 'land_school_2',
    name: 'Đất 120m² Cạnh Trường Đại Học',
    location: 'Làng Đại Học Thủ Đức',
    area: 120,
    propertyType: 'land',
    icon: '🏫',
    purchasePrice: 1150000000, // 1.15 Tỷ VNĐ
    currentMarketValue: 1150000000,
    estimatedMarketValue: 1380000000,
    zoningStatus: 'unverified',
    developmentPotential: 'high',
    rentalPotentialMonthly: 8500000, // 8.5 Triệu/tháng
    rentalDemand: 'high',
    isRented: false,
    isOwned: false,
    isChecked: false,
    inspectionCost: 8000000, // 8 Triệu
    riskLevel: 'low',
    description: 'Vị trí đắc địa 120m² ngay cổng sau ký túc xá. Nhu cầu thuê mở quầy ăn uống, trà sữa, sinh tố cực kỳ cao.',
  },
  {
    id: 'land_binhtan_3',
    name: 'Đất Thổ Cư Góc Phố Chợ Bình Tân',
    location: 'Bình Tân, TP.HCM',
    area: 90,
    propertyType: 'land',
    icon: '🛍️',
    purchasePrice: 1850000000, // 1.85 Tỷ VNĐ
    currentMarketValue: 1850000000,
    estimatedMarketValue: 2200000000,
    zoningStatus: 'unverified',
    developmentPotential: 'high',
    rentalPotentialMonthly: 14000000, // 14 Triệu/tháng
    rentalDemand: 'high',
    isRented: false,
    isOwned: false,
    isChecked: false,
    inspectionCost: 12000000, // 12 Triệu
    riskLevel: 'medium',
    description: 'Góc 2 mặt tiền 90m² gần chợ truyền thống đông đúc. Tiềm năng xây dựng ki-ốt cho tiểu thương thuê sinh lời liên tục.',
  },
  {
    id: 'land_thuduc_4',
    name: 'Lô Đất Quy Hoạch Trục Vành Đai 3',
    location: 'TP. Thủ Đức',
    area: 200,
    propertyType: 'land',
    icon: '🚧',
    purchasePrice: 3500000000, // 3.5 Tỷ VNĐ
    currentMarketValue: 3500000000,
    estimatedMarketValue: 4500000000,
    zoningStatus: 'unverified',
    developmentPotential: 'exceptional',
    rentalPotentialMonthly: 22000000, // 22 Triệu/tháng
    rentalDemand: 'medium',
    isRented: false,
    isOwned: false,
    isChecked: false,
    inspectionCost: 20000000, // 20 Triệu
    riskLevel: 'high',
    description: 'Lô đất 200m² nằm gần dự án đường Vành Đai lớn. Biên độ tăng giá cực khủng nhưng cần kiểm tra kỹ quy hoạch.',
  },
];

export const INITIAL_HOUSE_PROPERTIES: HouseProperty[] = [
  {
    id: 'house_studio_1',
    name: 'Nhà Phố Cấp 4 Vùng Ven Yên Tĩnh',
    location: 'Quận Gò Vấp / Hóc Môn, TP.HCM',
    area: 45,
    propertyType: 'house',
    icon: '🏠',
    purchasePrice: 1450000000, // 1.45 Tỷ VNĐ
    currentMarketValue: 1450000000,
    estimatedMarketValue: 1650000000,
    renovationCost: 120000000, // 120 Triệu
    maintenanceCost: 8000000, // 8 Triệu
    rentalIncomeMonthly: 11000000, // 11 Triệu/tháng
    rentalDemand: 'high',
    condition: 65, // 65%
    isRented: false,
    isOwned: false,
    isChecked: false,
    inspectionCost: 6000000, // 6 Triệu
    riskLevel: 'low',
    description: 'Nhà cấp 4 nhỏ gọn trong khu dân cư an ninh, phù hợp cho gia đình trẻ hoặc sinh viên thuê dài hạn.',
  },
  {
    id: 'house_d7_2',
    name: 'Nhà 2 Tầng Liền Kề Khu Nam',
    location: 'Quận 7, TP.HCM',
    area: 75,
    propertyType: 'house',
    icon: '🏡',
    purchasePrice: 3200000000, // 3.2 Tỷ VNĐ
    currentMarketValue: 3200000000,
    estimatedMarketValue: 3800000000,
    renovationCost: 220000000, // 220 Triệu
    maintenanceCost: 15000000, // 15 Triệu
    rentalIncomeMonthly: 22000000, // 22 Triệu/tháng
    rentalDemand: 'high',
    condition: 80,
    isRented: false,
    isOwned: false,
    isChecked: false,
    inspectionCost: 15000000, // 15 Triệu
    riskLevel: 'low',
    description: 'Thiết kế 2 tầng hiện đại gần khu chế xuất và trường quốc tế. Khách thuê chuyên gia công sở rất ưa chuộng.',
  },
  {
    id: 'house_d1_3',
    name: 'Nhà Cổ Mặt Tiền Hẻm Kinh Doanh',
    location: 'Quận 1, TP.HCM',
    area: 60,
    propertyType: 'house',
    icon: '🏛️',
    purchasePrice: 7800000000, // 7.8 Tỷ VNĐ
    currentMarketValue: 7800000000,
    estimatedMarketValue: 9200000000,
    renovationCost: 450000000, // 450 Triệu
    maintenanceCost: 25000000, // 25 Triệu
    rentalIncomeMonthly: 48000000, // 48 Triệu/tháng
    rentalDemand: 'high',
    condition: 50,
    isRented: false,
    isOwned: false,
    isChecked: false,
    inspectionCost: 25000000, // 25 Triệu
    riskLevel: 'medium',
    description: 'Căn nhà phong cách Indochine cổ kính ngay trung tâm sầm uất. Cải tạo nâng cấp sẽ biến thành điểm check-in hoặc quán cafe sinh tố đỉnh cao.',
  },
];
