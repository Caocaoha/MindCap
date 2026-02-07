import Dexie, { type Table } from 'dexie';

// 1. DATA MODELS
export interface Entry {
  id?: number;
  content: string; 
  type: 'task' | 'mood' | 'identity'; 
  status: 'active' | 'completed' | 'archived';
  isFocus: boolean; 
  quantity: number;     
  progress: number;      
  unit: string;          
  priority: 'normal' | 'important' | 'urgent' | 'critical';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  frequency_detail?: string; 
  mood_score: number;
  questionId?: number; 
  metadata?: { [key: string]: any; };
  createdAt: Date;
  completedAt?: Date;
  is_nlp_hidden: boolean;
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
    
    // --- QUAN TRỌNG: TĂNG VERSION LÊN 2 ---
    // Để Dexie biết là cấu trúc đã thay đổi và cập nhật lại Index
    this.version(2).stores({
      entries: '++id, type, status, isFocus, createdAt, completedAt, questionId', 
      mev_logs: '++id, actionType, timestamp'
    });
  }

  async nuke() {
    await this.transaction('rw', this.entries, this.mev_logs, async () => {
      await this.entries.clear();
      await this.mev_logs.clear();
    });
  }
}

export const db = new MindDatabase();