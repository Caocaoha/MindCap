import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { motion } from 'framer-motion';

const IdentityRadar = () => {
  const stats = useLiveQuery(async () => {
    const all = await db.masterDoc.toArray();
    // Tính toán các chỉ số dựa trên Master Doc (V3.3)
    return {
      logic: Math.min(100, all.filter(d => d.type === 'task').length * 15),
      emotion: Math.min(100, all.filter(d => d.type === 'mood').length * 20),
      vision: Math.min(100, all.filter(d => d.content.includes('Audit')).length * 4),
      consistency: all.length > 0 ? (all.reduce((acc, curr) => acc + curr.entropy, 0) / all.length) * 100 : 0
    };
  }, []);

  // Tính toán tọa độ Polygon (Center 50,50)
  const points = stats ? `50,${50 - stats.logic * 0.4} ${50 + stats.emotion * 0.4},50 50,${50 + stats.consistency * 0.4} ${50 - stats.vision * 0.4},50` : "50,50 50,50 50,50 50,50";

  return (
    <div className="flex flex-col items-center p-8 pt-2 h-full bg-black">
      <h1 className="text-3xl font-black uppercase mb-12 tracking-tighter">CĂN TÍNH</h1>
      
      <div className="relative w-72 h-72">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">
          {/* Mạng lưới Radar */}
          <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="0.1" strokeDasharray="1 1" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="white" strokeWidth="0.1" strokeDasharray="1 1" />
          <line x1="50" y1="10" x2="50" y2="90" stroke="white" strokeWidth="0.1" opacity="0.2" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="white" strokeWidth="0.1" opacity="0.2" />
          
          {/* Vùng Căn tính */}
          <motion.polygon 
            animate={{ points }} 
            points={points} 
            fill="rgba(59,130,246,0.3)" 
            stroke="#3b82f6" 
            strokeWidth="0.5" 
          />
        </svg>

        {/* Nhãn trục */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] font-bold text-blue-400 uppercase tracking-widest">Lý trí</div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[8px] font-bold text-pink-400 uppercase tracking-widest rotate-90 origin-right">Cảm xúc</div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] font-bold text-green-400 uppercase tracking-widest">Nhất quán</div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[8px] font-bold text-yellow-400 uppercase tracking-widest -rotate-90 origin-left">Tầm nhìn</div>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-xs">
        <StatCard label="Tỷ lệ thực thi" value={`${stats?.logic || 0}%`} color="text-blue-500" />
        <StatCard label="Độ tươi mới" value={`${Math.round(stats?.consistency || 0)}%`} color="text-green-500" />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }: any) => (
  <div className="bg-zinc-900/50 p-4 rounded-3xl border border-white/5">
    <div className="text-[9px] uppercase text-gray-500 font-bold mb-1">{label}</div>
    <div className={`text-xl font-mono ${color}`}>{value}</div>
  </div>
);

export default IdentityRadar;