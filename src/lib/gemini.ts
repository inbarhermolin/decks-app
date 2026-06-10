// Gemini REST API — browser-compatible, no SDK required.
// Uses responseMimeType: "application/json" to guarantee structured output.
// Key passed as query param (not Authorization header) — required for browser CORS.

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL   = 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AIEvaluation {
  isCorrect:          boolean;
  feedback:           string;
  correctedSentence:  string | null;
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert, encouraging language teacher evaluating a student's written response to a vocabulary exercise.

Your task:
1. Evaluate the student's response for grammatical correctness, spelling, vocabulary usage, and contextual appropriateness in the TARGET language.
2. Be encouraging but honest. Minor accent omissions (e.g. "citta" for "città") should NOT be counted as errors.
3. Respond ONLY with a single valid JSON object — no markdown, no code fences, no extra text.

The JSON must have EXACTLY these three fields:
- "isCorrect": boolean — true if the response is correct or close enough, false otherwise
- "feedback": string — 1-3 sentences in English explaining what was good or what went wrong
- "correctedSentence": string | null — the fully corrected sentence if there were errors, or null if correct`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripMarkdown(text: string): string {
  // Handles ```json\n...\n``` or ```\n...\n``` with any surrounding whitespace
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

// ── API call ──────────────────────────────────────────────────────────────────

export async function evaluateWithAI(
  userResponse:  string,
  targetWord:    string,
  language:      string,
  exercisePrompt: string,
): Promise<AIEvaluation> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file.');
  }

  const userMessage =
    `Language being learned: ${language}\n` +
    `Target word: "${targetWord}"\n` +
    `Exercise: ${exercisePrompt}\n` +
    `Student's response: "${userResponse}"\n\n` +
    `Evaluate the student's response and return a JSON object as instructed.`;

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
      maxOutputTokens: 300,
    },
  };

  // Content-Type is the only header needed — no Authorization header, which avoids CORS preflight issues.
  let res: Response;
  try {
    res = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
  } catch (networkErr) {
    console.error('[Gemini] Network/CORS error:', networkErr);
    throw new Error('Network error reaching Gemini API. Check your connection.');
  }

  if (!res.ok) {
    let errBody: unknown = {};
    try { errBody = await res.json(); } catch { /* non-JSON error body */ }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiMsg = (errBody as any)?.error?.message ?? '(no message)';
    console.error(`[Gemini] HTTP ${res.status} error | message: ${apiMsg}`, errBody);
    throw new Error(`Gemini API error ${res.status}: ${apiMsg}`);
  }

  const data = await res.json();
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!raw) {
    console.error('[Gemini] Empty text in response. Full payload:', JSON.stringify(data, null, 2));
    throw new Error('Empty response from Gemini.');
  }

  const clean = stripMarkdown(raw);

  let parsed: AIEvaluation;
  try {
    parsed = JSON.parse(clean) as AIEvaluation;
  } catch (parseErr) {
    console.error('[Gemini] JSON parse failed. Raw text was:\n', raw, '\nError:', parseErr);
    throw new Error('Could not parse AI response as JSON. Please try again.');
  }

  if (typeof parsed.isCorrect !== 'boolean' || typeof parsed.feedback !== 'string') {
    console.error('[Gemini] Unexpected response shape:', parsed);
    throw new Error('Unexpected response structure from AI. Please try again.');
  }

  return parsed;
}
