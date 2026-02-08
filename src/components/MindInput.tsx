// ... (Các import giữ nguyên)
import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Star, AlertTriangle, Flame, 
  Smile, Meh, Frown, Heart, 
  Send, Layers, XCircle, RotateCcw, Edit2, X, Minimize2 
} from 'lucide-react';
import { db } from '../db';
import { addXp } from '../utils/gamification';
import { smartParser, type NlpResult } from '../utils/nlpParser';
import clsx from 'clsx';

type SectorType = 'TASK_NORMAL' | 'TASK_IMPORTANT' | 'TASK_URGENT' | 'TASK_CRITICAL' | 
                  'MOOD_HAPPY' | 'MOOD_NEUTRAL' | 'MOOD_SAD' | null;

// --- EDIT MODAL (Giữ nguyên như phần trước) ---
const EditModal = ({ entry, onClose, onSave }: any) => {
  // ... (Code cũ của EditModal giữ nguyên không đổi)
  const [content, setContent] = useState(entry.content);
  const [qty, setQty] = useState(entry.quantity || 1);
  const [unit, setUnit] = useState(entry.unit || 'lần');
  const [freq, setFreq] = useState(entry.frequency || 'once');
  const [freqDetail, setFreqDetail] = useState(entry.frequency_detail || '');
  const [moodScore, setMoodScore] = useState(entry.mood_score || 0);

  const toggleDetail = (item: string) => {
    let items = freqDetail ? freqDetail.split(',').filter(Boolean) : [];
    if (items.includes(item)) items = items.filter((i:string) => i !== item); else items.push(item);
    if (freq === 'weekly') items.sort((a:string,b:string) => ['T2','T3','T4','T5','T6','T7','CN'].indexOf(a) - ['T2','T3','T4','T5','T6','T7','CN'].indexOf(b));
    else items.sort((a:string,b:string) => parseInt(a) - parseInt(b));
    setFreqDetail(items.join(','));
  };

  const handleSave = () => { 
    if (entry.type === 'task') {
      onSave({ content, quantity: Number(qty), unit, frequency: freq, frequency_detail: freqDetail }); 
    } else { 
      onSave({ content, mood_score: moodScore }); 
    } 
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h3 className="font-bold text-lg">{entry.type==='task'?'✏️ Sửa Task':'🎭 Sửa Mood'}</h3><button onClick={onClose}><X size={20}/></button></div>
        <div className="p-6 space-y-5 overflow-y-auto">
          <div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Nội dung</label><textarea value={content} onChange={e=>setContent(e.target.value)} className="w-full p-4 border rounded-2xl bg-slate-50 h-24"/></div>
          {entry.type === 'task' && (<><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Số lượng</label><input type="number" value={qty} onChange={e=>setQty(Number(e.target.value))} className="w-full p-3 border rounded-xl text-center font-bold"/></div><div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Đơn vị</label><input type="text" value={unit} onChange={e=>setUnit(e.target.value)} className="w-full p-3 border rounded-xl text-center"/></div></div><div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Tần suất</label><select value={freq} onChange={e=>{setFreq(e.target.value);setFreqDetail('')}} className="w-full p-3 border rounded-xl"><option value="once">Một lần</option><option value="daily">Hàng ngày</option><option value="weekly">Hàng tuần</option><option value="monthly">Hàng tháng</option></select></div>{freq === 'weekly' && (<div className="bg-slate-50 p-4 rounded-xl border"><span className="text-xs text-slate-500 block mb-3">Chọn thứ:</span><div className="flex justify-between gap-1">{['T2','T3','T4','T5','T6','T7','CN'].map(d=><button key={d} onClick={()=>toggleDetail(d)} className={clsx("w-9 h-9 rounded-lg text-[10px] font-bold",freqDetail.includes(d)?"bg-blue-600 text-white":"bg-white border")}>{d}</button>)}</div></div>)}{freq === 'monthly' && (<div className="bg-slate-50 p-4 rounded-xl border"><span className="text-xs text-slate-500 block mb-3">Chọn ngày:</span><div className="grid grid-cols-7 gap-2">{Array.from({length:31},(_,i)=>(i+1).toString()).map(d=><button key={d} onClick={()=>toggleDetail(d)} className={clsx("w-8 h-8 rounded-lg text-[10px] font-bold",freqDetail.split(',').includes(d)?"bg-blue-600 text-white":"bg-white border")}>{d}</button>)}</div></div>)}</>)}
          {entry.type === 'mood' && (<div><label className="text-xs font-bold text-slate-400 uppercase block text-center mb-3">Cảm xúc</label><div className="flex justify-center gap-4"><button onClick={()=>setMoodScore(-2)} className={clsx("w-20 h-20 rounded-2xl border-2 flex items-center justify-center",moodScore<0?"bg-slate-100 border-slate-500":"border-slate-100")}><Frown size={32}/></button><button onClick={()=>setMoodScore(0)} className={clsx("w-20 h-20 rounded-2xl border-2 flex items-center justify-center",moodScore===0?"bg-purple-50 border-purple-500":"border-slate-100")}><Meh size={32}/></button><button onClick={()=>setMoodScore(2)} className={clsx("w-20 h-20 rounded-2xl border-2 flex items-center justify-center",moodScore>0?"bg-green-50 border-green-500":"border-slate-100")}><Smile size={32}/></button></div></div>)}
        </div>
        <div className="p-4 border-t bg-slate-50"><button onClick={handleSave} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold">Lưu thay đổi</button></div>
      </motion.div>
    </div>
  );
};

