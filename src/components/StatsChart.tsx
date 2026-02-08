import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { format, subDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

export const StatsChart = () => {
  const logs = useLiveQuery(() => db.mev_logs.toArray());

  const data = useMemo(() => {
    if (!logs) return [];
    
    // 1. Tạo mảng 7 ngày gần nhất
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { 
        date: d, 
        label: format(d, 'EE', { locale: vi }), // T2, T3...
        total: 0,
        avg: 0 
      };
    });

    // 2. Tính tổng điểm từng ngày
    logs.forEach(log => {
      const day = last7Days.find(d => isSameDay(d.date, log.timestamp));
      if (day) day.total += log.points;
    });

    // 3. Tính đường trung bình động (3-day Moving Average)
    // Để làm mượt biểu đồ xu hướng
    last7Days.forEach((day, i) => {
      if (i === 0) day.avg = day.total;
      else if (i === 1) day.avg = (last7Days[0].total + day.total) / 2;
      else day.avg = (last7Days[i-2].total + last7Days[i-1].total + day.total) / 3;
    });

    return last7Days;
  }, [logs]);

  if (!data.length) return <div className="h-32 flex items-center justify-center text-xs text-slate-300">Đang tải dữ liệu...</div>;

  // 4. Tính toán tọa độ vẽ SVG
  const maxVal = Math.max(...data.map(d => d.total), 10); // Max ít nhất là 10 để không bị lỗi chia
  const height = 120;
  const colWidth = 8;
  const gap = (100 - (colWidth * 7)) / 6;

  // Tạo đường Path cho Line Chart (Average)
  const linePath = data.map((d, i) => {
    const x = i * (colWidth + gap) + (colWidth / 2);
    const y = height - (d.avg / maxVal) * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="w-full h-40 select-none">
      <svg viewBox="0 0 100 150" className="w-full h-full overflow-visible" preserveAspectRatio="none">
        
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="barGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
        </defs>

        {/* Trục hoành (Dotted Line) */}
        <line x1="0" y1={height} x2="100" y2={height} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
        <line x1="0" y1={height/2} x2="100" y2={height/2} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />

        {/* CỘT (BARS) - Intensity */}
        {data.map((d, i) => {
          const barHeight = (d.total / maxVal) * height;
          const x = i * (colWidth + gap);
          const y = height - barHeight;
          
          return (
            <g key={i}>
              <rect 
                x={x} y={y} 
                width={colWidth} height={barHeight} 
                rx="2" fill="url(#barGradient)" 
                opacity="0.9"
              />
              <text x={x + colWidth/2} y={140} fontSize="3" textAnchor="middle" fill="#94a3b8" fontWeight="bold">
                {d.label}
              </text>
              {d.total > 0 && (
                <text x={x + colWidth/2} y={y - 2} fontSize="3" textAnchor="middle" fill="#3b82f6" fontWeight="bold">
                  {d.total}
                </text>
              )}
            </g>
          );
        })}

        {/* ĐƯỜNG (LINE) - Consistency Trend */}
        <path 
          d={linePath} 
          fill="none" 
          stroke="#f59e0b" 
          strokeWidth="1" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />
        
        {/* Điểm trên đường */}
        {data.map((d, i) => {
           const x = i * (colWidth + gap) + (colWidth / 2);
           const y = height - (d.avg / maxVal) * height;
           return <circle key={i} cx={x} cy={y} r="1.5" fill="#fff" stroke="#f59e0b" strokeWidth="0.5" />
        })}

      </svg>
    </div>
  );
};