import Dexie, { type Table } from 'dexie';

// 1. DATA MODELS

export interface Entry {
  id?: number;
  content: string;
  
  // Classification
  type: 'task' | 'mood' | 'identity'; 
  status: 'active' | 'completed' | 'archived';
  isFocus: boolean; 
  
  // Quantitative (Task)
  quantity: number;      
  progress: number;      
  unit: string;          
  
  // Strategy & Scheduling
  priority: 'normal' | 'important' | 'urgent' | 'critical';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  frequency_detail?: string;
  
  // Mood & Identity
  mood_score: number;
  questionId?: number;
  
  // --- V4.0: MEMORY & ENTROPY ---
  isBookmarked: boolean;  // Hạt giống ký ức
  bookmarkReason?: string;
  updatedAt: Date;        // Dùng để tính độ tan rã (Entropy)
  
  // Timestamps
  createdAt: Date;
  completedAt?: Date;
  
  // System
  is_nlp_hidden: boolean;
  metadata?: { [key: string]: any; };
}

export interface MevLog {
  id?: number;
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
    // V1: Init
    // V2: Added Index for SaBan
    // V3: Added Bookmarks
    // V4: Final Stability & Migration Logic
    
    this.version(4).stores({
      entries: '++id, type, status, isFocus, isBookmarked, createdAt, updatedAt', 
      mev_logs: '++id, actionType, timestamp'
    }).upgrade(async tx => {
      // MIGRATION SCRIPT: Chạy 1 lần duy nhất khi user update lên V4
      // Mục tiêu: Đảm bảo dữ liệu cũ không làm crash tính năng Entropy
      await tx.table('entries').toCollection().modify(entry => {
        if (!entry.updatedAt) entry.updatedAt = entry.createdAt || new Date();
        if (entry.isBookmarked === undefined) entry.isBookmarked = false;
        if (!entry.priority) entry.priority = 'normal';
      });
    });
  }

  // Panic Button
  async nuke() {
    await this.transaction('rw', this.entries, this.mev_logs, async () => {
      await this.entries.clear();
      await this.mev_logs.clear();
    });
  }
}

export const db = new MindDatabase();