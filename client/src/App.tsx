import React, { useState, useEffect } from 'react';
import { NavTab, Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { MobileNav } from './components/common/MobileNav';
import { TrustBanner } from './components/common/TrustBanner';
import { DashboardView } from './components/dashboard/DashboardView';
import { AITutorView } from './components/tutor/AITutorView';
import { MaterialsView } from './components/materials/MaterialsView';
import { FlashcardsView } from './components/flashcards/FlashcardsView';
import { QuizView } from './components/quiz/QuizView';
import { ExamPrepView } from './components/exam/ExamPrepView';
import { ProgressView } from './components/progress/ProgressView';
import { SettingsView } from './components/settings/SettingsView';
import { PrivacyView } from './components/settings/PrivacyView';

import {
  ProcessedDocument,
  Flashcard,
  QuizResult,
  ExamPlan,
  LearningState,
  ServerStatus,
  StudyMode
} from './types';
import { StorageService } from './services/storage';
import { fetchServerStatus } from './services/api';

const VALID_TABS: NavTab[] = ['dashboard', 'tutor', 'materials', 'flashcards', 'quizzes', 'exam_prep', 'progress', 'settings', 'privacy'];

function normalizeTab(raw: string): NavTab | null {
  const clean = raw.toLowerCase().trim();
  if (VALID_TABS.includes(clean as NavTab)) return clean as NavTab;
  if (clean === 'exam' || clean === 'examprep') return 'exam_prep';
  if (clean === 'quiz') return 'quizzes';
  if (clean === 'notes' || clean === 'material') return 'materials';
  return null;
}

function parseTabFromLocation(): NavTab {
  if (typeof window === 'undefined') return 'dashboard';
  
  // 1. Check hash
  const hash = window.location.hash.replace(/^#\/?/, '');
  const fromHash = normalizeTab(hash);
  if (fromHash) return fromHash;

  // 2. Check pathname suffix
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  if (lastPart) {
    const fromPath = normalizeTab(lastPart);
    if (fromPath) return fromPath;
  }

  // 3. Check query param ?tab=
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab');
  if (tabParam) {
    const fromParam = normalizeTab(tabParam);
    if (fromParam) return fromParam;
  }

  return 'dashboard';
}

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>(parseTabFromLocation);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('studypilot_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sync tab with browser URL hash
  useEffect(() => {
    const onHashChange = () => {
      const newTab = parseTabFromLocation();
      setCurrentTab(newTab);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    window.location.hash = tab;
  };

  // App Data State (Backed by Local Study Memory)
  const [documents, setDocuments] = useState<ProcessedDocument[]>(() => StorageService.getDocuments());
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => StorageService.getFlashcards());
  const [quizResults, setQuizResults] = useState<QuizResult[]>(() => StorageService.getQuizResults());
  const [examPlans, setExamPlans] = useState<ExamPlan[]>(() => StorageService.getExamPlans());
  const [learningState, setLearningState] = useState<LearningState>(() => StorageService.getLearningState());
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);

  // Cross-view context
  const [pinnedDocument, setPinnedDocument] = useState<ProcessedDocument | null>(null);
  const [tutorInitialPrompt, setTutorInitialPrompt] = useState('');
  const [tutorInitialMode, setTutorInitialMode] = useState<StudyMode>('explain');

  // Dark Mode Class Sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('studypilot_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('studypilot_theme', 'light');
    }
  }, [darkMode]);

  // Fetch Server & AI Provider Status
  const loadStatus = async () => {
    try {
      const status = await fetchServerStatus();
      setServerStatus(status);
    } catch (e: any) {
      setServerStatus({
        status: 'error',
        provider: 'offline',
        model: 'local-cache',
        isLive: false,
        message: 'Backend server offline or running standalone. Operating in local mode.'
      });
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // Handlers
  const handleStartTutorWithPrompt = (prompt: string, mode: StudyMode = 'explain') => {
    setTutorInitialPrompt(prompt);
    setTutorInitialMode(mode);
    handleSelectTab('tutor');
  };

  const handleAskAboutDocument = (doc: ProcessedDocument) => {
    setPinnedDocument(doc);
    handleStartTutorWithPrompt(`Explain the main thesis and key findings of ${doc.fileName}`, 'explain');
  };

  const handleGenerateQuizFromDoc = (doc: ProcessedDocument) => {
    handleSelectTab('quizzes');
  };

  const handleGenerateFlashcardsFromDoc = (doc: ProcessedDocument) => {
    if (doc.flashcards && doc.flashcards.length > 0) {
      const newCards: Flashcard[] = doc.flashcards.map(fc => ({
        id: fc.id || 'fc-' + Math.random().toString(36).substring(2, 9),
        front: fc.front,
        back: fc.back,
        topic: fc.topic || doc.fileName,
        sourceDocId: doc.id,
        sourceDocName: doc.fileName,
        state: 'new',
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        nextReviewDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }));
      StorageService.addFlashcards(newCards);
      setFlashcards(StorageService.getFlashcards());
    }
    handleSelectTab('flashcards');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header */}
        <Header
          onToggleMobileNav={() => setMobileNavOpen(prev => !prev)}
          status={serverStatus}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(prev => !prev)}
          onOpenSettings={() => handleSelectTab('settings')}
        />

        {/* Content Wrapper */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {/* Trust & Safety + Demo Status Banner */}
          <TrustBanner
            status={serverStatus}
            onOpenSettings={() => handleSelectTab('settings')}
          />

          {/* Active View Router */}
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={handleSelectTab}
              onStartTutorWithPrompt={handleStartTutorWithPrompt}
              documents={documents}
              flashcards={flashcards}
              quizResults={quizResults}
              examPlans={examPlans}
              learningState={learningState}
            />
          )}

          {currentTab === 'tutor' && (
            <AITutorView
              initialPrompt={tutorInitialPrompt}
              initialMode={tutorInitialMode}
              pinnedDocument={pinnedDocument}
              onClearPinnedDocument={() => setPinnedDocument(null)}
              onAddFlashcards={(cards) => {
                StorageService.addFlashcards(cards);
                setFlashcards(StorageService.getFlashcards());
              }}
              onStartQuizFromTopic={(topic) => {
                handleSelectTab('quizzes');
              }}
              weakTopics={Array.from(new Set(quizResults.flatMap(r => r.weakTopics || [])))}
            />
          )}

          {currentTab === 'materials' && (
            <MaterialsView
              documents={documents}
              onDocumentAdded={(doc) => {
                StorageService.addDocument(doc);
                setDocuments(StorageService.getDocuments());
              }}
              onDocumentDeleted={(id) => {
                StorageService.deleteDocument(id);
                setDocuments(StorageService.getDocuments());
              }}
              onAskAboutDocument={handleAskAboutDocument}
              onGenerateQuizFromDoc={handleGenerateQuizFromDoc}
              onGenerateFlashcardsFromDoc={handleGenerateFlashcardsFromDoc}
            />
          )}

          {currentTab === 'flashcards' && (
            <FlashcardsView
              flashcards={flashcards}
              documents={documents}
              onFlashcardUpdated={(card) => {
                StorageService.updateFlashcard(card);
                setFlashcards(StorageService.getFlashcards());
              }}
              onFlashcardsAdded={(cards) => {
                StorageService.addFlashcards(cards);
                setFlashcards(StorageService.getFlashcards());
              }}
              onFlashcardDeleted={(id) => {
                StorageService.deleteFlashcard(id);
                setFlashcards(StorageService.getFlashcards());
              }}
            />
          )}

          {currentTab === 'quizzes' && (
            <QuizView
              documents={documents}
              onStartTutorReview={(topicPrompt) => {
                handleStartTutorWithPrompt(topicPrompt, 'explain');
              }}
            />
          )}

          {currentTab === 'exam_prep' && (
            <ExamPrepView
              examPlans={examPlans}
              onPlanAdded={(plan) => {
                StorageService.addExamPlan(plan);
                setExamPlans(StorageService.getExamPlans());
              }}
              onPlanUpdated={(plan) => {
                StorageService.updateExamPlan(plan);
                setExamPlans(StorageService.getExamPlans());
              }}
              onPlanDeleted={(id) => {
                StorageService.deleteExamPlan(id);
                setExamPlans(StorageService.getExamPlans());
              }}
              onStartQuizFromTopic={(topic) => {
                handleSelectTab('quizzes');
              }}
              weakTopics={Array.from(new Set(quizResults.flatMap(r => r.weakTopics || [])))}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressView
              learningState={learningState}
              flashcards={flashcards}
              quizResults={quizResults}
              onStartTutorWithPrompt={handleStartTutorWithPrompt}
              onStartQuizFromTopic={(topic) => {
                setCurrentTab('quizzes');
              }}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              serverStatus={serverStatus}
              onRefreshStatus={loadStatus}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(prev => !prev)}
            />
          )}

          {currentTab === 'privacy' && <PrivacyView />}
        </main>

        {/* 3. Mobile Navigation Bottom Bar */}
        <MobileNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
        />
      </div>
    </div>
  );
}
export default App;
