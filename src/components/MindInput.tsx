import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Star, AlertTriangle, Flame, 
  Smile, Meh, Frown, Heart, 
  Send, Layers, XCircle, RotateCcw, Edit2, Minimize2 
} from 'lucide-react';
import { db, type Entry } from '../db';
import { addXp } from '../utils/gamification';
import { smartParser, type NlpResult } from '../utils/nlpParser';
import { echoEngine } from '../utils/echoEngine';
// XÓA: import { EditModal } from './EditModal'; (Đã chuyển lên App)
import clsx from 'clsx';

type SectorType = 'TASK_NORMAL' | 'TASK_IMPORTANT' | 'TASK_URGENT' | 'TASK_CRITICAL' | 
                  'MOOD_HAPPY' | 'MOOD_NEUTRAL' | 'MOOD_SAD' | null;

interface MindInputProps {
  onFocusChange?: (focused: boolean) => void;
  derivedEntry?: Entry | null;
  onClearDerived?: () => void;
  // Thay thế setAppEditingMode bằng onEdit trực tiếp
  onEdit?: (entry: Entry) => void;
  setAppEditingMode?: (isEditing: boolean) => void; // Vẫn giữ để tương thích nếu cần, nhưng logic chính giờ nằm ở App
}

// ActionToast nhận prop onEdit từ MindInput
const ActionToast = ({ message, type, nlpSummary, onUndo, onEdit, onClose }: any) => {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-32 inset-x-0 flex justify-center z-[200] pointer-events-none px-4">
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={clsx("pointer-events-auto p-2 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md pr-4 max-w-md w-auto min-w-[300px]", type === 'success' ? "bg-slate-900/95 text-white border-slate-700" : "bg-red-50 text-red-600 border-red-100")}>
        <div className={clsx("p-2 rounded-xl shrink-0", type === 'success' ? "bg-green-500/20 text-green-400" : "bg-red-100 text-red-500")}>{type === 'success' ? <CheckCircle2 size={20}/> : <XCircle size={20}/>}</div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-bold truncate">{message}</span>
          {nlpSummary && <span className="text-[10px] opacity-70 font-mono truncate">{nlpSummary}</span>}
        </div>
        <div className="flex items-center gap-1 ml-auto pl-3 border-l border-white/10 shrink-0">
          <button onClick={onEdit} className="p-2 hover:bg-white/10 rounded-lg text-blue-300"><Edit2 size={16} /></button>
          <button onClick={onUndo} className="flex items-center gap-1 px-3 py-2 hover:bg-white/10 rounded-lg text-amber-300 font-bold text-xs"><RotateCcw size={14} /> <span>Undo</span></button>
        </div>
      </motion.div>
    </div>
  );
};

