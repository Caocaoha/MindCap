import { addMinutes, addHours, addDays, addMonths } from 'date-fns';

// Tính toán thời điểm review tiếp theo dựa trên lịch sử
export const calculateNextReview = (
  currentReviewCount: number, // Số lần đã review (0 = mới tạo)
  isBookmarked: boolean,
  baseDate: Date = new Date()
): Date | undefined => {
  
  // Mốc 0: Vừa tạo/sửa -> Hiện lại sau 10 phút
  if (currentReviewCount === 0) return addMinutes(baseDate, 10);

  // Mốc 1: Sau 10p -> Hiện lại sau 24h
  if (currentReviewCount === 1) return addHours(baseDate, 24);

  // Từ Mốc 2 trở đi: Chỉ áp dụng cho Bookmark
  if (!isBookmarked) return undefined; // Nếu không bookmark thì dừng, không hiện nữa

  // Mốc 2: Sau 24h -> Hiện lại sau 7 ngày
  if (currentReviewCount === 2) return addDays(baseDate, 7);

  // Mốc 3: Sau 7 ngày -> Hiện lại sau 30 ngày
  if (currentReviewCount === 3) return addDays(baseDate, 30);

  // Mốc 4: Sau 30 ngày -> Hiện lại sau 4 tháng
  if (currentReviewCount === 4) return addMonths(baseDate, 4);

  return undefined; // Xong quy trình
};