// --- ACTION TOAST (UPDATE POSITION) ---
const ActionToast = ({ message, type, nlpSummary, onUndo, onEdit, onClose }: any) => {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      // FIX: bottom-36 (khoảng 144px), nằm trên CmeToast, căn giữa
      className={clsx("fixed bottom-36 left-1/2 -translate-x-1/2 p-2 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] border backdrop-blur-md pr-4 max-w-[90vw] min-w-[280px]", type === 'success' ? "bg-slate-900/95 text-white border-slate-700" : "bg-red-50 text-red-600 border-red-100")}
    >
      <div className={clsx("p-2 rounded-xl", type === 'success' ? "bg-green-500/20 text-green-400" : "bg-red-100 text-red-500")}>{type === 'success' ? <CheckCircle2 size={20}/> : <XCircle size={20}/>}</div>
      <div className="flex flex-col min-w-0 flex-1"><span className="text-sm font-bold truncate">{message}</span>{nlpSummary && <span className="text-[10px] opacity-70 font-mono truncate">{nlpSummary}</span>}</div>
      {type === 'success' && (<div className="flex items-center gap-1 ml-auto pl-3 border-l border-white/10"><button onClick={onEdit} className="p-2 hover:bg-white/10 rounded-lg text-blue-300"><Edit2 size={16} /></button><button onClick={onUndo} className="flex items-center gap-1 px-3 py-2 hover:bg-white/10 rounded-lg text-amber-300 font-bold text-xs"><RotateCcw size={14} /> <span>Undo</span></button></div>)}
    </motion.div>
  );
};

