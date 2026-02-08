import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

export const ReloadPrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => setNeedRefresh(false);

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-6 right-6 z-[200] max-w-sm w-full bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex flex-col gap-3"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-sm text-blue-400 uppercase">Cập nhật khả dụng</h3>
              <p className="text-xs text-slate-300 mt-1">
                Phiên bản mới đã sẵn sàng. Tải lại để áp dụng thay đổi và tránh lỗi cache.
              </p>
            </div>
            <button onClick={close} className="text-slate-500 hover:text-white">
              <X size={16} />
            </button>
          </div>
          
          <button
            onClick={() => updateServiceWorker(true)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw size={14} className="animate-spin" />
            LÀM MỚI NGAY
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};