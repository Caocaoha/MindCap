import Dexie, { type Table } from 'dexie';

// 1. DATA MODELS INTERFACES

export interface Entry {
  id?: number;
  content: string;
  
  // --- CLASSIFICATION ---
  type: 'task' | 'mood' | 'identity'; 
  status: 'active' | 'completed' | 'archived';
  isFocus: boolean; 
  
  // --- QUANTITATIVE (Task) ---
  quantity: number;      
  progress: number;      
  unit: string;          
  
  // --- STRATEGY & SCHEDULING ---
  priority: 'normal' | 'important' | 'urgent' | 'critical';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  frequency_detail?: string; 
  
  // --- MOOD & IDENTITY ---
  mood_score: number;
  questionId?: number;
  
  // --- MEMORY & ENTROPY ---
  isBookmarked: boolean;  
  bookmarkReason?: string;
  updatedAt: Date;        
  createdAt: Date;
  completedAt?: Date;
  
  // --- SYSTEM FLAGS ---
  is_nlp_hidden: boolean; 
  metadata?: { [key: string]: any; };
}

export interface MevLog {
  id?: number;
  // CẬP NHẬT DANH SÁCH ACTION TYPES THEO TÀI LIỆU ARCHETYPE
  actionType: 
    // Nhóm TASK (Tử số - Ngoại lực)
    | 'task_create'    // Tạo việc
    | 'task_done'      // Hoàn thành việc
    | 'priority_shift' // Sắp xếp Sa bàn
    | 'focus_update'   // Cập nhật Tiêu điểm
    
    // Nhóm NON-TASK (Mẫu số - Nội lực)
    | 'thought_add'    // Lưu suy nghĩ
    | 'identity_fill'  // Trả lời Identity
    | 'reflect_action' // Tưới nước (Xem lại)
    | 'mood_log'       // Ghi nhận cảm xúc
    | 'echo_connect'   // Nối điểm tri thức
    
    // System Legacy
    | 'level_up' | 'todo_new' | 'todo_done' | 'thought' | 'habit_log'; // Giữ lại để tương thích dữ liệu cũ nếu cần
    
  points: number;
  timestamp: Date;
}

// BẢNG MỚI: ECHO LINK (Mạng lưới ký ức)
export interface EchoLink {
  id?: number;
  sourceId: number; // Entry gốc
  targetId: number; // Entry được liên kết
  type: 'semantic' | 'temporal' | 'structural'; // 3 Cấp độ Echo
  strength: number; // Độ mạnh: 1 (Implicit), 2 (Semantic), 3 (Explicit)
  keywords?: string[]; // Từ khóa chung (nếu là Semantic)
  createdAt: Date;
}

// 2. DATABASE CLASS CONFIGURATION
class MindDatabase extends Dexie {
  entries!: Table<Entry>;
  mev_logs!: Table<MevLog>;
  echo_links!: Table<EchoLink>; // <--- Bảng mới

  constructor() {
    super('MindCap_Store');
    
    // Version 7: Added echo_links
    this.version(7).stores({
      entries: '++id, type, status, isFocus, isBookmarked, priority, createdAt, updatedAt', 
      mev_logs: '++id, actionType, timestamp',
      echo_links: '++id, sourceId, targetId, type, createdAt' // Index cho truy vấn 2 chiều
    }).upgrade(async () => {
      // Migration script nếu cần thiết
    });
  }

  async nuke() {
    await this.transaction('rw', this.entries, this.mev_logs, this.echo_links, async () => {
      await this.entries.clear();
      await this.mev_logs.clear();
      await this.echo_links.clear();
    });
  }
}

export const db = new MindDatabase();