import React from 'react';
import { ShieldAlert, Sparkles, Key } from 'lucide-react';
import { ServerStatus } from '../../types';

interface TrustBannerProps {
  status: ServerStatus | null;
  onOpenSettings?: () => void;
}

export const TrustBanner: React.FC<TrustBannerProps> = ({ status, onOpenSettings }) => {
  return (
    <div className="w-full space-y-2 mb-4">
      {/* Demo Mode Notice (Honest AI Indication) */}
      {status && !status.isLive && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 rounded-xl text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>
              <strong>Demo Mode Active:</strong> High-yield curriculum engine running. Connect an AI provider (Gemini / OpenAI / Groq) in <code className="font-mono bg-amber-500/20 px-1 py-0.5 rounded">.env</code> to activate live model streaming.
            </span>
          </div>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-xs shrink-0"
            >
              <Key className="w-3 h-3" />
              <span>Provider Settings</span>
            </button>
          )}
        </div>
      )}

      {/* Live AI Connected Indicator */}
      {status && status.isLive && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            Connected to <strong>{status.provider.toUpperCase()}</strong> ({status.model})
          </span>
        </div>
      )}

      {/* Academic Trust & Safety Disclaimer */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          AI-generated content may contain mistakes. Verify important academic information with your course material or instructor.
        </span>
      </div>
    </div>
  );
};
