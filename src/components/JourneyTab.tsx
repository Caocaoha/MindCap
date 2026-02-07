import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getLevelInfo } from '../utils/gamification';
import { User, TrendingUp, Activity, BookOpen, Repeat, BarChart3 } from 'lucide-react';
import clsx from 'clsx';

export const JourneyTab = () => {
  // 1. DATA QUERIES
  const logs = useLiveQuery(() => db.mev_logs.toArray());
  const allTasks = useLiveQuery(() => db.entries.toArray());

  // 2. CALCULATE STATS
  const totalXp = logs?.reduce((sum, log) => sum + log.points, 0) || 0;
  const { level, type, progress, nextXp } = getLevelInfo(totalXp);

  // Thống kê trong ngày
  const today = new Date().toDateString();
  const dailyStats = allTasks?.reduce((acc, item) => {
    if (new Date(item.createdAt).toDateString() === today) {
      if (item.type === 'task') acc.tasks++;
      if (item.type === 'mood') acc.moods++;
    }
    return acc;
  }, { tasks: 0, moods: 0 }) || { tasks: 0, moods: 0 };

  // 3. CHART DATA GENERATION (7 Days)
  const generateChartData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      
      // Lọc task trong ngày d
      const dayTasks = allTasks?.filter(t => 
        t.type === 'task' && 
        (new Date(t.createdAt).toDateString() === dateStr || 
         (t.completedAt && new Date(t.completedAt).toDateString() === dateStr))
      ) || [];

      const completed = dayTasks.filter(t => t.status === 'completed').length;
      const total = dayTasks.length;
      const ratio = total > 0 ? (completed / total) * 100 : 0;

      data.push({ day: d.getDate(), completed, ratio });
    }
    return data;
  };

  const chartData = generateChartData();
  const maxBar = Math.max(...chartData.map(d => d.completed), 5); // Scale cho Bar

  // 4. HABITS (Recurring Tasks)
  const habits = allTasks?.filter(t => t.frequency && t.frequency !== 'once' && t.status === 'active') || [];

  return (
    <div className="p-5 pb-32 bg-slate-50/50 min-h-screen space-y-6">
      
      {/* 1. PROFILE CARD */}
      <div className="bg-white p-5 rounded-3xl shadow-lg shadow-blue-100/50 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{type}</h2>
            <div className="text-3xl font-black text-slate-800 flex items-baseline gap-1">
              LV.{level} <span className="text-sm font-medium text-slate-400">/ {totalXp} XP</span>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-5 relative z-10">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
            <span>TIẾN ĐỘ THĂNG CẤP</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-right text-slate-400 mt-1">Cần thêm {nextXp - totalXp} XP</p>
        </div>
      </div>

      {/* 2. DUAL AXIS CHART (SVG Tự vẽ - Lightweight) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={20} className="text-blue-500" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">HIỆU SUẤT 7 NGÀY</h3>
        </div>
        
        <div className="h-40 flex items-end justify-between gap-2 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="border-t border-dashed border-slate-400 w-full"></div>
            <div className="border-t border-dashed border-slate-400 w-full"></div>
            <div className="border-t border-dashed border-slate-400 w-full"></div>
          </div>

          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              {/* Line Chart Point (Ratio) */}
              <div 
                className="absolute w-2 h-2 bg-purple-500 rounded-full z-20 border-2 border-white shadow-sm transition-all"
                style={{ bottom: `${d.ratio}%`, marginBottom: '-4px' }}
              />
              {/* Bar Chart (Completed) */}
              <div 
                className="w-full max-w-[20px] bg-blue-100 rounded-t-lg transition-all duration-500 group-hover:bg-blue-200 relative"
                style={{ height: `${(d.completed / maxBar) * 100}%` }}
              >
                 {d.completed > 0 && <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-blue-600">{d.completed}</span>}
              </div>
              {/* Day Label */}
              <span className="text-[10px] font-medium text-slate-400 mt-2">{d.day}</span>
            </div>
          ))}
          
          {/* SVG Line Connector (Vẽ đường nối các điểm Ratio) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            <polyline 
              fill="none" 
              stroke="#A855F7" 
              strokeWidth="2" 
              points={chartData.map((d, i) => {
                const x = (i * (100 / 7)) + (100 / 14); // Căn giữa cột
                return `${x}%,${100 - d.ratio}%`; // Đảo ngược Y vì SVG 0 ở trên
              }).join(' ')} 
            />
          </svg>
        </div>
        
        <div className="flex justify-center gap-4 mt-4 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-blue-500"><div className="w-2 h-2 bg-blue-200 rounded-sm"/> Việc xong</span>
          <span className="flex items-center gap-1 text-purple-500"><div className="w-2 h-2 bg-purple-500 rounded-full"/> Tỷ lệ %</span>
        </div>
      </div>

      {/* 3. NHỊP ĐIỆU (HABITS) */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-2 flex items-center gap-2">
          <Repeat size={14}/> Thói quen lặp lại
        </h3>
        <div className="space-y-3">
          {habits.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic bg-white rounded-2xl border border-dashed">Chưa có thói quen nào</div>
          ) : (
            habits.map(h => (
              <div key={h.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-700 text-sm">{h.content}</p>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 mt-1 inline-block uppercase">{h.frequency}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-blue-600">{h.progress || 0}/{h.quantity}</div>
                  <div className="text-[10px] text-slate-400">{h.unit}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. DAILY LOG */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100">
          <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">Ý định mới</div>
          <div className="text-2xl font-black text-slate-800">{dailyStats.tasks}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100">
          <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">Cảm xúc</div>
          <div className="text-2xl font-black text-slate-800">{dailyStats.moods}</div>
        </div>
      </div>

    </div>
  );
};