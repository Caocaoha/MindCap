import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Frown, Meh, Smile } from 'lucide-react';
import { db, type Entry } from '../db';
import clsx from 'clsx';

interface EditModalProps {
  entry: Entry;
  onClose: () => void;
  onSave?: (updatedEntry: any) => void; // Callback tùy chọn nếu parent cần biết
}

export const EditModal = ({ entry, onClose, onSave }: EditModalProps) => {
  const [content, setContent] = useState(entry.content);
  const [qty, setQty] = useState(entry.quantity || 1);
  const [unit, setUnit] = useState(entry.unit || 'lần');
  const [freq, setFreq] = useState(entry.frequency || 'once');
  const [freqDetail, setFreqDetail] = useState(entry.frequency_detail || '');
  const [moodScore, setMoodScore] = useState(entry.mood_score || 0);

  const toggleDetail = (item: string) => {
    let items = freqDetail ? freqDetail.split(',').filter(Boolean) : [];
    if (items.includes(item)) items = items.filter(i => i !== item); else items.push(item);
    
    // Sort logic
    if (freq === 'weekly') {
      const days = ['T2','T3','T4','T5','T6','T7','CN'];
      items.sort((a,b) => days.indexOf(a) - days.indexOf(b));
    } else {
      items.sort((a,b) => parseInt(a) - parseInt(b));
    }
    setFreqDetail(items.join(','));
  };

  const handleSave = async () => {
    try {
      const updates: any = { content, updatedAt: new Date() };
      
      if (entry.type === 'task') {
        updates.quantity = Number(qty);
        updates.unit = unit;
        updates.frequency = freq;
        updates.frequency_detail = freqDetail;
      } else {
        updates.mood_score = moodScore;
      }

      // 1. Update DB Direct
      await db.entries.update(entry.id!, updates);
      
      // 2. Callback UI
      if (onSave) onSave({ ...entry, ...updates });
      
      onClose();
    } catch (e) {
      console.error("Save failed", e);
      alert("Lỗi khi lưu!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm touch-none">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50 rounded-t-3xl">
          <h3 className="font-bold text-lg text-slate-700">
            {entry.type === 'task' ? '✏️ Sửa Công Việc' : '🎭 Sửa Cảm Xúc'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Nội dung</label>
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 h-24 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none resize-none"
            />
          </div>

          {entry.type === 'task' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Số lượng</label>
                  <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full p-3 border border-slate-200 rounded-xl text-center font-bold outline-none focus:ring-2 focus:ring-blue-100"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Đơn vị</label>
                  <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-center outline-none focus:ring-2 focus:ring-blue-100"/>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Tần suất</label>
                <select value={freq} onChange={e => { setFreq(e.target.value as any); setFreqDetail(''); }} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 bg-white">
                  <option value="once">Một lần</option>
                  <option value="daily">Hàng ngày</option>
                  <option value="weekly">Hàng tuần</option>
                  <option value="monthly">Hàng tháng</option>
                </select>
              </div>

              {freq === 'weekly' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-3 font-bold">Lặp lại vào thứ:</span>
                  <div className="flex justify-between gap-1">
                    {['T2','T3','T4','T5','T6','T7','CN'].map(d => (
                      <button key={d} onClick={() => toggleDetail(d)} className={clsx("w-9 h-9 rounded-lg text-[10px] font-bold transition-all", freqDetail.includes(d) ? "bg-blue-600 text-white shadow-md scale-105" : "bg-white border text-slate-400")}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {freq === 'monthly' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-3 font-bold">Lặp lại vào ngày:</span>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({length:31},(_,i)=>(i+1).toString()).map(d => (
                      <button key={d} onClick={() => toggleDetail(d)} className={clsx("w-8 h-8 rounded-lg text-[10px] font-bold transition-all", freqDetail.split(',').includes(d) ? "bg-blue-600 text-white shadow-md" : "bg-white border text-slate-400")}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {entry.type === 'mood' && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block text-center mb-3">Cảm xúc</label>
              <div className="flex justify-center gap-4">
                <button onClick={() => setMoodScore(-2)} className={clsx("w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all", moodScore < 0 ? "bg-slate-100 border-slate-500 scale-110" : "border-slate-100 grayscale hover:grayscale-0")}>
                  <Frown size={32}/>
                </button>
                <button onClick={() => setMoodScore(0)} className={clsx("w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all", moodScore === 0 ? "bg-purple-50 border-purple-500 scale-110" : "border-slate-100 grayscale hover:grayscale-0")}>
                  <Meh size={32}/>
                </button>
                <button onClick={() => setMoodScore(2)} className={clsx("w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all", moodScore > 0 ? "bg-green-50 border-green-500 scale-110" : "border-slate-100 grayscale hover:grayscale-0")}>
                  <Smile size={32}/>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 rounded-b-3xl">
          <button onClick={handleSave} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
            Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </div>
  );
};