'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  Zap,
  Globe,
  Tag,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Trash2,
} from 'lucide-react';
import { Word, WordStatus } from '@/lib/types';
import { StatusBadge, STATUS_CONFIG } from './StatusBadge';
import { Separator } from '@/components/ui/separator';

// ── Constants ────────────────────────────────────────────────────────────────

const POS_STYLES: Record<string, string> = {
  verb:        'bg-violet-950/50 text-violet-400 border-violet-500/25',
  noun:        'bg-blue-950/50   text-blue-400   border-blue-500/25',
  adjective:   'bg-pink-950/50   text-pink-400   border-pink-500/25',
  adverb:      'bg-cyan-950/50   text-cyan-400   border-cyan-500/25',
  preposition: 'bg-orange-950/50 text-orange-400 border-orange-500/25',
  conjunction: 'bg-teal-950/50   text-teal-400   border-teal-500/25',
  pronoun:     'bg-indigo-950/50 text-indigo-400 border-indigo-500/25',
  phrase:      'bg-rose-950/50   text-rose-400   border-rose-500/25',
};

const STATUS_HEADER_GLOW: Record<WordStatus, string> = {
  known:        'from-emerald-950/60 to-[#0D0F1C]',
  'half-known': 'from-amber-950/60   to-[#0D0F1C]',
  unknown:      'from-red-950/60     to-[#0D0F1C]',
};

const STATUSES: WordStatus[] = ['unknown', 'half-known', 'known'];

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  word: Word | null;
  onClose: () => void;
  onStatusChange: (id: string, status: WordStatus) => void;
  onDelete: (id: string) => void;
}

export function WordDetailPanel({ word, onClose, onStatusChange, onDelete }: Props) {
  const [openTense, setOpenTense]       = useState<number | null>(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <AnimatePresence>
      {word && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Slide-in panel */}
          <motion.aside
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-[#0D0F1C] z-50 shadow-[0_0_60px_rgba(0,0,0,0.8)] border-l border-[#1C1E35] flex flex-col overflow-hidden"
          >
            {/* Status-tinted sticky header */}
            <div className={`flex-shrink-0 bg-gradient-to-b ${STATUS_HEADER_GLOW[word.status]} px-6 pt-5 pb-6 border-b border-[#1C1E35]`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{word.language}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setConfirmDelete((v) => !v)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      confirmDelete
                        ? 'bg-red-500/15 text-red-400'
                        : 'text-slate-600 hover:text-red-400 hover:bg-red-500/10'
                    }`}
                    aria-label="Delete word"
                    title="Delete word"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { onClose(); setConfirmDelete(false); }}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-slate-500 hover:text-slate-300"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-4xl font-bold tracking-tight text-white font-mono mb-1"
              >
                {word.word}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-base text-slate-400"
              >
                {word.translation}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-wrap items-center gap-2 mt-3"
              >
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${POS_STYLES[word.partOfSpeech] ?? 'bg-slate-900 text-slate-400 border-slate-700'}`}
                >
                  <Tag className="w-3 h-3" />
                  {word.partOfSpeech}
                </span>
                <StatusBadge status={word.status} />
              </motion.div>
            </div>

            {/* Delete confirmation banner */}
            <AnimatePresence>
              {confirmDelete && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex-shrink-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 px-6 py-3 bg-red-950/40 border-b border-red-500/25">
                    <p className="text-xs text-red-300/80 leading-snug">
                      Remove <span className="font-semibold text-red-300">"{word.word}"</span> from your collection?
                    </p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 border border-[#2A2C45] hover:border-[#3A3C55] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => onDelete(word.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-6">

                {/* Example sentence */}
                <motion.section
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Example
                    </h3>
                    <button className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 transition-colors px-2 py-1 rounded-md hover:bg-indigo-500/10">
                      <Zap className="w-3 h-3" />
                      Generate New
                    </button>
                  </div>
                  <div className="bg-[#111325] border border-[#1C1E35] rounded-xl p-4">
                    <p className="text-sm text-slate-300 leading-relaxed italic">
                      &ldquo;{word.exampleSentence}&rdquo;
                    </p>
                  </div>
                </motion.section>

                {/* Notes */}
                {word.notes && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-2.5 bg-amber-950/25 border border-amber-500/20 rounded-xl p-4"
                  >
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">💡</span>
                    <p className="text-sm text-amber-300/80 leading-relaxed">{word.notes}</p>
                  </motion.div>
                )}

                {/* Simple tense strings (verbs without full conjugation table) */}
                {word.partOfSpeech === 'verb' && (!word.conjugations || word.conjugations.length === 0) && (word.presentTense || word.pastTense) && (
                  <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                  >
                    <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2.5">
                      Conjugations
                    </h3>
                    <div className="space-y-2">
                      {word.presentTense && (
                        <div className="border border-[#1C1E35] rounded-xl overflow-hidden">
                          <div className="px-4 py-3 bg-[#111325]">
                            <span className="text-sm font-medium text-slate-300">Present</span>
                          </div>
                          <div className="px-4 py-3 bg-[#0D0F1C]">
                            <span className="text-sm text-slate-200 font-mono">{word.presentTense}</span>
                          </div>
                        </div>
                      )}
                      {word.pastTense && (
                        <div className="border border-[#1C1E35] rounded-xl overflow-hidden">
                          <div className="px-4 py-3 bg-[#111325]">
                            <span className="text-sm font-medium text-slate-300">Past</span>
                          </div>
                          <div className="px-4 py-3 bg-[#0D0F1C]">
                            <span className="text-sm text-slate-200 font-mono">{word.pastTense}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.section>
                )}

                {/* Conjugation tables (verbs only) */}
                {word.partOfSpeech === 'verb' && word.conjugations && word.conjugations.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                  >
                    <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2.5">
                      Conjugations
                    </h3>
                    <div className="space-y-2">
                      {word.conjugations.map((tense, i) => (
                        <div key={i} className="border border-[#1C1E35] rounded-xl overflow-hidden">
                          <button
                            onClick={() => setOpenTense(openTense === i ? null : i)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-[#111325] hover:bg-[#141730] transition-colors text-left"
                          >
                            <span className="text-sm font-medium text-slate-300">{tense.tense}</span>
                            {openTense === i
                              ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                              : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            }
                          </button>

                          <AnimatePresence initial={false}>
                            {openTense === i && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="divide-y divide-[#1C1E35]/60">
                                  {tense.rows.map((row, j) => (
                                    <div
                                      key={j}
                                      className={`flex items-center justify-between px-4 py-2.5 ${j % 2 === 0 ? 'bg-[#0D0F1C]' : 'bg-[#0F1120]/60'}`}
                                    >
                                      <span className="text-xs text-slate-600 font-medium w-28 font-mono">
                                        {row.pronoun}
                                      </span>
                                      <span className="text-sm font-semibold text-slate-200 font-mono">
                                        {row.form}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                )}

                <Separator className="bg-[#1C1E35]" />

                {/* Status update */}
                <motion.section
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                    I know this word…
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {STATUSES.map((s) => {
                      const cfg = STATUS_CONFIG[s];
                      const active = word.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => onStatusChange(word.id, s)}
                          className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${cfg.button} ${
                            active
                              ? `ring-2 ring-offset-2 ring-offset-[#0D0F1C] ${cfg.ring} scale-[1.03]`
                              : 'opacity-50 hover:opacity-80'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </motion.section>

                {/* Meta */}
                <div className="flex items-center gap-1.5 text-xs text-slate-700 pb-2">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Added{' '}
                  {new Date(word.addedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
