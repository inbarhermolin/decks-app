import { Word, WordStatus, Language } from './types';
import { AppSettings, LearningDirection } from './settings';

// ── Normalisation (diacritic-insensitive comparison) ─────────────────────────

export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')      // strip diacritics (é→e)
    .replace(/[''`´ʼ]/g, '')     // strip apostrophes/elision marks (l'ora→lora)
    .replace(/\s+/g, ' ');       // collapse whitespace
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type GameModeId =
  | 'sentence-translation'
  | 'word-translation'
  | 'verb-conjugation'
  | 'listening'
  | 'ai-question'
  | 'flashcard';

export type ResolvedDirection = 'target-to-english' | 'english-to-target';

export interface MissedForms {
  pronouns: string[];
  tense: string;
}

export interface QueueItem {
  uid: string;
  word: Word;
  gameMode: GameModeId;
  direction: ResolvedDirection;
  attemptNumber: number;
  focusPronouns?: string[];  // verb-conjugation retry: only ask these rows
  focusTense?: string;       // verb-conjugation retry: which tense to use
}

export interface WordResult {
  word: Word;
  originalStatus: WordStatus;
  passed: boolean;
  passedFirstTry: boolean;
  totalAttempts: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function resolveDirection(dir: LearningDirection): ResolvedDirection {
  if (dir === 'mixed') return Math.random() < 0.5 ? 'target-to-english' : 'english-to-target';
  return dir;
}

// ── Session building ──────────────────────────────────────────────────────────

export function buildSession(
  words: Word[],
  language: Language,
  settings: AppSettings,
  gameMode: GameModeId,
): QueueItem[] {
  const langWords = words.filter((w) => w.language === language);

  let pool = langWords;
  if (gameMode === 'verb-conjugation') {
    pool = langWords.filter(
      (w) => w.partOfSpeech === 'verb' && w.conjugations && w.conjugations.length > 0,
    );
  } else if (gameMode === 'sentence-translation') {
    // Require both sentences — without the translation we can't do word bank or auto-check
    pool = langWords.filter((w) => !!w.exampleSentence && !!w.exampleSentenceTranslation);
  }

  if (pool.length === 0) return [];

  const unknown    = shuffle(pool.filter((w) => w.status === 'unknown'));
  const halfKnown  = shuffle(pool.filter((w) => w.status === 'half-known'));
  const known      = shuffle(pool.filter((w) => w.status === 'known'));

  const priority   = [...unknown, ...halfKnown];
  const batchSize  = Math.min(settings.batchSize, pool.length);
  const greenSlots = Math.min(known.length, Math.max(0, Math.min(2, batchSize - priority.length)));
  const selected   = shuffle([...priority, ...known.slice(0, greenSlots)]).slice(0, batchSize);

  return selected.map((word) => ({
    uid: `${word.id}-${uid()}`,
    word,
    gameMode,
    direction: resolveDirection(settings.direction),
    attemptNumber: 1,
  }));
}

export function makeRetryItem(
  item: QueueItem,
  focusPronouns?: string[],
  focusTense?: string,
): QueueItem {
  return {
    uid: `${item.word.id}-r${item.attemptNumber + 1}-${uid()}`,
    word: item.word,
    gameMode: item.gameMode,
    direction: item.direction,
    attemptNumber: item.attemptNumber + 1,
    focusPronouns,
    focusTense,
  };
}

// ── Progress tracking (no automatic status changes) ───────────────────────────

/** Increments consecutiveCorrect for passed-first-try words; resets to 0 for failed. */
export function applyProgressUpdates(words: Word[], results: WordResult[]): Word[] {
  const resultMap = new Map(results.map((r) => [r.word.id, r]));
  return words.map((w) => {
    const r = resultMap.get(w.id);
    if (!r) return w;
    return {
      ...w,
      consecutiveCorrect: r.passedFirstTry ? (w.consecutiveCorrect ?? 0) + 1 : 0,
    };
  });
}

/** Returns words that met the upgrade threshold this session. */
export function computeEligibleUpgrades(
  updatedWords: Word[],
  practisedIds: Set<string>,
  threshold: number,
): Word[] {
  return updatedWords.filter(
    (w) =>
      practisedIds.has(w.id) &&
      (w.consecutiveCorrect ?? 0) >= threshold &&
      w.status !== 'known',
  );
}

/** Applies user-approved status upgrades and resets their counters. */
export function applyApprovedUpgrades(words: Word[], approvedIds: Set<string>): Word[] {
  return words.map((w) => {
    if (!approvedIds.has(w.id)) return w;
    const newStatus: WordStatus =
      w.status === 'unknown' ? 'half-known'
      : w.status === 'half-known' ? 'known'
      : 'known';
    return { ...w, status: newStatus, consecutiveCorrect: 0 };
  });
}
