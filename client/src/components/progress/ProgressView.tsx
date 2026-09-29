import React from 'react';
import {
  TrendingUp,
  Clock,
  Target,
  GraduationCap,
  Layers,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Calendar,
  Flame,
  Award
} from 'lucide-react';
import { LearningState, Flashcard, QuizResult } from '../../types';

interface ProgressViewProps {
  learningState: LearningState;
  flashcards: Flashcard[];
  quizResults: QuizResult[];
  onStartTutorWithPrompt: (prompt: string, mode: any) => void;
  onStartQuizFromTopic: (topic: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  learningState,
  flashcards,
  quizResults,
  onStartTutorWithPrompt,
  onStartQuizFromTopic
}) => {
  const totalStudyMinutes = learningState.totalStudyMinutes || 0;
  const totalHours = (totalStudyMinutes / 60).toFixed(1);
  const attempted = learningState.questionsAttempted || 0;
  const correct = learningState.questionsCorrect || 0;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  
  const reviewedFlashcardsCount = flashcards.filter(c => c.repetitions > 0).length;
  const topicsList = Object.keys(learningState.topicPerformance || {});

  // Adaptive Recommendations Engine (Rule-based, honest, pedagogical)
  const recommendations: {
    type: 'review' | 'easier' | 'practice' | 'advanced';
    title: string;
    description: string;
    actionLabel: string;
    action: () => void;
  }[] = [];

  Object.entries(learningState.topicPerformance || {}).forEach(([topic, perf]) => {
    const topicAcc = perf.attempted > 0 ? perf.correct / perf.attempted : 1;
    if (perf.masteryStatus === 'needs_review' || topicAcc < 0.6) {
      recommendations.push({
        type: 'review',
        title: `Review Topic: ${topic}`,
        description: `Current accuracy is ${Math.round(topicAcc * 100)}% across ${perf.attempted} questions. Revisit foundational concepts.`,
        actionLabel: 'Explain Again (Beginner)',
        action: () => onStartTutorWithPrompt(`Explain ${topic} simply at beginner level`, 'explain')
      });
      recommendations.push({
        type: 'practice',
        title: `Practice 5 questions in ${topic}`,
        description: 'Reinforce memory retrieval with targeted test questions.',
        actionLabel: 'Take Practice Quiz',
        action: () => onStartQuizFromTopic(topic)
      });
    } else if (perf.masteryStatus === 'strong' && topicAcc >= 0.8) {
      recommendations.push({
        type: 'advanced',
        title: `You are ready for advanced questions in ${topic}`,
        description: `High mastery demonstrated (${Math.round(topicAcc * 100)}% accuracy). Challenge yourself with complex edge cases.`,
        actionLabel: 'Ask Advanced Question',
        action: () => onStartTutorWithPrompt(`Explain advanced edge cases and mathematical optimization for ${topic}`, 'explain')
      });
    }
  });

  // If no recommendations, array remains empty and UI renders an onboarding zero state

  // Weekly study activity data
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxWeeklyMinutes = Math.max(60, ...daysOfWeek.map(d => learningState.weeklyActivity?.[d] || 0));

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Learning Progress & Adaptive State
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Objective performance tracking based on verified recall, quizzes, and revision history.
        </p>
      </div>

      {/* 1. Core Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Study Time</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalStudyMinutes === 0 ? '0 min' : totalStudyMinutes < 60 ? `${totalStudyMinutes} min` : `${totalHours} hrs`}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Total productive study sessions</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Quiz Accuracy</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {attempted > 0 ? `${accuracy}%` : '—'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {attempted > 0 ? `${correct} of ${attempted} questions correct` : 'Complete a quiz to see your accuracy'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Flashcards Reviewed</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{reviewedFlashcardsCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Cards in spaced repetition cycle</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Current Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{learningState.streakDays || 0} Days</div>
          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            {(learningState.streakDays || 0) > 0 ? 'Keep up daily active recall!' : 'Start studying today to build your streak!'}
          </div>
        </div>
      </div>

      {/* 2. Adaptive Learning Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Adaptive Learning Recommendations
          </h2>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
            <Sparkles className="w-7 h-7 text-blue-500 mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Adaptive Recommendations Yet
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Complete practice quizzes or flashcard reviews to unlock personalized study recommendations based on your verified recall.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 4).map((rec, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                  rec.type === 'review'
                    ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                    : rec.type === 'advanced'
                    ? 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="space-y-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      rec.type === 'review'
                        ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                        : rec.type === 'advanced'
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {rec.type.replace('_', ' ')}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {rec.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {rec.description}
                  </p>
                </div>

                <div>
                  <button
                    onClick={rec.action}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>{rec.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Weekly Activity Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Weekly Study Activity (Minutes per day)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Recorded study & quiz engagement</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>This Week</span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-4 flex items-end justify-between gap-3 h-48 px-2 sm:px-6">
          {daysOfWeek.map((day) => {
            const minutes = learningState.weeklyActivity?.[day] || 0;
            const heightPercent = minutes > 0 ? Math.max(8, Math.round((minutes / maxWeeklyMinutes) * 100)) : 0;

            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-500 transition-colors">
                  {minutes}m
                </span>
                <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-t-lg h-32 flex items-end p-1">
                  <div
                    className="w-full bg-blue-600 hover:bg-blue-500 rounded-sm transition-all duration-500 cursor-pointer shadow-xs"
                    style={{ height: `${heightPercent}%` }}
                    title={`${day}: ${minutes} minutes`}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Topic Mastery Breakdown */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Topic Mastery Status
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Requires &ge;80% accuracy across multiple questions for "Strong" label
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.keys(learningState.topicPerformance || {}).length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <GraduationCap className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Topic Mastery Recorded Yet
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Topic-level mastery updates automatically as you complete quizzes and review flashcards.
              </p>
            </div>
          ) : (
            Object.entries(learningState.topicPerformance || {}).map(([topic, perf]) => {
              const acc = perf.attempted > 0 ? Math.round((perf.correct / perf.attempted) * 100) : 0;
              return (
                <div
                  key={topic}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {topic}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {perf.correct}/{perf.attempted} questions solved ({acc}% accuracy) • Last studied {new Date(perf.lastStudied).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        perf.masteryStatus === 'strong'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : perf.masteryStatus === 'learning'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {perf.masteryStatus === 'strong'
                        ? 'Strong'
                        : perf.masteryStatus === 'learning'
                        ? 'Learning'
                        : 'Needs Review'}
                    </span>

                    <button
                      onClick={() => onStartTutorWithPrompt(`Explain key concepts and edge cases for ${topic}`, 'explain')}
                      className="p-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Revise
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
