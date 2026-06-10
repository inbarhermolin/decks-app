import { Word } from './types';

export function migrateWords(stored: Word[]): Word[] {
  const seedMap = new Map(VOCAB_DATA.map((w) => [w.id, w]));
  return stored.map((w) => {
    const seed = seedMap.get(w.id);
    if (!seed) return w;
    return { ...seed, status: w.status, consecutiveCorrect: w.consecutiveCorrect };
  });
}

export const VOCAB_DATA: Word[] = [
  // ── Spanish ──────────────────────────────────────────────────────────────
  {
    id: 'sp-1',
    word: 'hablar',
    translation: 'to speak / to talk',
    language: 'Spanish',
    partOfSpeech: 'verb',
    status: 'unknown',
    exampleSentence: 'Necesito hablar contigo sobre algo muy importante.',
    exampleSentenceTranslation: 'I need to talk to you about something very important.',
    conjugations: [
      {
        tense: 'Presente (Present)',
        rows: [
          { pronoun: 'yo', form: 'hablo' },
          { pronoun: 'tú', form: 'hablas' },
          { pronoun: 'él / ella', form: 'habla' },
          { pronoun: 'nosotros', form: 'hablamos' },
          { pronoun: 'vosotros', form: 'habláis' },
          { pronoun: 'ellos / ellas', form: 'hablan' },
        ],
      },
      {
        tense: 'Pretérito (Past)',
        rows: [
          { pronoun: 'yo', form: 'hablé' },
          { pronoun: 'tú', form: 'hablaste' },
          { pronoun: 'él / ella', form: 'habló' },
          { pronoun: 'nosotros', form: 'hablamos' },
          { pronoun: 'vosotros', form: 'hablasteis' },
          { pronoun: 'ellos / ellas', form: 'hablaron' },
        ],
      },
      {
        tense: 'Futuro (Future)',
        rows: [
          { pronoun: 'yo', form: 'hablaré' },
          { pronoun: 'tú', form: 'hablarás' },
          { pronoun: 'él / ella', form: 'hablará' },
          { pronoun: 'nosotros', form: 'hablaremos' },
          { pronoun: 'vosotros', form: 'hablaréis' },
          { pronoun: 'ellos / ellas', form: 'hablarán' },
        ],
      },
    ],
    addedAt: '2024-01-10',
  },
  {
    id: 'sp-2',
    word: 'hermoso',
    translation: 'beautiful / gorgeous',
    language: 'Spanish',
    partOfSpeech: 'adjective',
    status: 'known',
    exampleSentence: 'El paisaje de las montañas es absolutamente hermoso.',
    exampleSentenceTranslation: 'The mountain landscape is absolutely beautiful.',
    addedAt: '2024-01-12',
  },
  {
    id: 'sp-3',
    word: 'siempre',
    translation: 'always',
    language: 'Spanish',
    partOfSpeech: 'adverb',
    status: 'half-known',
    exampleSentence: 'Siempre llego tarde a las reuniones del lunes.',
    exampleSentenceTranslation: 'I always arrive late to Monday meetings.',
    addedAt: '2024-01-14',
  },
  {
    id: 'sp-4',
    word: 'madrugada',
    translation: 'early morning / dawn (3–6 AM)',
    language: 'Spanish',
    partOfSpeech: 'noun',
    status: 'unknown',
    exampleSentence: 'Llegamos a casa de madrugada después de la fiesta.',
    exampleSentenceTranslation: 'We got home in the early hours of the morning after the party.',
    notes: 'Refers specifically to the hours between midnight and sunrise — not the same as "mañana".',
    addedAt: '2024-01-16',
  },
  {
    id: 'sp-5',
    word: 'correr',
    translation: 'to run',
    language: 'Spanish',
    partOfSpeech: 'verb',
    status: 'half-known',
    exampleSentence: 'Voy a correr en el parque cada mañana antes del trabajo.',
    exampleSentenceTranslation: 'I am going to run in the park every morning before work.',
    conjugations: [
      {
        tense: 'Presente (Present)',
        rows: [
          { pronoun: 'yo', form: 'corro' },
          { pronoun: 'tú', form: 'corres' },
          { pronoun: 'él / ella', form: 'corre' },
          { pronoun: 'nosotros', form: 'corremos' },
          { pronoun: 'vosotros', form: 'corréis' },
          { pronoun: 'ellos / ellas', form: 'corren' },
        ],
      },
      {
        tense: 'Pretérito (Past)',
        rows: [
          { pronoun: 'yo', form: 'corrí' },
          { pronoun: 'tú', form: 'corriste' },
          { pronoun: 'él / ella', form: 'corrió' },
          { pronoun: 'nosotros', form: 'corrimos' },
          { pronoun: 'vosotros', form: 'corristeis' },
          { pronoun: 'ellos / ellas', form: 'corrieron' },
        ],
      },
      {
        tense: 'Futuro (Future)',
        rows: [
          { pronoun: 'yo', form: 'correré' },
          { pronoun: 'tú', form: 'correrás' },
          { pronoun: 'él / ella', form: 'correrá' },
          { pronoun: 'nosotros', form: 'correremos' },
          { pronoun: 'vosotros', form: 'correréis' },
          { pronoun: 'ellos / ellas', form: 'correrán' },
        ],
      },
    ],
    addedAt: '2024-01-18',
  },

  // ── Italian ───────────────────────────────────────────────────────────────
  {
    id: 'it-1',
    word: 'parlare',
    translation: 'to speak / to talk',
    language: 'Italian',
    partOfSpeech: 'verb',
    status: 'unknown',
    exampleSentence: 'Devo parlare con il mio capo domani mattina.',
    exampleSentenceTranslation: 'I have to talk to my boss tomorrow morning.',
    conjugations: [
      {
        tense: 'Presente (Present)',
        rows: [
          { pronoun: 'io', form: 'parlo' },
          { pronoun: 'tu', form: 'parli' },
          { pronoun: 'lui / lei', form: 'parla' },
          { pronoun: 'noi', form: 'parliamo' },
          { pronoun: 'voi', form: 'parlate' },
          { pronoun: 'loro', form: 'parlano' },
        ],
      },
      {
        tense: 'Passato prossimo (Past)',
        rows: [
          { pronoun: 'io', form: 'ho parlato' },
          { pronoun: 'tu', form: 'hai parlato' },
          { pronoun: 'lui / lei', form: 'ha parlato' },
          { pronoun: 'noi', form: 'abbiamo parlato' },
          { pronoun: 'voi', form: 'avete parlato' },
          { pronoun: 'loro', form: 'hanno parlato' },
        ],
      },
      {
        tense: 'Futuro semplice (Future)',
        rows: [
          { pronoun: 'io', form: 'parlerò' },
          { pronoun: 'tu', form: 'parlerai' },
          { pronoun: 'lui / lei', form: 'parlerà' },
          { pronoun: 'noi', form: 'parleremo' },
          { pronoun: 'voi', form: 'parlerete' },
          { pronoun: 'loro', form: 'parleranno' },
        ],
      },
    ],
    addedAt: '2024-02-01',
  },
  {
    id: 'it-2',
    word: 'mangiare',
    translation: 'to eat',
    language: 'Italian',
    partOfSpeech: 'verb',
    status: 'half-known',
    exampleSentence: 'Stasera vogliamo mangiare la pizza nel centro storico.',
    exampleSentenceTranslation: 'Tonight we want to eat pizza in the old town centre.',
    conjugations: [
      {
        tense: 'Presente (Present)',
        rows: [
          { pronoun: 'io', form: 'mangio' },
          { pronoun: 'tu', form: 'mangi' },
          { pronoun: 'lui / lei', form: 'mangia' },
          { pronoun: 'noi', form: 'mangiamo' },
          { pronoun: 'voi', form: 'mangiate' },
          { pronoun: 'loro', form: 'mangiano' },
        ],
      },
      {
        tense: 'Passato prossimo (Past)',
        rows: [
          { pronoun: 'io', form: 'ho mangiato' },
          { pronoun: 'tu', form: 'hai mangiato' },
          { pronoun: 'lui / lei', form: 'ha mangiato' },
          { pronoun: 'noi', form: 'abbiamo mangiato' },
          { pronoun: 'voi', form: 'avete mangiato' },
          { pronoun: 'loro', form: 'hanno mangiato' },
        ],
      },
      {
        tense: 'Futuro semplice (Future)',
        rows: [
          { pronoun: 'io', form: 'mangerò' },
          { pronoun: 'tu', form: 'mangerai' },
          { pronoun: 'lui / lei', form: 'mangerà' },
          { pronoun: 'noi', form: 'mangeremo' },
          { pronoun: 'voi', form: 'mangerete' },
          { pronoun: 'loro', form: 'mangeranno' },
        ],
      },
    ],
    addedAt: '2024-02-03',
  },
  {
    id: 'it-3',
    word: 'bello',
    translation: 'beautiful / handsome / nice',
    language: 'Italian',
    partOfSpeech: 'adjective',
    status: 'known',
    exampleSentence: 'Roma è una città bellissima con molti monumenti storici.',
    exampleSentenceTranslation: 'Rome is a beautiful city with many historical monuments.',
    notes: 'Agrees with gender/number: bello / bella / belli / belle.',
    addedAt: '2024-02-05',
  },
  {
    id: 'it-4',
    word: 'purtroppo',
    translation: 'unfortunately',
    language: 'Italian',
    partOfSpeech: 'adverb',
    status: 'unknown',
    exampleSentence: 'Purtroppo non posso venire alla tua festa di compleanno.',
    exampleSentenceTranslation: 'Unfortunately I cannot come to your birthday party.',
    addedAt: '2024-02-07',
  },
  {
    id: 'it-5',
    word: 'tramonto',
    translation: 'sunset',
    language: 'Italian',
    partOfSpeech: 'noun',
    status: 'half-known',
    exampleSentence: 'Il tramonto sul mare a Positano è uno spettacolo indimenticabile.',
    exampleSentenceTranslation: 'The sunset over the sea in Positano is an unforgettable spectacle.',
    addedAt: '2024-02-09',
  },
];
