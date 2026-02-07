import { db } from '../db';

export const getTodayActionCount = async (type: string) => {
  const today = new Date().toISOString().split('T')[0];
  return await db.mev_logs
    .where('action_type')
    .equals(type)
    .and((log) => log.date_string === today)
    .count();
};

export const calculateMEV = (
  type: 'Identity' | 'Task' | 'Habit' | 'Note',
  countToday: number
): number => {
  // Giai đoạn 3: Từ lần thứ 10 trở đi là 1 điểm [Yêu cầu bổ sung]
  if (countToday >= 10) return 1;

  const pointsMap = {
    Identity: { high: 15, low: 2 }, // [cite: 37]
    Task: { high: 5, low: 2 }, // [cite: 38]
    Habit: { high: 5, low: 2 }, // [cite: 39]
    Note: { high: 3, low: 1 }, // [cite: 39]
  };

  // Giai đoạn 1 (1-4) và Giai đoạn 2 (5-9)
  return countToday < 5 ? pointsMap[type].high : pointsMap[type].low;
};
