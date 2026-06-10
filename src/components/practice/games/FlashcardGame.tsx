'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import { QueueItem } from '@/lib/practice';

const LANG_FLAG: Record<string, string> = {
  Spanish: '🇪🇸',
  Italian: '🇮🇹',
  English: '🇬🇧',
  French:  '🇫🇷',
  German:  '🇩🇪',
};

// Status → subtle tint colour for the back face of the card
const STATUS_GLOW: Record<string, string> = {
  unknown:     'border-red-500/20',
  'half-known': 'border-amber-500/20',
  known:        'border-emerald-500/20',
};

interface Props {
  item: QueueItem;
  onResult: (passed: boolean) => void;
}

export function FlashcardGame({ item, onResult }: Props) {
  const [flipped, setFlipped] = useState(false);
  const { word } = item;
  const statusBorder = STATUS_GLOW[word.status] ?? 'border-[#1C1E35]';

  return (
    <div className="space-y-5">

      {/* Instruction label */}
      <p className="text-center text-sm text-slate-500">
        Do you know this word?
        <span className="ml-2 text-xs text-slate-700">tap the card to flip</span>
      </p>

      {/* ── 3-D card ─────────────────────────────────────────────────────── */}
      <div style={{ perspective: '1200px' }} className="w-full h-64">
        <motion.div
          onClick={() => !flipped && setFlipped(true)}
          style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%', position: 'relative', cursor: flipped ? 'default' : 'pointer' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
        >

          {/* ── Front face ─────────────────────────────────────────────── */}
          <div
            className="absolute inset-0 bg-[#0D0F1C] border border-[#1C1E35] hover:border-indigo-500/25 rounded-2xl flex flex-col items-center justify-center select-none transition-colors"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Language + POS badge */}
            <div className="flex items-center gap-2 mb-3 text-xs text-slate-600">
              <span>{LANG_FLAG[word.language]}</span>
              <span>{word.language}</span>
              <span className="text-slate-700">·</span>
              <Tag className="w-3 h-3" />
              <span className="capitalize">{word.partOfSpeech}</span>
            </div>

            {/* Target word */}
            <p className="text-5xl font-bold text-white font-mono tracking-tight text-center px-6">
              {word.word}
            </p>

            {/* Tap hint */}
            <div className="mt-5 flex items-center gap-1.5 text-xs text-slate-700">
              <motion.span
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              >
                ↕
              </motion.span>
              <span>Tap to reveal</span>
            </div>
          </div>

          {/* ── Back face ──────────────────────────────────────────────── */}
          <div
            className={`absolute inset-0 bg-[#0D0F1C] border ${statusBorder} rounded-2xl flex flex-col items-center justify-center select-none px-6`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-2">
              Translation
            </p>
            <p className="text-2xl font-bold text-white text-center leading-snug mb-4">
              {word.translation}
            </p>

            {word.exampleSentence && (
              <p className="text-xs text-slate-500 text-center leading-relaxed italic max-w-xs">
                &ldquo;{word.exampleSentence}&rdquo;
              </p>
            )}
          </div>

        </motion.div>
      </div>

      {/* ── Pass / Fail buttons — visible only after flip ─────────────── */}
      <motion.div
        animate={{ opacity: flipped ? 1 : 0, y: flipped ? 0 : 6 }}
        transition={{ duration: 0.25, delay: flipped ? 0.35 : 0 }}
        style={{ pointerEvents: flipped ? 'auto' : 'none' }}
        className="grid grid-cols-2 gap-3"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onResult(false)}
          className="py-4 rounded-xl text-sm font-semibold bg-red-950/50 text-red-400 border border-red-500/25 hover:bg-red-950/80 transition-colors"
        >
          ✗&nbsp; Forgot
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onResult(true)}
          className="py-4 rounded-xl text-sm font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-950/80 transition-colors"
        >
          ✓&nbsp; Knew it
        </motion.button>
      </motion.div>

    </div>
  );
}
