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

export function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('studypilot_backend_url');
    if (saved && saved.trim()) return saved.trim().replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_BACKEND_URL) {
    return (import.meta.env.VITE_BACKEND_URL as string).trim().replace(/\/+$/, '');
  }
  return '';
}

export function setBackendUrl(url: string) {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('studypilot_backend_url');
    } else {
      localStorage.setItem('studypilot_backend_url', url.trim().replace(/\/+$/, ''));
    }
  }
}

export function getApiBase(): string {
  const backend = getBackendUrl();
  if (backend) {
    return backend.endsWith('/api') ? backend : `${backend}/api`;
  }
  return '/api';
}

export function shouldUseClientFallback(): boolean {
  return isStaticDeployment() && !getBackendUrl();
}

export async function fetchServerStatus(): Promise<ServerStatus> {
  // If hosted on GitHub Pages and no external backend configured, return honest Demo Mode
  if (shouldUseClientFallback()) {
    return DEMO_SERVER_STATUS;
  }

  const endpoint = `${getApiBase()}/status`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return DEMO_SERVER_STATUS;
    }
    const data = await res.json();
    return {
      status: data.status || 'ok',
      provider: data.provider || 'demo',
      model: data.model || 'studypilot-curriculum-v1',
      isLive: Boolean(data.isLive),
      message: data.message || (data.isLive ? 'Connected to live AI provider.' : 'Operating in Demo Mode.')
    };
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
  // If no external backend configured on static host, execute client-side demo streaming
  if (shouldUseClientFallback()) {
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
    const res = await fetch(`${getApiBase()}/chat`, {
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
  if (shouldUseClientFallback()) {
    return generateDemoExplanation(topic, difficulty, studentContext);
  }

  try {
    const res = await fetch(`${getApiBase()}/explain`, {
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
  if (shouldUseClientFallback()) {
    return processDocumentInBrowser(file);
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${getApiBase()}/materials/upload`, {
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
  if (shouldUseClientFallback()) {
    return generateDemoQuiz(topic, subject, difficulty, count);
  }

  try {
    const res = await fetch(`${getApiBase()}/quiz/generate`, {
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
  if (shouldUseClientFallback()) {
    return generateDemoFlashcards(topic, count);
  }

  try {
    const res = await fetch(`${getApiBase()}/flashcards/generate`, {
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
  if (shouldUseClientFallback()) {
    return generateDemoExamPlan(params);
  }

  try {
    const res = await fetch(`${getApiBase()}/exam/generate`, {
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
