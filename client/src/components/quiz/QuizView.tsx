import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Clock,
  Target,
  AlertTriangle,
  BookOpen,
  Sliders,
  ChevronRight,
  Plus
} from 'lucide-react';
import { QuizQuestion, QuizResult, ProcessedDocument } from '../../types';
import { generateQuizAPI } from '../../services/api';
import { StorageService } from '../../services/storage';
import { Modal } from '../common/Modal';

interface QuizViewProps {
  documents: ProcessedDocument[];
  onStartTutorReview: (topic: string) => void;
  onQuizCompleted?: (result: QuizResult) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ documents, onStartTutorReview, onQuizCompleted }) => {
  // Quiz Generator Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetTopic, setTargetTopic] = useState('');
  const [targetSubject, setTargetSubject] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Quiz Playing State
  const [activeQuiz, setActiveQuiz] = useState<{ id: string; topic: string; questions: QuizQuestion[] } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: string }>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  // Results State
  const [completedResult, setCompletedResult] = useState<QuizResult | null>(null);
  const [pastResults, setPastResults] = useState<QuizResult[]>(() => StorageService.getQuizResults());

  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const selectedDoc = documents.find(d => d.id === selectedDocId);
      const quiz = await generateQuizAPI({
        topic: targetTopic || (selectedDoc ? selectedDoc.fileName : 'General Revision'),
        subject: targetSubject,
        difficulty,
        count: questionCount,
        documentContext: selectedDoc ? { mcqs: selectedDoc.mcqs } : null
      });

      setActiveQuiz({
        id: quiz.id,
        topic: targetTopic || (selectedDoc ? selectedDoc.fileName : 'General Revision'),
        questions: quiz.questions
      });
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setSelectedOption(null);
      setIsSubmitted(false);
      setCompletedResult(null);
      setStartTime(Date.now());
      setShowCreateModal(false);
    } catch (err: any) {
      alert(`Quiz generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (option: string) => {
    if (isSubmitted) return;
    setSelectedOption(option);
  };

  const handleConfirmAnswer = () => {
    if (!activeQuiz || !selectedOption) return;
    const currentQ = activeQuiz.questions[currentQuestionIndex];
    const newAnswers = { ...userAnswers, [currentQ.id]: selectedOption };
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      // Completed all questions!
      finishQuiz(newAnswers);
    }
  };

  const finishQuiz = (finalAnswers: { [qId: string]: string }) => {
    if (!activeQuiz) return;
    const timeSpent = Math.max(10, Math.round((Date.now() - startTime) / 1000));
    let score = 0;
    const weakTopicsSet = new Set<string>();

    activeQuiz.questions.forEach(q => {
      const ans = finalAnswers[q.id];
      if (ans && ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        score += 1;
      } else {
        if (q.topic) weakTopicsSet.add(q.topic);
      }
    });

    const accuracy = Math.round((score / activeQuiz.questions.length) * 100);

    const result: QuizResult = {
      id: 'res-' + Date.now(),
      quizId: activeQuiz.id,
      topic: activeQuiz.topic,
      subject: targetSubject,
      difficulty,
      totalQuestions: activeQuiz.questions.length,
      score,
      accuracy,
      userAnswers: finalAnswers,
      questions: activeQuiz.questions,
      completedAt: new Date().toISOString(),
      timeSpentSeconds: timeSpent,
      weakTopics: Array.from(weakTopicsSet)
    };

    StorageService.addQuizResult(result);
    setPastResults(StorageService.getQuizResults());
    setCompletedResult(result);
    setActiveQuiz(null);
    onQuizCompleted?.(result);

    // Confetti if high score!
    if (accuracy >= 80) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const currentQ: QuizQuestion | undefined = activeQuiz?.questions[currentQuestionIndex];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Targeted Quiz Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Turn test mistakes into personalized learning recommendations.
          </p>
        </div>

        {!activeQuiz && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Quiz</span>
          </button>
        )}
      </div>

      {/* 1. ACTIVE QUIZ PLAYER */}
      {activeQuiz && currentQ && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          {/* Progress Bar & Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {activeQuiz.topic}
              </span>
              <span className="font-medium">
                Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              {currentQ.type.replace('_', ' ').toUpperCase()}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(option)}
                  className={`w-full p-4 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between border cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs font-semibold'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Confirm Button */}
          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleConfirmAnswer}
              disabled={!selectedOption}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors cursor-pointer shadow-xs"
            >
              <span>{currentQuestionIndex === activeQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. QUIZ RESULTS SCREEN */}
      {completedResult && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                QUIZ COMPLETED
              </span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {completedResult.topic}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed in {Math.round(completedResult.timeSpentSeconds)}s • {completedResult.difficulty.toUpperCase()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-center border border-blue-100 dark:border-blue-900">
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {completedResult.accuracy}%
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Accuracy</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700">
                <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {completedResult.score}/{completedResult.totalQuestions}
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Score</div>
              </div>
            </div>
          </div>

          {/* Adaptive Learning Recommendations */}
          {completedResult.weakTopics.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Identified Weak Topics to Review:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {completedResult.weakTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200"
                  >
                    {topic}
                  </span>
                ))}
              </div>
              <div className="pt-1">
                <button
                  onClick={() => onStartTutorReview(`Explain and clarify my mistakes regarding: ${completedResult.weakTopics.join(', ')}`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Review Weak Topics in AI Tutor</span>
                </button>
              </div>
            </div>
          )}

          {/* Detailed Question Explanations */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Question-by-Question Breakdown
            </h3>
            <div className="space-y-3">
              {completedResult.questions.map((q, idx) => {
                const userAns = completedResult.userAnswers[q.id];
                const isCorrect = userAns && userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

                return (
                  <div
                    key={q.id}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {idx + 1}. {q.question}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 pl-7">
                      <p className="text-slate-600 dark:text-slate-400">
                        <strong>Your answer:</strong> <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400 font-medium'}>{userAns || 'No answer'}</span>
                      </p>
                      {!isCorrect && (
                        <p className="text-slate-600 dark:text-slate-400">
                          <strong>Correct answer:</strong> <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{q.correctAnswer}</span>
                        </p>
                      )}
                      <p className="text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setCompletedResult(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Take Another Quiz</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. RECENT QUIZ RESULTS ARCHIVE */}
      {!activeQuiz && !completedResult && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Past Quiz Attempts
          </h2>
          {pastResults.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
              <GraduationCap className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm">No quizzes taken yet. Click "New Quiz" to test your knowledge!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastResults.map((res) => (
                <div
                  key={res.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {res.subject} • {res.difficulty.toUpperCase()}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {res.topic}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Completed {new Date(res.completedAt).toLocaleDateString()} • {res.totalQuestions} Questions
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {res.score}/{res.totalQuestions}
                      </div>
                      <div
                        className={`text-xs font-semibold ${
                          res.accuracy >= 80 ? 'text-emerald-500' : 'text-amber-500'
                        }`}
                      >
                        {res.accuracy}% Accuracy
                      </div>
                    </div>
                    <button
                      onClick={() => setCompletedResult(res)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quiz Creation Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Practice Quiz">
        <form onSubmit={handleStartQuiz} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Study Topic
            </label>
            <input
              type="text"
              value={targetTopic}
              onChange={(e) => setTargetTopic(e.target.value)}
              placeholder="e.g. TCP Congestion Control, Photosynthesis, Binary Trees"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Subject Category
            </label>
            <input
              type="text"
              value={targetSubject}
              onChange={(e) => setTargetSubject(e.target.value)}
              placeholder="e.g. Computer Networks, Biology, Algorithms"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
            />
          </div>

          {documents.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Ground in Uploaded Document (Optional)
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden"
              >
                <option value="">None (General Topic)</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fileName} ({d.pageCount} pages)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden"
              >
                <option value="easy">Easy (Fundamentals)</option>
                <option value="medium">Medium (Standard Exam)</option>
                <option value="hard">Hard (Deep Application)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Number of Questions
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden"
              >
                <option value={5}>5 Questions (Quick)</option>
                <option value={10}>10 Questions (Standard)</option>
                <option value={20}>20 Questions (Full Test)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !targetTopic.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating Quiz...' : 'Start Quiz'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
