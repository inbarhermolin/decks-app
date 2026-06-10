'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, RefreshCw, TrendingUp, Check, X, Minus } from 'lucide-react';
import { Word, Language, WordStatus } from '@/lib/types';
import { WordResult } from '@/lib/practice';

// ── Constants ─────────────────────────────────────────────────────────────────

const LANG_FLAG: Record<Language, string> = {
  Spanish: '🇪🇸',
  Italian: '🇮🇹',
  English: '🇬🇧',
  French:  '🇫🇷',
  German:  '🇩🇪',
};

const STATUS_LABEL: Record<WordStatus, string> = {
  unknown:      'Unknown',
  'half-known': 'Half Known',
  known:        'Known',
};

const STATUS_COLOR: Record<WordStatus, string> = {
  unknown:      'text-red-400',
  'half-known': 'text-amber-400',
  known:        'text-emerald-400',
};

const UPGRADE_TO: Record<WordStatus, WordStatus> = {
  unknown:      'half-known',
  'half-known': 'known',
  known:        'known',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  results:          WordResult[];
  eligibleUpgrades: Word[];
  language:         Language;
  sessionXP:        number;
  onDone:           (approvedIds: Set<string>) => void;
  onPracticeAgain:  () => void;
}

export function SummaryScreen({
  results,
  eligibleUpgrades,
  language,
  sessionXP,
  onDone,
  onPracticeAgain,
}: Props) {
  const firstTryCount = results.filter((r) =>  r.passedFirstTry).length;
  const failedCount   = results.filter((r) => !r.passed).length;
  const totalMistakes = results.reduce((sum, r) => sum + Math.max(0, r.totalAttempts - 1), 0);

  const score      = results.length > 0 ? firstTryCount / results.length : 0;
  const titleEmoji = score >= 0.9 ? '🔥' : score >= 0.7 ? '⚡' : score >= 0.5 ? '💪' : '🎯';
  const titleText  = score >= 0.9 ? 'Flawless!'   : score >= 0.7 ? 'Great work!'
                   : score >= 0.5 ? 'Good effort!' : 'Keep going!';

  // Upgrade approval state: null = pending, true = approved, false = rejected
  const [decisions, setDecisions] = useState<Record<string, boolean | null>>(
    () => Object.fromEntries(eligibleUpgrades.map((w) => [w.id, null])),
  );

  const approve = (id: string) => setDecisions((d) => ({ ...d, [id]: true }));
  const reject  = (id: string) => setDecisions((d) => ({ ...d, [id]: false }));

  const handleDone = useCallback(() => {
    const approvedIds = new Set(
      Object.entries(decisions)
        .filter(([, v]) => v === true)
        .map(([id]) => id),
    );
    onDone(approvedIds);
  }, [decisions, onDone]);

  const pendingCount = Object.values(decisions).filter((v) => v === null).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter') handleDone(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleDone]);

  return (
    <div className="min-h-screen bg-[#07080F] flex flex-col">

      {/* Glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(99,102,241,0.08), transparent)' }}
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-4">

          {/* Trophy */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
            className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25"
          >
            <Trophy className="w-8 h-8 text-white" />
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-white mb-1">{titleEmoji} {titleText}</h1>
            <p className="text-slate-500 text-sm">
              {LANG_FLAG[language]} {language} · {results.length} words reviewed
            </p>
          </motion.div>

          {/* XP earned badge */}
          {sessionXP > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 6 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              transition={{ delay: 0.28, type: 'spring', stiffness: 260, damping: 20 }}
              className="flex justify-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/25 text-yellow-400">
                <span className="text-base leading-none">⭐</span>
                <span className="text-sm font-bold tabular-nums">+{sessionXP} XP</span>
                <span className="text-xs text-yellow-600">earned this round</span>
              </div>
            </motion.div>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { value: firstTryCount, label: 'First try',    colorClass: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/20' },
              { value: failedCount,   label: 'Need retry',   colorClass: 'text-amber-400',   bg: 'bg-amber-950/40 border-amber-500/20' },
              { value: totalMistakes, label: 'Mistakes',     colorClass: 'text-red-400',     bg: 'bg-red-950/40 border-red-500/20' },
            ].map(({ value, label, colorClass, bg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className={`rounded-xl border p-3.5 text-center ${bg}`}
              >
                <p className={`text-2xl font-bold tabular-nums ${colorClass}`}>{value}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">{label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Suggested Upgrades ─────────────────────────────────────────── */}
          {eligibleUpgrades.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-[#0D0F1C] border border-amber-500/20 rounded-2xl overflow-hidden"
            >
              <div className="px-4 py-3 bg-amber-950/20 border-b border-amber-500/15 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-xs font-semibold text-amber-400">
                  Suggested Upgrades
                </p>
                <span className="ml-auto text-[10px] text-slate-600">
                  {pendingCount > 0 ? `${pendingCount} pending` : 'all reviewed'}
                </span>
              </div>

              <div className="divide-y divide-[#1C1E35]/50">
                {eligibleUpgrades.map((word, i) => {
                  const decision = decisions[word.id];
                  const newStatus = UPGRADE_TO[word.status];
                  return (
                    <motion.div
                      key={word.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-semibold text-white truncate">{word.word}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] ${STATUS_COLOR[word.status]}`}>{STATUS_LABEL[word.status]}</span>
                          <span className="text-slate-700 text-[10px]">→</span>
                          <span className={`text-[10px] font-semibold ${STATUS_COLOR[newStatus]}`}>{STATUS_LABEL[newStatus]}</span>
                        </div>
                      </div>

                      {/* Decision buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <AnimatePresence mode="wait">
                          {decision === null ? (
                            <motion.div key="btns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-1.5">
                              <button
                                onClick={() => reject(word.id)}
                                className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-500/25 text-red-400 hover:bg-red-950/70 flex items-center justify-center transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => approve(word.id)}
                                className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-950/70 flex items-center justify-center transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          ) : decision === true ? (
                            <motion.div
                              key="approved"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/25"
                            >
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-[10px] text-emerald-400 font-medium">Approved</span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="rejected"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111325] border border-[#1C1E35]"
                            >
                              <Minus className="w-3 h-3 text-slate-600" />
                              <span className="text-[10px] text-slate-600 font-medium">Skipped</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {pendingCount > 0 && (
                <div className="px-4 py-2 bg-[#0A0C18] border-t border-[#1C1E35]">
                  <p className="text-[10px] text-slate-700 text-center">
                    Review each word — upgrades are permanent
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* No upgrades note */}
          {eligibleUpgrades.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="bg-[#0D0F1C] border border-[#1C1E35] rounded-xl px-4 py-3 flex items-center gap-2"
            >
              <Minus className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              <p className="text-xs text-slate-600">
                No upgrades yet — keep practicing to meet the threshold
              </p>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-2.5 pt-1"
          >
            <button
              onClick={onPracticeAgain}
              className="w-full py-3.5 rounded-xl text-sm font-semibold bg-[#0D0F1C] border border-[#1C1E35] hover:border-[#2A2C45] text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Practice Again
            </button>
            <button
              onClick={handleDone}
              className="w-full py-3.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Save & Return to Dashboard
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
