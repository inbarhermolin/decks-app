'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, AlignLeft, Type, ListOrdered, Headphones, Sparkles, Layers } from 'lucide-react';
import { Language, Word } from '@/lib/types';
import { GameModeId } from '@/lib/practice';

const LANG_FLAG: Record<Language, string> = {
  Spanish: '🇪🇸',
  Italian: '🇮🇹',
  English: '🇬🇧',
  French:  '🇫🇷',
  German:  '🇩🇪',
};

interface ModeConfig {
  id: GameModeId;
  label: string;
  desc: string;
  Icon: React.ElementType;
  available: boolean;
}

const MODES: ModeConfig[] = [
  { id: 'sentence-translation', label: 'Sentence Translation', desc: 'Translate full sentences — free typing or word bank', Icon: AlignLeft, available: true },
  { id: 'word-translation',     label: 'Word Translation',     desc: 'Translate individual words — free typing or multiple choice', Icon: Type,       available: true },
  { id: 'verb-conjugation',     label: 'Verb Conjugation',     desc: 'Fill in every conjugation form from memory', Icon: ListOrdered, available: true },
  { id: 'listening',            label: 'Listening',            desc: 'Hear the word and spell it back — or reconstruct a sentence', Icon: Headphones, available: true },
  { id: 'ai-question',          label: 'AI Conversation',      desc: 'Free-form contextual questions powered by AI',                    Icon: Sparkles,   available: false },
  { id: 'flashcard',            label: 'Flashcards',           desc: 'Classic flip cards — see the word, self-grade', Icon: Layers,      available: true },
];

interface Props {
  language: Language;
  allWords: Word[];
  onSelect: (mode: GameModeId) => void;
  onBack: () => void;
}

export function GameModeSelect({ language, allWords, onSelect, onBack }: Props) {
  const hasVerbs = allWords.some(
    (w) => w.language === language && w.partOfSpeech === 'verb' && w.conjugations?.length,
  );
  const hasSentences = allWords.some(
    (w) => w.language === language && !!w.exampleSentence,
  );

  const isViable = (id: GameModeId): boolean => {
    if (id === 'verb-conjugation') return hasVerbs;
    if (id === 'sentence-translation') return hasSentences;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#07080F] flex flex-col">
      {/* Glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(99,102,241,0.08), transparent)' }}
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">

          {/* Back */}
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-bold text-white mb-1">Choose Game Mode</h1>
            <p className="text-sm text-slate-500">
              {LANG_FLAG[language]} Practicing <span className="text-white font-medium">{language}</span>
            </p>
          </motion.div>

          {/* Mode grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODES.map((mode, i) => {
              const viable = isViable(mode.id);
              const disabled = !mode.available || !viable;
              return (
                <motion.button
                  key={mode.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.05 }}
                  whileHover={!disabled ? { scale: 1.015 } : undefined}
                  whileTap={!disabled ? { scale: 0.985 } : undefined}
                  onClick={() => !disabled && onSelect(mode.id)}
                  disabled={disabled}
                  className={`relative text-left p-5 rounded-2xl border transition-all duration-200 group ${
                    disabled
                      ? 'bg-[#0D0F1C]/50 border-[#1C1E35]/50 opacity-50 cursor-not-allowed'
                      : 'bg-[#0D0F1C] border-[#1C1E35] hover:border-indigo-500/40 hover:bg-[#0F1225] cursor-pointer shadow-sm hover:shadow-indigo-500/5'
                  }`}
                >
                  {/* Coming Soon badge */}
                  {!mode.available && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold text-slate-600 bg-[#111325] border border-[#1C1E35] px-2 py-0.5 rounded-full">
                      Soon
                    </span>
                  )}
                  {mode.available && !viable && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold text-amber-600 bg-amber-950/30 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      No data
                    </span>
                  )}

                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                    disabled ? 'bg-[#111325]' : 'bg-indigo-500/10 group-hover:bg-indigo-500/20'
                  }`}>
                    <mode.Icon className={`w-4 h-4 ${disabled ? 'text-slate-600' : 'text-indigo-400'}`} />
                  </div>

                  <p className="text-sm font-semibold text-white mb-1">{mode.label}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{mode.desc}</p>
                </motion.button>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
