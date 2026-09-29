import {
  Conversation,
  ProcessedDocument,
  Flashcard,
  QuizResult,
  ExamPlan,
  LearningState,
  SavedNote
} from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'studypilot_conversations',
  CURRENT_CONV_ID: 'studypilot_active_conv_id',
  DOCUMENTS: 'studypilot_documents',
  FLASHCARDS: 'studypilot_flashcards',
  QUIZ_RESULTS: 'studypilot_quiz_results',
  EXAM_PLANS: 'studypilot_exam_plans',
  LEARNING_STATE: 'studypilot_learning_state',
  SAVED_NOTES: 'studypilot_saved_notes',
  THEME: 'studypilot_theme'
};

const STORAGE_VERSION_KEY = 'studypilot_schema_version';
const CURRENT_SCHEMA_VERSION = 'v3_production_release';

/**
 * Robust zero-state & schema version migration.
 * Runs immediately on module load in the browser.
 * - Detects and purges legacy fabricated demo data (e.g. 3.8 hrs, 21/29 questions, Routing Protocols).
 * - Preserves authentic student-created data when present.
 * - Guarantees that fresh browsers and returning users always start at an authentic zero state.
 */
function migrateAndPurgeLegacyData() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY);
    const existingStateRaw = localStorage.getItem(STORAGE_KEYS.LEARNING_STATE);
    const existingFlashcardsRaw = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
    const existingQuizResultsRaw = localStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
    const existingPlansRaw = localStorage.getItem(STORAGE_KEYS.EXAM_PLANS);

    const legacyDemoIds = ['fc-1', 'fc-2', 'fc-3', 'res-demo-1', 'plan-demo-1', 'conv-demo-1'];
    const isContaminated = (
      (existingStateRaw && (
        existingStateRaw.includes('Routing Protocols') ||
        existingStateRaw.includes('215') ||
        existingStateRaw.includes('228') ||
        existingStateRaw.includes('TCP Congestion')
      )) ||
      (existingFlashcardsRaw && (existingFlashcardsRaw.includes('fc-1') || existingFlashcardsRaw.includes('fc-2') || existingFlashcardsRaw.includes('fc-3'))) ||
      (existingQuizResultsRaw && existingQuizResultsRaw.includes('res-demo-1')) ||
      (existingPlansRaw && existingPlansRaw.includes('plan-demo-1'))
    );

    if (version !== CURRENT_SCHEMA_VERSION || isContaminated) {
      // 1. Cleanse Flashcards: remove only legacy demo cards
      if (existingFlashcardsRaw) {
        try {
          const cards: Flashcard[] = JSON.parse(existingFlashcardsRaw);
          const realCards = cards.filter(c => !legacyDemoIds.includes(c.id));
          if (realCards.length > 0) {
            localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(realCards));
          } else {
            localStorage.removeItem(STORAGE_KEYS.FLASHCARDS);
          }
        } catch {
          localStorage.removeItem(STORAGE_KEYS.FLASHCARDS);
        }
      }

      // 2. Cleanse Quiz Results: remove legacy demo results
      if (existingQuizResultsRaw) {
        try {
          const results: QuizResult[] = JSON.parse(existingQuizResultsRaw);
          const realResults = results.filter(r => !legacyDemoIds.includes(r.id));
          if (realResults.length > 0) {
            localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(realResults));
          } else {
            localStorage.removeItem(STORAGE_KEYS.QUIZ_RESULTS);
          }
        } catch {
          localStorage.removeItem(STORAGE_KEYS.QUIZ_RESULTS);
        }
      }

      // 3. Cleanse Exam Plans: remove legacy demo plans
      if (existingPlansRaw) {
        try {
          const plans: ExamPlan[] = JSON.parse(existingPlansRaw);
          const realPlans = plans.filter(p => !legacyDemoIds.includes(p.id));
          if (realPlans.length > 0) {
            localStorage.setItem(STORAGE_KEYS.EXAM_PLANS, JSON.stringify(realPlans));
          } else {
            localStorage.removeItem(STORAGE_KEYS.EXAM_PLANS);
          }
        } catch {
          localStorage.removeItem(STORAGE_KEYS.EXAM_PLANS);
        }
      }

      // 4. Cleanse Learning State: if contaminated with fake 3.8 hrs or Routing Protocols, reset
      if (isContaminated || !version) {
        localStorage.removeItem(STORAGE_KEYS.LEARNING_STATE);
        localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_CONV_ID);
      }

      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_SCHEMA_VERSION);
    }
  } catch (e) {
    console.warn('Storage migration warning:', e);
  }
}

