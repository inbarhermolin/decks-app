const SETTINGS_KEY = 'decks-v1-settings';

export type LearningDirection = 'target-to-english' | 'english-to-target' | 'mixed';

export interface AppSettings {
  batchSize: number;
  direction: LearningDirection;
  upgradeThreshold: number;
  dailyGoal: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  batchSize:        15,
  direction:        'mixed',
  upgradeThreshold: 3,
  dailyGoal:        15,
};

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
