import Dexie, { type Table } from 'dexie';

// 1. DATA MODELS INTERFACES
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
  isBookmarked: boolean;  
  bookmarkReason?: string;
  updatedAt: Date;        
  createdAt: Date;
  completedAt?: Date;
  is_nlp_hidden: boolean;
  
  // --- NEW FIELD: SPACED REPETITION ---
  nextReviewAt?: Date; // Thời điểm hệ thống sẽ hiển thị lại ("Neo thời gian")
  
  metadata?: { [key: string]: any; };
}

export interface MevLog {
  id?: number;
  actionType: 
    | 'task_create' | 'task_done' | 'priority_shift' | 'focus_update'
    | 'thought_add' | 'identity_fill' | 'reflect_action' | 'mood_log' | 'echo_connect'
    | 'level_up' | 'todo_new' | 'todo_done' | 'thought' | 'habit_log';
  points: number;
  timestamp: Date;
}

export interface EchoLink {
  id?: number;
  sourceId: number;
  targetId: number;
  type: 'semantic' | 'temporal' | 'structural';
  strength: number;
  keywords?: string[];
  createdAt: Date;
}

// 2. DATABASE CONFIGURATION
class MindDatabase extends Dexie {
  entries!: Table<Entry>;
  mev_logs!: Table<MevLog>;
  echo_links!: Table<EchoLink>;

  constructor() {
    super('MindCap_Store');
    
    // Version 8: Add nextReviewAt index
    this.version(8).stores({
      entries: '++id, type, status, isFocus, isBookmarked, priority, createdAt, updatedAt, nextReviewAt', 
      mev_logs: '++id, actionType, timestamp',
      echo_links: '++id, sourceId, targetId, type, createdAt'
    }).upgrade(async () => {
       // Migration script if needed
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