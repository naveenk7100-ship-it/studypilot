import React from 'react';
import { Menu, Sun, Moon, Sparkles, AlertCircle } from 'lucide-react';
import { ServerStatus } from '../../types';

interface HeaderProps {
  onToggleMobileNav: () => void;
  status: ServerStatus | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileNav,
  status,
  darkMode,
  onToggleDarkMode,
  onOpenSettings
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileNav}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-base hidden sm:inline">
            StudyPilot Workspace
          </span>
          {status && (
            <button
              onClick={onOpenSettings}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                status.isLive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20'
              }`}
              title="Click to view AI Provider settings"
            >
              {status.isLive ? (
                <>
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span className="font-bold tracking-wider">LIVE AI</span>
                  <span className="text-[10px] text-emerald-500 uppercase font-semibold">({status.provider})</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  <span className="font-bold tracking-wider">DEMO MODE</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark / Light Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
