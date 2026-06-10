'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Check, X, AlertCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { QueueItem } from '@/lib/practice';
import { evaluateWithAI, AIEvaluation } from '@/lib/gemini';

interface Props {
  item: QueueItem;
  onResult: (passed: boolean) => void;
}

// ── Prompt builder (unchanged) ────────────────────────────────────────────────

type ExercisePrompt = { instruction: string; hint?: string };

function buildExercisePrompt(
  word: string, translation: string, language: string, sentence?: string,
): ExercisePrompt {
  const prompts: ExercisePrompt[] = [
    {
      instruction: `Write an original sentence in ${language} using the word "${word}".`,
      hint: `Try to convey the meaning: "${translation}"`,
    },
    {
      instruction: `Translate the following sentence into English:`,
      hint: sentence ? `"${sentence}"` : `"${word}" — ${translation}`,
    },
    {
      instruction: `Describe a real-life situation where you'd use the ${language} word "${word}". Write 1–2 sentences.`,
      hint: `Meaning: ${translation}`,
    },
    {
      instruction: `Write a short dialogue (2 lines) that naturally includes "${word}".`,
      hint: `${language} word · ${translation}`,
    },
  ];

  const idx = word.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % prompts.length;
  return prompts[idx];
}

// ── Component ─────────────────────────────────────────────────────────────────

type State =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'result'; evaluation: AIEvaluation }
  | { phase: 'error';  message: string };

export function AIQuestionGame({ item, onResult }: Props) {
  const { word } = item;
  const prompt   = buildExercisePrompt(word.word, word.translation, word.language, word.exampleSentence);
  const fullPromptText = prompt.hint
    ? `${prompt.instruction} ${prompt.hint}`
    : prompt.instruction;

  const [response, setResponse] = useState('');
  const [state,    setState]    = useState<State>({ phase: 'idle' });

  const handleCheck = async () => {
    if (!response.trim() || state.phase === 'checking') return;
    setState({ phase: 'checking' });
    try {
      const evaluation = await evaluateWithAI(
        response.trim(),
        word.word,
        word.language,
        fullPromptText,
      );
      setState({ phase: 'result', evaluation });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setState({ phase: 'error', message: msg });
    }
  };

  const handleRetry = () => {
    setState({ phase: 'idle' });
  };

  const isChecking = state.phase === 'checking';
  const isDone     = state.phase === 'result' || state.phase === 'error';

  return (
    <div className="space-y-4">

      {/* Label */}
      <p className="text-center text-[11px] text-slate-600 uppercase tracking-widest">
        AI Conversation
      </p>

      {/* Word card */}
      <div className="bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl px-6 py-7 text-center">
        <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-2">
          {word.language} · <span className="capitalize">{word.partOfSpeech}</span>
        </p>
        <p className="text-5xl sm:text-6xl font-bold text-white font-mono tracking-tight leading-none mb-2">
          {word.word}
        </p>
        <p className="text-sm text-slate-500">{word.translation}</p>
      </div>

      {/* Exercise prompt */}
      <div className="bg-[#0D0F1C] border border-violet-500/25 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-violet-400" />
          </div>
          <p className="text-[10px] text-violet-400 uppercase tracking-widest font-semibold">AI Prompt</p>
        </div>
        <p className="text-sm text-white leading-relaxed">{prompt.instruction}</p>
        {prompt.hint && (
          <p className="text-xs text-slate-500 mt-2 italic leading-relaxed">{prompt.hint}</p>
        )}
      </div>

      {/* Response textarea */}
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Type your response here…"
        rows={4}
        disabled={isDone || isChecking}
        className="w-full bg-[#0D0F1C] border border-[#1C1E35] rounded-xl px-4 py-3.5 text-white text-sm leading-relaxed placeholder-slate-700 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 resize-none transition-all disabled:opacity-60"
      />

      {/* Actions & feedback */}
      <AnimatePresence mode="wait">

        {/* ── Idle / checking ── */}
        {(state.phase === 'idle' || state.phase === 'checking') && (
          <motion.button
            key="check"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleCheck}
            disabled={!response.trim() || isChecking}
            className="w-full py-3.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-25 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI is thinking…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Check with AI
              </>
            )}
          </motion.button>
        )}

        {/* ── Error state ── */}
        {state.phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="space-y-3"
          >
            <div className="flex items-start gap-3 px-4 py-4 rounded-xl bg-red-950/40 border border-red-500/25">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400 mb-0.5">AI check failed</p>
                <p className="text-xs text-red-300/70 leading-relaxed">{state.message}</p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="w-full py-3 rounded-xl text-sm font-semibold text-slate-300 border border-[#1C1E35] hover:border-[#2A2C45] hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </motion.div>
        )}

        {/* ── Result state ── */}
        {state.phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {/* Feedback card */}
            <div className={`relative overflow-hidden rounded-2xl border bg-[#0D0F1C] ${
              state.evaluation.isCorrect
                ? 'border-emerald-500/30'
                : 'border-amber-500/30'
            }`}>
              {/* Accent stripe */}
              <div className={`h-0.5 w-full ${
                state.evaluation.isCorrect
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-amber-500 to-orange-400'
              }`} />

              <div className="px-4 py-4 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    state.evaluation.isCorrect
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {state.evaluation.isCorrect
                      ? <Check className="w-3.5 h-3.5" />
                      : <X className="w-3.5 h-3.5" />
                    }
                  </div>
                  <p className={`text-xs font-semibold uppercase tracking-widest ${
                    state.evaluation.isCorrect ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {state.evaluation.isCorrect ? 'Correct' : 'Needs improvement'}
                  </p>
                </div>

                {/* Feedback text */}
                <p className="text-sm text-slate-200 leading-relaxed">
                  {state.evaluation.feedback}
                </p>

                {/* Corrected sentence (only when incorrect) */}
                {!state.evaluation.isCorrect && state.evaluation.correctedSentence && (
                  <div className="mt-1 pt-3 border-t border-[#1C1E35]">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-1.5">
                      Corrected version
                    </p>
                    <p className="text-sm text-emerald-300 font-mono leading-relaxed bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-3 py-2">
                      {state.evaluation.correctedSentence}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Continue button */}
            <button
              onClick={() => onResult(state.evaluation.isCorrect)}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                state.evaluation.isCorrect
                  ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-950'
                  : 'bg-amber-950/50 text-amber-400 border border-amber-500/25 hover:bg-amber-950'
              }`}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