// --- MAIN EXPORT ---
export const MindInput = ({ onFocusChange }: { onFocusChange?: (focused: boolean) => void }) => {
  const [input, setInput] = useState('');
  const [activeSector, setActiveSector] = useState<SectorType>(null);
  const [activeRail, setActiveRail] = useState<'TASK' | 'MOOD' | null>(null);
  const [nlpData, setNlpData] = useState<NlpResult | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [lastSaved, setLastSaved] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [moodLevel, setMoodLevel] = useState<0 | 1>(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const taskX = useMotionValue(0); const taskY = useMotionValue(0);
  const moodX = useMotionValue(0); const moodY = useMotionValue(0);

  const handleFocus = () => { setIsTyping(true); onFocusChange?.(true); };
  const handleCollapse = () => { inputRef.current?.blur(); setIsTyping(false); onFocusChange?.(false); };

  // VUỐT XUỐNG ĐỂ ẨN
  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y > 50) { // Kéo xuống quá 50px
      handleCollapse();
    }
  };

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
      if (targetSector.startsWith('TASK')) {
        type = 'task';
        const priorityMap: Record<string, string> = { 'TASK_NORMAL': 'normal', 'TASK_IMPORTANT': 'important', 'TASK_URGENT': 'urgent', 'TASK_CRITICAL': 'critical' };
        id = await db.entries.add({ 
          content: input, type: 'task', status: 'active', isFocus: false, createdAt: now, updatedAt: now,
          priority: priorityMap[targetSector] as any || 'normal', 
          quantity: finalNlp.quantity || 1, unit: finalNlp.unit || 'lần', 
          frequency: (finalNlp.frequency as any) || 'once', frequency_detail: finalNlp.frequency_detail || '', 
          is_nlp_hidden: false, mood_score: 0, progress: 0, isBookmarked: false 
        });
        await addXp('todo_new');
      } else {
        type = 'mood';
        if (targetSector.includes('HAPPY')) moodScore = 1 + moodLevel;
        if (targetSector.includes('SAD')) moodScore = -(1 + moodLevel);
        if (targetSector.includes('NEUTRAL')) moodScore = 0;
        id = await db.entries.add({ 
          content: input, type: 'mood', status: 'active', isFocus: false, createdAt: now, updatedAt: now,
          mood_score: moodScore, quantity: 1, unit: 'lần', frequency: 'once', is_nlp_hidden: true, priority: 'normal', progress: 0, isBookmarked: false 
        });
        await addXp('thought');
      }
      triggerHaptic('success');
      setLastSaved({ 
        id: id as number, content: input, type, mood_score: moodScore,
        quantity: finalNlp.quantity, unit: finalNlp.unit, frequency: finalNlp.frequency, frequency_detail: finalNlp.frequency_detail
      });
      setToast({ msg: type === 'task' ? 'Đã lưu Task' : 'Đã lưu Mood', type: 'success' });
      setInput(''); setActiveSector(null); setActiveRail(null); setMoodLevel(0);
      taskX.set(0); taskY.set(0); moodX.set(0); moodY.set(0);
      handleCollapse();
    } catch (err: any) { setToast({ msg: `Lỗi: ${err.message}`, type: 'error' }); }
  };

  const handleEditSave = async (updatedData: any) => {
    if(!lastSaved?.id) return;
    try {
      if(lastSaved.type === 'task') {
        await db.entries.update(lastSaved.id, { 
          content: updatedData.content, 
          quantity: updatedData.quantity,
          unit: updatedData.unit,
          frequency: updatedData.frequency,
          frequency_detail: updatedData.frequency_detail,
          updatedAt: new Date()
        });
      } else {
        await db.entries.update(lastSaved.id, { 
          content: updatedData.content, 
          mood_score: updatedData.mood_score,
          updatedAt: new Date()
        });
      }
      setToast({ msg: 'Đã cập nhật!', type: 'success' });
      setShowEditModal(false);
      setLastSaved(null);
    } catch(e) { console.error(e); }
  };

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
      
      {/* THÊM drag="y" vào đây để vuốt xuống ẩn */}
      <motion.div 
        drag="y" 
        dragConstraints={{ top: 0, bottom: 0 }} 
        dragElastic={{ bottom: 0.2, top: 0 }} 
        onDragEnd={handleDragEnd}
        animate={{ opacity: activeRail ? 0.2 : 1, scale: activeRail ? 0.95 : 1, filter: activeRail ? "blur(3px)" : "blur(0px)", boxShadow: isTyping ? "0 0 0 4px rgba(59, 130, 246, 0.2)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)", borderColor: isTyping ? "#3B82F6" : "#E2E8F0" }} 
        className="z-10 w-72 h-44 bg-white rounded-xl border p-6 flex flex-col items-center justify-center relative transition-colors duration-300 touch-pan-y"
      >
        <textarea ref={inputRef} value={input} onFocus={handleFocus} onChange={handleInputChange} placeholder="Nhập nội dung..." className="w-full h-full bg-transparent text-slate-700 resize-none outline-none text-center text-lg font-normal z-10 placeholder-slate-400" />
        <AnimatePresence>{isTyping && (<motion.button initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} onClick={handleCollapse} className="absolute -top-3 -right-3 w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg z-50 hover:bg-slate-700 active:scale-90" title="Thoát nhập liệu"><Minimize2 size={16} /></motion.button>)}</AnimatePresence>
        <AnimatePresence>{nlpData?.detected && !activeRail && (<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute bottom-2 bg-blue-50 border border-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold flex gap-2 items-center shadow-sm z-20"><span>⚡ {nlpData.quantity} {nlpData.unit}</span></motion.div>)}</AnimatePresence>
      </motion.div>

      <div className="w-full max-w-[500px] flex items-center mt-20 px-10 relative z-30">
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"><AnimatePresence>{activeRail === 'TASK' && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"><svg className="absolute w-[220px] h-[220px] opacity-30 -translate-x-1/2 -translate-y-1/2"><line x1="20%" y1="20%" x2="80%" y2="80%" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" /><line x1="80%" y1="20%" x2="20%" y2="80%" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" /></svg><TargetIcon sector="TASK_NORMAL" icon={CheckCircle2} label="Thường" x={-75} y={-75} active={activeSector} color="text-blue-600" /><TargetIcon sector="TASK_URGENT" icon={AlertTriangle} label="Gấp" x={75} y={-75} active={activeSector} color="text-orange-500" /><TargetIcon sector="TASK_IMPORTANT" icon={Star} label="Cần" x={-75} y={75} active={activeSector} color="text-amber-500" /><TargetIcon sector="TASK_CRITICAL" icon={Flame} label="Cháy" x={75} y={75} active={activeSector} color="text-red-500" /></div>)}</AnimatePresence><motion.div drag={input.trim().length > 0} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={1} onDragStart={() => setActiveRail('TASK')} onDrag={(_, info) => handleDrag(info, 'TASK')} onDragEnd={() => activeSector ? executeSave(activeSector) : (setActiveRail(null), setActiveSector(null))} style={{ x: taskX, y: taskY, zIndex: activeRail === 'TASK' ? 50 : 20 }} className={clsx("p-4 rounded-full border-2 transition-all cursor-grab active:cursor-grabbing shadow-sm", input.length === 0 ? "opacity-20" : "bg-white border-slate-200")}><Layers size={24} className={activeRail === 'TASK' ? "text-slate-900" : "text-slate-400"} /><AnimatePresence>{activeRail === 'TASK' && nlpData?.detected && (<motion.div initial={{ opacity: 0, scale: 0.5, y: 0 }} animate={{ opacity: 1, scale: 1, y: -50 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] whitespace-nowrap px-2 py-1 rounded-md font-bold shadow-lg pointer-events-none z-[60]">{nlpData.quantity} {nlpData.unit} | {nlpData.frequency === 'daily' ? 'Hàng ngày' : nlpData.frequency}</motion.div>)}</AnimatePresence></motion.div><span className="text-[10px] font-bold mt-2 text-slate-400 uppercase">Task</span></div>
        <div className="absolute right-6 flex flex-col items-center"><AnimatePresence>{activeRail === 'MOOD' && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"><div className="absolute w-[180px] h-[180px] opacity-30 -translate-x-1/2 -translate-y-1/2"><div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-slate-400 border-l border-dashed -translate-x-1/2" /><div className="absolute top-1/2 left-0 w-1/2 h-[2px] bg-slate-400 border-t border-dashed -translate-y-1/2" /></div><DynamicTargetIcon sector="MOOD_HAPPY" icon={moodLevel > 0 ? Heart : Smile} label={moodLevel > 0 ? "Tuyệt" : "Vui"} x={0} y={-90} active={activeSector} color="text-green-500" scale={moodLevel > 0 ? 1.5 : 1.3} /><DynamicTargetIcon sector="MOOD_SAD" icon={moodLevel > 0 ? AlertTriangle : Frown} label={moodLevel > 0 ? "Tệ" : "Buồn"} x={0} y={90} active={activeSector} color="text-slate-500" scale={moodLevel > 0 ? 1.5 : 1.3} /><DynamicTargetIcon sector="MOOD_NEUTRAL" icon={Meh} label="Lưu" x={-90} y={0} active={activeSector} color="text-purple-500" /></div>)}</AnimatePresence><motion.div drag={input.trim().length > 0} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={1} onDragStart={() => setActiveRail('MOOD')} onDrag={(_, info) => handleDrag(info, 'MOOD')} onDragEnd={() => activeSector ? executeSave(activeSector) : (setActiveRail(null), setActiveSector(null), setMoodLevel(0))} style={{ x: moodX, y: moodY, zIndex: activeRail === 'MOOD' ? 50 : 20 }} className={clsx("p-4 rounded-full border-2 transition-all cursor-grab active:cursor-grabbing shadow-lg z-50", input.length === 0 ? "opacity-20" : "bg-[#2563EB] border-[#2563EB]")}><Send size={24} className="text-white" /></motion.div><span className="text-[10px] font-bold mt-2 text-slate-400 uppercase tracking-tighter">Mood</span></div>
      </div>
    </div>
  );
};

