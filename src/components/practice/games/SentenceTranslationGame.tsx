'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, X, RotateCcw } from 'lucide-react';
import { Word } from '@/lib/types';
import { QueueItem, shuffle, normalizeAnswer } from '@/lib/practice';
import { useEnterToContinue } from './useEnterToContinue';
import { ClickableSentence } from './ClickableSentence';

interface Props {
  item:     QueueItem;
  allWords: Word[];
  onResult: (passed: boolean) => void;
}

function normalize(s: string): string {
  return normalizeAnswer(s);
}

export function SentenceTranslationGame({ item, allWords, onResult }: Props) {
  const { word, direction } = item;

  const shown  = direction === 'target-to-english'
    ? word.exampleSentence
    : (word.exampleSentenceTranslation ?? word.exampleSentence);
  const answer = direction === 'target-to-english'
    ? (word.exampleSentenceTranslation ?? word.exampleSentence)
    : word.exampleSentence;
  const shownLang  = direction === 'target-to-english' ? word.language : 'English';
  const answerLang = direction === 'target-to-english' ? 'English' : word.language;

  const [mode, setMode] = useState<'typing' | 'word-bank'>('typing');

  // ── Free typing state ─────────────────────────────────────────────────────
  const [typed,    setTyped]    = useState('');
  const [revealed, setRevealed] = useState(false);

  // ── Word bank state ───────────────────────────────────────────────────────
  const tokens = useMemo(() => answer.split(' '), [answer]);
  const [shuffledOrder] = useState<number[]>(() => shuffle(tokens.map((_, i) => i)));
  const [picked,     setPicked]     = useState<number[]>([]);
  const [wbChecked,  setWbChecked]  = useState(false);
  const [wbCorrect,  setWbCorrect]  = useState(false);

  const available = shuffledOrder.filter((i) => !picked.includes(i));
  const built     = picked.map((i) => tokens[i]).join(' ');

  const pickToken = (origIdx: number) => setPicked((p) => [...p, origIdx]);
  const unpick    = (pos: number)      => setPicked((p) => p.filter((_, i) => i !== pos));

  const handleWbCheck = () => {
    const ok = normalize(built) === normalize(answer);
    setWbCorrect(ok);
    setWbChecked(true);
  };

  const switchMode = (m: 'typing' | 'word-bank') => {
    setMode(m);
    setTyped(''); setRevealed(false);
    setPicked([]); setWbChecked(false); setWbCorrect(false);
  };

  const continueWb = useCallback(() => onResult(wbCorrect), [onResult, wbCorrect]);
  useEnterToContinue(mode === 'word-bank' && wbChecked, continueWb);

  return (
    <div className="space-y-4">

      {/* Label */}
      <div className="text-center">
        <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-1">Sentence Translation</p>
        <p className="text-xs text-slate-500">
          Translate from <span className="text-white font-medium">{shownLang}</span> to{' '}
          <span className="text-white font-medium">{answerLang}</span>
        </p>
      </div>

      {/* Source sentence card */}
      <div className="bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl px-6 py-5 text-center overflow-visible">
        <p className="text-sm text-slate-600 uppercase tracking-widest mb-3">{shownLang}</p>
        <p className="text-xl sm:text-2xl font-semibold text-white leading-relaxed font-mono">
          &ldquo;<ClickableSentence sentence={shown ?? ''} allWords={allWords} />&rdquo;
        </p>
        <p className="text-xs text-slate-700 mt-3">
          Key: <span className="text-indigo-400 font-mono">{word.word}</span>{' '}
          <span className="text-slate-700">({word.partOfSpeech})</span>
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-[#07080F] border border-[#1C1E35] rounded-xl p-1 gap-1">
        {(['typing', 'word-bank'] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              mode === m
                ? 'bg-[#0D0F1C] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            {m === 'typing' ? 'Free Typing' : 'Word Bank'}
          </button>
        ))}
      </div>

      {/* ── Typing mode ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {mode === 'typing' && (
          <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

            {!revealed ? (
              <>
                <textarea
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={`Type your ${answerLang} translation…`}
                  rows={3}
                  className="w-full bg-[#0D0F1C] border border-[#1C1E35] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 text-sm resize-none transition-all leading-relaxed"
                />
                <button
                  onClick={() => setRevealed(true)}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-25 text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Send className="w-4 h-4" />
                  Check Answer
                </button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {typed.trim() && (
                  <div className="bg-[#0D0F1C] border border-[#1C1E35] rounded-xl p-4">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">Your translation</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{typed}</p>
                  </div>
                )}
                <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4">
                  <p className="text-[10px] text-indigo-400 uppercase tracking-wider mb-1.5">Correct answer</p>
                  <p className="text-sm text-white font-medium leading-relaxed">{answer}</p>
                </div>
                <p className="text-xs text-slate-600 text-center">Did you get the gist of it?</p>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => onResult(false)}
                    className="py-4 rounded-xl text-sm font-semibold bg-red-950/50 text-red-400 border border-red-500/25 hover:bg-red-950/80 transition-colors flex items-center justify-center gap-1.5">
                    <X className="w-4 h-4" /> Not quite
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => onResult(true)}
                    className="py-4 rounded-xl text-sm font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-950/80 transition-colors flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" /> Got it!
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Word bank mode ──────────────────────────────────────────────────── */}
        {mode === 'word-bank' && (
          <motion.div key="word-bank" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

            {/* Built sentence */}
            <div className={`min-h-[56px] bg-[#0D0F1C] border rounded-xl px-4 py-3 flex flex-wrap gap-1.5 items-start transition-colors ${
              wbChecked
                ? wbCorrect ? 'border-emerald-500/30' : 'border-red-500/30'
                : 'border-[#1C1E35]'
            }`}>
              {picked.length === 0 ? (
                <p className="text-sm text-slate-700 italic">Click words below to build your answer…</p>
              ) : (
                picked.map((origIdx, pos) => (
                  <motion.button
                    key={`${origIdx}-${pos}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => !wbChecked && unpick(pos)}
                    className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-all ${
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
                  onClick={() => !wbChecked && pickToken(origIdx)}
                  disabled={wbChecked}
                  className="px-2.5 py-1 rounded-lg text-sm font-medium bg-[#0D0F1C] border border-[#1C1E35] text-slate-400 hover:border-indigo-500/40 hover:text-white hover:bg-[#0F1225] transition-all disabled:opacity-40 disabled:cursor-default"
                >
                  {tokens[origIdx]}
                </motion.button>
              ))}
            </div>

            {/* Result or actions */}
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
                  {available.length > 0 ? `Place ${available.length} more word${available.length > 1 ? 's' : ''}` : 'Check Answer'}
                </button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
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
                        Correct: <span className="text-slate-300">{answer}</span>
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
                  Continue &rarr;
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
