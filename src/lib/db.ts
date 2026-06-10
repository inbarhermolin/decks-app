import { supabase } from './supabase';
import { Word, WordStatus, Deck, ExampleSentence } from './types';
import { AppSettings, DEFAULT_SETTINGS } from './settings';
import { UserStats, DEFAULT_STATS, applySessionToStats } from './gamification';

// ── Row ↔ Domain mappers ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToWord(row: any): Word {
  return {
    id:                         row.id,
    word:                       row.word,
    translation:                row.translation,
    language:                   row.language,
    partOfSpeech:               row.part_of_speech,
    status:                     row.status as WordStatus,
    exampleSentence:            row.example_sentence ?? '',
    exampleSentenceTranslation: row.example_sentence_translation ?? undefined,
    exampleSentences:           (row.example_sentences as ExampleSentence[] | null) ?? undefined,
    conjugations:               row.conjugations ?? undefined,
    notes:                      row.notes ?? undefined,
    presentTense:               row.present_tense ?? undefined,
    pastTense:                  row.past_tense ?? undefined,
    addedAt:                    row.added_at,
    consecutiveCorrect:         row.consecutive_correct ?? 0,
    deckId:                     row.deck_id ?? undefined,
  };
}

function wordToRow(word: Word, userId: string) {
  // deck_id is conditionally included so that words without a deckId
  // don't send the column at all (avoids errors if migration hasn't run yet).
  const row: Record<string, unknown> = {
    id:                          word.id,
    user_id:                     userId,
    word:                        word.word,
    translation:                 word.translation,
    language:                    word.language,
    part_of_speech:              word.partOfSpeech,
    status:                      word.status,
    example_sentence:            word.exampleSentence || null,
    example_sentence_translation: word.exampleSentenceTranslation ?? null,
    example_sentences:           word.exampleSentences ?? null,
    conjugations:                word.conjugations ?? null,
    notes:                       word.notes ?? null,
    added_at:                    word.addedAt,
    consecutive_correct:         word.consecutiveCorrect ?? 0,
  };
  if (word.deckId !== undefined) row.deck_id = word.deckId;
  if (word.presentTense !== undefined) row.present_tense = word.presentTense || null;
  if (word.pastTense    !== undefined) row.past_tense    = word.pastTense    || null;
  return row;
}

// ── Words ─────────────────────────────────────────────────────────────────────

export async function fetchWords(userId: string): Promise<Word[]> {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToWord);
}

export async function upsertWord(word: Word, userId: string): Promise<void> {
  const { error } = await supabase
    .from('words')
    .upsert(wordToRow(word, userId));
  if (error) throw error;
}

export async function upsertWords(words: Word[], userId: string): Promise<void> {
  if (words.length === 0) return;
  const { error } = await supabase
    .from('words')
    .upsert(words.map((w) => wordToRow(w, userId)));
  if (error) throw error;
}

export async function deleteWord(id: string): Promise<void> {
  const { error } = await supabase.from('words').delete().eq('id', id);
  if (error) throw error;
}

export async function updateWordProgress(
  id:                 string,
  status:             WordStatus,
  consecutiveCorrect: number,
): Promise<void> {
  const { error } = await supabase
    .from('words')
    .update({ status, consecutive_correct: consecutiveCorrect })
    .eq('id', id);
  if (error) throw error;
}

// ── Decks ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDeck(row: any): Deck {
  return {
    id:        row.id,
    name:      row.name,
    createdAt: row.created_at,
  };
}

export async function fetchDecks(userId: string): Promise<Deck[]> {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToDeck);
}

export async function createDeck(name: string, userId: string): Promise<Deck> {
  const id = `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const { data, error } = await supabase
    .from('decks')
    .insert({ id, user_id: userId, name })
    .select()
    .single();
  if (error) throw error;
  return rowToDeck(data);
}

export async function renameDeck(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('decks')
    .update({ name })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteDeck(id: string): Promise<void> {
  // DB FK ON DELETE SET NULL handles unassigning words automatically.
  const { error } = await supabase.from('decks').delete().eq('id', id);
  if (error) throw error;
}

// ── Settings ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSettings(row: any): AppSettings {
  return {
    batchSize:        row.session_size      ?? DEFAULT_SETTINGS.batchSize,
    direction:        row.direction         ?? DEFAULT_SETTINGS.direction,
    upgradeThreshold: row.upgrade_threshold ?? DEFAULT_SETTINGS.upgradeThreshold,
    dailyGoal:        row.daily_goal        ?? DEFAULT_SETTINGS.dailyGoal,
  };
}

export async function fetchSettings(userId: string): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return DEFAULT_SETTINGS;
  return rowToSettings(data);
}

export async function saveSettingsToDb(
  userId:   string,
  settings: AppSettings,
): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert({
      user_id:           userId,
      session_size:      settings.batchSize,
      direction:         settings.direction,
      upgrade_threshold: settings.upgradeThreshold,
      daily_goal:        settings.dailyGoal,
    });
  if (error) throw error;
}

// ── LocalStorage migration ────────────────────────────────────────────────────

const LS_WORDS_KEY     = 'decks-v1-words';
const LS_MIGRATED_KEY  = 'decks-migrated';

/** Returns the word count from localStorage, or 0 if nothing to migrate. */
export function localStorageWordCount(): number {
  if (typeof window === 'undefined') return 0;
  if (localStorage.getItem(LS_MIGRATED_KEY)) return 0;
  try {
    const raw = localStorage.getItem(LS_WORDS_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as unknown[];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

/** Upload localStorage words to the cloud then clear local state. */
export async function migrateLocalStorageToCloud(userId: string): Promise<void> {
  const raw = localStorage.getItem(LS_WORDS_KEY);
  if (!raw) return;
  const words = JSON.parse(raw) as Word[];
  await upsertWords(words, userId);
  localStorage.removeItem(LS_WORDS_KEY);
  localStorage.setItem(LS_MIGRATED_KEY, 'true');
}

/** Mark migration as skipped so we never ask again. */
export function dismissMigration(): void {
  localStorage.setItem(LS_MIGRATED_KEY, 'true');
}

// ── User Stats ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToStats(row: any): UserStats {
  return {
    totalXP:          row.total_xp           ?? 0,
    streak:           row.streak             ?? 0,
    lastPracticeDate: row.last_practice_date ?? null,
    todayWordsCount:  row.today_words_count  ?? 0,
    todayDate:        row.today_date         ?? null,
  };
}

export async function fetchUserStats(userId: string): Promise<UserStats> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToStats(data) : { ...DEFAULT_STATS };
}

export async function saveUserStats(userId: string, stats: UserStats): Promise<void> {
  const { error } = await supabase
    .from('user_stats')
    .upsert({
      user_id:            userId,
      total_xp:           stats.totalXP,
      streak:             stats.streak,
      last_practice_date: stats.lastPracticeDate,
      today_words_count:  stats.todayWordsCount,
      today_date:         stats.todayDate,
    });
  if (error) throw error;
}

/** Fetch current stats, apply session results, and persist the update. */
export async function updateUserStats(
  userId:      string,
  xpEarned:    number,
  wordsPassed: number,
): Promise<UserStats> {
  const current = await fetchUserStats(userId);
  const updated = applySessionToStats(current, xpEarned, wordsPassed);
  await saveUserStats(userId, updated);
  return updated;
}
