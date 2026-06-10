export type WordStatus = 'known' | 'half-known' | 'unknown';

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'pronoun'
  | 'phrase';

export type Language = 'Spanish' | 'Italian' | 'English' | 'French' | 'German';

export interface ConjugationRow {
  pronoun: string;
  form: string;
}

export interface ConjugationTense {
  tense: string;
  rows: ConjugationRow[];
}

export interface ExampleSentence {
  sentence:    string;
  translation: string;
  subject?:    string; // grammatical person for verbs, e.g. "io", "tu", "lui/lei"
}

export interface Deck {
  id: string;
  name: string;
  createdAt: string;
}

export interface Word {
  id: string;
  word: string;
  translation: string;
  language: Language;
  partOfSpeech: PartOfSpeech;
  status: WordStatus;
  exampleSentence: string;
  exampleSentenceTranslation?: string;
  exampleSentences?: ExampleSentence[];
  conjugations?: ConjugationTense[];
  notes?: string;
  presentTense?: string;
  pastTense?: string;
  addedAt: string;
  consecutiveCorrect?: number;
  deckId?: string;
}
