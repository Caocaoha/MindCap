import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, AlertTriangle } from 'lucide-react';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export const OfflineWarning = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      // Khi có mạng -> Lưu lại timestamp hiện tại
      localStorage.setItem('last_online_timestamp', Date.now().toString());
      setShowWarning(false);
    };

    const checkOfflineDuration = () => {
      if (!navigator.onLine) {
        const lastOnline = localStorage.getItem('last_online_timestamp');
        if (lastOnline) {
          const diff = Date.now() - parseInt(lastOnline);
          // Nếu đã offline quá 3 ngày -> Hiện cảnh báo
          if (diff > THREE_DAYS_MS) {
            setShowWarning(true);
          }
        }
      }
    };

    // Lắng nghe sự kiện mạng
    window.addEventListener('online', handleOnline);
    
    // Kiểm tra ngay khi mở app
    if (navigator.onLine) {
      handleOnline();
    } else {
      checkOfflineDuration();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl border-2 border-red-100">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <WifiOff size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">CẢNH BÁO OFFLINE</h3>
            <p className="text-sm text-slate-500 mb-4">
              Bạn đã không kết nối mạng trong hơn 3 ngày.
            </p>
            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-left mb-4">
              <div className="flex gap-2 items-start">
                <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-700 font-medium">
                  Rủi ro: iOS/Safari có thể tự động xóa dữ liệu App nếu không có mạng quá lâu.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm"
            >
              TÔI ĐÃ HIỂU
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};