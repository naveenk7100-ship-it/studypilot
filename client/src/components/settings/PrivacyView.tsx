import React from 'react';
import { Shield, Lock, EyeOff, Server, Trash2, CheckCircle2 } from 'lucide-react';

export const PrivacyView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider">
          <Shield className="w-4 h-4" />
          <span>Student Trust & Safety</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          Privacy Policy & Academic Integrity
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          StudyPilot is built to support your learning without compromising your autonomy or collecting unnecessary personal information.
        </p>
      </div>

      {/* Grid of Key Privacy Principles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            1. Local-First Memory
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your conversations, flashcards, quiz scores, and exam schedules are kept strictly inside your browser's private local storage. No invasive behavioral trackers or ad profiling exist here.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            2. Secure Backend AI Processing
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            All AI queries pass through a protected backend API. Secret keys are never exposed on your device, and queries are transmitted via secure HTTPS connections.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            3. Uploaded Document Grounding
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Documents you upload (PDFs, notes, lecture slides) are parsed in memory strictly to extract relevant study concepts and verify answers. They are never sold or used for public training.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            4. Full Data Deletion Control
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            You maintain 100% control over your data. You can export complete backups in standard JSON format or permanently purge all history with a single click in Settings.
          </p>
        </div>
      </div>

      {/* Detailed Disclosure Sections */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6 text-sm text-slate-700 dark:text-slate-300">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            What Data Is Stored & Why
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <li><strong>Flashcards & SM-2 Intervals:</strong> To compute exact repetition intervals and remind you when review is due.</li>
            <li><strong>Quiz Results:</strong> To diagnose subject weak points and recommend targeted revision.</li>
            <li><strong>Exam Roadmaps:</strong> To preserve your customized daily checklists and study hours.</li>
            <li><strong>Theme Preference:</strong> To remember your Light or Dark mode setting.</li>
          </ul>
        </section>

        <section className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Zero Unnecessary Account Requirements
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Core study utilities—including the flashcard engine, document breakdowns, quiz player, and exam roadmap planner—run autonomously on your device without mandatory phone numbers or advertising trackers.
          </p>
        </section>

        <section className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            External AI Provider Processing
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            In Demo Mode, all responses and study packs are synthesized locally by StudyPilot's curriculum engine. When a live external provider (e.g., Google Gemini or OpenAI) is connected by the user via server configuration, prompt queries and relevant document excerpts are transmitted via encrypted HTTPS to that provider.
          </p>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-medium">
            ⚠️ <strong>Student Advisory:</strong> Do not upload confidential, personal, or sensitive information unless you understand how the configured AI provider processes and retains data under their applicable terms.
          </div>
        </section>

        <section className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Academic Integrity & Honest AI Notice
          </h2>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p>
              AI-generated explanations are learning aids designed to help you comprehend and revise. They can occasionally contain hallucinations or arithmetic oversights.
            </p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Always verify critical formulas and factual data with your official course material or instructor before exams.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
