import { db } from '../db';

// 1. CẤU HÌNH ĐIỂM SỐ
const SCORING_RULES = {
  identity_fill: { tiers: [15, 2, 2], limits: [4, 100] }, 
  todo_done:     { tiers: [5, 2, 1],  limits: [4, 9] },   
  habit_log:     { tiers: [5, 2, 1],  limits: [4, 9] },
  todo_new:      { tiers: [3, 1, 0.5], limits: [4, 9] },
  thought:       { tiers: [3, 1, 0.5], limits: [4, 9] },
  level_up:      { tiers: [0], limits: [] }
};

// 2. CẤU HÌNH LEVEL
const BASE_LEVELS = [0, 50, 200, 400, 800, 1200, 1600, 2000]; 

const getRankTitle = (level: number): string => {
  if (level <= 3) return "Newbie";
  if (level <= 7) return "Explorer";
  if (level <= 14) return "Manager";
  if (level <= 24) return "Architect";
  return "Visionary";
};

export const getLevelInfo = (totalCme: number) => {
  let level = 0;
  let nextXp = 0;

  for (let i = 0; i < BASE_LEVELS.length; i++) {
    if (totalCme >= BASE_LEVELS[i]) level = i;
    else break;
  }

  if (totalCme >= 2000) {
    const excess = totalCme - 2000;
    const extraLevels = Math.floor(excess / 500) + 1;
    level = 7 + extraLevels;
  }

  if (level < 7) {
    nextXp = BASE_LEVELS[level + 1];
  } else {
    nextXp = 2000 + ((level - 7) * 500);
  }

  const currentLevelBase = level < 8 ? BASE_LEVELS[level] : 2000 + (level - 8) * 500;
  const progress = Math.min(100, Math.max(0, ((totalCme - currentLevelBase) / (nextXp - currentLevelBase)) * 100));

  return { level, currentCme: totalCme, nextCme: nextXp, progress, type: getRankTitle(level) };
};

// 3. HÀM TÍNH ĐIỂM & LOGIC LEVEL UP (UPDATE)
export const addXp = async (actionType: keyof typeof SCORING_RULES) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Lấy tổng điểm hiện tại để tính Level cũ
  const allLogs = await db.mev_logs.toArray();
  const currentTotal = allLogs.reduce((sum, log) => sum + log.points, 0);
  const oldLevel = getLevelInfo(currentTotal).level;

  // Tính điểm mới
  const count = await db.mev_logs.where('actionType').equals(actionType).filter(log => log.timestamp >= today).count();
  const rule = SCORING_RULES[actionType];
  let points = 0;

  if (count < rule.limits[0]) points = rule.tiers[0];
  else if (rule.limits[1] && count < rule.limits[1]) points = rule.tiers[1];
  else points = rule.tiers[rule.tiers.length - 1]; 

  if (points > 0) {
    await db.mev_logs.add({ actionType, points, timestamp: new Date() });
    
    // Kiểm tra Level mới
    const newTotal = currentTotal + points;
    const newLevel = getLevelInfo(newTotal).level;

    // Nếu lên cấp -> Bắn pháo hoa
    if (newLevel > oldLevel) {
      const levelEvent = new CustomEvent('level-up', { detail: { level: newLevel } });
      window.dispatchEvent(levelEvent);
    }

    // Bắn thông báo điểm
    const event = new CustomEvent('cme-gained', { detail: { points, actionType } });
    window.dispatchEvent(event);
  }

  return points;
};