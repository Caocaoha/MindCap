import { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Entry } from '../db';
import { getLevelInfo } from '../utils/gamification';
import { 
  BarChart3, Repeat, Book, Bookmark, 
  Search, RefreshCw, User, 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StatsChart } from './StatsChart';

// --- DIARY ITEM (EXCLUSIVE STATE) ---
// Nhận activeId và onActivate từ Parent
const DiaryItem = ({ entry, searchTerm, isActive, onActivate }: { entry: Entry, searchTerm: string, isActive: boolean, onActivate: (id: number) => void }) => {
  const [reason, setReason] = useState(entry.bookmarkReason || '');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto Focus & Scroll Strategy
  useEffect(() => {
    if (isActive && textAreaRef.current) {
      setTimeout(() => {
        if(textAreaRef.current) {
            textAreaRef.current.focus();
            // Scroll to start (đỉnh màn hình) thay vì center để tránh bị bàn phím che
            textAreaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500); // Delay 500ms để bàn phím nảy lên hết
    }
  }, [isActive]);

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
    if (!entry.isBookmarked) {
        // Mở Exclusive
        onActivate(entry.id!); 
    } else {
        // Tắt Bookmark
        await db.entries.update(entry.id!, { isBookmarked: false, updatedAt: new Date() });
    }
  };

  const saveBookmark = async () => {
    await db.entries.update(entry.id!, { isBookmarked: true, bookmarkReason: reason, updatedAt: new Date() });
    onActivate(-1); // Close input (truyền ID ảo để tắt hết)
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
        {/* Chỉ hiện khi isActive = true */}
        {isActive && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Vì sao cần giữ hạt giống này?</p>
              <textarea ref={textAreaRef} value={reason} onChange={e => setReason(e.target.value)} className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-200 outline-none resize-none shadow-sm text-slate-700" placeholder="Ghi lại bài học..." rows={3} />
              <div className="flex justify-end gap-2 mt-2"><button onClick={() => onActivate(-1)} className="text-[10px] text-slate-400 font-bold px-3 py-2">HỦY</button><button onClick={saveBookmark} className="text-[10px] bg-yellow-400 text-yellow-900 font-bold px-4 py-2 rounded-xl shadow-md hover:bg-yellow-500 active:scale-95 transition-all">GIEO HẠT</button></div>
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
  
  // STATE TẬP TRUNG: Chỉ 1 ID được active tại 1 thời điểm
  const [activeInputId, setActiveInputId] = useState<number | null>(null);

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
      
      {/* --- NEW HEADER DESIGN --- */}
      <div className="flex justify-between items-stretch gap-3 mb-6">
        {/* Left Card: Stats & Profile (Click to View Stats) */}
        <button onClick={() => setViewMode('stats')} className={clsx("flex-1 p-3 rounded-3xl border text-left transition-all relative overflow-hidden group", viewMode === 'stats' ? "bg-white border-blue-100 shadow-lg shadow-blue-50" : "bg-white border-slate-100 opacity-60")}>
           <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-md"><User size={20} /></div>
              <div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{type}</div>
                 <div className="text-xl font-black text-slate-800 leading-none mt-0.5">LV.{level}</div>
                 <div className="w-20 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} /></div>
              </div>
           </div>
           {viewMode === 'stats' && <div className="absolute top-0 right-0 p-3 opacity-10"><BarChart3 size={40}/></div>}
        </button>

        {/* Right Button: Write Diary (Big Action) */}
        <button onClick={() => setViewMode('diary')} className={clsx("w-[110px] rounded-3xl flex flex-col items-center justify-center gap-1 transition-all shadow-md active:scale-95", viewMode === 'diary' ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-200" : "bg-white border border-slate-100 text-slate-400")}>
            <Book size={24} strokeWidth={2.5} className={viewMode === 'diary' ? "animate-pulse" : ""} />
            <span className="text-[10px] font-black uppercase">Nhật Ký</span>
        </button>
      </div>

      {viewMode === 'stats' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-2 mb-4"><BarChart3 size={20} className="text-blue-500"/><h3 className="text-xs font-bold text-slate-500 uppercase">Hiệu suất 7 ngày</h3></div>
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
              <DiaryItem 
                key={entry.id} 
                entry={entry} 
                searchTerm={searchTerm} 
                // Truyền state độc quyền xuống
                isActive={activeInputId === entry.id}
                onActivate={setActiveInputId}
              />
            ))}
          </div>

          {/* SPACER KHỔNG LỒ (50% màn hình) để đẩy nội dung lên khi nhập liệu */}
          {activeInputId !== null && <div className="h-[50vh] w-full transition-all duration-300" />}
          
          <p className="text-[9px] text-center text-slate-300 italic px-10 pt-10">"Những ký ức không được chăm sóc sẽ tan biến sau 40 ngày."</p>
        </motion.div>
      )}
    </div>
  );
};