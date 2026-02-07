import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Database, Trash2, PlusCircle, RefreshCw } from 'lucide-react';

export const TodoTab = () => {
  // 1. Kết nối thử
  const allData = useLiveQuery(() => db.entries.toArray());
  const [status, setStatus] = useState("Đang kết nối...");

  useEffect(() => {
    db.open()
      .then(() => setStatus(`Đã kết nối: ${db.name} (v${db.verno})`))
      .catch(e => setStatus(`Lỗi kết nối: ${e.message}`));
  }, []);

  // 2. Hàm thêm thử dữ liệu (Bypass UI)
  const forceAdd = async () => {
    try {
      await db.entries.add({
        content: "Test Task " + new Date().getSeconds(),
        type: 'task',
        status: 'active',
        isFocus: false,
        createdAt: new Date(),
        // Các trường bắt buộc khác
        priority: 'normal', mood_score: 0,
        quantity: 1, unit: 'lần', frequency: 'once',
        progress: 0, is_nlp_hidden: false
      });
      alert("Đã thêm task thành công! Hãy xem danh sách bên dưới.");
    } catch (e: any) {
      alert("Lỗi GHI DB: " + e.message);
    }
  };

  return (
    <div className="p-4 pb-32 bg-slate-100 min-h-screen">
      {/* BẢNG ĐIỀU KHIỂN ĐEN (Nếu không thấy bảng này là Code chưa cập nhật) */}
      <div className="bg-slate-900 text-white p-5 rounded-xl shadow-xl mb-6">
        <h2 className="text-xl font-bold text-yellow-400 mb-2 flex items-center gap-2">
          <Database/> CHẾ ĐỘ SỬA LỖI (FIX MODE)
        </h2>
        <div className="font-mono text-xs text-slate-300 space-y-1 mb-4 border-b border-slate-700 pb-2">
          <p>Status: {status}</p>
          <p>Tổng bản ghi: <strong className="text-green-400 text-lg">{allData?.length || 0}</strong></p>
        </div>

        <button 
          onClick={forceAdd}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <PlusCircle size={20}/> THÊM NGAY 1 TASK (TEST)
        </button>
      </div>

      {/* DANH SÁCH DỮ LIỆU THẬT */}
      <div className="space-y-2">
        <h3 className="font-bold text-slate-500 uppercase text-xs pl-2">Dữ liệu trong Database:</h3>
        {allData?.map((item, idx) => (
          <div key={idx} className="bg-white p-3 rounded shadow-sm text-xs font-mono border-l-4 border-blue-500">
            <span className="font-bold text-blue-700">{item.type.toUpperCase()}</span>: {item.content} <br/>
            <span className="text-slate-400">(ID: {item.id}, Status: {item.status})</span>
          </div>
        ))}
        {(!allData || allData.length === 0) && (
          <div className="text-center text-slate-400 py-4 italic">Chưa có dữ liệu nào.</div>
        )}
      </div>
    </div>
  );
};