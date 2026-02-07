import { db } from '../db';

export const seedDatabase = async () => {
  const entryCount = await db.entries.count();
  if (entryCount > 0) return; // Chỉ nạp nếu máy đang trống để tránh lặp [cite: 46]

  const today = new Date().toISOString().split('T')[0];

  // 1. Nạp MEV Logs để đạt Level 4 (> 800 MEV) [cite: 42]
  const mockLogs = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Mỗi ngày nạp khoảng 120 XP để tổng > 800 [cite: 36-39]
    mockLogs.push({
      action_type: 'Identity',
      points: 120,
      timestamp: date.getTime(),
      date_string: dateStr,
    });
  }
  await db.mev_logs.bulkAdd(mockLogs);

  // 2. Nạp dữ liệu cho Sa bàn (Backlog) [cite: 16-17]
  await db.entries.bulkAdd([
    {
      content: 'Xây dựng triết lý Identity OS v3.1',
      type: 'task',
      status: 'active',
      part_label: 'Manager',
      editing_metrics: { velocity: 80, pause_count: 0, delete_all_count: 0 },
      is_bookmarked: true,
      frequency: 'once',
      quantity: 1,
      progress: 0,
      alignment_status: 'aligned',
      createdAt: Date.now() - 100000,
      is_focused: 0, // Nằm trong Sa bàn [cite: 17]
    },
    {
      content: 'Đọc Atomic Habits (Mục tiêu 50 trang)',
      type: 'task',
      status: 'active',
      part_label: 'Self',
      editing_metrics: { velocity: 50, pause_count: 0, delete_all_count: 0 },
      is_bookmarked: false,
      frequency: 'daily',
      quantity: 50,
      progress: 10,
      alignment_status: 'pending',
      createdAt: Date.now() - 50000,
      is_focused: 1, // Nằm trong Tiêu điểm (Focus Zone) [cite: 12]
    },
  ]);

  console.log('MIND CAP: Evolution Data Loaded (Level 4 Active) [cite: 42]');
};
