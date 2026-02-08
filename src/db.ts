import Dexie, { type Table } from 'dexie';

// 1. DATA MODELS INTERFACES
// Định nghĩa chặt chẽ để TypeScript hỗ trợ autocomplete

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
  // Priority: Dùng cho Sa bàn Eisenhower
  priority: 'normal' | 'important' | 'urgent' | 'critical';
  // Frequency: Dùng cho việc lặp lại
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  frequency_detail?: string; 
  
  // --- MOOD & IDENTITY ---
  mood_score: number;
  questionId?: number;
  
  // --- MEMORY & ENTROPY (V4+) ---
  isBookmarked: boolean;  // True = Hạt giống ký ức (Không bị mờ)
  bookmarkReason?: string;
  updatedAt: Date;        // Thời gian tương tác cuối -> Tính Entropy
  
  // --- TIMESTAMPS ---
  createdAt: Date;
  completedAt?: Date;
  
  // --- SYSTEM FLAGS ---
  is_nlp_hidden: boolean; // Ẩn khỏi dòng thời gian nếu là input phụ
  metadata?: { [key: string]: any; };
}

export interface MevLog {
  id?: number;
  // Các hành động sinh ra điểm CME
  actionType: 'todo_new' | 'todo_done' | 'habit_log' | 'thought' | 'identity_fill' | 'level_up';
  points: number;
  timestamp: Date;
}

// 2. DATABASE CLASS CONFIGURATION
class MindDatabase extends Dexie {
  entries!: Table<Entry>;
  mev_logs!: Table<MevLog>;

  constructor() {
    super('MindCap_Store');
    
    // --- VERSION HISTORY & MIGRATION ---
    // V1-V3: Development
    // V4: Added Entropy Fields
    // V5: Added Priority Index
    // V6: PWA Stability & Data Normalization
    
    this.version(6).stores({
      // Indexing Strategy:
      // - status, type, isFocus: Core Filters
      // - priority: Sorting cho Sa bàn
      // - updatedAt: Query cho Entropy & Resurfacing
      // - isBookmarked: Query cho Resurfacing
      entries: '++id, type, status, isFocus, isBookmarked, priority, createdAt, updatedAt', 
      mev_logs: '++id, actionType, timestamp'
    }).upgrade(async tx => {
      // MIGRATION SCRIPT: "Chữa lành" dữ liệu cũ
      // Chạy 1 lần duy nhất khi User update lên phiên bản mới
      await tx.table('entries').toCollection().modify(entry => {
        const now = new Date();
        
        // 1. Fix Entropy: Nếu thiếu updatedAt -> lấy createdAt hoặc Now
        if (!entry.updatedAt) entry.updatedAt = entry.createdAt || now;
        
        // 2. Fix Bookmark: Mặc định là false để tránh lỗi filter
        if (entry.isBookmarked === undefined) entry.isBookmarked = false;
        
        // 3. Fix Priority: Mặc định là normal để Sa bàn phân loại đúng
        if (!entry.priority) entry.priority = 'normal';
        
        // 4. Fix Frequency: Mặc định là once
        if (!entry.frequency) entry.frequency = 'once';
      });
    });
  }

  // Panic Button: Xóa sạch dữ liệu (Dùng trong Settings)
  async nuke() {
    await this.transaction('rw', this.entries, this.mev_logs, async () => {
      await this.entries.clear();
      await this.mev_logs.clear();
    });
  }
}

export const db = new MindDatabase();