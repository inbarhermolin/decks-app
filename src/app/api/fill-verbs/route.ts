import Anthropic from '@anthropic-ai/sdk';
import { PartOfSpeech } from '@/lib/types';

const client = new Anthropic();

interface WordInput {
  id: string;
  word: string;
  language: string;
}

export interface WordFillResult {
  id: string;
  partOfSpeech: PartOfSpeech;
  presentTense?: string;
  pastTense?: string;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
  }

  const { words } = (await request.json()) as { words: WordInput[] };
  if (!words?.length) return Response.json({ results: [] });

  const prompt =
    `You are a language expert. For each word below, return:\n` +
    `1. The correct part of speech — exactly one of: noun, verb, adjective, adverb, preposition, conjunction, pronoun, phrase\n` +
    `2. For verbs only: all 6 conjugation forms for the present tense and the simple past tense, comma-separated\n\n` +
    `Conjugation person order per language:\n` +
    `- Spanish:  yo / tú / él–ella / nosotros / vosotros / ellos–ellas   (past = pretérito indefinido)\n` +
    `- Italian:  io / tu / lui–lei / noi / voi / loro                    (past = passato prossimo)\n` +
    `- French:   je / tu / il–elle / nous / vous / ils–elles             (past = passé composé)\n` +
    `- German:   ich / du / er–sie / wir / ihr / sie                     (past = Präteritum)\n` +
    `- English:  I / you / he–she / we / you / they                     (past = simple past)\n\n` +
    `Words:\n${JSON.stringify(words)}\n\n` +
    `Respond ONLY with a valid JSON array — no markdown, no prose:\n` +
    `[{"id":"...","partOfSpeech":"...","presentTense":"f1, f2, f3, f4, f5, f6","pastTense":"f1, f2, f3, f4, f5, f6"}]\n` +
    `Omit presentTense and pastTense for non-verbs.`;

  let text: string;
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = response.content[0];
    text = block.type === 'text' ? block.text : '';
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Claude API error' }, { status: 502 });
  }

  const clean = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  let results: WordFillResult[];
  try {
    results = JSON.parse(clean) as WordFillResult[];
  } catch {
    return Response.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  return Response.json({ results });
}
