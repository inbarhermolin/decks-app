'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Zap, ChevronRight } from 'lucide-react';
import { Word, WordStatus, Deck } from '@/lib/types';
import { AppSettings, LearningDirection } from '@/lib/settings';

const DOT: Record<WordStatus, string> = {
  unknown:      'bg-red-400',
  'half-known': 'bg-amber-400',
  known:        'bg-emerald-400',
};

const BATCH_OPTIONS = [5, 10, 15, 20, 25];

const DIRECTION_OPTIONS: { value: LearningDirection; label: string }[] = [
  { value: 'target-to-english', label: '🇮🇹 → 🇬🇧' },
  { value: 'mixed',             label: 'Mixed' },
  { value: 'english-to-target', label: '🇬🇧 → 🇮🇹' },
];

interface Props {
  words:          Word[];
  decks:          Deck[];
  settings:       AppSettings;
  selectedDeckId: string | null;
  onDeckChange:   (id: string | null) => void;
  onStart:        (batchSize: number, direction: LearningDirection) => void;
  onBack:         () => void;
}

export function PreGameSetup({ words, decks, settings, selectedDeckId, onDeckChange, onStart, onBack }: Props) {
  const [batchSize,  setBatchSize]  = useState(settings.batchSize);
  const [direction,  setDirection]  = useState<LearningDirection>(settings.direction);

  const pool = words.filter(
    (w) => w.language === 'Italian' && (!selectedDeckId || w.deckId === selectedDeckId),
  );

  const unknown   = pool.filter((w) => w.status === 'unknown').length;
  const halfKnown = pool.filter((w) => w.status === 'half-known').length;
  const known     = pool.filter((w) => w.status === 'known').length;
  const total     = pool.length;
  const needsWork = unknown + halfKnown;

  return (
    <div className="min-h-screen bg-[#07080F] flex flex-col">

      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(99,102,241,0.1), transparent)' }} />

      <header className="relative z-10 px-4 sm:px-6 py-4 border-b border-[#1C1E35]">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-md flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-300 tracking-tight">Decks</span>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <Zap className="w-3 h-3" />
            Practice Mode
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
            🇮🇹 Italian
          </h1>
          <p className="text-slate-500 text-sm">Set up your session, then choose a game mode.</p>
        </motion.div>

        <div className="w-full max-w-md space-y-4">

          {/* Stats card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-white">{total} words</span>
              {needsWork > 0 && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-indigo-950/60 text-indigo-400 border border-indigo-500/20 font-medium">
                  {needsWork} to review
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mb-3">
              {unknown > 0   && <span className="flex items-center gap-1 text-xs text-slate-500"><span className={`w-1.5 h-1.5 rounded-full ${DOT.unknown}`} />{unknown} new</span>}
              {halfKnown > 0 && <span className="flex items-center gap-1 text-xs text-slate-500"><span className={`w-1.5 h-1.5 rounded-full ${DOT['half-known']}`} />{halfKnown} learning</span>}
              {known > 0     && <span className="flex items-center gap-1 text-xs text-slate-500"><span className={`w-1.5 h-1.5 rounded-full ${DOT.known}`} />{known} known</span>}
            </div>
            <div className="h-1.5 bg-[#1C1E35] rounded-full overflow-hidden flex">
              <div className="bg-red-500/60"     style={{ flex: unknown }} />
              <div className="bg-amber-500/60"   style={{ flex: halfKnown }} />
              <div className="bg-emerald-500/60" style={{ flex: known }} />
            </div>
          </motion.div>

          {/* Deck filter */}
          {decks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl p-5"
            >
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Deck</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onDeckChange(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedDeckId === null
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-[#111325] text-slate-500 border border-[#1C1E35] hover:border-[#2A2C45] hover:text-slate-400'
                  }`}
                >
                  All Words
                </button>
                {decks.map((deck) => (
                  <button
                    key={deck.id}
                    onClick={() => onDeckChange(deck.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedDeckId === deck.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-[#111325] text-slate-500 border border-[#1C1E35] hover:border-[#2A2C45] hover:text-slate-400'
                    }`}
                  >
                    {deck.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Batch size */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl p-5"
          >
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Words per session</p>
            <div className="flex gap-2">
              {BATCH_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setBatchSize(n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                    batchSize === n
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-[#111325] text-slate-500 border border-[#1C1E35] hover:border-[#2A2C45] hover:text-slate-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Direction toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl p-5"
          >
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Direction</p>
            <div className="flex gap-2">
              {DIRECTION_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDirection(value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    direction === value
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-[#111325] text-slate-500 border border-[#1C1E35] hover:border-[#2A2C45] hover:text-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Start button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onStart(batchSize, direction)}
            disabled={total === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
          >
            Choose Game Mode
            <ChevronRight className="w-4 h-4" />
          </motion.button>

        </div>
      </div>
    </div>
  );
}
