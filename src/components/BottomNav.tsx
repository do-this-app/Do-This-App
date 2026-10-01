import React from 'react';
import { PlusCircle, Clock, Settings, Sparkles } from 'lucide-react';

export type NavTab = 'check' | 'history' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  savedCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  savedCount,
}) => {
  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 pb-safe pointer-events-none"
    >
      <div className="max-w-md mx-auto px-4 pb-2.5">
        <div className="pointer-events-auto bg-zinc-950/90 backdrop-blur-xl text-zinc-400 p-1.5 rounded-3xl shadow-2xl border border-zinc-800 flex items-center justify-around">
          
          {/* HISTORY TAB */}
          <button
            onClick={() => onTabChange('history')}
            className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-2xl transition-all duration-200 active:scale-[0.97] ${
              currentTab === 'history'
                ? 'text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-current={currentTab === 'history' ? 'page' : undefined}
          >
            <div className="relative">
              <Clock className="w-5 h-5 transition-transform duration-200" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-emerald-500 text-zinc-950 font-bold text-[9px] font-mono w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-zinc-950">
                  {savedCount > 9 ? '9+' : savedCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono tracking-wider mt-1">HISTORY</span>
          </button>

          {/* CHECK (PRIMARY ACTION) TAB */}
          <button
            onClick={() => onTabChange('check')}
            className={`relative flex items-center justify-center gap-1.5 py-2.5 px-6 rounded-2xl transition-all duration-200 shadow-md active:scale-[0.97] ${
              currentTab === 'check'
                ? 'bg-white text-zinc-950 font-bold scale-[1.02]'
                : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
            }`}
            aria-current={currentTab === 'check' ? 'page' : undefined}
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold font-mono tracking-wider">CHECK</span>
          </button>

          {/* SETTINGS TAB */}
          <button
            onClick={() => onTabChange('settings')}
            className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-2xl transition-all duration-200 active:scale-[0.97] ${
              currentTab === 'settings'
                ? 'text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-current={currentTab === 'settings' ? 'page' : undefined}
          >
            <Settings className="w-5 h-5 transition-transform duration-200" />
            <span className="text-[10px] font-mono tracking-wider mt-1">SETTINGS</span>
          </button>

        </div>
      </div>
    </nav>
  );
};
