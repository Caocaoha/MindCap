// src/utils/smartParser.ts

// 1. Từ điển hành động & gợi ý mặc định [cite: 73]
const ACTION_MAP: Record<string, { qty: number; unit: string }> = {
  chạy: { qty: 5, unit: 'km' },
  run: { qty: 5, unit: 'km' },
  uống: { qty: 2, unit: 'lít' },
  drink: { qty: 2, unit: 'liters' },
  đọc: { qty: 10, unit: 'trang' },
  read: { qty: 10, unit: 'pages' },
  học: { qty: 30, unit: 'phút' },
  study: { qty: 30, unit: 'mins' },
};

// 2. Regex bóc tách số lượng và đơn vị [cite: 70]
const QTY_REGEX =
  /(\d+)\s*(lít|liters?|km|trang|pages?|phút|mins?|giờ|hours?|ly|cốc|glasses?)/i;

// 3. Regex bóc tách tần suất [cite: 71, 72]
const FREQ_REGEX = {
  daily: /(mỗi ngày|hàng ngày|daily|every day)/i,
  weekly: /(mỗi tuần|hàng tuần|weekly|every week)/i,
  custom: /(mỗi|hàng|every)\s*(\d+)\s*(ngày|days)/i,
};

export const parseMindInput = (text: string) => {
  let quantity = 1;
  let unit = 'lần';
  let frequency: 'once' | 'daily' | 'weekly' | 'custom' = 'once';
  let hint: string | null = null;

  // Bóc tách Số lượng & Đơn vị
  const qtyMatch = text.match(QTY_REGEX);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1]);
    unit = qtyMatch[2].toLowerCase();
  } else {
    // Nếu không có số lượng, kiểm tra Action Verbs để gợi ý
    for (const action in ACTION_MAP) {
      if (text.toLowerCase().includes(action)) {
        hint = `Thêm ${ACTION_MAP[action].qty}${ACTION_MAP[action].unit}?`;
        break;
      }
    }
  }

  // Bóc tách Tần suất
  if (FREQ_REGEX.daily.test(text)) frequency = 'daily';
  else if (FREQ_REGEX.weekly.test(text)) frequency = 'weekly';
  else if (FREQ_REGEX.custom.test(text)) frequency = 'custom';

  return { quantity, unit, frequency, hint };
};
