export interface EventDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'opportunity' | 'crisis' | 'weather' | 'influencer';
  triggerCondition?: (day: number, rating: number, cash: number) => boolean;
  choices: {
    text: string;
    description: string;
    cashCost?: number;
    cashReward?: number;
    ratingDelta?: number;
    trafficModifier?: number;
    toastMessage: string;
  }[];
}

export const GAME_EVENTS: EventDefinition[] = [
  {
    id: 'evt_influencer_visit',
    title: 'Food Reviewer "Minh Ăn Gì?" Bất Ngờ Ghé Quán!',
    description: 'Tiktoker ẩm thực có 120.000 người theo dõi xuất hiện với máy quay: "Chào anh chủ, cho em thử món signature đỉnh nhất của quán nhé!"',
    icon: '🌟',
    category: 'influencer',
    choices: [
      {
        text: 'Làm Ly Bơ Đặc Biệt Siêu Chất Lượng (Free)',
        description: 'Tốn chút chi phí nhưng để lại ấn tượng cực tốt với reviewer.',
        cashCost: 35000,
        ratingDelta: 0.2,
        trafficModifier: 1.5,
        toastMessage: 'Minh Ăn Gì đã đăng video khen nức nở! Lượng khách ngày mai tăng 50%!',
      },
      {
        text: 'Phục Vụ Bình Thường Tính Tiền Như Khách Khác',
        description: 'Công bằng với mọi khách hàng, không ưu tiên tiktoker.',
        ratingDelta: 0.05,
        trafficModifier: 1.1,
        toastMessage: 'Reviewer để lại đánh giá 4 sao khen ngợi tính chân thật của quán.',
      },
      {
        text: 'Từ Chối Quay Phim Vì Quán Đang Quá Tải',
        description: 'Tập trung phục vụ khách quen đang chờ trong hàng.',
        ratingDelta: -0.1,
        trafficModifier: 0.9,
        toastMessage: 'Reviewer hơi hụt hẫng nhưng khách quen cảm kích vì sự chu đáo.',
      },
    ],
  },
  {
    id: 'evt_mango_harvest',
    title: 'Xoài Cát Miền Tây Trúng Mùa Lớn',
    description: 'Vựa trái cây liên hệ báo tin xoài năm nay vừa ngọt vừa rẻ, đề xuất quán nhập sỉ số lượng lớn.',
    icon: '🥭',
    category: 'opportunity',
    choices: [
      {
        text: 'Nhập Ngay 20 Phần Xoài Giá Khuyến Mãi (140.000đ)',
        description: 'Tiết kiệm 40% chi phí nhập xoài cho cả tuần.',
        cashCost: 140000,
        toastMessage: 'Đã nhập 20 phần Xoài tươi ngon giá hời vào kho!',
      },
      {
        text: 'Chỉ Nhập Vừa Đủ Dùng Hôm Nay',
        description: 'Giữ tiền mặt để xoay vòng chi phí khác.',
        toastMessage: 'Quán tiếp tục dùng số lượng xoài hiện tại.',
      },
    ],
  },
  {
    id: 'evt_power_surge',
    title: 'Sụt Áp Cầu Chì Khu Phố',
    description: 'Khu vực bị sụt áp đột ngột làm máy xay kêu lụp bụp, đá xay bị sượng hơn bình thường.',
    icon: '⚡',
    category: 'crisis',
    choices: [
      {
        text: 'Thuê Thợ Điện Sửa Khẩn Cấp (80.000đ)',
        description: 'Máy chạy êm lại ngay, khách không phải chờ lâu.',
        cashCost: 80000,
        ratingDelta: 0.05,
        toastMessage: 'Đã xử lý xong nguồn điện! Máy xay hoạt động trơn tru.',
      },
      {
        text: 'Tự Vặn Lại Cầu Chì & Giảm Công Suất',
        description: 'Tiết kiệm tiền nhưng máy xay chậm hơn 20% trong hôm nay.',
        ratingDelta: -0.1,
        toastMessage: 'Tốc độ xay bị chậm nhẹ, khách phải chờ thêm một chút.',
      },
    ],
  },
  {
    id: 'evt_school_sport_day',
    title: 'Hội Thao Trường Cấp 3 Kế Bên',
    description: 'Hàng trăm học sinh chuẩn bị tan trường sau các trận bóng đá và kéo co nảy lửa. Nhu cầu giải khát cực lớn!',
    icon: '🏃',
    category: 'opportunity',
    choices: [
      {
        text: 'Tung Khuyến Mãi "Mua 2 Tặng Topping" (Tốn 50.000đ quảng cáo)',
        description: 'Thu hút cả đoàn học sinh ghé uống giải khát.',
        cashCost: 50000,
        trafficModifier: 1.6,
        toastMessage: 'Học sinh đổ xô đến quán nườm nượp!',
      },
      {
        text: 'Bán Bình Thường Theo Menu',
        description: 'Vẫn có thêm lượng khách tự nhiên mà không tốn chi phí.',
        trafficModifier: 1.25,
        toastMessage: 'Nhiều bạn học sinh ghé mua sinh tố giải nhiệt.',
      },
    ],
  },
  {
    id: 'evt_street_inspection',
    title: 'Tổ Quản Lý Trật Tự Đô Thị Đi Tuần',
    description: 'Cán bộ phường đi kiểm tra lối đi vỉa hè và vệ sinh an toàn thực phẩm tuyến phố.',
    icon: '👮',
    category: 'crisis',
    choices: [
      {
        text: 'Kê Gọn Gàng Bàn Ghế & Lau Dọn Sạch Sẽ',
        description: 'Quán chấp hành nghiêm túc, được tổ công tác khen ngợi.',
        ratingDelta: 0.1,
        toastMessage: 'Quán được đánh giá là điểm bán hàng văn minh đường phố!',
      },
      {
        text: 'Vội Vàng Thu Bớt Ghế Nhựa',
        description: 'Giảm bớt vài chỗ ngồi của khách trong 1 buổi.',
        trafficModifier: 0.9,
        toastMessage: 'Buổi chiều bớt một vài khách ngồi lại vỉa hè.',
      },
    ],
  },
];
