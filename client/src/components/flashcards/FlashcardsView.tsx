import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Plus,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  Shuffle
} from 'lucide-react';
import { Flashcard, FlashcardState, ProcessedDocument } from '../../types';
import { calculateNextReview, isCardDueForReview, ReviewRating } from '../../services/spacedRepetition';
import { generateFlashcardsAPI } from '../../services/api';
import { Modal } from '../common/Modal';

interface FlashcardsViewProps {
  flashcards: Flashcard[];
  documents: ProcessedDocument[];
  onFlashcardUpdated: (card: Flashcard) => void;
  onFlashcardsAdded: (cards: Flashcard[]) => void;
  onFlashcardDeleted: (id: string) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  flashcards,
  documents,
  onFlashcardUpdated,
  onFlashcardsAdded,
  onFlashcardDeleted
}) => {
  const [filter, setFilter] = useState<'all' | 'due' | 'new' | 'learning' | 'mastered'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Manual create form state
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newTopic, setNewTopic] = useState('Computer Science');

  // AI generator form state
  const [aiTopic, setAiTopic] = useState('');
  const [aiDocId, setAiDocId] = useState<string>('');
  const [aiCount, setAiCount] = useState<number>(6);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter cards
  const filteredCards = flashcards.filter(card => {
    if (filter === 'due') return isCardDueForReview(card);
    if (filter === 'new') return card.state === 'new';
    if (filter === 'learning') return card.state === 'learning';
    if (filter === 'mastered') return card.state === 'mastered';
    return true;
  });

  const activeCard: Flashcard | undefined = filteredCards[currentIndex];

  // Counters
  const counts = {
    all: flashcards.length,
    due: flashcards.filter(c => isCardDueForReview(c)).length,
    new: flashcards.filter(c => c.state === 'new').length,
    learning: flashcards.filter(c => c.state === 'learning').length,
    mastered: flashcards.filter(c => c.state === 'mastered').length
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % Math.max(1, filteredCards.length));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + filteredCards.length) % Math.max(1, filteredCards.length));
  };

  const handleRateCard = (rating: ReviewRating) => {
    if (!activeCard) return;
    const reviewResult = calculateNextReview(activeCard, rating);
    const updated: Flashcard = {
      ...activeCard,
      ...reviewResult,
      lastReviewedDate: new Date().toISOString()
    };
    onFlashcardUpdated(updated);
    handleNext();
  };

  const handleManualCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    const newCard: Flashcard = {
      id: 'fc-' + Date.now(),
      front: newFront.trim(),
      back: newBack.trim(),
      topic: newTopic.trim() || 'General',
      state: 'new',
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    onFlashcardsAdded([newCard]);
    setNewFront('');
    setNewBack('');
    setShowCreateModal(false);
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const selectedDoc = documents.find(d => d.id === aiDocId);
      const generated = await generateFlashcardsAPI({
        topic: aiTopic || (selectedDoc ? selectedDoc.fileName : 'Academic Revision'),
        count: aiCount,
        documentContext: selectedDoc ? { flashcards: selectedDoc.flashcards } : null
      });

      onFlashcardsAdded(generated);
      setShowAIModal(false);
      setAiTopic('');
    } catch (err: any) {
      alert(`Flashcard generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Spaced Repetition Flashcards
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            SuperMemo SM-2 memory scheduling for guaranteed long-term retention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate with AI</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Counters */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl">
        {[
          { id: 'all', label: 'All Cards', count: counts.all },
          { id: 'due', label: 'Due for Review', count: counts.due, alert: counts.due > 0 },
          { id: 'new', label: 'New', count: counts.new },
          { id: 'learning', label: 'Learning', count: counts.learning },
          { id: 'mastered', label: 'Mastered', count: counts.mastered }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setFilter(tab.id as any);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                tab.alert
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Active Card Container */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No cards found in this view
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filter === 'due'
              ? 'Great job! You have no cards due for review right now.'
              : 'Add custom notes or click "Generate with AI" to build your deck.'}
          </p>
        </div>
      ) : activeCard ? (
        <div className="space-y-6">
          {/* Card Meta & Navigation */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                {activeCard.topic}
              </span>
              <span>•</span>
              <span
                className={`font-semibold capitalize px-2 py-0.5 rounded-full text-[10px] ${
                  activeCard.state === 'mastered'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                    : activeCard.state === 'learning'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                    : 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                }`}
              >
                {activeCard.state}
              </span>
            </div>

            <div className="flex items-center gap-1 font-medium">
              <span>Card {currentIndex + 1} of {filteredCards.length}</span>
            </div>
          </div>

          {/* 3D Flip Card Viewport */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[300px] sm:min-h-[340px] cursor-pointer perspective-1000 select-none group"
          >
            <div
              className={`relative w-full h-full min-h-[300px] sm:min-h-[340px] rounded-2xl p-8 flex flex-col justify-between transition-transform duration-500 transform-style-preserve-3d shadow-md border ${
                isFlipped
                  ? 'rotate-y-180 bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
              }`}
            >
              {/* Front of Card */}
              <div className={`space-y-4 backface-hidden ${isFlipped ? 'hidden' : 'block'}`}>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
                    QUESTION
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-blue-500 transition-colors">
                    <RotateCw className="w-3 h-3" />
                    <span>Click to reveal answer</span>
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed pt-4">
                  {activeCard.front}
                </h3>
              </div>

              {/* Back of Card */}
              <div
                className={`space-y-4 backface-hidden rotate-y-180 ${
                  isFlipped ? 'block' : 'hidden'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                    ANSWER & EXPLANATION
                  </span>
                  <span className="text-[11px] text-slate-400">Tap to flip back</span>
                </div>
                <div className="text-base sm:text-lg text-slate-800 dark:text-slate-100 leading-relaxed pt-2">
                  {activeCard.back}
                </div>
                {activeCard.repetitions > 0 && (
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                    Current Interval: {activeCard.interval} days • Repetitions: {activeCard.repetitions}
                  </div>
                )}
              </div>

              {/* Bottom Card Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                <span>Next review: {new Date(activeCard.nextReviewDate).toLocaleDateString()}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFlashcardDeleted(activeCard.id);
                  }}
                  className="p-1 hover:text-rose-500 rounded transition-colors"
                  title="Delete card"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Rating Action Buttons (Active when flipped) */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-center text-slate-400 uppercase tracking-wider">
              {isFlipped ? 'Rate your recall to schedule next review' : 'Reveal answer to record spaced repetition score'}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleRateCard('difficult')}
                disabled={!isFlipped}
                className="py-3 px-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-bold text-xs sm:text-sm hover:bg-rose-100 disabled:opacity-40 transition-colors flex flex-col items-center gap-0.5 cursor-pointer"
              >
                <span>Difficult</span>
                <span className="text-[10px] font-normal opacity-80">Reset (1 day)</span>
              </button>

              <button
                onClick={() => handleRateCard('review')}
                disabled={!isFlipped}
                className="py-3 px-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-bold text-xs sm:text-sm hover:bg-amber-100 disabled:opacity-40 transition-colors flex flex-col items-center gap-0.5 cursor-pointer"
              >
                <span>Review</span>
                <span className="text-[10px] font-normal opacity-80">Good (+3 days)</span>
              </button>

              <button
                onClick={() => handleRateCard('know')}
                disabled={!isFlipped}
                className="py-3 px-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm hover:bg-emerald-100 disabled:opacity-40 transition-colors flex flex-col items-center gap-0.5 cursor-pointer"
              >
                <span>Know</span>
                <span className="text-[10px] font-normal opacity-80">Easy (+6-8 days)</span>
              </button>
            </div>
          </div>

          {/* Previous / Next Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Manual Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Flashcard">
        <form onSubmit={handleManualCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Topic / Subject
            </label>
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g. Computer Networks"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Front (Question / Prompt)
            </label>
            <textarea
              rows={3}
              value={newFront}
              onChange={(e) => setNewFront(e.target.value)}
              placeholder="What does AIMD stand for?"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Back (Answer / Explanation)
            </label>
            <textarea
              rows={4}
              value={newBack}
              onChange={(e) => setNewBack(e.target.value)}
              placeholder="Additive Increase Multiplicative Decrease..."
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              Save Card
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Generate Modal */}
      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="Generate Flashcards with AI">
        <form onSubmit={handleAIGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Target Topic
            </label>
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g. TCP Congestion Control, Photosynthesis, Binary Trees"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
            />
          </div>

          {documents.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Or Derive from Uploaded Document
              </label>
              <select
                value={aiDocId}
                onChange={(e) => setAiDocId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden"
              >
                <option value="">None (Use Topic above)</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fileName} ({d.pageCount} pages)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Number of Cards
            </label>
            <select
              value={aiCount}
              onChange={(e) => setAiCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-hidden"
            >
              <option value={4}>4 Cards (Quick)</option>
              <option value={6}>6 Cards (Recommended)</option>
              <option value={10}>10 Cards (Deep)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAIModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || (!aiTopic.trim() && !aiDocId)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating Cards...' : 'Generate Flashcards'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