const TargetIcon = ({ sector, icon: Icon, label, x, y, active, color }: any) => { const isTarget = active === sector; return (<motion.div animate={{ scale: isTarget ? 1.3 : 1 }} className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y, width: 60 }}><div className={clsx("p-2 rounded-xl border transition-all shadow-sm", isTarget ? "bg-white border-slate-400 ring-4 ring-blue-50 z-50 shadow-md" : "bg-white/90 border-slate-100 opacity-60")}><Icon size={22} className={isTarget ? color : "text-slate-300"} strokeWidth={2.5} /></div><span className={clsx("text-[9px] mt-1.5 font-black uppercase tracking-tighter", isTarget ? "text-slate-900" : "text-slate-300")}>{label}</span></motion.div>); };
const DynamicTargetIcon = ({ sector, icon: Icon, label, x, y, active, color, scale }: any) => { const isTarget = active === sector; return (<motion.div animate={{ scale: isTarget ? scale : 1 }} className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y, width: 60 }}><div className={clsx("p-2 rounded-xl border transition-all shadow-sm", isTarget ? "bg-white border-slate-400 ring-4 ring-blue-50 z-50 shadow-md" : "bg-white/90 border-slate-100 opacity-60")}><motion.div key={label} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><Icon size={22} className={isTarget ? color : "text-slate-300"} strokeWidth={2.5} /></motion.div></div><span className={clsx("text-[9px] mt-1.5 font-black uppercase", isTarget ? "text-slate-900" : "text-slate-300")}>{label}</span></motion.div>); };