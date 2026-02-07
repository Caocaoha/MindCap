import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Entry } from '../db';
import { getLevelInfo } from '../utils/gamification';
import { 
  User, BarChart3, Repeat, Book, Bookmark, 
  Search, Calendar, ArrowLeft, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// --- SUB-COMPONENT: DIARY ITEM (ENTROPY LOGIC) ---
const DiaryItem = ({ entry, searchTerm }: { entry: Entry, searchTerm: string }) => {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState(entry.bookmarkReason || '');

  // 1. TÍNH TOÁN ENTROPY (ĐỘ TAN RÃ)
  const calculateEntropy = () => {
    if (entry.isBookmarked) return 1; // Hạt giống không bao giờ chết
    if (searchTerm) return 1; // Khi search thì hiện rõ tất cả

    const now = new Date().getTime();
    const lastUpdate = new Date(entry.updatedAt || entry.createdAt).getTime();
    const daysPassed = (now - lastUpdate) / (1000 * 60 * 60 * 24);
    
    // Sau 40 ngày -> Opacity = 0
    const lifeForce = Math.max(0, 1 - (daysPassed / 40));
    return lifeForce;
  };

  const opacity = calculateEntropy();

  // Nếu đã tan rã hoàn toàn (Opacity 0) và không search -> Ẩn luôn
  if (opacity <= 0.05 && !searchTerm && !entry.isBookmarked) return null;

  // 2. HÀNH ĐỘNG
  const toggleBookmark = async () => {
    if (!entry.isBookmarked) {
      setShowReasonInput(true); // Mở hộp thoại hỏi lý do
    } else {
      // Bỏ bookmark -> Reset lại
      await db.entries.update(entry.id!, { 
        isBookmarked: false, 
        updatedAt: new Date() // Reset entropy
      });
    }
  };

  const saveBookmark = async () => {
    await db.entries.update(entry.id!, { 
      isBookmarked: true, 
      bookmarkReason: reason,
      updatedAt: new Date()
    });
    setShowReasonInput(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: searchTerm ? 1 : opacity }}
      className={clsx(
        "p-4 rounded-2xl border mb-3 transition-all duration-500 relative group",
        entry.isBookmarked 
          ? "bg-white border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.15)] ring-1 ring-yellow-100 z-10" // Visual Bookmark (Sáng hơn)
          : "bg-slate-50/50 border-slate-100 grayscale-[0.3]" // Entropy (Mờ nhạt)
      )}
      style={{ 
        // Hiệu ứng sáng hơn 5% nếu bookmark
        filter: entry.isBookmarked ? 'brightness(1.05)' : `opacity(${opacity})` 
      }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <p className="text-sm text-slate-700 font-medium leading-relaxed">{entry.content}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true, locale: vi })}
            </span>
            {entry.type === 'mood' && <span className="text-[10px] text-purple-400 font-bold uppercase">Tâm trạng</span>}
            {entry.type === 'identity' && <span className="text-[10px] text-pink-400 font-bold uppercase">Căn tính</span>}
            {entry.status === 'completed' && <span className="text-[10px] text-green-500 font-bold uppercase">Đã xong</span>}
          </div>
          
          {/* Hiển thị lý do Bookmark */}
          {entry.isBookmarked && entry.bookmarkReason && (
            <div className="mt-2 text-[11px] text-yellow-700 bg-yellow-50 p-2 rounded-lg border border-yellow-100 italic">
              " {entry.bookmarkReason} "
            </div>
          )}
        </div>

        <button 
          onClick={toggleBookmark}
          className={clsx(
            "p-2 rounded-full transition-all",
            entry.isBookmarked ? "text-yellow-500 bg-yellow-50" : "text-slate-300 hover:text-slate-500"
          )}
        >
          <Bookmark size={18} fill={entry.isBookmarked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* INPUT LÝ DO BOOKMARK */}
      <AnimatePresence>
        {showReasonInput && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Vì sao cần giữ hạt giống này?</p>
              <textarea 
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-200 outline-none resize-none"
                placeholder="Ghi lại bài học hoặc cảm xúc..."
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setShowReasonInput(false)} className="text-[10px] text-slate-400 font-bold px-3 py-1.5">HỦY</button>
                <button onClick={saveBookmark} className="text-[10px] bg-yellow-400 text-yellow-900 font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-yellow-500">GIEO HẠT</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---
