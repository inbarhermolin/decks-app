'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useEnterToContinue } from './useEnterToContinue';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Send, Check, X, RotateCcw } from 'lucide-react';
import { QueueItem, shuffle, normalizeAnswer } from '@/lib/practice';
import { LANG_CODE, speakText, cancelSpeech } from '@/lib/speech';

const LANG_FLAG: Record<string, string> = {
  Spanish: '🇪🇸', Italian: '🇮🇹', English: '🇬🇧', French: '🇫🇷', German: '🇩🇪',
};

interface Props {
  item: QueueItem;
  onResult: (passed: boolean) => void;
}

function norm(s: string): string {
  return normalizeAnswer(s);
}

type Playing = 'word' | 'sentence' | null;

export function ListeningGame({ item, onResult }: Props) {
  const { word } = item;
  const langCode = LANG_CODE[word.language] ?? 'en-US';
  const hasSentence = !!word.exampleSentence;

  const [supported, setSupported] = useState(true);
  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  // ── Sub-mode: word dictation vs sentence word-bank ────────────────────────
  const [mode, setMode] = useState<'typing' | 'word-bank'>('typing');

  // ── Playback ──────────────────────────────────────────────────────────────
  const [playing,   setPlaying]   = useState<Playing>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Guard against state updates after unmount
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const doSpeak = useCallback(
    (text: string, type: Playing) => {
      if (!supported || !text) return;
      setPlaying(type);
      speakText(text, langCode, type === 'sentence' ? 0.84 : 0.80, {
        onend:   () => { if (mounted.current) { setPlaying(null); setHasPlayed(true); } },
        onerror: () => { if (mounted.current) { setPlaying(null); setHasPlayed(true); } },
      });
    },
    [supported, langCode],
  );

  const playWord     = useCallback(() => doSpeak(word.word,                        'word'),     [doSpeak, word.word]);
  const playSentence = useCallback(() => doSpeak(word.exampleSentence ?? word.word, 'sentence'), [doSpeak, word.exampleSentence, word.word]);

  // Auto-play on mount and mode change
  // — word-bank → sentence is the comprehension task; typing → word is dictation
  useEffect(() => {
    const defaultPlay = mode === 'word-bank' && hasSentence ? playSentence : playWord;
    const t = setTimeout(defaultPlay, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ── Typing state ──────────────────────────────────────────────────────────
  const [typed,     setTyped]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct,   setCorrect]   = useState(false);

  // ── Word bank state (sentence reconstruction) ─────────────────────────────
  const wbAnswer = word.exampleSentence ?? word.word;
  const tokens   = useMemo(() => wbAnswer.split(' '), [wbAnswer]);
  const [shuffledOrder] = useState<number[]>(() => shuffle(tokens.map((_, i) => i)));
  const [picked,    setPicked]    = useState<number[]>([]);
  const [wbChecked, setWbChecked] = useState(false);
  const [wbCorrect, setWbCorrect] = useState(false);

  const available = shuffledOrder.filter((i) => !picked.includes(i));
  const built     = picked.map((i) => tokens[i]).join(' ');

  // ── Mode switch ────────────────────────────────────────────────────────────
  const switchMode = (m: 'typing' | 'word-bank') => {
    if (m === mode) return;
    cancelSpeech();
    setPlaying(null);
    setHasPlayed(false);
    setTyped(''); setSubmitted(false); setCorrect(false);
    setPicked([]); setWbChecked(false); setWbCorrect(false);
    setMode(m);
  };

  const continueTyping = useCallback(() => onResult(correct), [onResult, correct]);
  const continueWb     = useCallback(() => onResult(wbCorrect), [onResult, wbCorrect]);
  useEnterToContinue(mode === 'typing' && submitted, continueTyping);
  useEnterToContinue(mode === 'word-bank' && wbChecked, continueWb);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleTypingSubmit = () => {
    if (!typed.trim() || submitted) return;
    const ok = norm(typed) === norm(word.word);
    setCorrect(ok);
    setSubmitted(true);
  };

  const handleWbCheck = () => {
    const ok = norm(built) === norm(wbAnswer);
    setWbCorrect(ok);
    setWbChecked(true);
  };

  // ── Shared play button component ──────────────────────────────────────────
  const PlayBtn = ({
    type, label, disabled: dis,
  }: { type: 'word' | 'sentence'; label: string; disabled?: boolean }) => {
    const isPlaying = playing === type;
    const accent    = type === 'word' ? 'indigo' : 'violet';
    const colorMap  = {
      indigo: { border: 'border-indigo-500/50', bg: 'bg-indigo-500/20', icon: 'text-indigo-400', label: 'text-indigo-400', ring: 'border-indigo-400/40' },
      violet: { border: 'border-violet-500/50', bg: 'bg-violet-500/20', icon: 'text-violet-400', label: 'text-violet-400', ring: 'border-violet-400/40' },
    } as const;
    const c = colorMap[accent];

    return (
      <motion.button
        whileTap={!dis ? { scale: 0.94 } : undefined}
        onClick={() => type === 'word' ? playWord() : playSentence()}
        disabled={dis}
        className={`relative flex flex-col items-center gap-2.5 py-5 rounded-2xl border transition-all disabled:opacity-35 ${
          isPlaying
            ? `${c.bg} ${c.border}`
            : 'bg-[#07080F] border-[#1C1E35] hover:border-slate-600/60 hover:bg-[#0D0F1C]'
        }`}
      >
        {/* Pulse rings when speaking */}
        {isPlaying && (
          <>
            <motion.div
              className={`absolute inset-0 rounded-2xl border ${c.ring}`}
              animate={{ scale: [1, 1.05], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'easeOut' }}
            />
            <motion.div
              className={`absolute inset-0 rounded-2xl border ${c.ring}`}
              animate={{ scale: [1, 1.09], opacity: [0.3, 0] }}
              transition={{ repeat: Infinity, duration: 0.9, delay: 0.25, ease: 'easeOut' }}
            />
          </>
        )}

        <Volume2 className={`relative w-6 h-6 ${isPlaying ? c.icon : 'text-slate-500'}`} />

        <div className="relative text-center">
          <p className={`text-xs font-semibold ${isPlaying ? c.label : 'text-slate-400'}`}>
            {label}
          </p>
          <p className="text-[10px] text-slate-700 mt-0.5">
            {isPlaying ? 'Playing…' : 'tap to play'}
          </p>
        </div>
      </motion.button>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Label */}
      <div className="text-center">
        <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-1">Listening</p>
        <p className="text-xs text-slate-500">
          {LANG_FLAG[word.language]} {word.language} ·{' '}
          {mode === 'typing' ? 'Spell the word you hear' : 'Reconstruct the sentence'}
        </p>
      </div>

      {/* ── Audio card ────────────────────────────────────────────────────── */}
      <div className="bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl overflow-hidden">
        <div className="px-5 pt-4 pb-3 text-center border-b border-[#1C1E35]">
          <p className="text-[11px] text-slate-600 uppercase tracking-widest">
            {word.language} · <span className="capitalize">{word.partOfSpeech}</span>
          </p>
          <p className="text-xs text-slate-700 mt-1">
            {!supported
              ? 'Audio not supported in this browser'
              : mode === 'typing'
                ? 'Listen carefully — spell the word you hear'
                : 'Listen carefully — reconstruct the full sentence'}
          </p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-[#1C1E35] p-3 gap-3 divide-x-0">
          <PlayBtn type="word"     label="Play Word"     disabled={!supported} />
          <PlayBtn type="sentence" label="Play Sentence" disabled={!supported || !hasSentence} />
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-[#07080F] border border-[#1C1E35] rounded-xl p-1 gap-1">
        {(['typing', 'word-bank'] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              mode === m ? 'bg-[#0D0F1C] text-white shadow-sm' : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            {m === 'typing' ? 'Free Typing' : 'Word Bank'}
          </button>
        ))}
      </div>

      {/* ── Typing mode ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {mode === 'typing' && (
          <motion.div
            key="typing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {!submitted ? (
              <>
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTypingSubmit()}
                  placeholder={`Type the ${word.language} word you heard…`}
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                  className="w-full bg-[#0D0F1C] border border-[#1C1E35] rounded-xl px-4 py-3.5 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 font-mono text-2xl text-center tracking-wide transition-all"
                />
                <button
                  onClick={handleTypingSubmit}
                  disabled={!typed.trim()}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-25 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Send className="w-4 h-4" />
                  Check Answer
                </button>
              </>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="space-y-3"
              >
                <motion.div
                  animate={!correct ? { x: [-5, 5, -5, 5, 0] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`rounded-xl p-4 flex items-start gap-3 ${
                    correct
                      ? 'bg-emerald-950/40 border border-emerald-500/25'
                      : 'bg-red-950/40 border border-red-500/25'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {correct ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${correct ? 'text-emerald-400' : 'text-red-400'}`}>
                      {correct ? 'Correct!' : 'Not quite…'}
                    </p>
                    {!correct && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-slate-500">You typed: <span className="font-mono text-slate-400">{typed}</span></p>
                        <p className="text-xs text-slate-500">Correct: <span className="font-mono text-white font-semibold">{word.word}</span></p>
                      </div>
                    )}
                    {correct && <p className="text-xs text-slate-500 mt-0.5 font-mono">{word.word}</p>}
                    <p className="text-xs text-slate-600 mt-1">{word.translation}</p>
                  </div>
                </motion.div>
                <button
                  onClick={() => onResult(correct)}
                  className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-colors ${
                    correct
                      ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-950'
                      : 'bg-red-950/50 text-red-400 border border-red-500/25 hover:bg-red-950'
                  }`}
                >
                  Continue →
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Word bank mode ──────────────────────────────────────────────── */}
        {mode === 'word-bank' && (
          <motion.div
            key="word-bank"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Built sentence */}
            <div className={`min-h-[56px] bg-[#0D0F1C] border rounded-xl px-4 py-3 flex flex-wrap gap-1.5 items-start transition-colors ${
              wbChecked
                ? wbCorrect ? 'border-emerald-500/30' : 'border-red-500/30'
                : 'border-[#1C1E35]'
            }`}>
              {picked.length === 0 ? (
                <p className="text-sm text-slate-700 italic">Click words to reconstruct the sentence…</p>
              ) : (
                picked.map((origIdx, pos) => (
                  <motion.button
                    key={`${origIdx}-${pos}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => !wbChecked && setPicked((p) => p.filter((_, i) => i !== pos))}
                    className={`px-2.5 py-1 rounded-lg text-sm font-medium font-mono transition-all ${
                      wbChecked
                        ? 'bg-[#111325] text-slate-400 cursor-default'
                        : 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 hover:bg-red-950/40 hover:text-red-300 hover:border-red-500/30'
                    }`}
                  >
                    {tokens[origIdx]}
                  </motion.button>
                ))
              )}
            </div>

            {/* Available tokens */}
            <div className="flex flex-wrap gap-1.5 min-h-[40px]">
              {available.map((origIdx) => (
                <motion.button
                  key={origIdx}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => !wbChecked && setPicked((p) => [...p, origIdx])}
                  disabled={wbChecked}
                  className="px-2.5 py-1 rounded-lg text-sm font-medium font-mono bg-[#0D0F1C] border border-[#1C1E35] text-slate-400 hover:border-indigo-500/40 hover:text-white hover:bg-[#0F1225] transition-all disabled:opacity-40 disabled:cursor-default"
                >
                  {tokens[origIdx]}
                </motion.button>
              ))}
            </div>

            {/* Actions */}
            {!wbChecked ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setPicked([])}
                  disabled={picked.length === 0}
                  className="px-3 py-3 rounded-xl text-slate-600 hover:text-slate-300 hover:bg-[#0D0F1C] border border-transparent hover:border-[#1C1E35] disabled:opacity-30 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleWbCheck}
                  disabled={available.length > 0}
                  className="flex-1 py-3.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Send className="w-4 h-4" />
                  {available.length > 0
                    ? `Place ${available.length} more word${available.length > 1 ? 's' : ''}`
                    : 'Check Answer'}
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className={`rounded-xl p-4 flex items-start gap-3 ${
                  wbCorrect
                    ? 'bg-emerald-950/30 border border-emerald-500/25'
                    : 'bg-red-950/30 border border-red-500/25'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    wbCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {wbCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${wbCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                      {wbCorrect ? 'Correct!' : 'Not quite…'}
                    </p>
                    {!wbCorrect && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Correct: <span className="text-slate-300 font-mono">{wbAnswer}</span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onResult(wbCorrect)}
                  className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-colors ${
                    wbCorrect
                      ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-950'
                      : 'bg-red-950/50 text-red-400 border border-red-500/25 hover:bg-red-950'
                  }`}
                >
                  Continue →
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
