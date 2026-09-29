import React from 'react';
import { LayoutDashboard, Bot, FileText, Layers, GraduationCap } from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'tutor', label: 'Tutor', icon: <Bot className="w-5 h-5" /> },
    { id: 'materials', label: 'Docs', icon: <FileText className="w-5 h-5" /> },
    { id: 'flashcards', label: 'Cards', icon: <Layers className="w-5 h-5" /> },
    { id: 'quizzes', label: 'Quiz', icon: <GraduationCap className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 md:hidden px-2 py-1.5 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => {
        const active = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              active
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className={active ? 'scale-110 transition-transform' : ''}>{tab.icon}</span>
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
