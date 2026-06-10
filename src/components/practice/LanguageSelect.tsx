'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Zap, ChevronRight } from 'lucide-react';
import { Word, Language, WordStatus, Deck } from '@/lib/types';

const LANG_FLAG: Record<Language, string> = {
  Spanish: '🇪🇸',
  Italian: '🇮🇹',
  English: '🇬🇧',
  French:  '🇫🇷',
  German:  '🇩🇪',
};

const DOT: Record<WordStatus, string> = {
  unknown:      'bg-red-400',
  'half-known': 'bg-amber-400',
  known:        'bg-emerald-400',
};

interface Props {
  words:          Word[];
  languages:      Language[];
  decks:          Deck[];
  selectedDeckId: string | null;
  onDeckChange:   (id: string | null) => void;
  onSelect:       (lang: Language) => void;
  onBack:         () => void;
}

export function LanguageSelect({ words, languages, decks, selectedDeckId, onDeckChange, onSelect, onBack }: Props) {
  // Filter words by selected deck before computing per-language stats
  const practiceWords = selectedDeckId
    ? words.filter((w) => w.deckId === selectedDeckId)
    : words;

  // Only show languages that have words in the current pool
  const visibleLanguages = languages.filter((l) => practiceWords.some((w) => w.language === l));

  return (
    <div className="min-h-screen bg-[#07080F] flex flex-col">

      {/* Top glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(99,102,241,0.1), transparent)' }}
      />

      {/* Nav */}
      <header className="relative z-10 px-4 sm:px-6 py-4 border-b border-[#1C1E35]">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
          >
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

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <Zap className="w-3 h-3" />
            Practice Mode
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            Choose a language
          </h1>
          <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
            We&apos;ll build a round of up to 15 words,
            prioritising the ones you&apos;re still learning.
          </p>
        </motion.div>

        {/* Deck filter chips — only shown when decks exist */}
        {decks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex flex-wrap gap-2 justify-center mb-6 w-full max-w-md"
          >
            <button
              onClick={() => onDeckChange(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedDeckId === null
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-[#0D0F1C] text-slate-500 border border-[#1C1E35] hover:border-[#2A2C45] hover:text-slate-400'
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
                    : 'bg-[#0D0F1C] text-slate-500 border border-[#1C1E35] hover:border-[#2A2C45] hover:text-slate-400'
                }`}
              >
                {deck.name}
              </button>
            ))}
          </motion.div>
        )}

        {/* Language cards */}
        <div className="w-full max-w-md space-y-3">
          {visibleLanguages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-8 text-sm text-slate-600"
            >
              No words in this deck yet.
            </motion.div>
          ) : (
            visibleLanguages.map((lang, i) => {
              const pool      = practiceWords.filter((w) => w.language === lang);
              const unknown   = pool.filter((w) => w.status === 'unknown').length;
              const halfKnown = pool.filter((w) => w.status === 'half-known').length;
              const known     = pool.filter((w) => w.status === 'known').length;
              const total     = pool.length;
              const needsWork = unknown + halfKnown;

              return (
                <motion.button
                  key={lang}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.07, duration: 0.35 }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onSelect(lang)}
                  className="w-full bg-[#0D0F1C] hover:bg-[#111325] border border-[#1C1E35] hover:border-indigo-500/30 rounded-2xl p-5 flex items-center gap-4 transition-colors group text-left"
                >
                  <span className="text-3xl leading-none select-none">{LANG_FLAG[lang]}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base font-bold text-white">{lang}</span>
                      <span className="text-xs text-slate-600">{total} words</span>
                      {needsWork > 0 && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-indigo-950/60 text-indigo-400 border border-indigo-500/20 font-medium">
                          {needsWork} to review
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mb-2.5">
                      {unknown > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <span className={`w-1.5 h-1.5 rounded-full ${DOT.unknown}`} />
                          {unknown} new
                        </span>
                      )}
                      {halfKnown > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <span className={`w-1.5 h-1.5 rounded-full ${DOT['half-known']}`} />
                          {halfKnown} learning
                        </span>
                      )}
                      {known > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <span className={`w-1.5 h-1.5 rounded-full ${DOT.known}`} />
                          {known} known
                        </span>
                      )}
                    </div>

                    {/* Mini status bar */}
                    <div className="h-1 bg-[#1C1E35] rounded-full overflow-hidden flex">
                      <div className="bg-red-500/60 transition-all"     style={{ flex: unknown }} />
                      <div className="bg-amber-500/60 transition-all"   style={{ flex: halfKnown }} />
                      <div className="bg-emerald-500/60 transition-all" style={{ flex: known }} />
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </motion.button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
