import Dexie, { type Table } from 'dexie';

// 1. DATA MODELS

export interface Entry {
  id?: number;
  content: string;
  
  // Classification (Phân loại)
  type: 'task' | 'mood' | 'identity'; 
  status: 'active' | 'completed' | 'archived';
  isFocus: boolean; 
  
  // Quantitative (Định lượng cho Task)
  quantity: number;      
  progress: number;      
  unit: string;          
  
  // Strategy & Scheduling (Chiến lược)
  // Thêm 'undefined' để tương thích dữ liệu cũ chưa migrate
  priority: 'normal' | 'important' | 'urgent' | 'critical';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  frequency_detail?: string; // VD: "T2,T4" hoặc ngày tháng
  
  // Mood & Identity Specifics
  mood_score: number;
  questionId?: number;
  
  // --- V4.0+: MEMORY & ENTROPY ---
  isBookmarked: boolean;  // Hạt giống ký ức (Visual Bookmark)
  bookmarkReason?: string;
  updatedAt: Date;        // Biến số cốt lõi tính Entropy (Độ tan rã)
  
  // Timestamps
  createdAt: Date;
  completedAt?: Date;
  
  // System Flags
  is_nlp_hidden: boolean;
  metadata?: { [key: string]: any; };
}

export interface MevLog {
  id?: number;
  // Bổ sung 'level_up' để tracking sự kiện thăng cấp
  actionType: 'todo_new' | 'todo_done' | 'habit_log' | 'thought' | 'identity_fill' | 'level_up';
  points: number;
  timestamp: Date;
}

// 2. DATABASE CLASS
class MindDatabase extends Dexie {
  entries!: Table<Entry>;
  mev_logs!: Table<MevLog>;

  constructor() {
    super('MindCap_Store');
    
    // VERSION HISTORY
    // V1-V3: Dev phases
    // V4: Added Entropy fields
    // V5: Added Priority Index & Refined Migration
    
    this.version(5).stores({
      // Index Optimization:
      // - priority: Hỗ trợ sort/filter cho Sa bàn
      // - updatedAt: Hỗ trợ query Entropy/Resurfacing
      // - isBookmarked: Hỗ trợ query Resurfacing
      entries: '++id, type, status, isFocus, isBookmarked, priority, createdAt, updatedAt', 
      mev_logs: '++id, actionType, timestamp'
    }).upgrade(async tx => {
      // MIGRATION SCRIPT (CRITICAL)
      // Tự động chữa lành dữ liệu cũ khi User update app
      await tx.table('entries').toCollection().modify(entry => {
        const now = new Date();
        // 1. Fix Entropy: Nếu thiếu updatedAt -> lấy createdAt hoặc Now
        if (!entry.updatedAt) entry.updatedAt = entry.createdAt || now;
        // 2. Fix Bookmark: Mặc định là false
        if (entry.isBookmarked === undefined) entry.isBookmarked = false;
        // 3. Fix Priority: Mặc định là normal
        if (!entry.priority) entry.priority = 'normal';
        // 4. Fix Frequency: Mặc định là once
        if (!entry.frequency) entry.frequency = 'once';
      });
    });
  }

  // Panic Button (Dùng trong Settings)
  async nuke() {
    await this.transaction('rw', this.entries, this.mev_logs, async () => {
      await this.entries.clear();
      await this.mev_logs.clear();
    });
  }
}

export const db = new MindDatabase();