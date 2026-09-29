import React, { useState, useRef } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  Trash2,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Server,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';
import { ServerStatus } from '../../types';
import { StorageService } from '../../services/storage';
import { fetchServerStatus, getBackendUrl, setBackendUrl } from '../../services/api';

interface SettingsViewProps {
  serverStatus: ServerStatus | null;
  onRefreshStatus: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onDataReset?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  serverStatus,
  onRefreshStatus,
  darkMode,
  onToggleDarkMode,
  onDataReset
}) => {
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionLatency, setConnectionLatency] = useState<number | null>(null);
  const [customBackendUrl, setCustomBackendUrl] = useState<string>(() => getBackendUrl());
  const [urlSavedFeedback, setUrlSavedFeedback] = useState<string | null>(null);

  const importFileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = () => {
    const json = StorageService.exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studypilot-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMessage('Study data successfully exported to your device!');
    setTimeout(() => setExportMessage(null), 3500);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importData(content);
      if (success) {
        alert('Study data successfully imported! The page will now refresh.');
        window.location.reload();
      } else {
        alert('Failed to import data. Please ensure the file is valid StudyPilot JSON.');
      }
    };
    reader.readAsText(file);
    if (importFileInputRef.current) importFileInputRef.current.value = '';
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all conversation history? This cannot be undone.')) {
      StorageService.clearChatHistory();
      window.location.reload();
    }
  };

  const handleDeleteSavedMaterials = () => {
    if (window.confirm('Delete all saved documents and notes?')) {
      StorageService.deleteSavedMaterial();
      window.location.reload();
    }
  };

  const handleDeleteAllData = () => {
    if (window.confirm('WARNING: Are you sure you want to delete ALL study data, flashcards, quiz history, and plans? This permanently resets the dashboard to the clean zero state.')) {
      StorageService.deleteAllStudyData();
      if (onDataReset) {
        onDataReset();
      }
      window.location.reload();
    }
  };

  const handleSaveBackendUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendUrl(customBackendUrl);
    setUrlSavedFeedback('Backend endpoint saved! Testing connection...');
    await handleTestConnection();
    setTimeout(() => setUrlSavedFeedback(null), 3500);
  };

  const handleResetBackendUrl = async () => {
    setCustomBackendUrl('');
    setBackendUrl('');
    setUrlSavedFeedback('Reset to default. Testing connection...');
    await handleTestConnection();
    setTimeout(() => setUrlSavedFeedback(null), 3500);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    const start = performance.now();
    try {
      await fetchServerStatus();
      const end = performance.now();
      setConnectionLatency(Math.round(end - start));
      onRefreshStatus();
    } catch {
      setConnectionLatency(null);
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Settings & Local Study Memory
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your local learning data, privacy options, and AI backend configuration.
        </p>
      </div>

      {/* 1. Theme & Appearance */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Interface Theme
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {darkMode ? 'Dark Theme' : 'Light Theme'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Optimized for prolonged academic reading and late-night study sessions.
            </p>
          </div>
          <button
            onClick={onToggleDarkMode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            <span>{darkMode ? 'Switch to Light' : 'Switch to Dark'}</span>
          </button>
        </div>
      </div>

      {/* 2. AI Backend Configuration & Security */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              AI Backend Provider
            </h2>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>

        {/* Status Pill */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  serverStatus?.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {serverStatus?.isLive ? `Live Provider: ${serverStatus.provider.toUpperCase()}` : 'Demo Mode (Local Curriculum Engine)'}
              </span>
            </div>
            {connectionLatency !== null && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                API Ping: {connectionLatency}ms
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {serverStatus?.message}
          </p>

          {/* Backend URL Configuration Form */}
          <form onSubmit={handleSaveBackendUrl} className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Connected Backend URL (Optional)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={customBackendUrl}
                onChange={(e) => setCustomBackendUrl(e.target.value)}
                placeholder="e.g. https://studypilot-api.onrender.com (or leave empty for Demo Mode)"
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-hidden focus:border-blue-500"
              />
              <div className="flex gap-2 shrink-0">
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  Save & Connect
                </button>
                {customBackendUrl && (
                  <button
                    type="button"
                    onClick={handleResetBackendUrl}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            {urlSavedFeedback && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {urlSavedFeedback}
              </p>
            )}
          </form>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Production Security Architecture</span>
            </div>
            <p>
              API keys are <strong>never</strong> bundled or included in client code. The browser communicates exclusively with your secure backend, where API credentials live in private environment variables.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Study Data Management (Local Persistence) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Study Data Autonomy & Backup
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Export your flashcards, quiz scores, and study plans to JSON anytime.
          </p>
        </div>

        {exportMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{exportMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/20 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span>Export All Study Data (JSON)</span>
          </button>

          <button
            onClick={() => importFileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/20 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>Import / Restore Backup</span>
          </button>
          <input
            ref={importFileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        {/* Destructive Deletion Controls */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Privacy & Deletion Controls
          </h3>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleClearHistory}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 text-xs font-semibold transition-colors"
            >
              Clear Conversation History
            </button>

            <button
              onClick={handleDeleteSavedMaterials}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 text-xs font-semibold transition-colors"
            >
              Delete Saved Materials
            </button>

            <button
              onClick={handleDeleteAllData}
              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors"
            >
              Delete All Study Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
