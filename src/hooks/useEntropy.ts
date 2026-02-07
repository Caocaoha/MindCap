import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export const useEntropy = () => {
  const entropyData = useLiveQuery(async () => {
    // Chỉ lấy các mục nhập trong ngày hôm nay (tính từ Forgive Hour 04:00)
    const todayStart = new Date().setHours(4, 0, 0, 0);
    const entries = await db.entries
      .where('createdAt')
      .above(todayStart)
      .toArray();

    if (entries.length === 0) return 0;

    // Đếm số lượng mục đã được xác nhận "Aligned" (Tỉnh thức)
    const alignedCount = entries.filter(
      (e) => e.alignment_status === 'aligned'
    ).length;
    const totalReviewed = entries.filter(
      (e) => e.alignment_status !== 'pending'
    ).length;

    if (totalReviewed === 0) return 0;

    // Tính toán tỷ lệ Grayscale (0 - 100)
    const alignmentScore = alignedCount / totalReviewed;
    return Math.round((1 - alignmentScore) * 100);
  });

  return entropyData || 0;
};
