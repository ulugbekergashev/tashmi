import Dexie, { Table } from 'dexie';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DeckRow {
  id?: number;
  name: string;
  subject: string;
  topic: string;
  source_id?: number;
  created_at: number;
}

export interface FlashcardRow {
  id?: number;
  deck_id: number;
  front: string;
  back: string;
  hint?: string;
  source?: string;
  citations?: Citation[];
  concept?: string;
  // FSRS state
  due: number;            // unix ms
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: 0 | 1 | 2 | 3;   // New, Learning, Review, Relearning
  last_review?: number;
}

export interface ReviewRow {
  id?: number;
  card_id: number;
  rating: 1 | 2 | 3 | 4;  // Again, Hard, Good, Easy
  reviewed_at: number;
  duration_ms?: number;
  prev_state: number;
}

export interface MaterialRow {
  id?: number;
  title: string;
  type: 'pdf' | 'docx' | 'url' | 'text';
  source_url?: string;
  filename?: string;
  full_text: string;
  created_at: number;
}

export interface ChunkRow {
  id?: number;
  material_id: number;
  page?: number;
  text: string;
  embedding?: number[];   // 768-dim from text-embedding-004 (or null if no API)
  token_count?: number;
}

export interface Citation {
  chunk_id?: number;
  source_id?: number;
  source_title: string;
  page?: number;
  url?: string;
  quote: string;
}

export interface ChatTurn {
  id?: number;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  module: 'tutor' | 'vp' | 'learn';
  citations?: Citation[];
  meta?: Record<string, any>;
  created_at: number;
}

export interface CaseSessionRow {
  id?: number;
  case_id: string;
  hidden_diagnosis: string;
  ddx_history: { step: number; ddx: { dx: string; p: number }[] }[];
  tests_ordered: string[];
  rubric_scores?: Record<string, number>;
  total_score?: number;
  red_flags_missed?: string[];
  started_at: number;
  finished_at?: number;
}

export interface MasteryRow {
  id?: number;
  concept: string;
  mastery: number;        // 0-1
  bloom_level: number;    // 1-6
  attempts: number;
  last_seen: number;
}

export interface RecommendationRow {
  id?: number;
  type: 'card' | 'tutor' | 'case' | 'topic';
  concept: string;
  reason: string;
  created_at: number;
  consumed?: boolean;
}

// ─── Database ───────────────────────────────────────────────────────────────

export interface UserStatsRow {
  id: 'me';
  total_xp: number;
  level: number;
  streak: number;
  last_activity: number;  // unix ms
}

class MedAIDB extends Dexie {
  decks!: Table<DeckRow, number>;
  flashcards!: Table<FlashcardRow, number>;
  reviews!: Table<ReviewRow, number>;
  materials!: Table<MaterialRow, number>;
  chunks!: Table<ChunkRow, number>;
  chats!: Table<ChatTurn, number>;
  cases!: Table<CaseSessionRow, number>;
  mastery!: Table<MasteryRow, number>;
  recommendations!: Table<RecommendationRow, number>;
  user_stats!: Table<UserStatsRow, string>;

  constructor() {
    super('medai');
    this.version(1).stores({
      decks: '++id, subject, topic, created_at',
      flashcards: '++id, deck_id, due, state, concept',
      reviews: '++id, card_id, reviewed_at',
      materials: '++id, type, created_at',
      chunks: '++id, material_id',
      chats: '++id, session_id, module, created_at',
      cases: '++id, case_id, started_at',
      mastery: '++id, &concept, mastery, last_seen',
      recommendations: '++id, type, created_at, consumed',
      user_stats: '&id',
    });
  }
}

export const db = new MedAIDB();

// ─── Helpers ────────────────────────────────────────────────────────────────

export async function initStats() {
  const existing = await db.user_stats.get('me');
  if (!existing) {
    await db.user_stats.add({
      id: 'me',
      total_xp: 0,
      level: 1,
      streak: 0,
      last_activity: Date.now()
    });
  }
}

export async function awardXP(amount: number) {
  const current = await db.user_stats.get('me');
  if (!current) {
    await db.user_stats.add({
      id: 'me',
      total_xp: amount,
      level: Math.floor(amount / 1000) + 1,
      streak: 1,
      last_activity: Date.now()
    });
    return;
  }

  const nextXP = current.total_xp + amount;
  const nextLevel = Math.floor(nextXP / 1000) + 1;
  const now = Date.now();
  
  // Basic streak logic
  const lastDate = new Date(current.last_activity).toDateString();
  const today = new Date(now).toDateString();
  let nextStreak = current.streak;
  if (lastDate !== today) {
    // If it's the next day, increment streak. 
    // Simplified: we don't check for missed days here yet.
    nextStreak = current.streak + 1;
  }

  await db.user_stats.update('me', {
    total_xp: nextXP,
    level: nextLevel,
    streak: nextStreak,
    last_activity: now
  });

  if (nextLevel > current.level) {
    return { leveledUp: true, level: nextLevel };
  }
  return { leveledUp: false };
}

export async function getStats() {
  let stats = await db.user_stats.get('me');
  if (!stats) {
    await initStats();
    stats = await db.user_stats.get('me');
  }
  return stats!;
}

export async function upsertMastery(concept: string, delta: number, bloom?: number) {
  const existing = await db.mastery.where('concept').equals(concept).first();
  const now = Date.now();
  if (existing) {
    const next = Math.max(0, Math.min(1, existing.mastery + delta));
    await db.mastery.update(existing.id!, {
      mastery: next,
      bloom_level: bloom ?? existing.bloom_level,
      attempts: existing.attempts + 1,
      last_seen: now,
    });
  } else {
    await db.mastery.add({
      concept,
      mastery: Math.max(0, Math.min(1, 0.3 + delta)),
      bloom_level: bloom ?? 1,
      attempts: 1,
      last_seen: now,
    });
  }
}

export async function getWeakConcepts(limit = 5): Promise<MasteryRow[]> {
  const all = await db.mastery.toArray();
  return all
    .filter(m => m.mastery < 0.6)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, limit);
}

export async function getDailyReviewCount(): Promise<{ due: number; new: number }> {
  const now = Date.now();
  const due = await db.flashcards.where('due').belowOrEqual(now).count();
  const newCards = await db.flashcards.where('state').equals(0).count();
  return { due, new: newCards };
}
