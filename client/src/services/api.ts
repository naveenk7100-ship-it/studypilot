import type {
  ServerStatus,
  StudyMode,
  DifficultyLevel,
  ProcessedDocument,
  QuizQuestion,
  Flashcard,
  ExamPlan
} from '../types';

const API_BASE = '/api';

export async function fetchServerStatus(): Promise<ServerStatus> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) {
    throw new Error(`Status check failed: ${res.statusText}`);
  }
  return res.json();
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
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Chat request error (${res.status}): ${errText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream not supported by browser');
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
  } catch (err: any) {
    onError(err);
  }
}

export async function fetchExplanation(
  topic: string,
  difficulty: DifficultyLevel = 'intermediate',
  studentContext?: StudentContextParams
) {
  const res = await fetch(`${API_BASE}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, difficulty, studentContext })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to generate explanation: ${err}`);
  }
  return res.json();
}

export async function uploadDocument(file: File): Promise<ProcessedDocument> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/materials/upload`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to upload document');
  }

  return {
    id: 'doc-' + Date.now(),
    ...data.document
  };
}

export async function generateQuizAPI({
  topic,
  subject,
  difficulty,
  count,
  documentContext
}: {
  topic: string;
  subject?: string;
  difficulty?: string;
  count?: number;
  documentContext?: any;
}): Promise<{ questions: QuizQuestion[]; id: string }> {
  const res = await fetch(`${API_BASE}/quiz/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, subject, difficulty, count, documentContext })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate quiz');
  }
  return data.quiz;
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
  const res = await fetch(`${API_BASE}/flashcards/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, count, documentContext })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate flashcards');
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
}

export async function generateExamPlanAPI(params: {
  examName: string;
  subject: string;
  examDate: string;
  availableHours: number;
  topics: string[];
  weakTopics?: string[];
}): Promise<ExamPlan> {
  const res = await fetch(`${API_BASE}/exam/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate exam plan');
  }

  return data.examPlan;
}
