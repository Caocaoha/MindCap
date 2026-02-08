import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Star, AlertTriangle, Flame, 
  Smile, Meh, Frown, Heart, 
  Send, Layers, XCircle, RotateCcw, Edit2, Minimize2 
} from 'lucide-react';
import { db, type Entry } from '../db'; // Import Entry type
import { addXp } from '../utils/gamification';
import { smartParser, type NlpResult } from '../utils/nlpParser';
import { echoEngine } from '../utils/echoEngine'; // Import Echo Engine
import { EditModal } from './EditModal';
import clsx from 'clsx';

type SectorType = 'TASK_NORMAL' | 'TASK_IMPORTANT' | 'TASK_URGENT' | 'TASK_CRITICAL' | 
                  'MOOD_HAPPY' | 'MOOD_NEUTRAL' | 'MOOD_SAD' | null;

// --- ACTION TOAST (FIXED CENTER) ---
const ActionToast = ({ message, type, nlpSummary, onUndo, onEdit, onClose }: any) => {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  
  return (
    // FIX: Container full-width (inset-x-0) + flex justify-center để căn giữa tuyệt đối
    <div className="fixed bottom-40 inset-x-0 flex justify-center z-[120] pointer-events-none px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.9 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.9 }} 
        className={clsx(
          "pointer-events-auto p-2 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md pr-4 max-w-md w-auto min-w-[300px]", 
          type === 'success' ? "bg-slate-900/95 text-white border-slate-700" : "bg-red-50 text-red-600 border-red-100"
        )}
      >
        <div className={clsx("p-2 rounded-xl shrink-0", type === 'success' ? "bg-green-500/20 text-green-400" : "bg-red-100 text-red-500")}>
          {type === 'success' ? <CheckCircle2 size={20}/> : <XCircle size={20}/>}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-bold truncate">{message}</span>
          {nlpSummary && <span className="text-[10px] opacity-70 font-mono truncate">{nlpSummary}</span>}
        </div>
        {type === 'success' && (
          <div className="flex items-center gap-1 ml-auto pl-3 border-l border-white/10 shrink-0">
            <button onClick={onEdit} className="p-2 hover:bg-white/10 rounded-lg text-blue-300"><Edit2 size={16} /></button>
            <button onClick={onUndo} className="flex items-center gap-1 px-3 py-2 hover:bg-white/10 rounded-lg text-amber-300 font-bold text-xs"><RotateCcw size={14} /> <span>Undo</span></button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// --- MAIN COMPONENT ---
interface MindInputProps {
  onFocusChange?: (focused: boolean) => void;
  derivedEntry?: Entry | null;      // Entry gốc để phái sinh (nếu có)
  onClearDerived?: () => void;      // Hàm xóa state gốc sau khi lưu
}

export const MindInput = ({ onFocusChange, derivedEntry, onClearDerived }: MindInputProps) => {
  const [input, setInput] = useState('');
  const [activeSector, setActiveSector] = useState<SectorType>(null);
  const [activeRail, setActiveRail] = useState<'TASK' | 'MOOD' | null>(null);
  const [nlpData, setNlpData] = useState<NlpResult | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [lastSaved, setLastSaved] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [moodLevel, setMoodLevel] = useState<0 | 1>(0);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const taskX = useMotionValue(0); const taskY = useMotionValue(0);
  const moodX = useMotionValue(0); const moodY = useMotionValue(0);

  // --- SHORTCUTS ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!isTyping && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        inputRef.current?.focus();
        setIsKeyboardActive(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (input.trim()) executeSave('MOOD_NEUTRAL'); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === 't')) { e.preventDefault(); if (input.trim()) executeSave('TASK_NORMAL'); }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [input, isTyping]);

  const handleFocus = () => { setIsTyping(true); setIsKeyboardActive(true); onFocusChange?.(true); };
  const handleCollapse = () => { inputRef.current?.blur(); setIsTyping(false); setIsKeyboardActive(false); onFocusChange?.(false); };
  const handleDragEnd = (_: any, info: any) => { if (info.offset.y > 50) handleCollapse(); };

  useEffect(() => { const result = smartParser(input); setNlpData(result); }, [input]);
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setInput(e.target.value); if(toast) setToast(null); };

  const triggerHaptic = (pattern: 'light' | 'medium' | 'success') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (pattern === 'light') navigator.vibrate(10);
      if (pattern === 'medium') navigator.vibrate(30);
      if (pattern === 'success') navigator.vibrate([10, 30, 10]);
    }
  };

  const executeSave = async (targetSector: SectorType) => {
    if (!input.trim() || !targetSector) return;
    const now = new Date();
    const finalNlp = nlpData || { quantity: 1, unit: 'lần', frequency: 'once', detected: false };
    
    try {
      let id; let type: 'task' | 'mood'; let moodScore = 0;
      let actionTypeForLog: any = 'thought_add';

      if (targetSector.startsWith('TASK')) {
        type = 'task';
        actionTypeForLog = 'task_create'; // [cite: 71]
        const priorityMap: Record<string, string> = { 'TASK_NORMAL': 'normal', 'TASK_IMPORTANT': 'important', 'TASK_URGENT': 'urgent', 'TASK_CRITICAL': 'critical' };
        
        id = await db.entries.add({ 
          content: input, type: 'task', status: 'active', isFocus: false, createdAt: now, updatedAt: now,
          priority: priorityMap[targetSector] as any || 'normal', 
          quantity: finalNlp.quantity || 1, unit: finalNlp.unit || 'lần', 
          frequency: (finalNlp.frequency as any) || 'once', frequency_detail: finalNlp.frequency_detail || '', 
          is_nlp_hidden: false, mood_score: 0, progress: 0, isBookmarked: false 
        });
      } else {
        type = 'mood';
        actionTypeForLog = 'thought_add'; // [cite: 78]
        if (targetSector.includes('HAPPY')) moodScore = 1 + moodLevel;
        if (targetSector.includes('SAD')) moodScore = -(1 + moodLevel);
        if (targetSector.includes('NEUTRAL')) moodScore = 0;
        
        id = await db.entries.add({ 
          content: input, type: 'mood', status: 'active', isFocus: false, createdAt: now, updatedAt: now,
          mood_score: moodScore, quantity: 1, unit: 'lần', frequency: 'once', is_nlp_hidden: true, priority: 'normal', progress: 0, isBookmarked: false 
        });
        
        if (type === 'mood' && moodScore !== 0) {
           await addXp('mood_log'); // Log thêm điểm mood [cite: 81]
        }
      }
      
      // --- INTEGRATION: ECHO ENGINE & DERIVATION ---
      
      // 1. Explicit Link (Phái sinh) 
      if (derivedEntry?.id) {
        await db.echo_links.add({
          sourceId: derivedEntry.id, 
          targetId: id as number,    
          type: 'structural',       
          strength: 3,               // x3 CPI
          createdAt: new Date()
        });
        console.log("🔗 Created Explicit Link (x3 CPI)");
        onClearDerived?.(); // Reset state phái sinh
      }

      // 2. Implicit/Semantic Link (Chạy ngầm)
      const newEntryFull = await db.entries.get(id as number);
      if (newEntryFull) {
         echoEngine.processEntry(newEntryFull).catch(err => console.error("Echo Error:", err));
      }
      // ---------------------------------------------

      triggerHaptic('success');
      await addXp(actionTypeForLog); // Log điểm Gamification
      
      setLastSaved({ id, content: input, type, mood_score: moodScore, ...finalNlp });
      setToast({ msg: type === 'task' ? 'Đã lưu Task' : 'Đã lưu Mood', type: 'success' });
      
      setInput(''); setActiveSector(null); setActiveRail(null); setMoodLevel(0);
      taskX.set(0); taskY.set(0); moodX.set(0); moodY.set(0);
      
      if (!isKeyboardActive) handleCollapse(); 
      else { setIsKeyboardActive(false); setTimeout(() => setIsKeyboardActive(true), 150); }
    } catch (err: any) { setToast({ msg: `Lỗi: ${err.message}`, type: 'error' }); }
  };

  const handleEditSave = () => { setToast({ msg: 'Đã cập nhật!', type: 'success' }); setShowEditModal(false); setLastSaved(null); };
  const handleUndo = async () => { if(!lastSaved?.id) return; try { await db.entries.delete(lastSaved.id); setInput(lastSaved.content); setToast({ msg: 'Đã hoàn tác!', type: 'success' }); setLastSaved(null); inputRef.current?.focus(); } catch (e) { console.error(e); } };
  
  const handleDrag = (info: any, type: 'TASK' | 'MOOD') => {
    const { x, y } = info.offset; const d = Math.sqrt(x*x+y*y); const a = Math.atan2(y, x) * (180/Math.PI);
    if(type==='TASK') { if(d<40) {setActiveSector(null);return;} if(a>-165&&a<-105) setActiveSector('TASK_NORMAL'); else if(a>-75&&a<-15) setActiveSector('TASK_URGENT'); else if(a>105&&a<165) setActiveSector('TASK_IMPORTANT'); else if(a>15&&a<75) setActiveSector('TASK_CRITICAL'); }
    if(type==='MOOD') { const l=d>100?1:0; if(l!==moodLevel&&d>50){triggerHaptic(l===1?'medium':'light');setMoodLevel(l as any);} if(d<40){setActiveSector(null);return;} if(a>-130&&a<-50) setActiveSector('MOOD_HAPPY'); else if(a>50&&a<130) setActiveSector('MOOD_SAD'); else if(Math.abs(a)>150) setActiveSector('MOOD_NEUTRAL'); else setActiveSector(null); }
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center min-h-[500px] overflow-hidden">
      <AnimatePresence>{toast && <ActionToast message={toast.msg} type={toast.type} onUndo={handleUndo} onEdit={()=>setShowEditModal(true)} onClose={()=>setToast(null)} />}</AnimatePresence>
      {showEditModal && lastSaved && <EditModal entry={lastSaved} onClose={()=>setShowEditModal(false)} onSave={handleEditSave} />}
      
      {/* HIỂN THỊ TRẠNG THÁI PHÁI SINH (Nếu có) */}
      <AnimatePresence>
        {derivedEntry && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className="absolute top-24 z-20 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm border border-blue-100 max-w-[80%]"
          >
            <span className="truncate max-w-[150px]">Từ: "{derivedEntry.content}"</span>
            <button onClick={onClearDerived} className="p-1 hover:bg-blue-100 rounded-full"><XCircle size={14}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INPUT CARD */}
      <motion.div 
        drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ bottom: 0.2, top: 0 }} onDragEnd={handleDragEnd}
        animate={{ opacity: activeRail ? 0.2 : 1, scale: activeRail ? 0.95 : 1, filter: activeRail ? "blur(3px)" : "blur(0px)", boxShadow: isKeyboardActive ? "0 0 0 4px rgba(59, 130, 246, 0.4)" : (isTyping ? "0 0 0 4px rgba(59, 130, 246, 0.2)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)"), borderColor: (isTyping || isKeyboardActive) ? "#3B82F6" : "#E2E8F0" }} 
        className="z-10 w-72 h-44 bg-white rounded-xl border p-6 flex flex-col items-center justify-center relative transition-all duration-300 touch-pan-y"
      >
        <textarea ref={inputRef} value={input} onFocus={handleFocus} onChange={handleInputChange} placeholder="Nhập nội dung..." className="w-full h-full bg-transparent text-slate-700 resize-none outline-none text-center text-lg font-normal z-10 placeholder-slate-400" />
        <AnimatePresence>{isTyping && (<motion.button initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} onClick={handleCollapse} className="absolute -top-3 -right-3 w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg z-50 hover:bg-slate-700 active:scale-90" title="Thoát nhập liệu"><Minimize2 size={16} /></motion.button>)}</AnimatePresence>
        <AnimatePresence>{nlpData?.detected && !activeRail && (<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute bottom-2 bg-blue-50 border border-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold flex gap-2 items-center shadow-sm z-20"><span>⚡ {nlpData.quantity} {nlpData.unit}</span></motion.div>)}</AnimatePresence>
      </motion.div>

      {/* RAILS CONTAINER */}
      <div className="w-full max-w-[500px] flex items-center mt-20 px-10 relative z-30">
        
        {/* TASK RAIL (FIXED SQUARE LAYOUT) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center">
          <AnimatePresence>
            {activeRail === 'TASK' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-[280px] h-[280px]">
                {/* SVG Guidelines */}
                <svg className="absolute inset-0 w-full h-full opacity-30"><line x1="20%" y1="20%" x2="80%" y2="80%" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" /><line x1="80%" y1="20%" x2="20%" y2="80%" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" /></svg>
                {/* Fixed Corner Buttons */}
                <div className="absolute top-0 left-0"><TargetIcon sector="TASK_NORMAL" icon={CheckCircle2} label="Thường" active={activeSector} color="text-blue-600" /></div>
                <div className="absolute top-0 right-0"><TargetIcon sector="TASK_URGENT" icon={AlertTriangle} label="Gấp" active={activeSector} color="text-orange-500" /></div>
                <div className="absolute bottom-0 left-0"><TargetIcon sector="TASK_IMPORTANT" icon={Star} label="Cần" active={activeSector} color="text-amber-500" /></div>
                <div className="absolute bottom-0 right-0"><TargetIcon sector="TASK_CRITICAL" icon={Flame} label="Cháy" active={activeSector} color="text-red-500" /></div>
              </div>
            )}
          </AnimatePresence>
          <motion.div drag={input.trim().length > 0} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={1} onDragStart={() => setActiveRail('TASK')} onDrag={(_, info) => handleDrag(info, 'TASK')} onDragEnd={() => activeSector ? executeSave(activeSector) : (setActiveRail(null), setActiveSector(null))} style={{ x: taskX, y: taskY, zIndex: activeRail === 'TASK' ? 50 : 20 }} className={clsx("p-4 rounded-full border-2 transition-all cursor-grab active:cursor-grabbing shadow-sm", input.length === 0 ? "opacity-20" : "bg-white border-slate-200")}><Layers size={24} className={activeRail === 'TASK' ? "text-slate-900" : "text-slate-400"} /><AnimatePresence>{activeRail === 'TASK' && nlpData?.detected && (<motion.div initial={{ opacity: 0, scale: 0.5, y: 0 }} animate={{ opacity: 1, scale: 1, y: -50 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] whitespace-nowrap px-2 py-1 rounded-md font-bold shadow-lg pointer-events-none z-[60]">{nlpData.quantity} {nlpData.unit} | {nlpData.frequency === 'daily' ? 'Hàng ngày' : nlpData.frequency}</motion.div>)}</AnimatePresence></motion.div><span className="text-[10px] font-bold mt-2 text-slate-400 uppercase">Task</span>
        </div>

        {/* MOOD RAIL (KEEP DYNAMIC) */}
        <div className="absolute right-6 flex flex-col items-center">
          <AnimatePresence>
            {activeRail === 'MOOD' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="absolute w-[180px] h-[180px] opacity-30 -translate-x-1/2 -translate-y-1/2"><div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-slate-400 border-l border-dashed -translate-x-1/2" /><div className="absolute top-1/2 left-0 w-1/2 h-[2px] bg-slate-400 border-t border-dashed -translate-y-1/2" /></div>
                <DynamicTargetIcon sector="MOOD_HAPPY" icon={moodLevel > 0 ? Heart : Smile} label={moodLevel > 0 ? "Tuyệt" : "Vui"} x={0} y={-90} active={activeSector} color="text-green-500" scale={moodLevel > 0 ? 1.5 : 1.3} />
                <DynamicTargetIcon sector="MOOD_SAD" icon={moodLevel > 0 ? AlertTriangle : Frown} label={moodLevel > 0 ? "Tệ" : "Buồn"} x={0} y={90} active={activeSector} color="text-slate-500" scale={moodLevel > 0 ? 1.5 : 1.3} />
                <DynamicTargetIcon sector="MOOD_NEUTRAL" icon={Meh} label="Lưu" x={-90} y={0} active={activeSector} color="text-purple-500" />
              </div>
            )}
          </AnimatePresence>
          <motion.div drag={input.trim().length > 0} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={1} onDragStart={() => setActiveRail('MOOD')} onDrag={(_, info) => handleDrag(info, 'MOOD')} onDragEnd={() => activeSector ? executeSave(activeSector) : (setActiveRail(null), setActiveSector(null), setMoodLevel(0))} style={{ x: moodX, y: moodY, zIndex: activeRail === 'MOOD' ? 50 : 20 }} className={clsx("p-4 rounded-full border-2 transition-all cursor-grab active:cursor-grabbing shadow-lg z-50", input.length === 0 ? "opacity-20" : "bg-[#2563EB] border-[#2563EB]")}><Send size={24} className="text-white" /></motion.div><span className="text-[10px] font-bold mt-2 text-slate-400 uppercase tracking-tighter">Mood</span>
        </div>
      </div>
    </div>
  );
};

