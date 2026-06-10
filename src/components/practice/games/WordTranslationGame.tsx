'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, X } from 'lucide-react';
import { Word } from '@/lib/types';
import { QueueItem, shuffle, normalizeAnswer } from '@/lib/practice';
import { useEnterToContinue } from './useEnterToContinue';
import { WordPopover } from './WordPopover';

interface Props {
  item: QueueItem;
  allWords: Word[];
  onResult: (passed: boolean) => void;
}

function normalise(s: string): string {
  return normalizeAnswer(s);
}

function checkTyped(input: string, target: string): boolean {
  const i = normalise(input);
  return target.split('/').map(normalise).some((t) => t === i);
}

function generateChoices(word: Word, allWords: Word[], correct: string): string[] {
  const pool = allWords
    .filter((w) => w.id !== word.id && w.language === word.language)
    .map((w) => w.translation);
  const distractors = shuffle(pool).slice(0, 3);
  return shuffle([correct, ...distractors]);
}

export function WordTranslationGame({ item, allWords, onResult }: Props) {
  const { word, direction } = item;

  const shown   = direction === 'target-to-english' ? word.word       : word.translation;
  const answer  = direction === 'target-to-english' ? word.translation : word.word;
  const shownLang  = direction === 'target-to-english' ? word.language : 'English';
  const answerLang = direction === 'target-to-english' ? 'English'     : word.language;

  const [mode, setMode] = useState<'typing' | 'multiple-choice'>('typing');

  // ── Free typing ───────────────────────────────────────────────────────────
  const [typed,     setTyped]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct,   setCorrect]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'typing') inputRef.current?.focus();
  }, [mode]);

  const handleTypingSubmit = () => {
    if (!typed.trim() || submitted) return;
    const ok = checkTyped(typed, answer);
    setCorrect(ok);
    setSubmitted(true);
  };

  // ── Multiple choice ───────────────────────────────────────────────────────
  const choices = useMemo(
    () => generateChoices(word, allWords, answer),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [word.id, answer],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const mcCorrect = selected === answer;

  const switchMode = (m: 'typing' | 'multiple-choice') => {
    setMode(m);
    setTyped(''); setSubmitted(false); setCorrect(false);
    setSelected(null);
  };

  const continueTyping = useCallback(() => onResult(correct), [onResult, correct]);
  const continueMC     = useCallback(() => onResult(mcCorrect), [onResult, mcCorrect]);
  useEnterToContinue(mode === 'typing' && submitted, continueTyping);
  useEnterToContinue(mode === 'multiple-choice' && selected !== null, continueMC);

  return (
    <div className="space-y-4">

      {/* Label */}
      <div className="text-center">
        <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-1">Word Translation</p>
        <p className="text-xs text-slate-500">
          Translate from <span className="text-white font-medium">{shownLang}</span> to{' '}
          <span className="text-white font-medium">{answerLang}</span>
        </p>
      </div>

      {/* Source word card — LARGE typography */}
      <div className="bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl px-6 py-8 text-center overflow-visible">
        <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-3">{shownLang}</p>
        <p className="text-5xl sm:text-6xl font-bold text-white font-mono tracking-tight leading-none">
          <WordPopover token={shown} allWords={allWords}>{shown}</WordPopover>
        </p>
        <p className="text-xs text-slate-600 mt-3 capitalize">{word.partOfSpeech}</p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-[#07080F] border border-[#1C1E35] rounded-xl p-1 gap-1">
        {(['typing', 'multiple-choice'] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              mode === m
                ? 'bg-[#0D0F1C] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            {m === 'typing' ? 'Free Typing' : 'Multiple Choice'}
          </button>
        ))}
      </div>

      {/* ── Typing mode ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {mode === 'typing' && (
          <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {!submitted ? (
              <>
                <motion.input
                  ref={inputRef}
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTypingSubmit()}
                  placeholder={`Type in ${answerLang}…`}
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                  className="w-full bg-[#0D0F1C] border border-[#1C1E35] rounded-xl px-4 py-3.5 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 font-mono text-xl text-center transition-all"
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
                    correct ? 'bg-emerald-950/40 border border-emerald-500/25' : 'bg-red-950/40 border border-red-500/25'
                  }`}>
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
                        <p className="text-xs text-slate-500">Your answer: <span className="font-mono text-slate-400">{typed}</span></p>
                        <p className="text-xs text-slate-500">Correct: <span className="font-mono text-emerald-400 font-semibold">{answer}</span></p>
                      </div>
                    )}
                    {correct && <p className="text-xs text-slate-500 mt-0.5 font-mono">{answer}</p>}
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
                  Continue &rarr;
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Multiple choice ───────────────────────────────────────────────── */}
        {mode === 'multiple-choice' && (
          <motion.div key="mc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {choices.map((choice, i) => {
              const isSelected = selected === choice;
              const isCorrect  = choice === answer;
              const showResult = selected !== null;

              let cls = 'bg-[#0D0F1C] border-[#1C1E35] text-slate-300 hover:border-indigo-500/40 hover:text-white';
              if (showResult) {
                if (isCorrect)        cls = 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300';
                else if (isSelected)  cls = 'bg-red-950/40 border-red-500/40 text-red-300';
                else                  cls = 'bg-[#0D0F1C] border-[#1C1E35] text-slate-600 opacity-50';
              }

              return (
                <motion.button
                  key={choice}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileTap={!showResult ? { scale: 0.98 } : undefined}
                  onClick={() => !showResult && setSelected(choice)}
                  disabled={showResult}
                  className={`w-full py-4 px-5 rounded-xl border text-sm font-medium text-left transition-all ${cls}`}
                >
                  <span className="text-slate-700 text-xs mr-2">{String.fromCharCode(65 + i)}.</span>
                  {choice}
                </motion.button>
              );
            })}

            <AnimatePresence>
              {selected !== null && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onResult(mcCorrect)}
                  className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-colors mt-1 ${
                    mcCorrect
                      ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-950'
                      : 'bg-red-950/50 text-red-400 border border-red-500/25 hover:bg-red-950'
                  }`}
                >
                  Continue &rarr;
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
