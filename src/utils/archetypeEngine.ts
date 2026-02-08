import { db } from '../db';
import { getLevelInfo } from './gamification';

// CẤU HÌNH NHÓM HÀNH ĐỘNG 
const TASK_ACTIONS = new Set(['task_create', 'task_done', 'priority_shift', 'focus_update']);
const NON_TASK_ACTIONS = new Set(['thought_add', 'identity_fill', 'reflect_action', 'mood_log', 'echo_connect']);

export interface ArchetypeResult {
  type: 'Newbie' | 'Manager-Led' | 'Curious Explorer' | 'The Harmonizer';
  badge?: string; // Ví dụ: "The Harmonized Manager" [cite: 65]
  ea_index: number; // Chỉ số Ea
  cpi_index: number; // Chỉ số CPI
  level: number;
}

export const calculateArchetype = async (): Promise<ArchetypeResult> => {
  // 1. Lấy dữ liệu logs & links
  const logs = await db.mev_logs.toArray();
  const links = await db.echo_links.toArray();
  const totalEntries = await db.entries.count();
  
  // Tính tổng điểm để ra Level [cite: 52]
  const totalXp = logs.reduce((sum, log) => sum + log.points, 0);
  const { level } = getLevelInfo(totalXp);

  // 2. Tính Ea (Balance Equation) [cite: 67]
  let taskCount = 0;
  let nonTaskCount = 0;

  logs.forEach(log => {
    if (TASK_ACTIONS.has(log.actionType)) taskCount++;
    else if (NON_TASK_ACTIONS.has(log.actionType)) nonTaskCount++;
  });

  const totalActions = taskCount + nonTaskCount;
  // Tránh chia cho 0
  const ea_index = totalActions > 0 ? (taskCount / totalActions) * 100 : 50; 

  // 3. Tính CPI (Cross-Pollination Index) [cite: 87]
  // Trọng số: Explicit(3) + Contextual(2) + Implicit(1) [cite: 83]
  let weightedLinks = 0;
  links.forEach(link => {
    if (link.type === 'structural') weightedLinks += 3; // Explicit/Structural
    else if (link.type === 'semantic') weightedLinks += 2; // Contextual/Semantic
    else weightedLinks += 1; // Temporal/Implicit
  });

  const cpi_index = totalEntries > 0 ? weightedLinks / totalEntries : 0;

  // 4. Phân loại Archetype (Decision Matrix) [cite: 51]
  let baseType: 'Newbie' | 'Manager-Led' | 'Curious Explorer' | 'The Harmonizer' = 'Newbie';
  let badge = '';

  if (level < 3) {
    baseType = 'Newbie'; // [cite: 52]
  } else {
    // Xác định Base Type dựa trên Ea [cite: 67, 68]
    if (ea_index > 70) baseType = 'Manager-Led';
    else if (ea_index <= 30) baseType = 'Curious Explorer';
    else baseType = 'The Harmonizer'; // Tạm thời gán nếu cân bằng

    // Logic "Trạng thái ẩn" cho Harmonizer [cite: 62, 63]
    // Nếu chưa đủ Level 8 hoặc CPI thấp -> Vẫn giữ mác Manager/Explorer nhưng thêm Badge
    if (baseType === 'The Harmonizer') {
        // Nếu chưa "chín", fallback về nhóm có trọng số lớn hơn
        if (level < 8 || cpi_index < 0.5) {
             baseType = ea_index > 50 ? 'Manager-Led' : 'Curious Explorer';
             // Trao thưởng danh hiệu phụ nếu Ea cân bằng (40-60%) [cite: 64]
             if (ea_index >= 40 && ea_index <= 60) {
                 badge = `The Harmonized ${baseType.split(' ')[0]}`; // Vd: The Harmonized Manager
             }
        }
    }
  }

  return {
    type: baseType,
    badge: badge || baseType, // Nếu không có badge đặc biệt thì dùng tên gốc
    ea_index,
    cpi_index,
    level
  };
};