migrateAndPurgeLegacyData();

// Clean Zero State Initialization (No fabricated student history)
const INITIAL_ZERO_STATE: {
  conversations: Conversation[];
  documents: ProcessedDocument[];
  flashcards: Flashcard[];
  quizResults: QuizResult[];
  examPlans: ExamPlan[];
  learningState: LearningState;
  savedNotes: SavedNote[];
} = {
  conversations: [],
  documents: [],
  flashcards: [],
  quizResults: [],
  examPlans: [],
  learningState: {
    totalStudyMinutes: 0,
    questionsAttempted: 0,
    questionsCorrect: 0,
    streakDays: 0,
    lastActiveDate: new Date().toISOString(),
    topicPerformance: {},
    weeklyActivity: {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0
    }
  },
  savedNotes: []
};

export const StorageService = {
  // --- Conversations ---
  getConversations(): Conversation[] {
    const val = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!val) {
      return [];
    }
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  },

  saveConversations(convs: Conversation[]) {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));
  },

  getActiveConversationId(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CONV_ID) || '';
  },

  setActiveConversationId(id: string) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CONV_ID, id);
  },

  // --- Documents ---
  getDocuments(): ProcessedDocument[] {
    const val = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!val) {
      return [];
    }
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  },

  saveDocuments(docs: ProcessedDocument[]) {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  },

  addDocument(doc: ProcessedDocument) {
    const docs = this.getDocuments();
    const updated = [doc, ...docs.filter(d => d.id !== doc.id)];
    this.saveDocuments(updated);
  },

  deleteDocument(id: string) {
    const docs = this.getDocuments().filter(d => d.id !== id);
    this.saveDocuments(docs);
  },

  // --- Flashcards ---
  getFlashcards(): Flashcard[] {
    const val = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
    if (!val) {
      return [];
    }
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  },

  saveFlashcards(cards: Flashcard[]) {
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(cards));
  },

  addFlashcards(newCards: Flashcard[]) {
    const cards = this.getFlashcards();
    this.saveFlashcards([...newCards, ...cards]);
  },

  updateFlashcard(card: Flashcard) {
    const cards = this.getFlashcards();
    const index = cards.findIndex(c => c.id === card.id);
    if (index !== -1) {
      cards[index] = card;
      this.saveFlashcards([...cards]);
    }
  },

  deleteFlashcard(id: string) {
    const cards = this.getFlashcards().filter(c => c.id !== id);
    this.saveFlashcards(cards);
  },

  // --- Quiz Results ---
  getQuizResults(): QuizResult[] {
    const val = localStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
    if (!val) {
      return [];
    }
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  },

  saveQuizResults(results: QuizResult[]) {
    localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(results));
  },

  addQuizResult(result: QuizResult) {
    const results = this.getQuizResults();
    this.saveQuizResults([result, ...results]);
    this.recordQuizInLearningState(result);
  },

  // --- Exam Plans ---
  getExamPlans(): ExamPlan[] {
    const val = localStorage.getItem(STORAGE_KEYS.EXAM_PLANS);
    if (!val) {
      return [];
    }
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  },

  saveExamPlans(plans: ExamPlan[]) {
    localStorage.setItem(STORAGE_KEYS.EXAM_PLANS, JSON.stringify(plans));
  },

  addExamPlan(plan: ExamPlan) {
    const plans = this.getExamPlans();
    this.saveExamPlans([plan, ...plans]);
  },

  updateExamPlan(plan: ExamPlan) {
    const plans = this.getExamPlans();
    const index = plans.findIndex(p => p.id === plan.id);
    if (index !== -1) {
      plans[index] = plan;
      this.saveExamPlans([...plans]);
    }
  },

  deleteExamPlan(id: string) {
    const plans = this.getExamPlans().filter(p => p.id !== id);
    this.saveExamPlans(plans);
  },

  // --- Learning State & Progress ---
  getLearningState(): LearningState {
    const val = localStorage.getItem(STORAGE_KEYS.LEARNING_STATE);
    if (!val) {
      return {
        totalStudyMinutes: 0,
        questionsAttempted: 0,
        questionsCorrect: 0,
        streakDays: 0,
        lastActiveDate: new Date().toISOString(),
        topicPerformance: {},
        weeklyActivity: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
      };
    }
    try {
      return JSON.parse(val);
    } catch {
      return {
        totalStudyMinutes: 0,
        questionsAttempted: 0,
        questionsCorrect: 0,
        streakDays: 0,
        lastActiveDate: new Date().toISOString(),
        topicPerformance: {},
        weeklyActivity: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
      };
    }
  },

  saveLearningState(state: LearningState) {
    localStorage.setItem(STORAGE_KEYS.LEARNING_STATE, JSON.stringify(state));
  },

  recordStudyTime(minutes: number) {
    const state = this.getLearningState();
    state.totalStudyMinutes += minutes;
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    if (state.weeklyActivity[dayName] !== undefined) {
      state.weeklyActivity[dayName] += minutes;
    } else {
      state.weeklyActivity[dayName] = minutes;
    }
    if (state.streakDays === 0) {
      state.streakDays = 1;
    }
    state.lastActiveDate = new Date().toISOString();
    this.saveLearningState(state);
  },

  recordQuizInLearningState(result: QuizResult) {
    const state = this.getLearningState();
    state.questionsAttempted += result.totalQuestions;
    state.questionsCorrect += result.score;
    state.totalStudyMinutes += Math.round(result.timeSpentSeconds / 60) || 5;

    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    const quizMinutes = Math.round(result.timeSpentSeconds / 60) || 5;
    if (state.weeklyActivity[dayName] !== undefined) {
      state.weeklyActivity[dayName] += quizMinutes;
    } else {
      state.weeklyActivity[dayName] = quizMinutes;
    }
    if (state.streakDays === 0) {
      state.streakDays = 1;
    }

    const topic = result.topic || 'General';
    const current = state.topicPerformance[topic] || {
      attempted: 0,
      correct: 0,
      lastStudied: new Date().toISOString(),
      masteryStatus: 'learning'
    };

    current.attempted += result.totalQuestions;
    current.correct += result.score;
    current.lastStudied = new Date().toISOString();

    const acc = current.correct / current.attempted;
    if (acc >= 0.8 && current.attempted >= 5) {
      current.masteryStatus = 'strong';
    } else if (acc < 0.6) {
      current.masteryStatus = 'needs_review';
    } else {
      current.masteryStatus = 'learning';
    }

    state.topicPerformance[topic] = current;
    this.saveLearningState(state);
  },

  // --- Saved Notes ---
  getSavedNotes(): SavedNote[] {
    const val = localStorage.getItem(STORAGE_KEYS.SAVED_NOTES);
    if (!val) {
      return [];
    }
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  },

  saveSavedNotes(notes: SavedNote[]) {
    localStorage.setItem(STORAGE_KEYS.SAVED_NOTES, JSON.stringify(notes));
  },

  addSavedNote(note: SavedNote) {
    const notes = this.getSavedNotes();
    this.saveSavedNotes([note, ...notes]);
  },

  deleteSavedNote(id: string) {
    const notes = this.getSavedNotes().filter(n => n.id !== id);
    this.saveSavedNotes(notes);
  },

  // --- Privacy & Data Management Controls ---
  clearChatHistory() {
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CONV_ID);
  },

  deleteSavedMaterial() {
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.SAVED_NOTES);
  },

  deleteAllStudyData() {
    this.resetStudyData();
  },

  resetStudyData() {
    Object.values(STORAGE_KEYS).forEach(k => {
      if (k !== STORAGE_KEYS.THEME) {
        localStorage.removeItem(k);
      }
    });
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_SCHEMA_VERSION);
  },

  exportAllData(): string {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      conversations: this.getConversations(),
      documents: this.getDocuments(),
      flashcards: this.getFlashcards(),
      quizResults: this.getQuizResults(),
      examPlans: this.getExamPlans(),
      learningState: this.getLearningState(),
      savedNotes: this.getSavedNotes()
    };
    return JSON.stringify(fullBackup, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.conversations) this.saveConversations(data.conversations);
      if (data.documents) this.saveDocuments(data.documents);
      if (data.flashcards) this.saveFlashcards(data.flashcards);
      if (data.quizResults) this.saveQuizResults(data.quizResults);
      if (data.examPlans) this.saveExamPlans(data.examPlans);
      if (data.learningState) this.saveLearningState(data.learningState);
      if (data.savedNotes) this.saveSavedNotes(data.savedNotes);
      return true;
    } catch (e) {
      console.error('Failed to import backup data:', e);
      return false;
    }
  }
};
