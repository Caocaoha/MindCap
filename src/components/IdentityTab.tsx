import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Fingerprint, ChevronDown, PenTool } from 'lucide-react';
import { addXp } from '../utils/gamification';
import clsx from 'clsx';

const QUESTIONS = [
  "Tôi là ai khi không có danh vọng?",
  "Điều gì khiến tôi sợ hãi nhất lúc này?",
  "3 Giá trị cốt lõi mà tôi sẽ không bao giờ đánh đổi?",
  "Nếu ngày mai là ngày cuối, tôi sẽ hối tiếc điều gì?",
  "Sứ mệnh của tôi trong 5 năm tới là gì?"
];

export const IdentityTab = ({ onClose }: { onClose: () => void }) => {
  const [activeQ, setActiveQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(QUESTIONS.length).fill(""));
  const [isLocked, setIsLocked] = useState(false);
  const [warning, setWarning] = useState(false);
  
  const idleTimer = useRef<any>(null);
  const kickTimer = useRef<any>(null);

  const resetTimers = () => {
    if (isLocked) return;
    setWarning(false);
    clearTimeout(idleTimer.current);
    clearTimeout(kickTimer.current);
    idleTimer.current = setTimeout(() => setWarning(true), 15000);
    kickTimer.current = setTimeout(() => setIsLocked(true), 30000);
  };

  useEffect(() => {
    window.addEventListener('keydown', resetTimers);
    window.addEventListener('mousemove', resetTimers);
    window.addEventListener('touchstart', resetTimers);
    resetTimers();
    return () => {
      window.removeEventListener('keydown', resetTimers);
      window.removeEventListener('mousemove', resetTimers);
      window.removeEventListener('touchstart', resetTimers);
      clearTimeout(idleTimer.current);
      clearTimeout(kickTimer.current);
    };
  }, [isLocked]);

  const handleNext = async () => {
    await addXp('identity_fill'); 
    setActiveQ(prev => prev + 1);
  };

  // --- RENDERING ---
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[200] bg-slate-50 flex flex-col" // Z-Index 200
    >
      {isLocked ? (
        <div className="flex-1 bg-slate-900 text-white flex flex-col items-center justify-center p-10 text-center">
          <Lock size={64} className="mb-6 text-red-500 animate-pulse" />
          <h2 className="text-2xl font-bold mb-2">ĐÃ MẤT TẬP TRUNG</h2>
          <p className="text-slate-400 mb-8">Thánh đường chỉ dành cho sự tĩnh tại tuyệt đối.</p>
          <button onClick={onClose} className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold">Rời khỏi</button>
        </div>
      ) : (
        <>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-2 text-slate-800 font-bold uppercase tracking-widest text-xs"><Fingerprint size={18}/> Căn tính</div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><ChevronDown size={20} className="text-slate-400"/></button>
          </div>

          <AnimatePresence>{warning && (<motion.div initial={{ y: -50 }} animate={{ y: 0 }} className="absolute top-20 left-0 w-full bg-yellow-100 text-yellow-800 p-3 text-center text-xs font-bold border-y border-yellow-200 z-50">⚠️ Cảnh báo: Bạn đang mất tập trung.</motion.div>)}</AnimatePresence>

          <div className="flex-1 overflow-y-auto p-6 pb-32">
            <div className="space-y-4">
              {QUESTIONS.map((q, index) => (
                <div key={index} className={clsx("transition-all duration-500", index === activeQ ? "opacity-100" : "opacity-40 grayscale")}>
                  <div onClick={() => { if(index <= activeQ) setActiveQ(index); }} className={clsx("p-4 rounded-xl border flex items-center justify-between cursor-pointer", index === activeQ ? "bg-white border-slate-800 shadow-md" : "bg-slate-100 border-transparent")}>
                    <span className="font-bold text-sm text-slate-700">0{index + 1}. {q}</span>
                    {index === activeQ && <PenTool size={16} className="text-blue-500" />}
                  </div>
                  <AnimatePresence>
                    {index === activeQ && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <textarea 
                          className="w-full min-h-[150px] p-4 mt-2 bg-white border border-slate-200 rounded-xl text-slate-600 leading-relaxed focus:ring-2 focus:ring-slate-800 outline-none resize-none shadow-inner font-serif"
                          placeholder="Viết câu trả lời của bạn..."
                          value={answers[index]}
                          onChange={(e) => { const newAnswers = [...answers]; newAnswers[index] = e.target.value; setAnswers(newAnswers); }}
                        />
                        <div className="flex justify-end mt-2">
                          <button disabled={!answers[index].trim()} onClick={handleNext} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50">Tiếp tục</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};