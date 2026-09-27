/**
 * Format money into Vietnamese Dong standard: 500.000đ, 1.250.000đ
 * Strictly without decimals.
 */
export function formatVND(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('vi-VN')}đ`;
}

/**
 * Format game hour minute: e.g. 08:30
 */
export function formatGameTime(minutesSinceMidnight: number): string {
  const hours = Math.floor(minutesSinceMidnight / 60) % 24;
  const mins = Math.floor(minutesSinceMidnight % 60);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
