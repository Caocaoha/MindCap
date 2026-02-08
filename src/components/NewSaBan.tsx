import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Entry } from '../db';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { 
  Search, Archive, Flame, Star, Coffee, 
  ArrowUpCircle, Trash2, Edit3 
} from 'lucide-react';
import clsx from 'clsx';

// ... (Giữ nguyên component TaskItem)
const TaskItem = ({ task, onMoveFocus, onDelete }: { task: Entry, onMoveFocus: (t: Entry) => void, onDelete: (id: number) => void }) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 100], [1, 0]);
  const scale = useTransform(x, [0, 100], [1, 1.05]);
  const bg = useTransform(x, [0, 100], ["#ffffff", "#eff6ff"]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onMoveFocus(task);
    } 
  };

  return (
    <div className="relative mb-3">
      <div className="absolute inset-0 bg-blue-500 rounded-2xl flex items-center justify-start pl-6 text-white font-bold text-xs uppercase tracking-widest z-0">
        <ArrowUpCircle size={20} className="mr-2 animate-bounce" /> Đẩy vào Tiêu điểm
      </div>
      <motion.div
        style={{ x, opacity, scale, backgroundColor: bg }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ right: 0.5, left: 0.1 }}
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 group touch-pan-y"
      >
        <div className="flex justify-between items-start gap-3">
          <p className="text-sm font-medium text-slate-700 leading-snug flex-1">{task.content}</p>
          <PriorityBadge level={task.priority} />
        </div>
        <div className="flex items-center justify-between mt-1">
          {task.quantity > 1 ? (
            <div className="flex items-center gap-2 flex-1 max-w-[120px]">
              <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400/50 rounded-full" style={{ width: `${Math.min(((task.progress || 0) / task.quantity) * 100, 100)}%` }} />
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-bold">{task.progress || 0}/{task.quantity}</span>
            </div>
          ) : (<div className="text-[10px] text-slate-300 italic">Việc đơn</div>)}
          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
             <button className="text-slate-300 hover:text-blue-500"><Edit3 size={14}/></button>
             <button onClick={() => onDelete(task.id!)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const NewSaBan = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const allEntries = useLiveQuery(() => db.entries.toArray()) || [];

  const tasks = allEntries
    .filter(item => item.type === 'task' && item.status === 'active' && item.isFocus === false)
    .reverse();

  // FIX: Chỉ đếm Task đang Active (Chưa xong) và đang trong Focus
  const focusCount = allEntries.filter(item => 
    item.isFocus === true && item.status === 'active'
  ).length;

  if (!allEntries) return <div className="p-10 text-center text-slate-300">Đang tải kho việc...</div>;

  const filteredTasks = tasks.filter(t => 
    t.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groups = {
    doNow: filteredTasks.filter(t => t.priority === 'critical' || t.priority === 'urgent'),
    plan: filteredTasks.filter(t => t.priority === 'important'),
    later: filteredTasks.filter(t => t.priority === 'normal')
  };

  const handleMoveToFocus = async (task: Entry) => {
    if (focusCount >= 4) {
      alert("⚠️ Tiêu điểm đã đầy (4/4)! Hãy hoàn thành bớt việc.");
      return;
    }
    await db.entries.update(task.id!, { isFocus: true });
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Xóa vĩnh viễn?")) await db.entries.delete(id);
  };

  return (
    <div className="w-full pb-32 bg-slate-50/30 min-h-screen flex flex-col">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-5 py-3 border-b border-slate-100">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-100/50 border-none rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"/>
        </div>
      </div>
      <div className="px-5 pt-4 space-y-8">
        {groups.doNow.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 text-orange-600"><Flame size={18} fill="currentColor" className="opacity-20"/><h3 className="text-xs font-black uppercase tracking-widest">Làm Ngay ({groups.doNow.length})</h3></div>
            {groups.doNow.map(task => (<TaskItem key={task.id} task={task} onMoveFocus={handleMoveToFocus} onDelete={handleDelete} />))}
          </section>
        )}
        {groups.plan.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 text-blue-600"><Star size={18} fill="currentColor" className="opacity-20"/><h3 className="text-xs font-black uppercase tracking-widest">Suy Nghĩ Thêm ({groups.plan.length})</h3></div>
            {groups.plan.map(task => (<TaskItem key={task.id} task={task} onMoveFocus={handleMoveToFocus} onDelete={handleDelete} />))}
          </section>
        )}
        {groups.later.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 text-slate-400"><Coffee size={18} className="opacity-50"/><h3 className="text-xs font-black uppercase tracking-widest">Khác ({groups.later.length})</h3></div>
            {groups.later.map(task => (<TaskItem key={task.id} task={task} onMoveFocus={handleMoveToFocus} onDelete={handleDelete} />))}
          </section>
        )}
        {filteredTasks.length === 0 && (<div className="text-center py-20 opacity-40"><Archive size={40} className="mx-auto mb-2 text-slate-300"/><p className="text-sm font-medium text-slate-500">Kho việc trống</p></div>)}
      </div>
    </div>
  );
};

const PriorityBadge = ({ level }: { level?: string }) => {
  const styles: any = { urgent: "bg-orange-50 text-orange-600 border-orange-100", important: "bg-blue-50 text-blue-600 border-blue-100", critical: "bg-red-50 text-red-600 border-red-100", normal: "bg-slate-50 text-slate-500 border-slate-100" };
  const labels: any = { urgent: "GẤP", important: "CẦN", critical: "CHÁY", normal: "" };
  if (level === 'normal' || !level) return null;
  return (<span className={clsx("text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0", styles[level])}>{labels[level]}</span>);
};