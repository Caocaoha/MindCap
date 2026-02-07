import { db } from '../db';

export const exportData = async () => {
  try {
    // 1. Lấy toàn bộ dữ liệu từ các bảng
    const entries = await db.entries.toArray();
    const logs = await db.mev_logs.toArray();

    // 2. Đóng gói thành JSON
    const data = {
      version: 3.0,
      timestamp: new Date().toISOString(),
      entries,
      logs
    };

    // 3. Tạo Blob và link tải xuống
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `MindCap_Backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Export error:", error);
    return false;
  }
};

export const importData = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        if (!json.entries || !json.logs) {
          throw new Error("File backup không hợp lệ");
        }

        // Transaction để đảm bảo an toàn dữ liệu (Atomic)
        await db.transaction('rw', db.entries, db.mev_logs, async () => {
          await db.entries.clear();
          await db.mev_logs.clear();
          
          await db.entries.bulkAdd(json.entries);
          await db.mev_logs.bulkAdd(json.logs);
        });

        resolve(true);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
};