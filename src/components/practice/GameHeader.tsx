'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Language } from '@/lib/types';

const LANG_FLAG: Record<Language, string> = {
  Spanish: '🇪🇸',
  Italian: '🇮🇹',
  English: '🇬🇧',
  French:  '🇫🇷',
  German:  '🇩🇪',
};

interface Props {
  language: Language;
  cleared: number;
  total: number;
  isRetry: boolean;
  onBack: () => void;
}

export function GameHeader({ language, cleared, total, isRetry, onBack }: Props) {
  const pct = total > 0 ? (cleared / total) * 100 : 0;

  return (
    <div className="bg-[#07080F]/95 backdrop-blur-sm border-b border-[#1C1E35] px-4 sm:px-6 py-3">
      <div className="max-w-lg mx-auto space-y-3">

        {/* Top row */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-sm text-slate-500 flex-shrink-0">
            <span className="text-base leading-none">{LANG_FLAG[language]}</span>
            <span>{language}</span>
          </div>

          <div className="flex-1" />

          <AnimatePresence>
            {isRetry && (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                exit={{ scale: 0.7,    opacity: 0 }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/50 text-amber-400 border border-amber-500/20 text-xs font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </motion.div>
            )}
          </AnimatePresence>

          <span className="text-xs font-semibold tabular-nums text-slate-500 flex-shrink-0">
            <span className="text-white">{cleared}</span>
            <span className="text-slate-700"> / {total}</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-[#1C1E35] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ boxShadow: '0 0 8px rgba(99,102,241,0.45)' }}
          />
        </div>

      </div>
    </div>
  );
}
