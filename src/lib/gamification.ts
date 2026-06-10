import { WordResult } from './practice';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserStats {
  totalXP: number;
  streak: number;
  lastPracticeDate: string | null; // YYYY-MM-DD
  todayWordsCount: number;
  todayDate: string | null;        // YYYY-MM-DD — resets count when it changes
}

export const DEFAULT_STATS: UserStats = {
  totalXP:          0,
  streak:           0,
  lastPracticeDate: null,
  todayWordsCount:  0,
  todayDate:        null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function isYesterdayOf(dateStr: string, today: string): boolean {
  const d = new Date(today + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return dateStr === d.toISOString().slice(0, 10);
}

// ── XP calculation ────────────────────────────────────────────────────────────

/** +10 XP for first-try correct, +5 XP for eventually correct, 0 for failed. */
export function computeSessionXP(results: WordResult[]): number {
  return results.reduce((sum, r) => {
    if (r.passedFirstTry) return sum + 10;
    if (r.passed)         return sum + 5;
    return sum;
  }, 0);
}

// ── Stats update (pure, no I/O) ───────────────────────────────────────────────

export function applySessionToStats(
  current: UserStats,
  xpEarned: number,
  wordsPassed: number,
): UserStats {
  const today = getTodayString();

  let newStreak: number;
  if (!current.lastPracticeDate) {
    newStreak = 1;
  } else if (current.lastPracticeDate === today) {
    // Already practiced today — preserve streak, only accumulate words/XP
    newStreak = current.streak;
  } else if (isYesterdayOf(current.lastPracticeDate, today)) {
    newStreak = current.streak + 1;
  } else {
    // Gap of more than one day — streak broken
    newStreak = 1;
  }

  const todayWords =
    current.todayDate === today
      ? current.todayWordsCount + wordsPassed
      : wordsPassed;

  return {
    totalXP:          current.totalXP + xpEarned,
    streak:           newStreak,
    lastPracticeDate: today,
    todayWordsCount:  todayWords,
    todayDate:        today,
  };
}
