'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye } from 'lucide-react';
import { QueueItem } from '@/lib/practice';

interface Props {
  item: QueueItem;
  onResult: (passed: boolean) => void;
}

export function SentenceGame({ item, onResult }: Props) {
  const [userText, setUserText] = useState('');
  const [revealed, setRevealed] = useState(false);
  const { word } = item;

  const correctTranslation =
    word.exampleSentenceTranslation ?? `(contains: ${word.word} = "${word.translation}")`;

  return (
    <div className="space-y-5">

      {/* Label */}
      <div className="text-center">
        <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-1">
          Sentence Translation
        </p>
        <p className="text-sm text-slate-400">
          Translate this <span className="text-white font-medium">{word.language}</span> sentence into English:
        </p>
      </div>

      {/* Source sentence card */}
      <div className="bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl p-5">
        <p className="text-base font-semibold text-white leading-relaxed italic">
          &ldquo;{word.exampleSentence}&rdquo;
        </p>
        <p className="text-xs text-slate-700 mt-2">
          Key word:{' '}
          <span className="text-indigo-400 font-mono">{word.word}</span>{' '}
          <span className="text-slate-600">({word.partOfSpeech})</span>
        </p>
      </div>

      {/* User input + actions */}
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <textarea
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="Type your English translation…"
              rows={3}
              className="w-full bg-[#0D0F1C] border border-[#1C1E35] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 text-sm resize-none transition-all"
            />
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-3.5 rounded-xl text-sm font-semibold bg-[#0D0F1C] border border-[#1C1E35] hover:border-indigo-500/30 text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Reveal Correct Answer
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {/* User's attempt (if any) */}
            {userText.trim() && (
              <div className="bg-[#0D0F1C] border border-[#1C1E35] rounded-xl p-3.5">
                <p className="text-[11px] text-slate-600 uppercase tracking-wider mb-1">Your translation</p>
                <p className="text-sm text-slate-300 leading-relaxed">{userText}</p>
              </div>
            )}

            {/* Correct translation */}
            <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3.5">
              <p className="text-[11px] text-indigo-400 uppercase tracking-wider mb-1">Correct translation</p>
              <p className="text-sm text-white font-medium leading-relaxed">{correctTranslation}</p>
            </div>

            {/* Self-grade */}
            <p className="text-xs text-slate-500 text-center pt-1">
              Did you get the gist of it?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onResult(false)}
                className="py-4 rounded-xl text-sm font-semibold bg-red-950/50 text-red-400 border border-red-500/25 hover:bg-red-950/80 transition-colors"
              >
                ✗&nbsp; Not really
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onResult(true)}
                className="py-4 rounded-xl text-sm font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-950/80 transition-colors"
              >
                ✓&nbsp; Got it!
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
