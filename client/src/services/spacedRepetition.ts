import { Flashcard, FlashcardState } from '../types';

export type ReviewRating = 'difficult' | 'review' | 'know';

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 * Computes interval, repetitions, and next review date.
 */
export function calculateNextReview(
  card: Flashcard,
  rating: ReviewRating
): {
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: string;
  state: FlashcardState;
} {
  let { repetitions = 0, interval = 1, easeFactor = 2.5 } = card;

  // Map user button to SM-2 quality grade (0-5)
  // 'difficult': 1, 'review': 3, 'know': 5
  let grade = 3;
  if (rating === 'difficult') grade = 1;
  if (rating === 'know') grade = 5;

  // Update ease factor: EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  if (grade < 3) {
    // Failed recall: reset repetitions to 0, review again tomorrow
    repetitions = 0;
    interval = 1;
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Calculate next review timestamp
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  // Determine state
  let state: FlashcardState = 'learning';
  if (repetitions >= 3 && interval >= 6) {
    state = 'mastered';
  } else if (repetitions === 0 && rating === 'difficult') {
    state = 'learning';
  }

  return {
    interval,
    repetitions,
    easeFactor: Number(easeFactor.toFixed(2)),
    nextReviewDate: nextDate.toISOString(),
    state
  };
}

export function isCardDueForReview(card: Flashcard): boolean {
  if (!card.nextReviewDate) return true;
  const due = new Date(card.nextReviewDate);
  const now = new Date();
  return due <= now;
}
