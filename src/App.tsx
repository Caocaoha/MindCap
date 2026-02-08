import { useState, useEffect } from 'react';
import { MindInput } from './components/MindInput';
import { NewSaBan } from './components/NewSaBan';
import { FocusZone } from './components/FocusZone';
import { JourneyTab } from './components/JourneyTab'; 
import { IdentityTab } from './components/IdentityTab';
import { CmeToast } from './components/CmeToast'; 
import { SettingsModal } from './components/SettingsModal';
import { ReloadPrompt } from './components/ReloadPrompt';
import { OfflineWarning } from './components/OfflineWarning';

import { AnimatePresence, motion } from 'framer-motion';
import { 
  Brain, ListTodo, Fingerprint, Map, Settings, PartyPopper 
} from 'lucide-react';
import confetti from 'canvas-confetti';

function App() {
  const [activeTab, setActiveTab] = useState<'todo' | 'mind' | 'journey'>('mind');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);

  // --- LOGIC CONFETTI KHI LEVEL UP ---
  useEffect(() => {
    const handleLevelUp = (e: any) => {
      const newLevel = e.detail.level;
      setShowLevelUp(newLevel);
      
      // Bắn pháo hoa 3 đợt để tạo hiệu ứng tưng bừng
      const duration = 3000;
      const end = Date.now() + duration;

      (function frame() {
        // Bên trái bắn sang
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#3b82f6', '#fbbf24', '#f43f5e']
        });
        // Bên phải bắn sang
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#3b82f6', '#fbbf24', '#f43f5e']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    };

    window.addEventListener('level-up', handleLevelUp);
    return () => window.removeEventListener('level-up', handleLevelUp);
  }, []);

  return (
    // FIX: h-[100dvh] giúp app full màn hình chính xác trên Mobile Browser
    <div className="w-full h-[100dvh] bg-white flex flex-col font-sans text-slate-900 mx-auto max-w-md shadow-2xl overflow-hidden relative">
      
      {/* --- PWA SAFEGUARDS --- */}
      <ReloadPrompt />
      <OfflineWarning />
      {/* ---------------------- */}

      <CmeToast />

      {/* --- OVERLAYS --- */}
      <AnimatePresence mode="wait">
        {showIdentity && <IdentityTab onClose={() => setShowIdentity(false)} />}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        
        {/* POPUP LEVEL UP */}
        {showLevelUp !== null && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowLevelUp(null)}
          >
            <div className="bg-white p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500"></div>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
                <PartyPopper size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">CHÚC MỪNG!</h2>
              <p className="text-slate-500 font-medium">Bạn đã đạt</p>
              <p className="text-4xl font-black text-blue-600 mt-2">LEVEL {showLevelUp}</p>
              <p className="text-xs text-slate-400 mt-4">Chạm để tiếp tục</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-50 bg-white/80 backdrop-blur-md z-40 relative">
        <button onClick={() => setShowSettings(true)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
          <Settings size={20} />
        </button>

        <button onClick={() => setShowIdentity(true)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95 group absolute left-1/2 -translate-x-1/2">
          <Fingerprint size={24} strokeWidth={1.5} className="group-hover:animate-pulse"/>
        </button>

        <div className="w-9 h-9"></div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/30 relative scrollbar-hide flex flex-col">
        {activeTab === 'mind' && (
          <div className="flex flex-col w-full min-h-full pb-10 transition-all duration-500 ease-in-out">
            <AnimatePresence>
              {!isInputFocused && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="relative z-50 pt-2 px-2 overflow-hidden shrink-0">
                   <FocusZone />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div animate={{ height: isInputFocused ? 40 : 20 }} className="w-full" />
            <div className="flex-1 flex flex-col justify-start relative z-0 px-4">
               <MindInput onFocusChange={setIsInputFocused} />
            </div>
          </div>
        )}
        
        {activeTab === 'todo' && <NewSaBan />} 
        {activeTab === 'journey' && <JourneyTab />}
      </main>

      {/* --- BOTTOM NAV --- */}
      <nav className="h-20 bg-white border-t border-slate-100 flex items-center justify-around px-6 pb-2 z-50">
        <button onClick={() => setActiveTab('todo')} className={`p-3 rounded-2xl transition-all duration-300 ${activeTab === 'todo' ? 'bg-blue-50 text-blue-600 scale-105' : 'text-slate-300 hover:bg-slate-50 hover:text-slate-500'}`}>
          <ListTodo size={26} strokeWidth={activeTab === 'todo' ? 2.5 : 2} />
        </button>

        <button onClick={() => setActiveTab('mind')} className={`p-4 rounded-full transition-all duration-300 border-4 shadow-lg active:scale-95 ${activeTab === 'mind' ? 'bg-blue-600 text-white border-blue-50 -translate-y-5 shadow-blue-200' : 'bg-white text-slate-300 border-transparent'}`}>
          <Brain size={32} strokeWidth={activeTab === 'mind' ? 2.5 : 2} />
        </button>

        <button onClick={() => setActiveTab('journey')} className={`p-3 rounded-2xl transition-all duration-300 ${activeTab === 'journey' ? 'bg-blue-50 text-blue-600 scale-105' : 'text-slate-300 hover:bg-slate-50 hover:text-slate-500'}`}>
          <Map size={26} strokeWidth={activeTab === 'journey' ? 2.5 : 2} />
        </button>
      </nav>

    </div>
  );
}

export default App;