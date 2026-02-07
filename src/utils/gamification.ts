import { db } from '../db';

// 1. CẤU HÌNH ĐIỂM SỐ (DIMINISHING RETURNS)
const SCORING_RULES = {
  identity_fill: { tiers: [15, 2, 2], limits: [4, 100] }, // 4 lần đầu 15, sau đó 2
  todo_done:     { tiers: [5, 2, 1],  limits: [4, 9] },   // 1-4: 5đ, 5-9: 2đ, 10+: 1đ
  habit_log:     { tiers: [5, 2, 1],  limits: [4, 9] },
  todo_new:      { tiers: [3, 1, 0.5], limits: [4, 9] },
  thought:       { tiers: [3, 1, 0.5], limits: [4, 9] },
  level_up:      { tiers: [0], limits: [] }
};

// 2. CẤU HÌNH LEVEL
const BASE_LEVELS = [0, 50, 200, 400, 800, 1200, 1600, 2000]; // Level 0 -> 7

export const getLevelInfo = (totalCme: number) => {
  let level = 0;
  let nextXp = 0;

  // Tính Level cơ bản (0-7)
  for (let i = 0; i < BASE_LEVELS.length; i++) {
    if (totalCme >= BASE_LEVELS[i]) {
      level = i;
    } else {
      break;
    }
  }

  // Tính Level cao cấp (8 trở đi, mỗi cấp +500)
  if (totalCme >= 2000) {
    const excess = totalCme - 2000;
    const extraLevels = Math.floor(excess / 500) + 1;
    level = 7 + extraLevels;
  }

  // Tính Next XP
  if (level < 7) {
    nextXp = BASE_LEVELS[level + 1];
  } else {
    // Nếu level 7 (2000), next là 2500. Level 8 (2500), next là 3000.
    nextXp = 2000 + ((level - 7) * 500);
  }

  const currentLevelBase = level < 8 
    ? BASE_LEVELS[level] 
    : 2000 + (level - 8) * 500;
    
  const progress = Math.min(100, Math.max(0, ((totalCme - currentLevelBase) / (nextXp - currentLevelBase)) * 100));

  return { level, currentCme: totalCme, nextCme: nextXp, progress };
};

// 3. HÀM TÍNH ĐIỂM & GHI LOG
export const addXp = async (actionType: keyof typeof SCORING_RULES) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Đếm số lần đã làm trong hôm nay
  const count = await db.mev_logs
    .where('actionType').equals(actionType)
    .filter(log => log.timestamp >= today)
    .count();

  // Tính điểm dựa trên số lần đã làm (count)
  // count = 0 -> Lần 1 -> Tier 0
  // count = 4 -> Lần 5 -> Tier 1
  const rule = SCORING_RULES[actionType];
  let points = 0;

  if (count < rule.limits[0]) {
    points = rule.tiers[0];
  } else if (rule.limits[1] && count < rule.limits[1]) {
    points = rule.tiers[1];
  } else {
    points = rule.tiers[rule.tiers.length - 1]; // Lấy mức cuối cùng
  }

  // Lưu vào DB
  await db.mev_logs.add({
    actionType,
    points,
    timestamp: new Date()
  });

  // BẮN SỰ KIỆN ĐỂ UI HIỂN THỊ (Custom Event)
  const event = new CustomEvent('cme-gained', { detail: { points, actionType } });
  window.dispatchEvent(event);

  return points;
};