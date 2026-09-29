import React from 'react';
import {
  LayoutDashboard,
  Bot,
  FileText,
  Layers,
  GraduationCap,
  CalendarDays,
  TrendingUp,
  Settings,
  Shield,
  X,
  Compass
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'tutor'
  | 'materials'
  | 'flashcards'
  | 'quizzes'
  | 'exam_prep'
  | 'progress'
  | 'settings'
  | 'privacy';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile
}) => {
  const mainNavItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'tutor', label: 'AI Tutor', icon: <Bot className="w-5 h-5" />, badge: 'Core' },
    { id: 'materials', label: 'Study Materials', icon: <FileText className="w-5 h-5" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Layers className="w-5 h-5" /> },
    { id: 'quizzes', label: 'Quizzes', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'exam_prep', label: 'Exam Prep', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'progress', label: 'Progress', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const secondaryNavItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'settings', label: 'Settings & Data', icon: <Settings className="w-5 h-5" /> },
    { id: 'privacy', label: 'Privacy & Safety', icon: <Shield className="w-5 h-5" /> },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  StudyPilot
                </h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1 uppercase">
                  Understand • Practice • Remember
                </p>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white md:hidden"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Study Workspace
            </div>
            {mainNavItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Secondary Links & Footer */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Preferences & Legal
          </div>
          {secondaryNavItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="text-slate-400">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="mt-2 pt-2 px-3 text-[11px] text-slate-400 flex items-center justify-between">
            <span>StudyPilot v1.0</span>
            <span className="text-emerald-500 font-medium">● Local Memory</span>
          </div>
        </div>
      </aside>
    </>
  );
};