// --- FIXED TARGET ICON COMPONENT (LABEL OVERLAY) ---
const TargetIcon = ({ sector, icon: Icon, label, active, color }: any) => { 
  const isTarget = active === sector; 
  return (
    <motion.div animate={{ scale: isTarget ? 1.2 : 1 }} className="flex flex-col items-center justify-center w-[60px] h-[60px] relative">
      <div className={clsx("w-12 h-12 rounded-xl border flex items-center justify-center transition-all shadow-sm bg-white shrink-0 z-10", isTarget ? "border-slate-400 ring-4 ring-blue-50 shadow-md" : "border-slate-100 opacity-80")}>
        <Icon size={24} className={isTarget ? color : "text-slate-300"} strokeWidth={2.5} />
      </div>
      <div className="absolute -bottom-4 z-20">
         <span className={clsx("text-[10px] font-black uppercase tracking-tighter text-center px-1 py-0.5 rounded bg-white/80 backdrop-blur-sm", isTarget ? "text-slate-900 shadow-sm" : "text-slate-300")}>{label}</span>
      </div>
    </motion.div>
  ); 
};

// Dynamic Icon (cho Mood)
const DynamicTargetIcon = ({ sector, icon: Icon, label, x, y, active, color, scale }: any) => { 
  const isTarget = active === sector; 
  return (
    <motion.div animate={{ scale: isTarget ? scale : 1 }} className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y, width: 60, height: 60 }}>
      <div className={clsx("p-2 rounded-xl border transition-all shadow-sm shrink-0 bg-white", isTarget ? "border-slate-400 ring-4 ring-blue-50 z-50 shadow-md" : "border-slate-100 opacity-60")}>
        <motion.div key={label} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Icon size={22} className={isTarget ? color : "text-slate-300"} strokeWidth={2.5} />
        </motion.div>
      </div>
      <span className={clsx("text-[9px] mt-1 font-black uppercase text-center leading-none", isTarget ? "text-slate-900" : "text-slate-300")}>{label}</span>
    </motion.div>
  ); 
};