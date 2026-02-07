export interface NlpResult {
  quantity: number;
  unit: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  frequency_detail?: string; // Lưu trữ: "T2,T4" hoặc "1,15,30"
  detected: boolean;
}

// --- TỪ ĐIỂN ĐƠN VỊ (25+ UNITS) ---
const UNIT_DICTIONARY = [
  // 1. Học tập & Đọc
  'trang', 'chương', 'cuốn', 'quyển', 'bài', 'tờ', 'từ',
  // 2. Thời gian
  'phút', 'giờ', 'tiếng', 'giây', 'buổi', 'pomodoro',
  // 3. Vận động & Sức khỏe
  'bước', 'km', 'mét', 'cây', 'kg', 'hiệp', 'set', 'rep', 'lượt', 'kcal', 'calo',
  // 4. Ăn uống
  'cốc', 'ly', 'chai', 'lít', 'ml', 'bát', 'chén', 'đĩa', 'muỗng', 'thìa',
  // 5. Công việc
  'task', 'việc', 'email', 'cuộc gọi', 'call', 'meeting', 'video'
].join('|');

// Map số chữ sang số (Mở rộng)
const NUM_MAP: Record<string, number> = {
  'một': 1, 'hai': 2, 'ba': 3, 'bốn': 4, 'năm': 5, 'sáu': 6, 
  'bảy': 7, 'tám': 8, 'chín': 9, 'mười': 10, 'chục': 10, 'trăm': 100
};

export const smartParser = (text: string): NlpResult => {
  const lowerText = text.toLowerCase();
  const result: NlpResult = {
    quantity: 1,
    unit: 'lần', // Đơn vị mặc định
    frequency: 'once',
    detected: false
  };

  if (!text) return result;

  // --- 1. XỬ LÝ SỐ LƯỢNG & ĐƠN VỊ ---
  // Regex: Tìm Số (số hoặc chữ) + Khoảng trắng (tùy chọn) + Đơn vị trong từ điển
  const quantityRegex = new RegExp(`(\\d+|${Object.keys(NUM_MAP).join('|')})\\s*(${UNIT_DICTIONARY})`, 'i');
  const qtyMatch = lowerText.match(quantityRegex);

  if (qtyMatch) {
    let qtyRaw = qtyMatch[1];
    let qty = parseInt(qtyRaw);
    
    // Nếu là chữ (một, hai...) thì map sang số
    if (isNaN(qty)) {
      qty = NUM_MAP[qtyRaw] || 1;
    }

    result.quantity = qty;
    result.unit = qtyMatch[2]; // Lấy đơn vị tìm được
    result.detected = true;
  }

  // --- 2. XỬ LÝ TẦN SUẤT & CHI TIẾT (WEEKLY/MONTHLY) ---

  // A. DAILY (Hàng ngày)
  if (/(hàng ngày|mỗi ngày|daily|everyday|sáng nay|tối nay)/i.test(lowerText)) {
    result.frequency = 'daily';
    result.detected = true;
  }

  // B. WEEKLY (Hàng tuần & Thứ cụ thể)
  // Input: "Tập gym thứ 3, 5, 7" -> weekly + "T3,T5,T7"
  else if (/(hàng tuần|mỗi tuần|weekly|thứ\s+|chủ nhật|cn)/i.test(lowerText)) {
    result.frequency = 'weekly';
    result.detected = true;
    
    const daysFound = new Set<string>();
    
    // Regex bắt các thứ: "thứ 2", "thứ ba", "t2", "cn", "chủ nhật"
    // Lưu ý: Regex global (/g) để bắt hết các thứ trong câu
    const dayRegex = /(?:thứ|t)\s*([2-7]|hai|ba|tư|năm|sáu|bảy)|(chủ nhật|cn)/gi;
    let match;
    
    while ((match = dayRegex.exec(lowerText)) !== null) {
      if (match[2]) { // Trường hợp Chủ nhật
        daysFound.add('CN');
      } else if (match[1]) { // Trường hợp Thứ 2-7
        let d = match[1];
        // Map chữ sang số cho Thứ
        if (d === 'hai') d = '2';
        if (d === 'ba') d = '3';
        if (d === 'tư') d = '4';
        if (d === 'năm') d = '5';
        if (d === 'sáu') d = '6';
        if (d === 'bảy') d = '7';
        daysFound.add(`T${d}`);
      }
    }

    if (daysFound.size > 0) {
      // Sắp xếp T2 -> CN
      result.frequency_detail = Array.from(daysFound).sort().join(',');
    }
  }

  // C. MONTHLY (Hàng tháng & Ngày cụ thể)
  // Input: "Trả nợ ngày 15 và 30" -> monthly + "15,30"
  else if (/(hàng tháng|mỗi tháng|monthly|ngày\s+\d+)/i.test(lowerText)) {
    result.frequency = 'monthly';
    result.detected = true;

    const datesFound = new Set<string>();
    // Regex bắt ngày: "ngày 1", "ngày 15", "ngày 31"
    const dateRegex = /ngày\s+(\d{1,2})/gi;
    let match;

    while ((match = dateRegex.exec(lowerText)) !== null) {
      const dateNum = parseInt(match[1]);
      // Validate ngày hợp lệ (1-31)
      if (dateNum >= 1 && dateNum <= 31) {
        datesFound.add(dateNum.toString());
      }
    }

    if (datesFound.size > 0) {
      // Sắp xếp ngày tăng dần
      result.frequency_detail = Array.from(datesFound)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .join(',');
    }
  }

  return result;
};