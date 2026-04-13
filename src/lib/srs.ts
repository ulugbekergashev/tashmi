/**
 * FSRS spaced-repetition wrapper around `ts-fsrs`.
 * Maps Dexie FlashcardRow ⇄ FSRS Card and persists reviews.
 */
import {
  fsrs as fsrsFactory,
  generatorParameters,
  createEmptyCard,
  Rating,
  State,
  type Card as FSRSCard,
} from 'ts-fsrs';
import { db, FlashcardRow, ReviewRow } from './db';

const f = fsrsFactory(generatorParameters({
  enable_fuzz: true,
  enable_short_term: true,
  request_retention: 0.9,
}));

export type SrsRating = 1 | 2 | 3 | 4; // Again | Hard | Good | Easy

const RATING_MAP: Record<SrsRating, Rating> = {
  1: Rating.Again,
  2: Rating.Hard,
  3: Rating.Good,
  4: Rating.Easy,
};

function rowToCard(row: FlashcardRow): FSRSCard {
  if (row.reps === 0 && row.state === 0) {
    const c = createEmptyCard(new Date(row.due || Date.now()));
    return c;
  }
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    learning_steps: 0,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state as unknown as State,
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  } as unknown as FSRSCard;
}

function cardToRow(card: FSRSCard): Partial<FlashcardRow> {
  return {
    due: new Date(card.due).getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as unknown as 0 | 1 | 2 | 3,
    last_review: card.last_review ? new Date(card.last_review).getTime() : Date.now(),
  };
}

/** Schedule next review and persist. */
export async function reviewCard(cardId: number, rating: SrsRating, durationMs?: number) {
  const row = await db.flashcards.get(cardId);
  if (!row) throw new Error(`card ${cardId} not found`);

  const fsrsCard = rowToCard(row);
  const result = f.next(fsrsCard, new Date(), RATING_MAP[rating] as any);
  const updates = cardToRow(result.card as any);

  await db.flashcards.update(cardId, updates);
  const review: ReviewRow = {
    card_id: cardId,
    rating,
    reviewed_at: Date.now(),
    duration_ms: durationMs,
    prev_state: row.state,
  };
  await db.reviews.add(review);
  return updates;
}

/** Daily queue: due cards + new cards (interleaved by concept). */
export async function buildDailyQueue(opts?: { newLimit?: number; maxReviews?: number }) {
  const newLimit = opts?.newLimit ?? 15;
  const maxReviews = opts?.maxReviews ?? 120;
  const now = Date.now();

  const dueCards = await db.flashcards
    .where('due')
    .belowOrEqual(now)
    .and(c => c.state !== 0)
    .limit(maxReviews)
    .toArray();

  const newCards = await db.flashcards
    .where('state')
    .equals(0)
    .limit(newLimit)
    .toArray();

  // Interleave by concept to avoid blocking on a single topic
  const all = [...dueCards, ...newCards];
  return interleaveByConcept(all);
}

function interleaveByConcept<T extends { concept?: string }>(items: T[]): T[] {
  const buckets = new Map<string, T[]>();
  for (const it of items) {
    const k = it.concept || '_';
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(it);
  }
  const out: T[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const arr of buckets.values()) {
      const v = arr.shift();
      if (v) { out.push(v); added = true; }
    }
  }
  return out;
}

/** Convert imported flashcards (no FSRS state) into ready-to-store rows. */
export function newCardRow(
  deckId: number,
  card: { question: string; answer: string; hint?: string; source?: string; concept?: string }
): FlashcardRow {
  return {
    deck_id: deckId,
    front: card.question,
    back: card.answer,
    hint: card.hint,
    source: card.source,
    concept: card.concept,
    due: Date.now(),
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    state: 0,
  };
}

/** Quick retention forecast for a card. */
export function retentionAt(card: FlashcardRow, days: number): number {
  if (card.stability <= 0) return 0;
  // FSRS forgetting curve
  return Math.pow(1 + days / (9 * card.stability), -1);
}

/** Detect leeches (frequent lapses → needs Socratic intervention) */
export async function findLeeches(threshold = 6): Promise<FlashcardRow[]> {
  return db.flashcards.filter(c => c.lapses >= threshold).toArray();
}
