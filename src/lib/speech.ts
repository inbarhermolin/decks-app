// Language name → BCP-47 locale (used for labelling / future API calls)
export const LANG_CODE: Record<string, string> = {
  Spanish: 'es-ES',
  Italian: 'it-IT',
  French:  'fr-FR',
  German:  'de-DE',
  English: 'en-US',
};

// Language name → Google TTS `tl` parameter (2-letter code)
const LANG_TL: Record<string, string> = {
  Spanish: 'es',
  Italian: 'it',
  French:  'fr',
  German:  'de',
  English: 'en',
};

// Derive the 2-letter code from either a language name ("Italian") or a locale ("it-IT")
function toLangTl(langOrLocale: string): string {
  // Direct lookup by language name
  if (LANG_TL[langOrLocale]) return LANG_TL[langOrLocale];
  // Fallback: take the prefix of a locale string (it-IT → it)
  return langOrLocale.split('-')[0].toLowerCase();
}

// ── Audio instance management ─────────────────────────────────────────────────

let _current: HTMLAudioElement | null = null;

function stopCurrent() {
  if (_current) {
    _current.pause();
    _current.src = '';   // release the network request
    _current = null;
  }
}

// ── Main speak function ───────────────────────────────────────────────────────

export interface SpeakCallbacks {
  onstart?: () => void;
  onend?:   () => void;
  onerror?: () => void;
}

export async function speakText(
  text:             string,
  langOrLocale:     string,  // e.g. "Italian" or "it-IT" — both accepted
  _rate             = 0.82,  // kept for API compatibility; Google TTS ignores it
  callbacks:        SpeakCallbacks = {},
): Promise<void> {
  if (typeof window === 'undefined') return;

  stopCurrent();

  const tl       = toLangTl(langOrLocale);
  const audioUrl =
    `https://translate.google.com/translate_tts` +
    `?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${tl}&client=tw-ob`;

  console.log(`[TTS] lang=${tl} | text="${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`);

  const audio   = new Audio(audioUrl);
  _current      = audio;

  audio.onplay  = () => callbacks.onstart?.();
  audio.onended = () => { _current = null; callbacks.onend?.(); };
  audio.onerror = () => {
    console.error(`[TTS] Playback error — lang=${tl} text="${text.slice(0, 60)}"`);
    _current = null;
    callbacks.onerror?.();
  };

  try {
    await audio.play();
  } catch (err) {
    console.error('[TTS] audio.play() rejected:', err);
    _current = null;
    callbacks.onerror?.();
  }
}

export function cancelSpeech(): void {
  stopCurrent();
}
