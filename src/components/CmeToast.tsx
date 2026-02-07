import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

export const CmeToast = () => {
  const [notifications, setNotifications] = useState<{id: number, points: number, text: string}[]>([]);

  useEffect(() => {
    const handleCme = (e: any) => {
      const { points, actionType } = e.detail;
      const id = Date.now();
      
      let text = "Hoạt động";
      if (actionType === 'todo_done') text = "Hoàn thành";
      if (actionType === 'todo_new') text = "Ý định mới";
      if (actionType === 'habit_log') text = "Thói quen";
      if (actionType === 'identity_fill') text = "Căn tính";
      if (actionType === 'thought') text = "Suy tư";

      setNotifications(prev => [...prev, { id, points, text }]);

      // Tự tắt sau 2s
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 2000);
    };

    window.addEventListener('cme-gained', handleCme);
    return () => window.removeEventListener('cme-gained', handleCme);
  }, []);

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/90 backdrop-blur text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-3 border border-yellow-500/30"
          >
            <div className="bg-yellow-500 p-1 rounded-full text-slate-900">
              <Zap size={14} fill="currentColor" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">{n.text}</div>
              <div className="text-sm font-black text-yellow-400">+{n.points} CME</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};