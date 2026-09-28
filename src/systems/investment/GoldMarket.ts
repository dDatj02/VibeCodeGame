import { GoldMarketState, GoldMarketEvent, GoldPriceHistoryItem } from '../../types/investment';

export const INITIAL_GOLD_PRICE = 12500000; // 12.5M VND / lượng
export const GOLD_TRANSACTION_FEE = 0.01; // 1% spread/fee

export const INITIAL_GOLD_MARKET: GoldMarketState = {
  currentPrice: INITIAL_GOLD_PRICE,
  yesterdayPrice: 12200000,
  todayChangePercent: 2.46,
  priceHistory: [
    { day: 1, price: 12000000, changePercent: 0, reason: 'Mở cửa sàn giao dịch vàng' },
    { day: 2, price: 12200000, changePercent: 1.67, reason: 'Nhu cầu ổn định' },
    { day: 3, price: 12500000, changePercent: 2.46, reason: 'Thị trường sôi động' },
  ],
  activeMarketEvent: null,
};

const GOLD_EVENTS_POOL = [
  {
    title: 'Bất Ổn Kinh Tế Toàn Cầu',
    description: 'Nhà đầu tư ồ ạt rút tiền sang hầm trú ẩn vàng, giá vàng bật tăng mạnh!',
    icon: '🪙',
    effectPercent: 0.08, // +8%
  },
  {
    title: 'Mùa Cưới & Lễ Hội Tăng Cao',
    description: 'Nhu cầu mua sắm tích trữ vàng trong dân chúng tăng vọt.',
    icon: '📈',
    effectPercent: 0.05, // +5%
  },
  {
    title: 'Thị Trường Khởi Sắc & Tự Tin',
    description: 'Dòng tiền quay lại các kênh sản xuất kinh doanh, nhu cầu giữ vàng giảm.',
    icon: '📉',
    effectPercent: -0.06, // -6%
  },
  {
    title: 'Chính Sách Tiền Tệ Ổn Định',
    description: 'Lãi suất ổn định, thị trường vàng đi ngang biên độ hẹp.',
    icon: '🪙',
    effectPercent: 0.005, // +0.5%
  },
  {
    title: 'Nguồn Cung Khai Thác Bị Gián Đoạn',
    description: 'Các mỏ vàng lớn bảo trì định kỳ khiến lượng cung suy giảm.',
    icon: '⛏️',
    effectPercent: 0.07, // +7%
  },
  {
    title: 'Đồng Tiền Mạnh Lên',
    description: 'Áp lực chốt lời ngắn hạn khiến giá vàng điều chỉnh giảm nhẹ.',
    icon: '💵',
    effectPercent: -0.04, // -4%
  },
];

export class GoldMarket {
  /**
   * Simulates daily gold price movement and occasional events.
   */
  public static simulateDailyGoldPrice(
    currentState: GoldMarketState,
    currentDay: number
  ): { updatedMarketState: GoldMarketState; event?: GoldMarketEvent | null } {
    const oldPrice = currentState.currentPrice;
    let event: GoldMarketEvent | null = null;
    let deltaPercent = 0;

    // 30% chance for special market event
    if (Math.random() < 0.3) {
      const selectedEvent = GOLD_EVENTS_POOL[Math.floor(Math.random() * GOLD_EVENTS_POOL.length)];
      // Add slight random noise to event effect (-1% to +1%)
      const noise = (Math.random() * 0.02) - 0.01;
      deltaPercent = selectedEvent.effectPercent + noise;

      event = {
        id: `gold_evt_${currentDay}_${Date.now()}`,
        title: selectedEvent.title,
        description: selectedEvent.description,
        icon: selectedEvent.icon,
        effectPercent: Math.round(deltaPercent * 1000) / 1000,
        day: currentDay,
      };
    } else {
      // Normal market drift: -3.5% to +3.5%
      deltaPercent = (Math.random() * 0.07) - 0.035;
    }

    // Calculate new price (rounded to 50,000 VND)
    let newPrice = Math.round((oldPrice * (1 + deltaPercent)) / 50000) * 50000;

    // Safe bounds (min 7.5M, max 35M per lượng)
    newPrice = Math.max(7500000, Math.min(35000000, newPrice));

    const actualChangePercent = Math.round(((newPrice - oldPrice) / oldPrice) * 1000) / 10;

    const newHistoryItem: GoldPriceHistoryItem = {
      day: currentDay,
      price: newPrice,
      changePercent: actualChangePercent,
      reason: event ? event.title : actualChangePercent >= 0 ? 'Tăng theo thị trường' : 'Giảm điều chỉnh',
    };

    const updatedHistory = [newHistoryItem, ...currentState.priceHistory].slice(0, 14);

    const updatedMarketState: GoldMarketState = {
      currentPrice: newPrice,
      yesterdayPrice: oldPrice,
      todayChangePercent: actualChangePercent,
      priceHistory: updatedHistory,
      activeMarketEvent: event,
    };

    return {
      updatedMarketState,
      event,
    };
  }
}
