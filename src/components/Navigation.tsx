import { motion } from 'framer-motion';

export const Navigation = ({ activeTab, setActiveTab, isLevel4 }: any) => {
  return (
    <>
      {/* HEADER: Chứa Căn tính & Hành trình (khi đạt Lv4) [cite: 30, 44] */}
      <header className="fixed top-0 inset-x-0 h-16 bg-slate-950/80 backdrop-blur-md z-40 border-b border-slate-900 flex items-center px-6">
        <div className="flex-1">
          {isLevel4 && (
            <motion.button
              layoutId="journey-tab"
              onClick={() => setActiveTab('Journey')}
              className={`text-xs font-mono tracking-widest ${
                activeTab === 'Journey' ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              HÀNH TRÌNH
            </motion.button>
          )}
        </div>

        {/* Nút Căn tính: Center Absolute [cite: 30] */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <button
            onClick={() => isLevel4 && setActiveTab('Identity')}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
              isLevel4
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-slate-800 bg-slate-900 opacity-20'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                activeTab === 'Identity'
                  ? 'bg-blue-400 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
          </button>
        </div>

        <div className="flex-1 text-right">
          <span className="text-[10px] font-mono text-slate-600">
            MIND CAP OS v3.1
          </span>
        </div>
      </header>

      {/* FOOTER: Chứa Mind & Sa bàn [cite: 41, 43] */}
      <nav className="fixed bottom-8 inset-x-0 z-40 flex justify-center px-6">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 p-2 rounded-[32px] flex items-center gap-2 shadow-2xl">
          <TabButton
            active={activeTab === 'Mind'}
            onClick={() => setActiveTab('Mind')}
            label="MIND"
          />
          <TabButton
            active={activeTab === 'SaBan'}
            onClick={() => setActiveTab('SaBan')}
            label={isLevel4 ? 'SA BÀN' : 'TODO'}
          />

          {/* Khi chưa đạt Lv4, Hành trình nằm ở Footer  */}
          {!isLevel4 && (
            <motion.div layoutId="journey-tab">
              <TabButton
                active={activeTab === 'Journey'}
                onClick={() => setActiveTab('Journey')}
                label="BIỂU ĐỒ"
              />
            </motion.div>
          )}
        </div>
      </nav>
    </>
  );
};

const TabButton = ({ active, onClick, label }: any) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-2xl text-xs font-bold tracking-widest transition-all ${
      active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
        : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    {label}
  </button>
);
