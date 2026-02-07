import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Entry } from '../db';
import { addXp } from '../utils/gamification'; 
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowDownCircle, Target, Zap, Sprout, Droplets } from 'lucide-react';

// --- 1. MEMORY ITEM (HẠT GIỐNG) ---
const MemoryItem = ({ entry, onReflect }: { entry: Entry, onReflect: (id: number) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, y: -20 }}
      layout
      className="bg-gradient-to-br from-yellow-50 to-orange-50 p-3 rounded-xl border border-yellow-200 shadow-sm flex flex-col gap-2 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <Sprout size={40} className="text-yellow-600"/>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-1 text-[9px] font-bold text-yellow-600 uppercase tracking-wider mb-1">
          <Sprout size={10} /> Ký ức ngủ quên
        </div>
        <p className="text-xs font-medium text-slate-700 italic line-clamp-2">"{entry.content}"</p>
        {entry.bookmarkReason && (
          <p className="text-[10px] text-slate-400 mt-1">Lý do: {entry.bookmarkReason}</p>
        )}
      </div>

      <button 
        onClick={() => onReflect(entry.id!)}
        className="mt-1 w-full flex items-center justify-center gap-1 bg-white border border-yellow-200 text-yellow-700 py-1.5 rounded-lg text-[10px] font-bold hover:bg-yellow-400 hover:text-white transition-all shadow-sm"
      >
        <Droplets size={10} /> TƯỚI NƯỚC (ÔN TẬP)
      </button>
    </motion.div>
  );
};

// --- 2. FOCUS ITEM (TASK) ---
const FocusItem = ({ task, onComplete, onUnfocus }: { task: any, onComplete: any, onUnfocus: any }) => {
  const [localProgress, setLocalProgress] = useState(task.progress || 0);
  const timerRef = useRef<any>(null);
  
  const triggerHaptic = (type: 'tick' | 'success') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'tick') navigator.vibrate(15);
      if (type === 'success') navigator.vibrate([10, 50, 10]);
    }
  };

  useEffect(() => {
    const saveToDb = setTimeout(() => {
      if (localProgress !== task.progress) {
        db.entries.update(task.id, { progress: localProgress });
        if (localProgress >= task.quantity) {
          triggerHaptic('success');
          onComplete(task.id, task);
        }
      }
    }, 500);
    return () => clearTimeout(saveToDb);
  }, [localProgress]);

  const handleDialDrag = (event: any, info: any) => {
    const step = Math.floor(info.offset.y / 15); 
    if (step !== 0) {
      const newValue = Math.min(Math.max(0, task.progress + step), task.quantity);
      if (newValue !== localProgress) {
        setLocalProgress(newValue);
        triggerHaptic('tick');
      }
    }
  };

  const handleNumberTap = () => {
    if (task.quantity <= 10 && localProgress < task.quantity) {
      setLocalProgress(prev => prev + 1);
      triggerHaptic('tick');
    }
  };

  const startFilling = () => {
    if (localProgress >= task.quantity) return;
    triggerHaptic('tick');
    timerRef.current = setInterval(() => {
      setLocalProgress((prev: number) => {
        if (prev >= task.quantity) {
          clearInterval(timerRef.current);
          return prev;
        }
        triggerHaptic('tick');
        return prev + 1;
      });
    }, 150);
  };

  const stopFilling = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const percent = Math.min((localProgress / task.quantity) * 100, 100);

  return (
    <motion.div layout initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white p-0 rounded-2xl border border-blue-100 shadow-[0_4px_12px_rgba(37,99,235,0.08)] relative z-10 overflow-hidden select-none touch-none">
      {task.quantity > 1 && (
         <div className="absolute top-0 left-0 w-full h-full bg-slate-50 z-0" onPointerDown={startFilling} onPointerUp={stopFilling} onPointerLeave={stopFilling}>
           <motion.div className="h-full bg-blue-50 transition-all duration-100 ease-linear" style={{ width: `${percent}%` }} />
           {localProgress > 0 && localProgress < task.quantity && (<div className="absolute top-0 right-0 w-2 h-full bg-white/50 blur-[2px] animate-pulse" style={{ left: `${percent}%` }} />)}
         </div>
      )}
      <div className="flex items-center justify-between gap-3 p-3.5 relative z-10">
        <button onClick={() => { triggerHaptic('success'); onComplete(task.id, task); }} className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-transparent hover:border-green-500 hover:text-green-500 transition-all shrink-0 bg-white/50">
          <CheckCircle2 size={16} strokeWidth={3} />
        </button>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-sm font-bold text-slate-800 leading-tight truncate">{task.content}</p>
          {task.quantity > 1 && (
            <motion.div className="flex items-center gap-1 w-fit mt-1 px-2 py-0.5 rounded-lg bg-white/60 border border-slate-100 shadow-sm cursor-ns-resize active:scale-110 active:border-blue-300 transition-all" drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.1} onDrag={handleDialDrag} onClick={handleNumberTap}>
              <Zap size={10} className={localProgress >= task.quantity ? "text-green-500" : "text-amber-500"} fill="currentColor"/>
              <span className="text-[11px] font-black text-slate-600 font-mono">{localProgress} <span className="text-slate-300">/</span> {task.quantity} {task.unit}</span>
            </motion.div>
          )}
        </div>
        <button onClick={() => onUnfocus(task.id)} className="text-slate-300 hover:text-orange-500 p-2 rounded-lg hover:bg-white/80 transition-colors"><ArrowDownCircle size={20} /></button>
      </div>
    </motion.div>
  );
};

