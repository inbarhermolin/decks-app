import Anthropic from '@anthropic-ai/sdk';
import { PartOfSpeech } from '@/lib/types';

const client = new Anthropic();

interface WordInput {
  id: string;
  word: string;
  language: string;
  partOfSpeech: PartOfSpeech;
  translation: string;
}

export interface SentenceFillResult {
  id: string;
  sentences: Array<{ sentence: string; translation: string; subject?: string }>;
}

const VERB_SUBJECTS: Record<string, string[]> = {
  Italian: ['io', 'tu', 'lui/lei', 'noi', 'loro'],
  Spanish: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
  French:  ['je', 'tu', 'il/elle', 'nous', 'ils/elles'],
  German:  ['ich', 'du', 'er/sie', 'wir', 'sie'],
  English: ['I', 'you', 'he/she', 'we', 'they'],
};

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
  }

  const { words } = (await request.json()) as { words: WordInput[] };
  if (!words?.length) return Response.json({ results: [] });

  const verbSubjectsNote = Object.entries(VERB_SUBJECTS)
    .map(([lang, subjects]) => `  - ${lang}: ${subjects.join(' / ')}`)
    .join('\n');

  const prompt =
    `You are a language teacher. For each word below, generate 5 natural example sentences.\n\n` +
    `Rules:\n` +
    `- For VERBS: use exactly 5 different grammatical subject persons in this order per language:\n` +
    `${verbSubjectsNote}\n` +
    `  Each sentence must use that subject explicitly and conjugate the verb correctly for it.\n` +
    `- For ALL OTHER parts of speech (noun, adjective, adverb, preposition, etc.):\n` +
    `  generate 5 varied, natural sentences showing different usage contexts.\n` +
    `- Each sentence must be in the target language with an English translation.\n` +
    `- Sentences should be concise (max ~12 words) and appropriate for language learners.\n\n` +
    `Words:\n${JSON.stringify(words)}\n\n` +
    `Respond ONLY with a valid JSON array — no markdown, no prose:\n` +
    `[\n` +
    `  {\n` +
    `    "id": "...",\n` +
    `    "sentences": [\n` +
    `      { "sentence": "...", "translation": "...", "subject": "io" },\n` +
    `      ...\n` +
    `    ]\n` +
    `  }\n` +
    `]\n` +
    `For non-verbs, omit the "subject" field from each sentence object.`;

  let text: string;
  try {
    const response = await client.messages.create({
      model:      'claude-opus-4-8',
      max_tokens: 8192,
      messages:   [{ role: 'user', content: prompt }],
    });
    const block = response.content[0];
    text = block.type === 'text' ? block.text : '';
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Claude API error' },
      { status: 502 },
    );
  }

  const clean = text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let results: SentenceFillResult[];
  try {
    results = JSON.parse(clean) as SentenceFillResult[];
  } catch {
    return Response.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  return Response.json({ results });
}
