import { LoanProduct } from '../types';

export const LOAN_PRODUCTS: LoanProduct[] = [
  {
    id: 'bank_starter',
    title: 'Gói Vay Khởi Nghiệp Trẻ',
    type: 'bank',
    lenderName: 'Ngân Hàng VietNova Bank',
    description: 'Khoản vay hỗ trợ hộ kinh doanh cá thể với lãi suất ưu đãi, kỳ hạn linh hoạt.',
    principal: 2000000,
    interestRate: 0.08, // 8% total
    durationDays: 15,
    dailyPayment: 144000,
    requiredCreditScore: 500,
  },
  {
    id: 'bank_expansion',
    title: 'Vay Nâng Cấp Mặt Bằng & Thiết Bị',
    type: 'bank',
    lenderName: 'Ngân Hàng VietNova Bank',
    description: 'Dành cho các quán có lịch sử trả nợ tốt và doanh thu ổn định trên thị trường.',
    principal: 10000000,
    interestRate: 0.10, // 10%
    durationDays: 20,
    dailyPayment: 550000,
    requiredCreditScore: 560,
  },
  {
    id: 'bank_realestate',
    title: 'Gói Vay Thế Chấp & Đầu Tư BĐS',
    type: 'bank',
    lenderName: 'Ngân Hàng VietNova Bank',
    description: 'Vốn đòn bẩy lớn hỗ trợ doanh nghiệp mua đất, nhà phố tích sản và mở rộng chi nhánh.',
    principal: 500000000, // 500 Triệu VNĐ
    interestRate: 0.12, // 12%
    durationDays: 60,
    dailyPayment: 9333000,
    requiredCreditScore: 650,
  },
  {
    id: 'fast_cash',
    title: 'Vay Nóng Ứng Vốn Nhanh Trong Ngày',
    type: 'fast',
    lenderName: 'Dịch Vụ Tài Chính FastCash',
    description: 'Duyệt tiền ngay trong 30 giây để nhập trái cây khẩn cấp. Không cần xét duyệt tín dụng.',
    principal: 1000000,
    interestRate: 0.20, // 20%
    durationDays: 5,
    dailyPayment: 240000,
    requiredCreditScore: 0,
    riskNotice: 'Chi phí vay cao, cần cân nhắc kỹ dòng tiền trước khi nhận nợ.',
  },
  {
    id: 'anh_tu_private',
    title: 'Vốn Cứu Nguy Anh Tư Chợ Cũ',
    type: 'private',
    lenderName: 'Anh Tư (Tài Chính Tư Nhân)',
    description: 'Nhận 5.000.000đ liền tay. "Cứ xài đi chú em, đúng hạn trả đủ cho anh là vui vẻ."',
    principal: 5000000,
    interestRate: 0.35, // 35%
    durationDays: 7,
    dailyPayment: 965000,
    requiredCreditScore: 0,
    riskNotice: 'CẢNH BÁO: Trả chậm sẽ bị phạt nặng và làm giảm uy tín quán nghiêm trọng!',
  },
];
