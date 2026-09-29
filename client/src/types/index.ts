export type StudyMode = 'ask' | 'explain' | 'summarize' | 'quiz' | 'flashcards' | 'exam_prep';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  mode?: StudyMode;
  difficulty?: DifficultyLevel;
  documentRef?: {
    fileName: string;
    pageNumber?: number;
    quote?: string;
  };
  feedback?: 'like' | 'dislike' | null;
  saved?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  pinnedDocumentId?: string;
}

export interface ProcessedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  pageCount: number;
  uploadedAt: string;
  status: 'processing' | 'processed' | 'error';
  rawText: string;
  pages: { pageNumber: number; text: string }[];
  summary: string;
  concepts: string[];
  definitions: { term: string; definition: string }[];
  formulas: string[];
  questions: { question: string; context: string }[];
  flashcards: { id: string; front: string; back: string; topic: string }[];
  mcqs: { id: string; question: string; options: string[]; correctAnswer: string; explanation: string }[];
  chapters: { title: string; estimatedPage: number; summary: string }[];
}

export type FlashcardState = 'new' | 'learning' | 'mastered';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
  sourceDocId?: string;
  sourceDocName?: string;
  createdAt: string;
  state: FlashcardState;
  repetitions: number;
  interval: number; // in days
  easeFactor: number; // SM-2 parameter (default 2.5)
  nextReviewDate: string; // ISO date
  lastReviewedDate?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
}

export interface QuizResult {
  id: string;
  quizId: string;
  topic: string;
  subject: string;
  difficulty: string;
  totalQuestions: number;
  score: number;
  accuracy: number;
  userAnswers: { [questionId: string]: string };
  questions: QuizQuestion[];
  completedAt: string;
  timeSpentSeconds: number;
  weakTopics: string[];
}

export interface ExamTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyExamPlan {
  dayNumber: number;
  title: string;
  focusTopic: string;
  allocatedHours: number;
  tasks: ExamTask[];
  milestone?: string;
}

export interface ExamPlan {
  id: string;
  examName: string;
  subject: string;
  examDate: string;
  daysRemaining: number;
  dailyHours: number;
  totalStudyHours: number;
  topics: string[];
  dailyPlan: DailyExamPlan[];
  createdAt: string;
}

export interface LearningState {
  totalStudyMinutes: number;
  questionsAttempted: number;
  questionsCorrect: number;
  streakDays: number;
  lastActiveDate: string;
  topicPerformance: {
    [topic: string]: {
      attempted: number;
      correct: number;
      lastStudied: string;
      masteryStatus: 'needs_review' | 'learning' | 'strong';
    };
  };
  weeklyActivity: { [day: string]: number }; // minutes per day
}

export interface SavedNote {
  id: string;
  title: string;
  content: string;
  topic: string;
  savedAt: string;
}

export interface ServerStatus {
  status: string;
  provider: string;
  model: string;
  isLive: boolean;
  message: string;
}
