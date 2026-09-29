import React, { useState } from 'react';
import {
  CalendarDays,
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  RotateCcw,
  Milestone,
  Edit3,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import type { ExamPlan } from '../../types';
import { generateExamPlanAPI } from '../../services/api';
import { Modal } from '../common/Modal';

interface ExamPrepViewProps {
  examPlans: ExamPlan[];
  onPlanAdded: (plan: ExamPlan) => void;
  onPlanUpdated: (plan: ExamPlan) => void;
  onPlanDeleted: (id: string) => void;
  onStartQuizFromTopic: (topic: string) => void;
  weakTopics?: string[];
}

export const ExamPrepView: React.FC<ExamPrepViewProps> = ({
  examPlans,
  onPlanAdded,
  onPlanUpdated,
  onPlanDeleted,
  onStartQuizFromTopic,
  weakTopics = []
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(examPlans[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form State
  const [examName, setExamName] = useState('');
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [availableHours, setAvailableHours] = useState<number>(3);
  const [topicsInput, setTopicsInput] = useState(() => {
    if (weakTopics.length > 0) {
      return weakTopics.join(', ');
    }
    return '';
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const activePlan = examPlans.find(p => p.id === selectedPlanId) || examPlans[0];

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || !examDate) return;
    setIsGenerating(true);

    try {
      const topicsList = topicsInput.split(',').map(t => t.trim()).filter(Boolean);
      const newPlan = await generateExamPlanAPI({
        examName,
        subject,
        examDate,
        availableHours,
        topics: topicsList,
        weakTopics
      });

      onPlanAdded(newPlan);
      setSelectedPlanId(newPlan.id);
      setShowCreateModal(false);
    } catch (err: any) {
      alert(`Failed to create exam plan: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateCurrentPlan = async () => {
    if (!activePlan) return;
    setIsGenerating(true);
    try {
      const updated = await generateExamPlanAPI({
        examName: activePlan.examName,
        subject: activePlan.subject,
        examDate: activePlan.examDate,
        availableHours: activePlan.dailyHours,
        topics: activePlan.topics,
        weakTopics
      });
      onPlanUpdated({ ...updated, id: activePlan.id });
    } catch (err: any) {
      alert(`Regeneration failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTask = (dayIndex: number, taskId: string) => {
    if (!activePlan) return;
    const updatedDaily = [...activePlan.dailyPlan];
    const day = { ...updatedDaily[dayIndex] };
    day.tasks = day.tasks.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    updatedDaily[dayIndex] = day;

    onPlanUpdated({
      ...activePlan,
      dailyPlan: updatedDaily
    });
  };

  const handleRescheduleTask = (dayIndex: number, taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activePlan) return;
    const updatedDaily = [...activePlan.dailyPlan];
    const sourceDay = { ...updatedDaily[dayIndex] };
    const taskIndex = sourceDay.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const [movedTask] = sourceDay.tasks.splice(taskIndex, 1);
    updatedDaily[dayIndex] = sourceDay;

    // Move to next day (or cycle to day 1)
    const targetDayIndex = (dayIndex + 1) % updatedDaily.length;
    const targetDay = { ...updatedDaily[targetDayIndex] };
    targetDay.tasks = [...targetDay.tasks, { ...movedTask, text: `${movedTask.text} (Rescheduled)` }];
    updatedDaily[targetDayIndex] = targetDay;

    onPlanUpdated({
      ...activePlan,
      dailyPlan: updatedDaily
    });
  };

  const handleAddTask = (dayIndex: number) => {
    const taskName = prompt('Enter new revision task:');
    if (!taskName || !taskName.trim()) return;

    if (!activePlan) return;
    const updatedDaily = [...activePlan.dailyPlan];
    const day = { ...updatedDaily[dayIndex] };
    day.tasks = [...day.tasks, { id: 't-' + Date.now(), text: taskName.trim(), completed: false }];
    updatedDaily[dayIndex] = day;

    onPlanUpdated({
      ...activePlan,
      dailyPlan: updatedDaily
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Structured Exam Preparation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalized revision roadmap connected to your study hours and weak topics.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Exam Plan</span>
        </button>
      </div>

      {/* Weak Topics Notification if present */}
      {weakTopics.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Personalized Focus:</strong> Identified weak topics from quizzes (<em>{weakTopics.slice(0, 3).join(', ')}</em>) are prioritized in your study roadmap.
            </span>
          </div>
        </div>
      )}

      {/* Plan Selector if multiple */}
      {examPlans.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {examPlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                plan.id === activePlan?.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {plan.examName} ({plan.daysRemaining} days left)
            </button>
          ))}
        </div>
      )}

      {/* Active Exam Plan Overview */}
      {activePlan ? (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                    {activePlan.daysRemaining} Days Until Exam
                  </span>
                  <span className="text-xs text-slate-400">{activePlan.subject}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {activePlan.examName}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Exam Date: {new Date(activePlan.examDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {activePlan.dailyHours} hrs
                  </div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Daily Target</div>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-center border border-blue-100 dark:border-blue-900">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {activePlan.totalStudyHours} hrs
                  </div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Total Prep</div>
                </div>

                {/* Regenerate Plan */}
                <button
                  onClick={handleRegenerateCurrentPlan}
                  disabled={isGenerating}
                  className="p-3 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Regenerate plan"
                >
                  <RotateCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>

                {/* Delete Plan */}
                <button
                  onClick={() => onPlanDeleted(activePlan.id)}
                  className="p-3 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Delete plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Covered Topics Tags */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 mr-1">Topics:</span>
              {activePlan.topics.map((t, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 italic">
              Note: This study plan is a structured preparation guide and does not guarantee specific exam performance.
            </div>
          </div>

          {/* Daily Roadmap Timeline */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Day-by-Day Revision Roadmap
            </h3>

            <div className="space-y-4">
              {activePlan.dailyPlan.map((day, dayIndex) => {
                const completedTasks = day.tasks.filter(t => t.completed).length;
                const isDayDone = completedTasks === day.tasks.length && day.tasks.length > 0;

                return (
                  <div
                    key={day.dayNumber}
                    className={`p-5 rounded-2xl border transition-all ${
                      isDayDone
                        ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-300 dark:border-emerald-900/60'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                            isDayDone
                              ? 'bg-emerald-500 text-white'
                              : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {day.dayNumber}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {day.title}
                          </h4>
                          <span className="text-xs text-slate-400">
                            Focus: <strong>{day.focusTopic}</strong> ({day.allocatedHours} hours target)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {day.milestone && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            <Milestone className="w-3 h-3" />
                            <span>{day.milestone}</span>
                          </span>
                        )}
                        <button
                          onClick={() => onStartQuizFromTopic(day.focusTopic)}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                        >
                          Practice Quiz
                        </button>
                      </div>
                    </div>

                    {/* Task Checklist */}
                    <div className="pt-3 space-y-2">
                      {day.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                        >
                          <div
                            onClick={() => toggleTask(dayIndex, task.id)}
                            className="flex items-start gap-3 cursor-pointer select-none flex-1"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                            )}
                            <span
                              className={`text-xs sm:text-sm ${
                                task.completed
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              {task.text}
                            </span>
                          </div>

                          <button
                            onClick={(e) => handleRescheduleTask(dayIndex, task.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 rounded text-[11px] flex items-center gap-1 transition-opacity"
                            title="Reschedule task to next study day"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>+1 Day</span>
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => handleAddTask(dayIndex)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium pt-1 px-2"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add custom study task</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <CalendarDays className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No exam plan yet
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Build your personalized study roadmap with milestones and practice tests.
          </p>
          <div className="pt-1">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Build Exam Roadmap</span>
            </button>
          </div>
        </div>
      )}

      {/* Plan Creator Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Personalized Exam Plan">
        <form onSubmit={handleGeneratePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Exam Name
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. Distributed Systems Midterm"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Exam Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Available Daily Study Hours
            </label>
            <select
              value={availableHours}
              onChange={(e) => setAvailableHours(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden"
            >
              <option value={1}>1 hour / day</option>
              <option value={2}>2 hours / day</option>
              <option value={3}>3 hours / day (Recommended)</option>
              <option value={4}>4 hours / day (Intensive)</option>
              <option value={6}>6 hours / day (Full-time)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Topics to Cover (comma-separated)
            </label>
            <textarea
              rows={3}
              value={topicsInput}
              onChange={(e) => setTopicsInput(e.target.value)}
              placeholder="e.g. Cell Structure, Photosynthesis, Genetics or Data Structures, Algorithms"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
              required
            />
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
              disabled={isGenerating || !examName.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Structuring Plan...' : 'Generate Plan'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
