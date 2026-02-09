import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Entry } from '../db';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle2, Sparkles, ChevronUp, ChevronDown, History } from 'lucide-react';
import clsx from 'clsx';
import { calculateNextReview } from '../utils/scheduler';
import { differenceInDays } from 'date-fns';

const ProgressControl = ({ task, onUpdate }: { task: Entry, onUpdate: (id: number, val: number) => void }) => {
  const [val, setVal] = useState(task.progress || 0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimer = useRef<any>(null);
  const startY = useRef(0);
  
  const isSmallTarget = task.quantity <= 10; 
  const isDialMode = !isSmallTarget;

  const handleTap = () => {
    if (isDialMode) return;
    const nextVal = val + 1;
    setVal(nextVal);
    onUpdate(task.id!, nextVal);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isDialMode) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDialMode) return;
    const deltaY = startY.current - e.touches[0].clientY;
    const step = Math.floor(deltaY / 20);
    
    if (step !== 0) {
      const nextVal = Math.max(0, task.progress + step);
      if (nextVal !== val) {
        setVal(nextVal);
        if (navigator.vibrate) navigator.vibrate(15);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isDialMode && val !== task.progress) onUpdate(task.id!, val);
  };

  const startHold = () => {
    setIsHolding(true);
    let speed = 100;
    const loop = () => {
      setVal(prev => {
        const next = prev + (task.quantity / 50); 
        return next;
      });
      speed = Math.max(20, speed * 0.9);
      holdTimer.current = setTimeout(loop, speed);
    };
    loop();
  };

  const stopHold = () => {
    setIsHolding(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    onUpdate(task.id!, Math.floor(val));
  };

  const percent = Math.min(100, (val / task.quantity) * 100);

  return (
    <div className="mt-2 select-none">
      <div className="flex justify-between items-end mb-1">
        <div 
          className={clsx("text-2xl font-black leading-none cursor-ns-resize flex items-center gap-1 active:scale-110 transition-transform", isDialMode ? "text-blue-600" : "text-slate-700")}
          onClick={handleTap}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {Math.floor(val)} 
          <span className="text-xs font-medium text-slate-400">/ {task.quantity} {task.unit}</span>
          {isDialMode && <div className="flex flex-col text-blue-200"><ChevronUp size={10}/><ChevronDown size={10}/></div>}
        </div>
      </div>

      <div 
        className={clsx("h-2 bg-slate-100 rounded-full overflow-hidden relative touch-none", isHolding ? "ring-2 ring-blue-200" : "")}
        onMouseDown={startHold} onMouseUp={stopHold} onMouseLeave={stopHold}
        onTouchStart={startHold} onTouchEnd={stopHold}
      >
        <motion.div className="h-full bg-blue-500 rounded-full relative" style={{ width: `${percent}%` }} layout>
          {isHolding && <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px] animate-pulse" />}
        </motion.div>
      </div>
    </div>
  );
};

export const FocusZone = () => {
  const focusTasks = useLiveQuery(() => 
    db.entries
      .where('status').equals('active')
      .filter(t => t.type === 'task' && t.isFocus === true)
      .limit(4)
      .toArray()
  );

  const memorySpark = useLiveQuery(async () => {
    const now = new Date();
    const dueEntry = await db.entries.where('nextReviewAt').belowOrEqual(now).first();
    return dueEntry;
  });

  const forgottenSeedsCount = useLiveQuery(async () => {
    const allBookmarked = await db.entries.filter(e => e.isBookmarked === true).toArray();
    const now = new Date();
    return allBookmarked.filter(e => differenceInDays(now, new Date(e.updatedAt)) > 28).length;
  });

  const handleComplete = async (id: number) => {
    if (navigator.vibrate) navigator.vibrate(50);
    await db.entries.update(id, { status: 'completed', completedAt: new Date(), isFocus: false });
    window.dispatchEvent(new CustomEvent('cme-gained', { detail: { points: 10, actionType: 'task_done' } }));
  };

  const handleUpdateProgress = async (id: number, newVal: number, target: number) => {
    if (newVal >= target) {
      handleComplete(id);
    } else {
      await db.entries.update(id, { progress: newVal });
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const handleSparkInteraction = async (entry: Entry) => {
    if (confirm('Đi đến Nhật ký để xem chi tiết?')) { /* Navigate logic */ }
    const currentReviewCount = entry.metadata?.reviewCount || 0;
    const nextDate = calculateNextReview(currentReviewCount + 1, entry.isBookmarked);
    await db.entries.update(entry.id!, {
      nextReviewAt: nextDate,
      metadata: { ...entry.metadata, reviewCount: currentReviewCount + 1 }
    });
  };

  return (
    <div className="w-full space-y-4 pb-2">
      <div className="flex items-center gap-2 px-2 opacity-50">
        <Target size={14} className="text-blue-600" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Tiêu điểm</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {focusTasks?.map((task) => (
          <div key={task.id} className={clsx("p-3 rounded-2xl border flex flex-col justify-between min-h-[100px] bg-white border-slate-100 shadow-sm", task.priority === 'critical' && "border-l-4 border-l-red-500")}>
            <div className="flex justify-between items-start">
               <p className="text-xs font-bold line-clamp-2 text-slate-700 leading-tight">{task.content}</p>
               <button onClick={() => handleComplete(task.id!)} className="text-slate-300 hover:text-green-500 transition-colors"><CheckCircle2 size={18}/></button>
            </div>
            <ProgressControl task={task} onUpdate={(id, val) => handleUpdateProgress(id, val, task.quantity)} />
          </div>
        ))}
        {Array.from({ length: 4 - (focusTasks?.length || 0) }).map((_, i) => (
          <div key={`empty-${i}`} className="border-2 border-dashed border-slate-100 rounded-2xl min-h-[100px] flex items-center justify-center opacity-30"><span className="text-[10px] font-bold text-slate-300">TRỐNG</span></div>
        ))}
      </div>

      <AnimatePresence>
        {memorySpark && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100 rounded-xl p-3 flex gap-3 cursor-pointer shadow-sm relative overflow-hidden group" onClick={() => handleSparkInteraction(memorySpark)}>
            <div className="w-1 bg-violet-400 absolute left-0 top-0 bottom-0"/>
            <div className="p-2 bg-white rounded-full h-fit shadow-sm text-violet-500"><Sparkles size={16}/></div>
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Gợi nhớ ({memorySpark.isBookmarked ? 'Hạt giống' : 'Thoáng qua'})</span>
               </div>
               <p className="text-xs text-slate-700 italic line-clamp-2">"{memorySpark.content}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {forgottenSeedsCount && forgottenSeedsCount > 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3 cursor-pointer active:scale-95 transition-transform" onClick={() => alert(`Hãy sang tab Nhật Ký để xem ${forgottenSeedsCount} hạt giống này nhé!`)}>
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0"><History size={16} /></div>
          <div><p className="text-xs font-bold text-amber-800">Ký ức ngủ quên</p><p className="text-[10px] text-amber-600">Có {forgottenSeedsCount} ý tưởng đã quá 28 ngày chưa tưới.</p></div>
        </motion.div>
      ) : null}
    </div>
  );
};