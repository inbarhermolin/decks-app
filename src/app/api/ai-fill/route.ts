import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface AiFillRequest {
  word: string;
  language: string;
  partOfSpeech: string;
}

interface AiFillResponse {
  translation: string;
  sentence: string;
  sentenceTranslation: string;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
  }

  const { word, language, partOfSpeech } = (await request.json()) as AiFillRequest;

  if (!word?.trim() || !language) {
    return Response.json({ error: 'word and language are required' }, { status: 400 });
  }

  const prompt =
    `You are a language learning assistant. ` +
    `Given the ${language} ${partOfSpeech} "${word}", provide:\n` +
    `1. Its concise English translation (1-5 words)\n` +
    `2. A natural, simple example sentence in ${language} using "${word}"\n` +
    `3. The English translation of that example sentence\n\n` +
    `Respond ONLY with a valid JSON object — no markdown, no code fences:\n` +
    `{"translation":"...","sentence":"...","sentenceTranslation":"..."}`;

  let text: string;
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = response.content[0];
    text = block.type === 'text' ? block.text : '';
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Claude API error';
    return Response.json({ error: msg }, { status: 502 });
  }

  const clean = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  let parsed: AiFillResponse;
  try {
    parsed = JSON.parse(clean) as AiFillResponse;
  } catch {
    return Response.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  return Response.json(parsed);
}