// --- 3. MAIN COMPONENT (SAFE QUERY MODE) ---
export const FocusZone = () => {
  // Lấy TOÀN BỘ dữ liệu về trước (Safe Query)
  const allEntries = useLiveQuery(() => db.entries.toArray()) || [];

  // Lọc 1: Tiêu điểm Active (Lọc bằng JS thay vì DB Index)
  const focusTasks = allEntries
    .filter(item => item.type === 'task' && item.status === 'active' && item.isFocus === true)
    .reverse();

  // Lọc 2: Ký ức ngủ quên (Memory)
  const memories = React.useMemo(() => {
    const now = new Date();
    const threshold = new Date(now.setDate(now.getDate() - 28)); // 28 ngày trước

    const oldOnes = allEntries.filter(e => {
      // Chỉ lấy Bookmark + Có ngày cập nhật cũ hơn 28 ngày
      if (!e.isBookmarked) return false;
      const lastUpdate = new Date(e.updatedAt || e.createdAt);
      return lastUpdate < threshold;
    });

    // Shuffle và lấy 4
    return oldOnes.sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [allEntries]); // Chỉ tính lại khi allEntries thay đổi

  // Logic Hành động
  const completeTask = async (id: number, task: any) => {
    await db.entries.update(id, { status: 'completed', completedAt: new Date(), progress: 100 });
    if (task.frequency && task.frequency !== 'once') { await addXp('habit_log'); } 
    else { await addXp('todo_done'); }
  };

  const unfocusTask = async (id: number) => { await db.entries.update(id, { isFocus: false }); };

  const reflectMemory = async (id: number) => {
    await db.entries.update(id, { updatedAt: new Date() }); // Reset Entropy
    await addXp('thought');
    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
  };

  // EMPTY STATE
  if (focusTasks.length === 0 && memories.length === 0) {
    return (
      <div className="w-full py-4 px-4 bg-white/50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 mt-2">
        <div className="bg-slate-100 p-2 rounded-full text-slate-300"><Target size={20} /></div>
        <p className="text-[10px] text-slate-400 font-medium">Chưa có Tiêu điểm</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      
      {/* SECTION 1: MEMORIES */}
      <AnimatePresence>
        {memories.length > 0 && (
          <motion.div layout className="grid grid-cols-2 gap-2 mb-2">
             {memories.map(mem => (
               <MemoryItem key={mem.id} entry={mem} onReflect={reflectMemory} />
             ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEPARATOR */}
      {memories.length > 0 && focusTasks.length > 0 && (
         <div className="flex items-center justify-center gap-2 opacity-50 my-1">
            <span className="h-[1px] w-4 bg-slate-300"></span>
            <ArrowDownCircle size={10} className="text-slate-400"/>
            <span className="h-[1px] w-4 bg-slate-300"></span>
         </div>
      )}

      {/* SECTION 2: FOCUS TASKS */}
      {focusTasks.length > 0 && (
        <>
          <div className="flex items-center justify-center gap-2 mb-1 opacity-80">
            <span className="h-[1px] w-6 bg-blue-300"></span>
            <h3 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">TIÊU ĐIỂM ({focusTasks.length}/4)</h3>
            <span className="h-[1px] w-6 bg-blue-300"></span>
          </div>
          <AnimatePresence>
            {focusTasks.map(task => (<FocusItem key={task.id} task={task} onComplete={completeTask} onUnfocus={unfocusTask} />))}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};