import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../db';

const AUDIT_QUESTIONS = [
  { q: "Nỗi bất mãn âm ỉ và dai dẳng mà trò đang phải sống chung hàng ngày là gì?", type: 'axit' },
  { q: "Viết ra 3 điều về bản thân trò thường xuyên phàn nàn nhưng vẫn chưa thay đổi được?", type: 'axit' },
  { q: "Điều trò thực sự khao khát ẩn dưới sự khó chịu đó là gì?", type: 'axit' },
  { q: "Đâu là sự thật về cuộc sống mà trò không bao giờ dám thổ lộ?", type: 'axit' },
  { q: "Giữa bất mãn, phẩm chất nào của trò vẫn đang 'sống sót'?", type: 'kiem' },
  { q: "Nếu hành vi không đổi trong 5 năm tới, ai đang rời bỏ trò?", type: 'axit' },
  { q: "Cái giá trò phải trả khi sống một cuộc đời 'an toàn' là gì?", type: 'axit' },
  { q: "Để không trở thành con người đó, trò phải từ bỏ căn tính cũ nào?", type: 'axit' },
  { q: "Trò đang 'trung thành' với kỳ vọng lỗi thời nào?", type: 'axit' },
  { q: "Giả sử sống cuộc đời mơ ước sau 3 năm, ngày thứ Ba đó ra sao?", type: 'light' },
  { q: "Tuyên ngôn: 'Tôi là kiểu người...'", type: 'light' },
  { q: "Lệnh thực thi: Kế hoạch 2-3 việc cho ngày mai (Mỗi việc 1 dòng).", type: 'action' }
];

const AuditOverlay = ({ onFinish }: { onFinish: () => void }) => {
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState("");

  const next = async () => {
    if (!ans.trim()) return;
    await db.masterDoc.add({ content: `Audit: ${ans}`, type: 'audit', timestamp: Date.now(), entropy: 1, status: 'active', priority: 'normal', quantity: 1, unit: 'lần', mood_score: 0, frequency: 'once' });

    if (AUDIT_QUESTIONS[step].type === 'action') {
      const tasks = ans.split('\n').filter(t => t.trim());
      for (const t of tasks) {
        await db.masterDoc.add({ content: t, type: 'task', status: 'active', priority: 'normal', quantity: 1, unit: 'lần', mood_score: 0, frequency: 'once', timestamp: Date.now(), entropy: 1 });
      }
      onFinish();
    } else {
      setStep(s => s + 1);
      setAns("");
    }
  };

  const current = AUDIT_QUESTIONS[step];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[100] p-10 flex flex-col transition-colors duration-1000 ${current.type === 'axit' ? 'bg-zinc-950 text-red-50/80' : 'bg-slate-900 text-blue-50'}`}
    >
      <div className="flex justify-between items-center mb-16">
        <span className="text-[10px] font-mono tracking-widest opacity-40 uppercase">Chặng: {current.type}</span>
        <span className="text-[10px] font-mono opacity-40">{step + 1}/{AUDIT_QUESTIONS.length}</span>
      </div>

      <h2 className="text-3xl font-light italic leading-relaxed mb-12">"{current.q}"</h2>

      <textarea 
        autoFocus value={ans} onChange={e => setAns(e.target.value)}
        className="flex-1 bg-transparent border-none focus:ring-0 text-2xl placeholder-white/5"
        placeholder="Sự thật là..."
      />

      <button onClick={next} className="mt-8 py-5 bg-white text-black rounded-full font-bold uppercase text-xs tracking-[0.3em]">
        Xác nhận ý chí
      </button>
    </motion.div>
  );
};

export default AuditOverlay;