export const MindInput = ({ onFocusChange, derivedEntry, onClearDerived, onEdit }: MindInputProps) => {
  const [input, setInput] = useState('');
  const [activeSector, setActiveSector] = useState<SectorType>(null);
  const [activeDragType, setActiveDragType] = useState<'TASK' | 'MOOD' | null>(null);
  const [nlpData, setNlpData] = useState<NlpResult | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [lastSaved, setLastSaved] = useState<any>(null);
  // XÓA: const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [moodLevel, setMoodLevel] = useState<0 | 1>(0);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const taskBtnRef = useRef<HTMLDivElement>(null);
  const moodBtnRef = useRef<HTMLDivElement>(null);
  
  const [railCoords, setRailCoords] = useState({ x: 0, y: 0 });

  const taskX = useMotionValue(0); const taskY = useMotionValue(0);
  const moodX = useMotionValue(0); const moodY = useMotionValue(0);

  useEffect(() => {
    // Logic Shortcuts... (Giữ nguyên)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Auto-focus check (bỏ check showEditModal vì modal giờ nằm ở App, khi modal mở thì input bị blur rồi)
      if (!isTyping && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Cần check thêm nếu đang có modal editing ở App thì không focus. 
        // Tuy nhiên do App set pointer-events-none cho Main chứa Input này nên cũng an toàn.
        inputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (input.trim()) executeSave('MOOD_NEUTRAL'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (input.trim()) executeSave('TASK_NORMAL'); }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [input, isTyping]);

  useEffect(() => { if (derivedEntry) { setInput(''); inputRef.current?.focus(); } }, [derivedEntry]);
  
  const handleFocus = () => { setIsTyping(true); onFocusChange?.(true); };
  const handleCollapse = () => { inputRef.current?.blur(); setIsTyping(false); onFocusChange?.(false); };
  
  useEffect(() => { const result = smartParser(input); setNlpData(result); }, [input]);
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setInput(e.target.value); if(toast) setToast(null); setIsTyping(e.target.value.length > 0); };

  const executeSave = async (targetSector: SectorType) => {
    // ... Logic Save giữ nguyên ...
    if (!input.trim() || !targetSector) return;
    const now = new Date();
    const finalNlp = nlpData || { quantity: 1, unit: 'lần', frequency: 'once', detected: false };
    const wordCount = input.trim().split(/\s+/).length;
    const nextReview = wordCount > 16 ? new Date(Date.now() + 10 * 60000) : undefined;

    try {
      let id; let type: 'task' | 'mood'; let moodScore = 0; let actionTypeForLog: any = 'thought_add';
      if (targetSector.startsWith('TASK')) {
        type = 'task'; actionTypeForLog = 'task_create';
        const priorityMap: Record<string, string> = { 'TASK_NORMAL': 'normal', 'TASK_IMPORTANT': 'important', 'TASK_URGENT': 'urgent', 'TASK_CRITICAL': 'critical' };
        id = await db.entries.add({ 
          content: input, type: 'task', status: 'active', isFocus: false, createdAt: now, updatedAt: now,
          priority: priorityMap[targetSector] as any || 'normal', quantity: finalNlp.quantity || 1, unit: finalNlp.unit || 'lần', 
          frequency: (finalNlp.frequency as any) || 'once', is_nlp_hidden: false, mood_score: 0, progress: 0, isBookmarked: false,
          nextReviewAt: nextReview, metadata: { reviewCount: 0 }
        });
      } else {
        type = 'mood'; actionTypeForLog = 'thought_add';
        if (targetSector.includes('HAPPY')) moodScore = 1 + moodLevel;
        if (targetSector.includes('SAD')) moodScore = -(1 + moodLevel);
        id = await db.entries.add({ 
          content: input, type: 'mood', status: 'active', isFocus: false, createdAt: now, updatedAt: now,
          mood_score: moodScore, quantity: 1, unit: 'lần', frequency: 'once', is_nlp_hidden: true, priority: 'normal', progress: 0, isBookmarked: false,
          nextReviewAt: nextReview, metadata: { reviewCount: 0 }
        });
        if (type === 'mood' && moodScore !== 0) await addXp('mood_log');
      }
      if (derivedEntry?.id) { await db.echo_links.add({ sourceId: derivedEntry.id, targetId: id as number, type: 'structural', strength: 3, createdAt: new Date() }); onClearDerived?.(); }
      
      const newEntryFull = await db.entries.get(id as number);
      if (newEntryFull) echoEngine.processEntry(newEntryFull).catch(err => console.error(err));
      
      if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
      await addXp(actionTypeForLog);
      
      setLastSaved({ id, content: input, type, mood_score: moodScore, ...finalNlp });
      setToast({ msg: type === 'task' ? 'Đã lưu Task' : 'Đã lưu Mood', type: 'success' });
      
      setInput(''); setActiveSector(null); setActiveDragType(null); setMoodLevel(0);
      taskX.set(0); taskY.set(0); moodX.set(0); moodY.set(0);
      handleCollapse();
    } catch (err: any) { setToast({ msg: `Lỗi: ${err.message}`, type: 'error' }); }
  };

  const handleDragStart = (type: 'TASK' | 'MOOD') => {
    const btnRef = type === 'TASK' ? taskBtnRef.current : moodBtnRef.current;
    if (btnRef) {
      const rect = btnRef.getBoundingClientRect();
      setRailCoords({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    setActiveDragType(type);
    if(navigator.vibrate) navigator.vibrate(10);
  };

  const handleDrag = (info: any, type: 'TASK' | 'MOOD') => {
    const { x, y } = info.offset; const d = Math.sqrt(x*x+y*y); const a = Math.atan2(y, x) * (180/Math.PI);
    if(type==='TASK') {
      if(d<40) {setActiveSector(null); return;}
      if(a>-165&&a<-105) setActiveSector('TASK_NORMAL'); else if(a>-75&&a<-15) setActiveSector('TASK_URGENT');
      else if(a>105&&a<165) setActiveSector('TASK_IMPORTANT'); else if(a>15&&a<75) setActiveSector('TASK_CRITICAL');
    } else {
      const l=d>100?1:0; if(l!==moodLevel&&d>50){ if(navigator.vibrate) navigator.vibrate(10); setMoodLevel(l as any);}
      if(d<40){setActiveSector(null);return;}
      if(a>-130&&a<-50) setActiveSector('MOOD_HAPPY'); else if(a>50&&a<130) setActiveSector('MOOD_SAD');
      else if(Math.abs(a)>150) setActiveSector('MOOD_NEUTRAL'); else setActiveSector(null);
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-start min-h-[400px]">
      <AnimatePresence>
        {toast && (
          <ActionToast 
            message={toast.msg} 
            type={toast.type} 
            onUndo={async () => { if(!lastSaved?.id) return; await db.entries.delete(lastSaved.id); setInput(lastSaved.content); setToast({ msg: 'Đã hoàn tác!', type: 'success' }); }} 
            onEdit={() => {
              // GỌI HÀM CỦA APP ĐỂ MỞ MODAL
              if (lastSaved && onEdit) onEdit(lastSaved);
            }} 
            onClose={()=>setToast(null)} 
          />
        )}
      </AnimatePresence>
      
      {/* XÓA: {showEditModal && lastSaved && ...} */}

      {/* --- TEXTAREA CARD --- */}
      <motion.div 
        animate={{ opacity: activeDragType ? 0.1 : 1, scale: activeDragType ? 0.95 : 1, filter: activeDragType ? "blur(4px)" : "blur(0px)" }} 
        className={clsx("w-full max-w-sm h-48 bg-white rounded-3xl border border-slate-100 p-6 flex flex-col items-center justify-center relative transition-all duration-300 shadow-sm mb-2", activeDragType ? "z-0" : "z-20")}
      >
        <textarea ref={inputRef} value={input} onFocus={handleFocus} onChange={handleInputChange} placeholder="Ghi lại suy nghĩ..." className="w-full h-full bg-transparent text-slate-700 resize-none outline-none text-center text-xl font-medium placeholder-slate-200" />
        <AnimatePresence>{isTyping && (<motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={handleCollapse} className="absolute -top-3 -right-3 w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg z-50"><Minimize2 size={16} /></motion.button>)}</AnimatePresence>
        <AnimatePresence>{derivedEntry && (<motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg whitespace-nowrap">🔗 Phái sinh</motion.div>)}</AnimatePresence>
      </motion.div>

      {/* --- CONTROLS CONTAINER --- */}
      <AnimatePresence>
        {input.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-sm h-24 relative z-10" >
            {/* ... Giữ nguyên phần nút Task/Mood ... */}
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
              <motion.div ref={taskBtnRef} drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={1} onDragStart={() => handleDragStart('TASK')} onDrag={(_, info) => handleDrag(info, 'TASK')} onDragEnd={() => { if(activeSector) executeSave(activeSector); setActiveDragType(null); setActiveSector(null); }} style={{ x: taskX, y: taskY }} animate={{ opacity: activeDragType === 'MOOD' ? 0.3 : 1 }} className="p-5 rounded-full bg-white border-2 border-slate-100 shadow-xl cursor-grab active:cursor-grabbing relative z-50">
                <Layers size={32} className={activeDragType === 'TASK' ? "text-blue-600" : "text-slate-400"} />
              </motion.div>
              <span className="text-[9px] font-black uppercase text-slate-300 mt-2 tracking-widest">Lưu Task</span>
            </div>
            <div className="absolute right-6 flex flex-col items-center">
              <motion.div ref={moodBtnRef} drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={1} onDragStart={() => handleDragStart('MOOD')} onDrag={(_, info) => handleDrag(info, 'MOOD')} onDragEnd={() => { if(activeSector) executeSave(activeSector); setActiveDragType(null); setActiveSector(null); setMoodLevel(0); }} style={{ x: moodX, y: moodY }} animate={{ opacity: activeDragType === 'TASK' ? 0.3 : 1 }} className="p-4 rounded-full bg-blue-600 border-2 border-blue-500 shadow-xl cursor-grab active:cursor-grabbing relative z-50">
                <Send size={24} className="text-white" />
              </motion.div>
              <span className="text-[9px] font-black uppercase text-slate-300 mt-3 tracking-widest">Mood</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- RAILS OVERLAY --- */}
      {/* ... Giữ nguyên phần Rail ... */}
      <AnimatePresence>
        {activeDragType && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] pointer-events-none">
            <div style={{ position: 'absolute', left: railCoords.x, top: railCoords.y, transform: 'translate(-50%, -50%)' }}>
               {activeDragType === 'TASK' ? (
                  <div className="w-[300px] h-[300px] flex items-center justify-center">
                     <svg className="absolute inset-0 w-full h-full opacity-30 text-slate-400"><line x1="20%" y1="20%" x2="80%" y2="80%" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" /><line x1="80%" y1="20%" x2="20%" y2="80%" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" /></svg>
                     <div className="absolute top-0 left-0"><TargetIcon sector="TASK_NORMAL" icon={CheckCircle2} label="Thường" active={activeSector} color="text-blue-600" /></div>
                     <div className="absolute top-0 right-0"><TargetIcon sector="TASK_URGENT" icon={AlertTriangle} label="Gấp" active={activeSector} color="text-orange-500" /></div>
                     <div className="absolute bottom-0 left-0"><TargetIcon sector="TASK_IMPORTANT" icon={Star} label="Cần" active={activeSector} color="text-amber-500" /></div>
                     <div className="absolute bottom-0 right-0"><TargetIcon sector="TASK_CRITICAL" icon={Flame} label="Cháy" active={activeSector} color="text-red-500" /></div>
                  </div>
               ) : (
                  <div className="w-[280px] h-[280px] flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20 border-r-4 border-b-4 border-slate-400 border-dashed rounded-full translate-x-1/2" />
                    <DynamicTargetIcon sector="MOOD_HAPPY" icon={moodLevel > 0 ? Heart : Smile} label={moodLevel > 0 ? "Tuyệt" : "Vui"} x="50%" y="10%" active={activeSector} color="text-green-500" scale={moodLevel > 0 ? 1.5 : 1.3} />
                    <DynamicTargetIcon sector="MOOD_SAD" icon={moodLevel > 0 ? AlertTriangle : Frown} label={moodLevel > 0 ? "Tệ" : "Buồn"} x="50%" y="90%" active={activeSector} color="text-slate-500" scale={moodLevel > 0 ? 1.5 : 1.3} />
                    <DynamicTargetIcon sector="MOOD_NEUTRAL" icon={Meh} label="Lưu" x="10%" y="50%" active={activeSector} color="text-purple-500" />
                  </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ... Sub-components TargetIcon/DynamicTargetIcon giữ nguyên
const TargetIcon = ({ sector, icon: Icon, label, active, color }: any) => { 
  const isTarget = active === sector; 
  return (
    <motion.div animate={{ scale: isTarget ? 1.3 : 1 }} className="flex flex-col items-center justify-center w-20 h-20 relative">
      <div className={clsx("w-14 h-14 rounded-2xl border-2 flex items-center justify-center bg-white shadow-sm transition-colors", isTarget ? "border-current" : "border-slate-100 opacity-40", isTarget && color)}>
        <Icon size={28} className={isTarget ? color : "text-slate-400"} strokeWidth={3} />
      </div>
      <span className={clsx("text-[10px] font-black uppercase mt-1 px-1 rounded shadow-sm", isTarget ? "bg-slate-900 text-white" : "text-slate-300")}>{label}</span>
    </motion.div>
  ); 
};

const DynamicTargetIcon = ({ sector, icon: Icon, label, x, y, active, color, scale }: any) => { 
  const isTarget = active === sector; 
  return (
    <motion.div animate={{ scale: isTarget ? scale : 1 }} className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y, width: 80, height: 80 }}>
      <div className={clsx("p-4 rounded-3xl border-2 bg-white shadow-md transition-all", isTarget ? "border-current z-50 shadow-xl" : "border-slate-100 opacity-40", isTarget && color)}>
        <Icon size={28} className={isTarget ? color : "text-slate-400"} strokeWidth={3} />
      </div>
      <span className={clsx("text-[10px] font-black uppercase mt-1 px-1 rounded shadow-sm", isTarget ? "bg-slate-900 text-white" : "text-slate-300")}>{label}</span>
    </motion.div>
  ); 
};