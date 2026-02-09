import React, { useState, useRef, useEffect } from 'react'; // <--- ĐÃ THÊM REACT VÀO ĐÂY
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Entry } from '../db';
import { getLevelInfo } from '../utils/gamification';
import { calculateArchetype, type ArchetypeResult } from '../utils/archetypeEngine';
import { 
  BarChart3, Repeat, Book, Bookmark, 
  Search, RefreshCw, User, Link2, ArrowRightCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StatsChart } from './StatsChart';

// --- SUB-COMPONENT: ECHO BADGE ---
const EchoBadge = ({ entryId }: { entryId: number }) => {
  const links = useLiveQuery(async () => {
    const asSource = await db.echo_links.where('sourceId').equals(entryId).toArray();
    const asTarget = await db.echo_links.where('targetId').equals(entryId).toArray();
    return [...asSource, ...asTarget];
  });

  if (!links || links.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
      <Link2 size={10} />
      <span>{links.length}</span>
    </div>
  );
};

// --- DIARY ITEM ---
const DiaryItem = ({ entry, searchTerm, isActive, onActivate, onDerive }: { 
  entry: Entry, 
  searchTerm: string, 
  isActive: boolean, 
  onActivate: (id: number) => void,
  onDerive: (e: Entry) => void 
}) => {
  const [reason, setReason] = useState(entry.bookmarkReason || '');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const [showLinks, setShowLinks] = useState(false);
  
  const relatedEntries = useLiveQuery(async () => {
    if (!showLinks) return [];
    const asSource = await db.echo_links.where('sourceId').equals(entry.id!).toArray();
    const asTarget = await db.echo_links.where('targetId').equals(entry.id!).toArray();
    const ids = [...asSource.map(l => l.targetId), ...asTarget.map(l => l.sourceId)];
    return await db.entries.where('id').anyOf(ids).toArray();
  }, [showLinks]);

  useEffect(() => {
    if (isActive && textAreaRef.current) {
      setTimeout(() => {
        if(textAreaRef.current) {
            textAreaRef.current.focus();
            textAreaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [isActive]);

  const timerRef = useRef<any>(null);
  const handleTouchStart = () => {
    timerRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(100);
      if (confirm(`⚡ Phái sinh Task từ: "${entry.content}"?`)) {
        onDerive(entry);
      }
    }, 800);
  };
  const handleTouchEnd = () => { if (timerRef.current) clearTimeout(timerRef.current); };

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

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!entry.isBookmarked) onActivate(entry.id!); 
    else await db.entries.update(entry.id!, { isBookmarked: false, updatedAt: new Date() });
  };

  const saveBookmark = async () => {
    await db.entries.update(entry.id!, { isBookmarked: true, bookmarkReason: reason, updatedAt: new Date() });
    onActivate(-1);
  };

  return (
    <motion.div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onClick={() => setShowLinks(!showLinks)}
      initial={{ opacity: 0 }}
      animate={{ opacity: searchTerm ? 1 : opacity }}
      className={clsx("p-4 rounded-2xl border mb-3 transition-all duration-500 relative group cursor-pointer", entry.isBookmarked ? "bg-white border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.15)] ring-1 ring-yellow-100 z-10" : "bg-slate-50/50 border-slate-100 grayscale-[0.3]")}
      style={{ filter: entry.isBookmarked ? 'brightness(1.05)' : `opacity(${opacity})` }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <p className="text-sm text-slate-700 font-medium leading-relaxed">{entry.content}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true, locale: vi })}</span>
            {entry.type === 'mood' && <span className="text-[10px] text-purple-400 font-bold uppercase">Tâm trạng</span>}
            {entry.status === 'completed' && <span className="text-[10px] text-green-500 font-bold uppercase">Đã xong</span>}
            <EchoBadge entryId={entry.id!} />
          </div>
          {entry.isBookmarked && entry.bookmarkReason && (<div className="mt-2 text-[11px] text-yellow-700 bg-yellow-50 p-2 rounded-lg border border-yellow-100 italic">" {entry.bookmarkReason} "</div>)}
        </div>
        <button onClick={toggleBookmark} className={clsx("p-2 rounded-full transition-all shrink-0", entry.isBookmarked ? "text-yellow-500 bg-yellow-50" : "text-slate-300 hover:text-slate-500")}><Bookmark size={18} fill={entry.isBookmarked ? "currentColor" : "none"} /></button>
      </div>

      <AnimatePresence>
        {showLinks && relatedEntries && relatedEntries.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
             <div className="mt-3 pt-3 border-t border-blue-100/50">
                <p className="text-[9px] font-bold text-blue-400 uppercase mb-2 flex items-center gap-1"><Link2 size={10}/> Mạng lưới ký ức ({relatedEntries.length})</p>
                <div className="space-y-2 pl-2 border-l-2 border-blue-100">
                  {relatedEntries.map(rel => (
                    <div key={rel.id} className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-50 flex items-center justify-between">
                       <span className="truncate flex-1">{rel.content}</span>
                       <ArrowRightCircle size={12} className="text-blue-300 shrink-0 ml-2"/>
                    </div>
                  ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isActive && (
          <motion.div onClick={e => e.stopPropagation()} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
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

// --- MAIN EXPORT ---
export const JourneyTab = ({ onDerive }: { onDerive: (e: Entry) => void }) => {
  const [viewMode, setViewMode] = useState<'stats' | 'diary'>('stats');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeInputId, setActiveInputId] = useState<number | null>(null);
  const [userArchetype, setUserArchetype] = useState<ArchetypeResult | null>(null);

  const logs = useLiveQuery(() => db.mev_logs.toArray());
  const allEntries = useLiveQuery(() => db.entries.orderBy('updatedAt').reverse().toArray());

  useEffect(() => {
    calculateArchetype().then(result => setUserArchetype(result));
  }, [logs]); 

  const diaryEntries = allEntries?.filter(e => {
    const isSaBan = e.type === 'task' && e.status === 'active' && e.isFocus === false;
    return !isSaBan && e.content.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const displayTitle = userArchetype?.badge || "Loading...";
  const displayLevel = userArchetype?.level || 0;
  
  const totalXp = logs?.reduce((sum, log) => sum + log.points, 0) || 0;
  const { progress } = getLevelInfo(totalXp);
  const habits = allEntries?.filter(t => t.frequency && t.frequency !== 'once' && t.status === 'active') || [];

  return (
    <div className="p-5 pb-32 bg-slate-50/50 min-h-screen space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-stretch gap-3 mb-6">
        <button onClick={() => setViewMode('stats')} className={clsx("flex-1 p-3 rounded-3xl border text-left transition-all relative overflow-hidden group", viewMode === 'stats' ? "bg-white border-blue-100 shadow-lg shadow-blue-50" : "bg-white border-slate-100 opacity-60")}>
           <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-md"><User size={20} /></div>
              <div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{displayTitle}</div>
                 <div className="text-xl font-black text-slate-800 leading-none mt-0.5">LV.{displayLevel}</div>
                 <div className="flex items-center gap-1 mt-2">
                    <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden flex">
                        <div className={clsx("h-full transition-all duration-500", userArchetype?.ea_index! > 50 ? "bg-blue-500" : "bg-yellow-500")} style={{ width: `${progress}%` }} />
                    </div>
                 </div>
              </div>
           </div>
           {viewMode === 'stats' && <div className="absolute top-0 right-0 p-3 opacity-10"><BarChart3 size={40}/></div>}
        </button>

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
                isActive={activeInputId === entry.id}
                onActivate={setActiveInputId}
                onDerive={onDerive} 
              />
            ))}
          </div>

          {activeInputId !== null && <div className="h-[50vh] w-full transition-all duration-300" />}
          
          <p className="text-[9px] text-center text-slate-300 italic px-10 pt-10">"Những ký ức không được chăm sóc sẽ tan biến sau 40 ngày."</p>
        </motion.div>
      )}
    </div>
  );
};