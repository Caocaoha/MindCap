import { useState, useRef, useEffect } from 'react'; // Bỏ React
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Entry } from '../db';
import { getLevelInfo } from '../utils/gamification';
import { 
  BarChart3, Repeat, Book, Bookmark, 
  Search, RefreshCw, User 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StatsChart } from './StatsChart'; // Import Chart

// --- DIARY ITEM (Updated) ---
const DiaryItem = ({ entry, searchTerm, onFocusInput }: { entry: Entry, searchTerm: string, onFocusInput: () => void }) => {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState(entry.bookmarkReason || '');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto Focus & Scroll
  useEffect(() => {
    if (showReasonInput && textAreaRef.current) {
      onFocusInput(); // Báo cho parent biết để tạo khoảng trống
      setTimeout(() => {
        textAreaRef.current?.focus();
        textAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [showReasonInput]);

  const calculateEntropy = () => {
    if (entry.isBookmarked) return 1;
    if (searchTerm) return 1;
    const now = new Date().getTime();
    const lastUpdate = new Date(entry.updatedAt || entry.createdAt).getTime();
    const daysPassed = (now - lastUpdate) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - (daysPassed / 40));
  };

  const opacity = calculateEntropy();
  if (opacity <= 0.05 && !searchTerm && !entry.isBookmarked) return null;

  const toggleBookmark = async () => {
    if (!entry.isBookmarked) setShowReasonInput(true);
    else await db.entries.update(entry.id!, { isBookmarked: false, updatedAt: new Date() });
  };

  const saveBookmark = async () => {
    await db.entries.update(entry.id!, { isBookmarked: true, bookmarkReason: reason, updatedAt: new Date() });
    setShowReasonInput(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: searchTerm ? 1 : opacity }}
      className={clsx("p-4 rounded-2xl border mb-3 transition-all duration-500 relative group", entry.isBookmarked ? "bg-white border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.15)] ring-1 ring-yellow-100 z-10" : "bg-slate-50/50 border-slate-100 grayscale-[0.3]")}
      style={{ filter: entry.isBookmarked ? 'brightness(1.05)' : `opacity(${opacity})` }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <p className="text-sm text-slate-700 font-medium leading-relaxed">{entry.content}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true, locale: vi })}</span>
            {entry.type === 'mood' && <span className="text-[10px] text-purple-400 font-bold uppercase">Tâm trạng</span>}
            {entry.status === 'completed' && <span className="text-[10px] text-green-500 font-bold uppercase">Đã xong</span>}
          </div>
          {entry.isBookmarked && entry.bookmarkReason && (<div className="mt-2 text-[11px] text-yellow-700 bg-yellow-50 p-2 rounded-lg border border-yellow-100 italic">" {entry.bookmarkReason} "</div>)}
        </div>
        <button onClick={toggleBookmark} className={clsx("p-2 rounded-full transition-all", entry.isBookmarked ? "text-yellow-500 bg-yellow-50" : "text-slate-300 hover:text-slate-500")}><Bookmark size={18} fill={entry.isBookmarked ? "currentColor" : "none"} /></button>
      </div>

      <AnimatePresence>
        {showReasonInput && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Vì sao cần giữ hạt giống này?</p>
              <textarea ref={textAreaRef} value={reason} onChange={e => setReason(e.target.value)} className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-200 outline-none resize-none" placeholder="Ghi lại bài học..." rows={2} />
              <div className="flex justify-end gap-2 mt-2"><button onClick={() => setShowReasonInput(false)} className="text-[10px] text-slate-400 font-bold px-3 py-1.5">HỦY</button><button onClick={saveBookmark} className="text-[10px] bg-yellow-400 text-yellow-900 font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-yellow-500">GIEO HẠT</button></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- MAIN ---
export const JourneyTab = () => {
  const [viewMode, setViewMode] = useState<'stats' | 'diary'>('stats');
  const [searchTerm, setSearchTerm] = useState('');
  const [isInputting, setIsInputting] = useState(false); // State để trigger spacer

  const logs = useLiveQuery(() => db.mev_logs.toArray());
  const allEntries = useLiveQuery(() => db.entries.orderBy('createdAt').reverse().toArray());

  const diaryEntries = allEntries?.filter(e => {
    const isSaBan = e.type === 'task' && e.status === 'active' && e.isFocus === false;
    return !isSaBan && e.content.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const totalXp = logs?.reduce((sum, log) => sum + log.points, 0) || 0;
  const { level, type, progress } = getLevelInfo(totalXp);
  const habits = allEntries?.filter(t => t.frequency && t.frequency !== 'once' && t.status === 'active') || [];

  return (
    <div className="p-5 pb-32 bg-slate-50/50 min-h-screen space-y-6">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setViewMode('stats')} className={clsx("flex items-center gap-3 p-1.5 pr-4 rounded-full transition-all border shadow-sm", viewMode === 'stats' ? "bg-white border-blue-100 shadow-blue-100" : "bg-slate-100 border-transparent opacity-60")}>
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black">{level}</div>
          <div className="text-left"><div className="text-[9px] font-bold text-slate-400 uppercase">Level</div><div className="text-xs font-bold text-slate-700">{Math.round(progress)}%</div></div>
        </button>
        <button onClick={() => setViewMode('diary')} className={clsx("flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all border", viewMode === 'diary' ? "bg-white border-yellow-200 text-yellow-700 shadow-sm" : "bg-slate-100 border-transparent text-slate-400")}><span className="text-xs font-bold uppercase tracking-wider">Nhật Ký</span><Book size={16} strokeWidth={2.5} /></button>
      </div>

      {viewMode === 'stats' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white p-5 rounded-3xl shadow-lg shadow-blue-100/50 border border-slate-100 relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl"><User size={32} /></div>
              <div><h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{type}</h2><div className="text-3xl font-black text-slate-800 flex items-baseline gap-1">LV.{level} <span className="text-sm font-medium text-slate-400">/ {totalXp} CME</span></div></div>
            </div>
          </div>
          
          {/* CHARTS */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-2 mb-4"><BarChart3 size={20} className="text-blue-500"/><h3 className="text-xs font-bold text-slate-500 uppercase">Hiệu suất 7 ngày</h3></div>
             {/* Chart Component Here */}
             <StatsChart />
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-2 flex items-center gap-2"><Repeat size={14}/> Thói quen</h3>
            <div className="space-y-3">{habits.map(h => (<div key={h.id} className="bg-white p-4 rounded-2xl border border-slate-100 text-sm font-bold">{h.content}</div>))}</div>
          </div>
        </motion.div>
      )}

      {viewMode === 'diary' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-50 placeholder:text-slate-300 shadow-sm"/></div>
          <div className="flex items-center justify-between px-2"><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dòng thời gian</h3><div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 bg-slate-100 px-2 py-1 rounded-full"><RefreshCw size={10}/> Entropy Mode: ON</div></div>
          
          <div className="space-y-1">
            {diaryEntries.map(entry => (
              <DiaryItem key={entry.id} entry={entry} searchTerm={searchTerm} onFocusInput={() => setIsInputting(true)} />
            ))}
          </div>

          {/* SPACER CHO BÀN PHÍM */}
          {isInputting && <div className="h-[300px] w-full" />}
          
          <p className="text-[9px] text-center text-slate-300 italic px-10 pt-10">"Những ký ức không được chăm sóc sẽ tan biến sau 40 ngày."</p>
        </motion.div>
      )}
    </div>
  );
};