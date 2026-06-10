'use client';

import { useState, useMemo, useCallback } from 'react';
import { useEnterToContinue } from './useEnterToContinue';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, X, Lock, RotateCcw } from 'lucide-react';
import { ConjugationTense } from '@/lib/types';
import { QueueItem, MissedForms, normalizeAnswer } from '@/lib/practice';

interface Props {
  item: QueueItem;
  onResult: (passed: boolean, missedForms?: MissedForms) => void;
}

interface FieldResult {
  correct: boolean;
  expected: string;
}

function normalizeVerb(s: string): string {
  return normalizeAnswer(s);
}

function getTenseStyle(tense: string) {
  const t = tense.toLowerCase();
  if (t.includes('present') || t.includes('presente'))
    return { color: 'text-indigo-300', bg: 'bg-indigo-950/60', border: 'border-indigo-500/40' };
  if (t.includes('past') || t.includes('pret') || t.includes('passato') || t.includes('imperfect'))
    return { color: 'text-amber-300', bg: 'bg-amber-950/60', border: 'border-amber-500/40' };
  if (t.includes('future') || t.includes('futuro'))
    return { color: 'text-emerald-300', bg: 'bg-emerald-950/60', border: 'border-emerald-500/40' };
  if (t.includes('conditional') || t.includes('subjunctive') || t.includes('congiuntivo'))
    return { color: 'text-violet-300', bg: 'bg-violet-950/60', border: 'border-violet-500/40' };
  return { color: 'text-slate-300', bg: 'bg-slate-900/60', border: 'border-slate-500/40' };
}

type Phase = 'filling' | 'checked' | 'retrying' | 'retry-checked';

