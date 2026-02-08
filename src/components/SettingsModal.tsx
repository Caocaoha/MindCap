import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShieldCheck, WifiOff, Download, Upload, 
  Trash2, Database,  
} from 'lucide-react';
import { db } from '../db';
import { exportData, importData } from '../utils/dataHandler';

export const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [wipeConfirm, setWipeConfirm] = useState(false);

  const handleDragEnd = (_: any, info: any) => {
    // Nếu kéo xuống quá 100px thì đóng
    if (info.offset.y > 100) {
      onClose();
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (confirm("CẢNH BÁO: Dữ liệu hiện tại sẽ bị ghi đè. Tiếp tục?")) {
      try {
        await importData(file);
        alert("Thành công! App sẽ tải lại.");
        window.location.reload();
      } catch (err) { alert("Lỗi File."); }
    }
  };

  const handleWipe = async () => {
    await db.nuke();
    alert("Đã xóa sạch.");
    window.location.reload();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }} // Chỉ cho kéo dãn xuống dưới
        onDragEnd={handleDragEnd}
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] touch-pan-y"
      >
        {/* DRAG HANDLE */}
        <div className="w-full flex justify-center pt-3 pb-1 bg-slate-50 cursor-grab active:cursor-grabbing border-b border-slate-50">
           <div className="w-12 h-1.5 bg-slate-300 rounded-full opacity-50"></div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-slate-800 font-bold uppercase tracking-widest text-xs">
            <Database size={16}/> Hầm dữ liệu
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} className="text-slate-500"/></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 no-scrollbar">
           {/* (Giữ nguyên nội dung bên trong như cũ) */}
           <section className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                <circle cx="64" cy="64" r="56" stroke="#10b981" strokeWidth="12" fill="none" strokeDasharray="351.86" strokeDashoffset="0" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">100%</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">LOCAL</span>
              </div>
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">Chủ quyền dữ liệu tuyệt đối</h3>
            <p className="text-xs text-slate-400 px-4">Dữ liệu nằm trong máy bạn. 0 byte gửi đi.</p>
          </section>

          <section className="bg-slate-900 rounded-xl p-4 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><WifiOff size={64} className="text-white"/></div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><ShieldCheck size={12} className="text-emerald-400"/> Audit Network</h4>
            <div className="font-mono text-[10px] text-emerald-400/80 space-y-1">
              <p>&gt; Checking Server... <span className="text-emerald-500">BLOCKED</span></p>
              <p>&gt; Checking Trackers... <span className="text-emerald-500">NONE</span></p>
              <p className="mt-2 text-white border-t border-slate-700 pt-2">KẾT QUẢ: <span className="bg-emerald-500/20 px-1 rounded text-emerald-300">OFFLINE ONLY</span></p>
            </div>
          </section>

          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Sao lưu</h4>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={exportData} className="flex flex-col items-center p-4 bg-slate-50 border rounded-xl hover:bg-blue-50 transition-all"><Download size={24} className="mb-2 text-slate-400"/><span className="text-xs font-bold">Xuất JSON</span></button>
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center p-4 bg-slate-50 border rounded-xl hover:bg-purple-50 transition-all"><Upload size={24} className="mb-2 text-slate-400"/><span className="text-xs font-bold">Nhập File</span><input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" /></button>
            </div>
          </section>

          <section className="pt-4 border-t border-slate-100">
            <button onClick={() => setWipeConfirm(true)} className="w-full py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/> XÓA DẤU VẾT</button>
            <AnimatePresence>
              {wipeConfirm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden mt-3">
                   <div className="bg-red-600 text-white p-3 rounded-xl text-center">
                     <p className="text-xs font-bold mb-2">Hủy diệt toàn bộ dữ liệu?</p>
                     <div className="flex gap-2 justify-center">
                       <button onClick={handleWipe} className="bg-white text-red-600 px-4 py-1.5 rounded-lg text-xs font-black">XÓA NGAY</button>
                       <button onClick={() => setWipeConfirm(false)} className="bg-red-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold">HỦY</button>
                     </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
};