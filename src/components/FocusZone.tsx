import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, History } from 'lucide-react'; // Import History icon
import clsx from 'clsx';
import { differenceInDays } from 'date-fns';

export const FocusZone = () => {
  // Lấy 4 task quan trọng nhất đang active
  const focusTasks = useLiveQuery(() => 
    db.entries
      .where('status').equals('active')
      .filter(t => t.type === 'task' && t.isFocus === true)
      .limit(4)
      .toArray()
  );

  // LOGIC HẠT GIỐNG LÃNG QUÊN
  const forgottenSeedsCount = useLiveQuery(async () => {
    const allBookmarked = await db.entries.where('isBookmarked').equals(true).toArray();
    const now = new Date();
    // Lọc những bài update lần cuối cách đây > 28 ngày
    return allBookmarked.filter(e => differenceInDays(now, new Date(e.updatedAt)) > 28).length;
  });

  const handleComplete = async (id: number) => {
    if (navigator.vibrate) navigator.vibrate(50);
    await db.entries.update(id, { status: 'completed', completedAt: new Date(), isFocus: false });
    const event = new CustomEvent('cme-gained', { detail: { points: 10, actionType: 'focus_done' } });
    window.dispatchEvent(event);
  };

  return (
    <div className="w-full space-y-3">
      {/* Header nhỏ */}
      <div className="flex items-center gap-2 px-2 opacity-50">
        <Target size={14} className="text-blue-600" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Tiêu điểm</span>
      </div>

      {/* Grid 2x2 cho Tasks */}
      <div className="grid grid-cols-2 gap-2">
        {focusTasks?.map((task) => (
          <motion.div 
            key={task.id} 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className={clsx(
              "p-3 rounded-2xl border flex flex-col justify-between min-h-[80px] relative overflow-hidden group transition-all",
              task.priority === 'critical' ? "bg-red-50 border-red-100" :
              task.priority === 'urgent' ? "bg-orange-50 border-orange-100" :
              "bg-white border-slate-100 shadow-sm"
            )}
          >
            <p className={clsx("text-xs font-bold line-clamp-2 leading-relaxed", task.priority === 'critical' ? "text-red-700" : "text-slate-700")}>
              {task.content}
            </p>
            <button 
              onClick={() => handleComplete(task.id!)}
              className="absolute bottom-2 right-2 p-1.5 rounded-full bg-white/50 hover:bg-green-500 hover:text-white text-slate-300 transition-all active:scale-90"
            >
              <CheckCircle2 size={16} />
            </button>
          </motion.div>
        ))}
        
        {/* Empty States (Placeholder nếu chưa đủ 4 task) */}
        {Array.from({ length: 4 - (focusTasks?.length || 0) }).map((_, i) => (
          <div key={`empty-${i}`} className="border-2 border-dashed border-slate-100 rounded-2xl min-h-[80px] flex items-center justify-center opacity-50">
             <span className="text-[10px] text-slate-300 font-medium">Trống</span>
          </div>
        ))}
      </div>

      {/* CARD: HẠT GIỐNG LÃNG QUÊN (Chỉ hiện khi có > 0) */}
      {forgottenSeedsCount && forgottenSeedsCount > 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3 cursor-pointer active:scale-95 transition-transform"
          onClick={() => alert(`Hãy sang tab Nhật Ký để xem ${forgottenSeedsCount} hạt giống này nhé!`)} // Sau này có thể navigate
        >
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <History size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-800">Ký ức ngủ quên</p>
            <p className="text-[10px] text-amber-600">Có {forgottenSeedsCount} ý tưởng đã quá 28 ngày chưa tưới.</p>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
};