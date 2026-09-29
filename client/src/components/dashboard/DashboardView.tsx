import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  HelpCircle,
  FileText,
  Layers,
  GraduationCap,
  CalendarDays,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus
} from 'lucide-react';
import { NavTab } from '../common/Sidebar';
import { ProcessedDocument, QuizResult, ExamPlan, LearningState, Flashcard } from '../../types';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onStartTutorWithPrompt: (prompt: string, mode: 'ask' | 'explain' | 'summarize' | 'quiz' | 'flashcards' | 'exam_prep') => void;
  documents: ProcessedDocument[];
  flashcards: Flashcard[];
  quizResults: QuizResult[];
  examPlans: ExamPlan[];
  learningState: LearningState;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onStartTutorWithPrompt,
  documents,
  flashcards,
  quizResults,
  examPlans,
  learningState
}) => {
  const [studyInput, setStudyInput] = useState('');

  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning 👋';
    if (hour < 18) return 'Good afternoon ☀️';
    return 'Good evening 🌙';
  };

  const handleStudySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyInput.trim()) return;
    onStartTutorWithPrompt(studyInput.trim(), 'explain');
    setStudyInput('');
  };

  // Calculate statistics
  const totalStudyMinutes = learningState.totalStudyMinutes || 0;
  const totalHours = (totalStudyMinutes / 60).toFixed(1);
  const totalQuestions = learningState.questionsAttempted || 0;
  const correctQuestions = learningState.questionsCorrect || 0;
  const overallAccuracy = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;
  
  // Flashcards due today
  const dueCardsCount = flashcards.filter(c => {
    if (!c.nextReviewDate) return true;
    return new Date(c.nextReviewDate) <= new Date();
  }).length;

  // Topics needing review
  const topicsNeedingReview = Object.entries(learningState.topicPerformance || {})
    .filter(([_, perf]) => perf.masteryStatus === 'needs_review')
    .map(([topic]) => topic);

  const quickActions = [
    {
      title: 'Ask AI',
      desc: 'Ask any study question',
      icon: <HelpCircle className="w-5 h-5 text-blue-500" />,
      action: () => onStartTutorWithPrompt('', 'ask')
    },
    {
      title: 'Explain Topic',
      desc: 'Step-by-step breakdown',
      icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
      action: () => onStartTutorWithPrompt('', 'explain')
    },
    {
      title: 'Summarize Notes',
      desc: 'Turn notes into bullet points',
      icon: <FileText className="w-5 h-5 text-indigo-500" />,
      action: () => onStartTutorWithPrompt('', 'summarize')
    },
    {
      title: 'Create Quiz',
      desc: 'Test your understanding',
      icon: <GraduationCap className="w-5 h-5 text-amber-500" />,
      action: () => onNavigate('quizzes')
    },
    {
      title: 'Create Flashcards',
      desc: 'Spaced repetition revision',
      icon: <Layers className="w-5 h-5 text-purple-500" />,
      action: () => onNavigate('flashcards')
    },
    {
      title: 'Exam Prep',
      desc: 'Build revision schedule',
      icon: <CalendarDays className="w-5 h-5 text-rose-500" />,
      action: () => onNavigate('exam_prep')
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* 1. Header & Primary AI Input */}
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-0.5">
            Ready to learn something new?
          </p>
        </div>

        {/* Hero AI Input Box */}
        <div className="relative p-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 rounded-2xl shadow-lg shadow-blue-500/10">
          <form
            onSubmit={handleStudySubmit}
            className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-[14px]"
          >
            <div className="flex items-center gap-3 w-full px-3 py-2">
              <Sparkles className="w-5 h-5 text-blue-500 shrink-0 animate-pulse" />
              <input
                type="text"
                value={studyInput}
                onChange={(e) => setStudyInput(e.target.value)}
                placeholder="What are you studying today? (e.g. TCP congestion control, Photosynthesis, Binary Search)"
                className="w-full text-sm sm:text-base bg-transparent border-none outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={!studyInput.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-semibold text-sm transition-all shadow-xs cursor-pointer shrink-0"
            >
              <span>Explain</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* 2. Dashboard Metric Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Goal */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Today's Goal</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {dueCardsCount} Cards
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {dueCardsCount > 0
                ? 'Due for spaced repetition'
                : flashcards.length === 0
                ? 'Review a flashcard deck to start your streak'
                : 'All review tasks caught up!'}
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{
                width: dueCardsCount > 0 ? `${Math.min(100, Math.round((dueCardsCount / Math.max(1, flashcards.length)) * 100))}%` : '0%'
              }}
            />
          </div>
        </div>

        {/* Study Time */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Study Time</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalStudyMinutes === 0
                ? '0 min'
                : totalStudyMinutes < 60
                ? `${totalStudyMinutes} min`
                : `${totalHours} hrs`}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {learningState.streakDays > 0
                ? `🔥 ${learningState.streakDays}-day learning streak`
                : '0 days streak'}
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: totalStudyMinutes > 0 ? `${Math.min(100, Math.round((totalStudyMinutes / 60) * 100))}%` : '0%' }}
            />
          </div>
        </div>

        {/* Quiz Accuracy */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Quiz Accuracy</span>
            <GraduationCap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalQuestions > 0 ? `${overallAccuracy}%` : '—'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalQuestions > 0
                ? `${correctQuestions}/${totalQuestions} solved correctly`
                : 'Complete a quiz to see your accuracy'}
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: totalQuestions > 0 ? `${overallAccuracy}%` : '0%' }}
            />
          </div>
        </div>

        {/* Topics to Review */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Topics to Review</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {topicsNeedingReview.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {topicsNeedingReview.length > 0
                ? topicsNeedingReview[0]
                : 'No topics needing review'}
            </p>
          </div>
          <button
            onClick={() => onNavigate(topicsNeedingReview.length > 0 ? 'progress' : 'quizzes')}
            className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1"
          >
            <span>{topicsNeedingReview.length > 0 ? 'View adaptive plan' : 'Take a quiz'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </section>

      {/* 3. Quick Actions */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={action.action}
              className="flex flex-col items-start p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all text-left group cursor-pointer"
            >
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 group-hover:scale-105 transition-transform mb-2">
                {action.icon}
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {action.title}
              </span>
              <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                {action.desc}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 4. Two-Column Layout: Recent Activity & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Activity
            </h2>
            {(documents.length > 0 || quizResults.length > 0) && (
              <button
                onClick={() => onNavigate('tutor')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View History
              </button>
            )}
          </div>

          <div className="space-y-3">
            {documents.length === 0 && quizResults.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mx-auto text-blue-500">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No study activity yet</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Start your first session to build your progress. Ask the AI Tutor, upload study notes, or generate a quiz!
                  </p>
                </div>
                <button
                  onClick={() => onStartTutorWithPrompt('', 'explain')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <span>Start Your First Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                {/* User Documents */}
                {documents.slice(0, 2).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {doc.fileName}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {doc.pageCount} pages • {doc.concepts.length} key concepts extracted
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('materials')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
                    >
                      Open
                    </button>
                  </div>
                ))}

                {/* User Quiz Performance */}
                {quizResults.slice(0, 2).map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          Quiz: {res.topic}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Score: {res.score}/{res.totalQuestions} ({res.accuracy}%)
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('quizzes')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Upcoming Exams & Revision (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Upcoming Milestones
            </h2>
            <button
              onClick={() => onNavigate('exam_prep')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Plan</span>
            </button>
          </div>

          <div className="space-y-3">
            {examPlans.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mx-auto text-rose-500">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">No upcoming exam plans</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Set your exam date and syllabus to generate an adaptive revision timeline.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('exam_prep')}
                  className="w-full py-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Build Exam Roadmap
                </button>
              </div>
            ) : (
              examPlans.slice(0, 2).map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                        {plan.daysRemaining} DAYS REMAINING
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                        {plan.examName}
                      </h3>
                      <p className="text-xs text-slate-400">{plan.subject}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Next Action:
                    </div>
                    {plan.dailyPlan[0]?.tasks.slice(0, 1).map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="line-clamp-1">{t.text}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => onNavigate('exam_prep')}
                    className="w-full text-center text-xs font-semibold py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    Open Study Roadmap
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
