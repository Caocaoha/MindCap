import { db } from '../db';

// CẬP NHẬT DANH SÁCH ACTION TYPE ĐẦY ĐỦ
export type ActionType = 
  // Nhóm cũ (Legacy)
  | 'todo_new' | 'todo_done' | 'habit_log' | 'thought' | 'identity_fill' | 'level_up'
  // Nhóm mới (Archetype)
  | 'task_create'    // Tạo việc
  | 'task_done'      // Hoàn thành việc
  | 'priority_shift' // Sắp xếp Sa bàn
  | 'focus_update'   // Cập nhật Tiêu điểm
  | 'thought_add'    // Lưu suy nghĩ
  | 'reflect_action' // Tưới nước (Xem lại)
  | 'mood_log'       // Ghi nhận cảm xúc
  | 'echo_connect';  // Nối điểm tri thức

export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];

// CẤU HÌNH ĐIỂM SỐ CHI TIẾT
const POINTS: Record<ActionType, number> = {
  // Legacy
  todo_new: 2,
  todo_done: 10,
  habit_log: 5,
  thought: 3,
  identity_fill: 15,
  level_up: 0,
  
  // New Archetype Actions
  task_create: 2,      // Tạo task mới
  task_done: 10,       // Hoàn thành task (Quan trọng)
  priority_shift: 1,   // Sắp xếp lại thứ tự (Eisenhower)
  focus_update: 2,     // Đẩy vào tiêu điểm
  thought_add: 3,      // Viết suy nghĩ/nhật ký
  reflect_action: 1,   // Xem lại bài cũ
  mood_log: 3,         // Ghi nhận cảm xúc
  echo_connect: 5      // Kết nối tri thức
};

export const getLevelInfo = (totalXp: number) => {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) level = i;
    else break;
  }
  const currentLevelXp = LEVEL_THRESHOLDS[level];
  const nextLevelXp = LEVEL_THRESHOLDS[level + 1] || currentLevelXp * 1.5;
  const progress = Math.min(100, Math.max(0, ((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100));

  let type = "Newbie";
  if (level >= 3) type = "Explorer"; 
  if (level >= 8) type = "Master";

  return { level, progress, nextLevelXp, type };
};

export const addXp = async (actionType: ActionType) => {
  const points = POINTS[actionType] || 0;
  
  // Lưu vào DB
  await db.mev_logs.add({
    actionType,
    points,
    timestamp: new Date()
  });

  // Bắn sự kiện để UI (Toast/Confetti) bắt được
  const event = new CustomEvent('cme-gained', { detail: { points, actionType } });
  window.dispatchEvent(event);

  // Check Level Up Logic (Giữ nguyên logic cũ hoặc nâng cấp sau)
  const allLogs = await db.mev_logs.toArray();
  const totalXp = allLogs.reduce((sum, log) => sum + log.points, 0);
  const currentLevelInfo = getLevelInfo(totalXp);
  const prevTotalXp = totalXp - points;
  const prevLevelInfo = getLevelInfo(prevTotalXp);

  if (currentLevelInfo.level > prevLevelInfo.level) {
     const levelUpEvent = new CustomEvent('level-up', { detail: { level: currentLevelInfo.level } });
     window.dispatchEvent(levelUpEvent);
  }
};