export function VerbConjugationGame({ item, onResult }: Props) {
  const { word } = item;
  const conjugations = word.conjugations;

  const [tenseIdx] = useState<number>(() => {
    if (!conjugations || conjugations.length === 0) return 0;
    if (item.focusTense) {
      const idx = conjugations.findIndex((c) => c.tense === item.focusTense);
      return idx >= 0 ? idx : 0;
    }
    return Math.floor(Math.random() * conjugations.length);
  });

  const tense: ConjugationTense | undefined = conjugations?.[tenseIdx];
  const tenseStyle = tense ? getTenseStyle(tense.tense) : null;

  // When this is a focused retry, only show the missed pronoun rows
  const visibleRows = useMemo(() => {
    if (!tense) return [];
    if (!item.focusPronouns?.length) return tense.rows;
    const focusSet = new Set(item.focusPronouns);
    return tense.rows.filter((r) => focusSet.has(r.pronoun));
  }, [tense, item.focusPronouns]);

  const isFocusedRetry = !!item.focusPronouns?.length;

  const [phase,           setPhase]           = useState<Phase>('filling');
  const [answers,         setAnswers]         = useState<Record<string, string>>({});
  const [retryAnswers,    setRetryAnswers]     = useState<Record<string, string>>({});
  const [fieldResults,    setFieldResults]    = useState<Record<string, FieldResult>>({});
  const [allCorrect,      setAllCorrect]      = useState(false);
  const [retriedPronouns, setRetriedPronouns] = useState<string[]>([]);

  const wrongPronouns = useMemo(
    () => Object.entries(fieldResults).filter(([, fr]) => !fr.correct).map(([p]) => p),
    [fieldResults],
  );

  const allFilled = useMemo(
    () => visibleRows.every((r) => (answers[r.pronoun] ?? '').trim().length > 0),
    [visibleRows, answers],
  );

  const allRetryFilled = useMemo(
    () => wrongPronouns.every((p) => (retryAnswers[p] ?? '').trim().length > 0),
    [wrongPronouns, retryAnswers],
  );

  // Returns the currently-wrong forms for queuing an end-of-session focused retry
  const getMissedForms = (): MissedForms | undefined => {
    if (wrongPronouns.length === 0 || !tense) return undefined;
    return { pronouns: wrongPronouns, tense: tense.tense };
  };

  const handleFirstSubmit = () => {
    if (!tense) return;
    const results: Record<string, FieldResult> = {};
    let allOk = true;
    for (const row of visibleRows) {
      const ok = normalizeVerb(answers[row.pronoun] ?? '') === normalizeVerb(row.form);
      if (!ok) allOk = false;
      results[row.pronoun] = { correct: ok, expected: row.form };
    }
    setFieldResults(results);
    setAllCorrect(allOk);
    setPhase('checked');
  };

  const handleRetrySubmit = () => {
    const updated = { ...fieldResults };
    let allNowOk = true;
    for (const pronoun of wrongPronouns) {
      const ok = normalizeVerb(retryAnswers[pronoun] ?? '') === normalizeVerb(fieldResults[pronoun].expected);
      if (!ok) allNowOk = false;
      updated[pronoun] = { correct: ok, expected: fieldResults[pronoun].expected };
    }
    setFieldResults(updated);
    setAllCorrect(allNowOk);
    setPhase('retry-checked');
  };

  const continueChecked = useCallback(() => {
    if (allCorrect) onResult(true);
  }, [allCorrect, onResult]);

  const continueRetryChecked = useCallback(() => {
    const missed = wrongPronouns.length > 0 && tense
      ? { pronouns: wrongPronouns, tense: tense.tense }
      : undefined;
    onResult(allCorrect, missed);
  }, [allCorrect, wrongPronouns, tense, onResult]);

  useEnterToContinue(phase === 'checked' && allCorrect, continueChecked);
  useEnterToContinue(phase === 'retry-checked', continueRetryChecked);

  if (!tense || visibleRows.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 text-sm">
        No conjugation data for <span className="font-mono text-white">{word.word}</span>.
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <p className="text-center text-[11px] text-slate-600 uppercase tracking-widest">
        {isFocusedRetry ? 'Conjugation Retry' : 'Verb Conjugation'}
      </p>

      {/* Infinitive card */}
      <div className="bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl px-6 py-6 text-center">
        <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-2">
          {word.language} · Infinitive
        </p>
        <p className="text-5xl sm:text-6xl font-bold text-white font-mono tracking-tight leading-none mb-3">
          {word.word}
        </p>
        <p className="text-xs text-slate-600 mb-4">{word.translation}</p>

        {tenseStyle && (
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border ${tenseStyle.bg} ${tenseStyle.border} ${tenseStyle.color}`}>
            {tense.tense}
            {isFocusedRetry && (
              <span className="opacity-50 text-xs">· {visibleRows.length} form{visibleRows.length > 1 ? 's' : ''}</span>
            )}
          </span>
        )}
      </div>

      {/* Conjugation grid */}
      <div className="bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl overflow-hidden">
        {visibleRows.map((row, i) => {
          const fr         = fieldResults[row.pronoun];
          const isLocked   = phase === 'retrying' && fr?.correct;
          const isWrong    = phase === 'retrying' && !fr?.correct;
          const showResult = (phase === 'checked' || phase === 'retry-checked') && fr !== undefined;
          const shownAnswer =
            phase === 'retry-checked' && retriedPronouns.includes(row.pronoun)
              ? (retryAnswers[row.pronoun] || '—')
              : (answers[row.pronoun] || '—');

          return (
            <div
              key={row.pronoun}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                i < visibleRows.length - 1 ? 'border-b border-[#1C1E35]/60' : ''
              } ${showResult && fr ? (fr.correct ? 'bg-emerald-950/10' : 'bg-red-950/10') : ''}`}
            >
              <div className="w-24 flex-shrink-0">
                <span className="text-sm text-slate-500 font-mono">{row.pronoun}</span>
              </div>

              <div className="flex-1 relative">
                {phase === 'filling' && (
                  <input
                    type="text"
                    value={answers[row.pronoun] ?? ''}
                    onChange={(e) => setAnswers((p) => ({ ...p, [row.pronoun]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && allFilled && handleFirstSubmit()}
                    placeholder="…"
                    autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                    className="w-full bg-[#07080F] border border-[#1C1E35] rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 placeholder-slate-700 transition-all"
                  />
                )}

                {isLocked && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-emerald-400">
                      {answers[row.pronoun]}
                    </span>
                    <Lock className="w-3 h-3 text-emerald-700" />
                  </div>
                )}

                {isWrong && (
                  <input
                    type="text"
                    value={retryAnswers[row.pronoun] ?? ''}
                    onChange={(e) => setRetryAnswers((p) => ({ ...p, [row.pronoun]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && allRetryFilled && handleRetrySubmit()}
                    placeholder="try again…"
                    autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                    className="w-full bg-red-950/20 border border-red-500/30 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 placeholder-red-900 transition-all"
                  />
                )}

                {showResult && (
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm font-semibold ${fr.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fr.correct ? fr.expected : shownAnswer}
                    </span>
                    {!fr.correct && (
                      <span className="text-xs text-slate-500">
                        → <span className="text-emerald-400 font-mono font-semibold">{fr.expected}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {showResult && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    fr.correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {fr.correct ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <AnimatePresence mode="wait">

        {phase === 'filling' && (
          <motion.button
            key="check"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleFirstSubmit}
            disabled={!allFilled}
            className="w-full py-3.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-25 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Send className="w-4 h-4" />
            Check All
          </motion.button>
        )}

        {phase === 'checked' && (
          <motion.div
            key="checked"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-2.5"
          >
            <div className={`rounded-xl p-3.5 text-center ${
              allCorrect
                ? 'bg-emerald-950/30 border border-emerald-500/20'
                : 'bg-red-950/30 border border-red-500/20'
            }`}>
              <p className={`text-sm font-semibold ${allCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                {allCorrect
                  ? '🎉 Perfect!'
                  : `${wrongPronouns.length} mistake${wrongPronouns.length > 1 ? 's' : ''} — missed forms re-asked at end`}
              </p>
            </div>

            {allCorrect ? (
              <button
                onClick={() => onResult(true)}
                className="w-full py-3.5 rounded-xl text-sm font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-950 transition-colors"
              >
                Continue ✓
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onResult(false, getMissedForms())}
                  className="py-3.5 rounded-xl text-sm font-semibold bg-[#0D0F1C] text-slate-400 border border-[#1C1E35] hover:text-white hover:border-[#2A2C45] transition-colors flex items-center justify-center gap-1.5"
                >
                  Move On →
                </button>
                <button
                  onClick={() => { setRetriedPronouns([...wrongPronouns]); setRetryAnswers({}); setPhase('retrying'); }}
                  className="py-3.5 rounded-xl text-sm font-semibold bg-amber-950/40 text-amber-400 border border-amber-500/25 hover:bg-amber-950/70 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retry Now
                </button>
              </div>
            )}
          </motion.div>
        )}

        {phase === 'retrying' && (
          <motion.button
            key="retry-submit"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleRetrySubmit}
            disabled={!allRetryFilled}
            className="w-full py-3.5 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-500 disabled:opacity-25 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Check Again
          </motion.button>
        )}

        {phase === 'retry-checked' && (
          <motion.div
            key="retry-checked"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-2.5"
          >
            <div className={`rounded-xl p-3.5 text-center ${
              allCorrect
                ? 'bg-emerald-950/30 border border-emerald-500/20'
                : 'bg-amber-950/30 border border-amber-500/20'
            }`}>
              <p className={`text-sm font-semibold ${allCorrect ? 'text-emerald-400' : 'text-amber-400'}`}>
                {allCorrect
                  ? '🎉 All correct now!'
                  : `Still ${wrongPronouns.length} wrong — will re-ask at end`}
              </p>
            </div>
            <button
              onClick={() => onResult(allCorrect, getMissedForms())}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-colors ${
                allCorrect
                  ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-950'
                  : 'bg-amber-950/50 text-amber-400 border border-amber-500/25 hover:bg-amber-950'
              }`}
            >
              Continue →
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
