'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, X } from 'lucide-react';
import { QueueItem } from '@/lib/practice';

interface Props {
  item: QueueItem;
  onResult: (passed: boolean) => void;
}

/** Accept any slash-separated alternative (e.g. "to speak / to talk") */
function checkAnswer(input: string, target: string): boolean {
  const normalise = (s: string) => s.trim().toLowerCase();
  const in_ = normalise(input);
  return target
    .split('/')
    .map(normalise)
    .some((t) => t === in_);
}

export function TypingGame({ item, onResult }: Props) {
  const [value,     setValue]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct,   setCorrect]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { word } = item;

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = () => {
    if (!value.trim() || submitted) return;
    const ok = checkAnswer(value, word.word);
    setCorrect(ok);
    setSubmitted(true);
  };

  return (
    <div className="space-y-5">

      {/* Label */}
      <div className="text-center">
        <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-1">
          Typing Challenge
        </p>
        <p className="text-sm text-slate-400">
          Type the <span className="text-white font-medium">{word.language}</span> word for:
        </p>
      </div>

      {/* Prompt card */}
      <div className="bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl p-7 text-center">
        <p className="text-2xl font-bold text-white leading-snug">{word.translation}</p>
        {word.partOfSpeech && (
          <p className="text-xs text-slate-600 mt-1.5 capitalize">{word.partOfSpeech}</p>
        )}
      </div>

      {/* Input row */}
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <motion.input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={`Type in ${word.language}…`}
              className="w-full bg-[#0D0F1C] border border-[#1C1E35] rounded-xl px-4 py-3.5 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 font-mono text-xl text-center transition-all"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button
              onClick={handleSubmit}
              disabled={!value.trim()}
              className="w-full py-3.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-25 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Check Answer
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22 }}
            className="space-y-3"
          >
            {/* Feedback banner */}
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
                    <p className="text-xs text-slate-500">
                      Your answer:{' '}
                      <span className="font-mono text-slate-400">{value}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Correct answer:{' '}
                      <span className="font-mono text-emerald-400 font-semibold">{word.word}</span>
                    </p>
                  </div>
                )}
                {correct && (
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{word.word}</p>
                )}
              </div>
            </motion.div>

            {/* Continue */}
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
      </AnimatePresence>

    </div>
  );
}
