import type {
  ServerStatus,
  StudyMode,
  DifficultyLevel,
  ProcessedDocument,
  QuizQuestion,
  Flashcard,
  ExamPlan
} from '../types';
import {
  isStaticDeployment,
  DEMO_SERVER_STATUS,
  generateDemoExplanation,
  streamDemoChat,
  generateDemoQuiz,
  generateDemoFlashcards,
  generateDemoExamPlan,
  processDocumentInBrowser
} from './demoEngine';

const API_BASE = '/api';

export async function fetchServerStatus(): Promise<ServerStatus> {
  // If hosted on GitHub Pages or static host, immediately return honest Demo Mode
  if (isStaticDeployment()) {
    return DEMO_SERVER_STATUS;
  }

  try {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) {
      return DEMO_SERVER_STATUS;
    }
    return await res.json();
  } catch {
    return DEMO_SERVER_STATUS;
  }
}

export interface StudentContextParams {
  subject?: string;
  topic?: string;
  difficulty?: DifficultyLevel;
  weakTopics?: string[];
}

export interface ChatStreamParams {
  message: string;
  mode: StudyMode;
  difficulty?: DifficultyLevel;
  documentContext?: {
    fileName: string;
    text: string;
  } | null;
  studentContext?: StudentContextParams | null;
  onChunk: (chunk: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

export async function sendChatMessageStream({
  message,
  mode,
  difficulty = 'intermediate',
  documentContext = null,
  studentContext = null,
  onChunk,
  onDone,
  onError
}: ChatStreamParams) {
  // If on GitHub Pages or static host, execute pure client-side demo streaming
  if (isStaticDeployment()) {
    try {
      await streamDemoChat(
        { message, mode, difficulty, documentContext, studentContext },
        onChunk,
        onDone
      );
      return;
    } catch (err: any) {
      onError(err);
      return;
    }
  }

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        mode,
        difficulty,
        documentContext,
        studentContext,
        stream: true
      })
    });

    if (!res.ok) {
      // Graceful fallback to client demo stream
      await streamDemoChat(
        { message, mode, difficulty, documentContext, studentContext },
        onChunk,
        onDone
      );
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      await streamDemoChat(
        { message, mode, difficulty, documentContext, studentContext },
        onChunk,
        onDone
      );
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) {
              onError(new Error(parsed.error));
              return;
            }
            if (parsed.chunk) {
              onChunk(parsed.chunk);
            }
          } catch {
            // Ignore non-json lines
          }
        }
      }
    }

    onDone();
  } catch {
    // If backend connection fails, fall back to client demo stream seamlessly
    await streamDemoChat(
      { message, mode, difficulty, documentContext, studentContext },
      onChunk,
      onDone
    );
  }
}

export async function fetchExplanation(
  topic: string,
  difficulty: DifficultyLevel = 'intermediate',
  studentContext?: StudentContextParams
) {
  if (isStaticDeployment()) {
    return generateDemoExplanation(topic, difficulty, studentContext);
  }

  try {
    const res = await fetch(`${API_BASE}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, difficulty, studentContext })
    });
    if (!res.ok) {
      return generateDemoExplanation(topic, difficulty, studentContext);
    }
    return res.json();
  } catch {
    return generateDemoExplanation(topic, difficulty, studentContext);
  }
}

export async function uploadDocument(file: File): Promise<ProcessedDocument> {
  if (isStaticDeployment()) {
    return processDocumentInBrowser(file);
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/materials/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return processDocumentInBrowser(file);
    }

    return {
      id: 'doc-' + Date.now(),
      ...data.document
    };
  } catch {
    return processDocumentInBrowser(file);
  }
}

export async function generateQuizAPI({
  topic,
  subject,
  difficulty,
  count = 5,
  documentContext
}: {
  topic: string;
  subject?: string;
  difficulty?: string;
  count?: number;
  documentContext?: any;
}): Promise<{ questions: QuizQuestion[]; id: string }> {
  if (isStaticDeployment()) {
    return generateDemoQuiz(topic, subject, difficulty, count);
  }

  try {
    const res = await fetch(`${API_BASE}/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, subject, difficulty, count, documentContext })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return generateDemoQuiz(topic, subject, difficulty, count);
    }
    return data.quiz;
  } catch {
    return generateDemoQuiz(topic, subject, difficulty, count);
  }
}

export async function generateFlashcardsAPI({
  topic,
  count = 6,
  documentContext = null
}: {
  topic: string;
  count?: number;
  documentContext?: any;
}): Promise<Flashcard[]> {
  if (isStaticDeployment()) {
    return generateDemoFlashcards(topic, count);
  }

  try {
    const res = await fetch(`${API_BASE}/flashcards/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, count, documentContext })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return generateDemoFlashcards(topic, count);
    }

    return (data.flashcards || []).map((fc: any) => ({
      id: fc.id || 'fc-' + Math.random().toString(36).substring(2, 9),
      front: fc.front,
      back: fc.back,
      topic: fc.topic || topic,
      state: 'new',
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }));
  } catch {
    return generateDemoFlashcards(topic, count);
  }
}

export async function generateExamPlanAPI(params: {
  examName: string;
  subject: string;
  examDate: string;
  availableHours: number;
  topics: string[];
  weakTopics?: string[];
}): Promise<ExamPlan> {
  if (isStaticDeployment()) {
    return generateDemoExamPlan(params);
  }

  try {
    const res = await fetch(`${API_BASE}/exam/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return generateDemoExamPlan(params);
    }

    return data.examPlan;
  } catch {
    return generateDemoExamPlan(params);
  }
}
