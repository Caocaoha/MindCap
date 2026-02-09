import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { db, type Entry } from '../db';
import clsx from 'clsx';

interface EditModalProps {
  entry: Entry;
  onClose: () => void;
  onSave: () => void;
}

export const EditModal = ({ entry, onClose, onSave }: EditModalProps) => {
  const [content, setContent] = useState(entry.content);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    
    // Cập nhật nội dung + Reset Spaced Repetition (coi như học lại từ đầu)
    await db.entries.update(entry.id!, { 
      content, 
      updatedAt: new Date(),
      // Reset review cycle: hiện lại sau 10 phút
      nextReviewAt: new Date(Date.now() + 10 * 60000), 
      metadata: { ...entry.metadata, reviewCount: 0 } 
    });
    
    onSave();
  };

  const handleDelete = async () => {
    if (confirm('Bạn chắc chắn muốn xóa?')) {
      await db.entries.delete(entry.id!);
      onSave(); // Trigger refresh
    }
  };

  return (
    // BACKDROP BLUR (CINEMA MODE): backdrop-blur-md làm mờ mọi thứ phía sau
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20"
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">
            {/* FIX TEXT THEO YÊU CẦU */}
            Sửa bản ghi
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={18} className="text-slate-400"/></button>
        </div>

        <div className="p-4">
          <textarea 
            value={content} 
            onChange={e => setContent(e.target.value)}
            className="w-full h-32 text-lg text-slate-700 bg-transparent outline-none resize-none placeholder-slate-300"
            placeholder="Nội dung..."
            autoFocus
          />
          
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-mono">
             <div className="flex items-center gap-1"><Calendar size={12}/> <span>{new Date(entry.createdAt).toLocaleDateString('vi-VN')}</span></div>
             {entry.type === 'task' && <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-bold">{entry.quantity} {entry.unit}</div>}
          </div>
        </div>

        <div className="p-4 bg-slate-50 flex gap-3">
          <button onClick={handleDelete} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={20}/></button>
          <button onClick={handleSave} className="flex-1 bg-blue-600 text-white font-bold rounded-xl py-3 shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
            <Save size={18} /> Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </div>
  );
};