export const JourneyTab = () => {
  const [viewMode, setViewMode] = useState<'stats' | 'diary'>('stats');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. DATA QUERIES
  const logs = useLiveQuery(() => db.mev_logs.toArray());
  const allEntries = useLiveQuery(() => db.entries.orderBy('createdAt').reverse().toArray());

  // Lọc dữ liệu cho Nhật ký: Trừ việc đang ở Sa bàn (Task Active & Not Focus)
  // Lưu ý: Logic "Ở sa bàn" tức là: type='task' AND status='active' AND isFocus=false
  // Còn lại (Task Done, Mood, Identity, Archived...) đều hiện ở Nhật ký.
  const diaryEntries = allEntries?.filter(e => {
    const isSaBan = e.type === 'task' && e.status === 'active' && e.isFocus === false;
    const matchesSearch = e.content.toLowerCase().includes(searchTerm.toLowerCase());
    return !isSaBan && matchesSearch;
  }) || [];

  // CALCULATE STATS
  const totalXp = logs?.reduce((sum, log) => sum + log.points, 0) || 0;
  const { level, type, progress, nextXp } = getLevelInfo(totalXp);
  const habits = allEntries?.filter(t => t.frequency && t.frequency !== 'once' && t.status === 'active') || [];

  return (
    <div className="p-5 pb-32 bg-slate-50/50 min-h-screen space-y-6">
      
      {/* 1. NAVIGATION HEADER (TOGGLE) */}
      <div className="flex justify-between items-center mb-6">
        {/* Nút Level (Bấm vào để về Stats) */}
        <button 
          onClick={() => setViewMode('stats')}
          className={clsx(
            "flex items-center gap-3 p-1.5 pr-4 rounded-full transition-all border shadow-sm",
            viewMode === 'stats' ? "bg-white border-blue-100 shadow-blue-100" : "bg-slate-100 border-transparent opacity-60"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black">
            {level}
          </div>
          <div className="text-left">
            <div className="text-[9px] font-bold text-slate-400 uppercase">Level</div>
            <div className="text-xs font-bold text-slate-700">{Math.round(progress)}%</div>
          </div>
        </button>

        {/* Nút Diary (Đối diện) */}
        <button 
          onClick={() => setViewMode('diary')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all border",
            viewMode === 'diary' ? "bg-white border-yellow-200 text-yellow-700 shadow-sm" : "bg-slate-100 border-transparent text-slate-400"
          )}
        >
          <span className="text-xs font-bold uppercase tracking-wider">Nhật Ký</span>
          <Book size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* 2. STATS VIEW (Giao diện cũ) */}
      {viewMode === 'stats' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* ... (Giữ nguyên code biểu đồ cũ của bạn ở đây) ... */}
          {/* Để gọn code, tôi giả lập lại cấu trúc cũ, bạn hãy giữ nguyên code Chart/Habit cũ nhé */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-2 mb-4"><BarChart3 size={20} className="text-blue-500"/><h3 className="text-xs font-bold text-slate-500 uppercase">Hiệu suất</h3></div>
             <div className="h-32 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 text-xs italic">Biểu đồ (Placeholder)</div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-2 flex items-center gap-2"><Repeat size={14}/> Thói quen</h3>
            <div className="space-y-3">{habits.map(h => (<div key={h.id} className="bg-white p-4 rounded-2xl border border-slate-100 text-sm font-bold">{h.content}</div>))}</div>
          </div>
        </motion.div>
      )}

      {/* 3. DIARY VIEW (Giao diện mới) */}
      {viewMode === 'diary' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm trong dòng chảy ký ức..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-50 placeholder:text-slate-300 shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dòng thời gian</h3>
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 bg-slate-100 px-2 py-1 rounded-full">
              <RefreshCw size={10}/> Entropy Mode: ON
            </div>
          </div>

          {/* List Entries */}
          <div className="space-y-1">
            {diaryEntries.length === 0 ? (
              <div className="text-center py-20 opacity-40">
                <Calendar size={40} className="mx-auto mb-2 text-slate-300"/>
                <p className="text-sm font-medium text-slate-500">Chưa có ký ức nào</p>
              </div>
            ) : (
              diaryEntries.map(entry => (
                <DiaryItem key={entry.id} entry={entry} searchTerm={searchTerm} />
              ))
            )}
          </div>

          {/* Footer Note */}
          <p className="text-[9px] text-center text-slate-300 italic px-10">
            "Những ký ức không được chăm sóc (bookmark) sẽ tan biến sau 40 ngày."
          </p>
        </motion.div>
      )}

    </div>
  );
};