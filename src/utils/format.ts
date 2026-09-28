/**
 * Format money into Vietnamese Dong standard:
 * - When amount >= 1,000,000,000 (1 tỷ): formats as "1 tỷ", "1.45 tỷ", "3.2 tỷ", "7.8 tỷ"
 * - Otherwise: formats as "500.000đ", "1.250.000đ"
 * - Supports options.full to force full number representation if ever needed.
 */
export function formatVND(amount: number, options?: { full?: boolean }): string {
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));

  if (!options?.full && abs >= 1_000_000_000) {
    const ty = abs / 1_000_000_000;
    // Format up to 3 decimal places without trailing zeros: e.g. 1 -> "1", 1.45 -> "1.45", 1.15 -> "1.15"
    const roundedTy = Math.round(ty * 1000) / 1000;
    const formatted = roundedTy.toString().replace('.', ',');
    return `${isNegative ? '-' : ''}${formatted} tỷ`;
  }

  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('vi-VN')}đ`;
}

/**
 * Format compact money (e.g. for small tags: 500k, 1.2M, 1.5 tỷ)
 */
export function formatCompactVND(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));

  if (abs >= 1_000_000_000) {
    const ty = Math.round((abs / 1_000_000_000) * 100) / 100;
    return `${isNegative ? '-' : ''}${ty.toString().replace('.', ',')} tỷ`;
  }
  if (abs >= 1_000_000) {
    const tr = Math.round((abs / 1_000_000) * 10) / 10;
    return `${isNegative ? '-' : ''}${tr.toString().replace('.', ',')} tr`;
  }
  if (abs >= 1_000) {
    const k = Math.round(abs / 1_000);
    return `${isNegative ? '-' : ''}${k}k`;
  }

  return `${amount}đ`;
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
