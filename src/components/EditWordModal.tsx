'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Loader2, Check } from 'lucide-react';
import { Word, Language, PartOfSpeech, Deck } from '@/lib/types';

async function fetchWordDetailsFromAI(
  word: string,
  language: string,
  partOfSpeech: string,
): Promise<{ translation: string; sentence: string; sentenceTranslation: string }> {
  const res = await fetch('/api/ai-fill', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ word, language, partOfSpeech }),
  });
  if (!res.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = await res.json().catch(() => ({} as any));
    throw new Error(err?.error ?? 'AI auto-fill failed');
  }
  return res.json();
}

const LANGUAGES: Language[]   = ['Italian', 'Spanish', 'French', 'German', 'English'];
const PARTS: PartOfSpeech[]   = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'phrase'];

const inputCls = (highlight = false) =>
  `w-full bg-[#07080F] border rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-700 ` +
  `focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all ` +
  (highlight ? 'border-indigo-500/40' : 'border-[#1C1E35]');

const selectCls =
  'w-full bg-[#07080F] border border-[#1C1E35] rounded-xl px-3.5 py-2.5 text-white text-sm ' +
  'focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 ' +
  'transition-all appearance-none cursor-pointer';

interface Props {
  word:           Word;
  onSave:         (word: Word) => void;
  onClose:        () => void;
  decks:          Deck[];
}

export function EditWordModal({ word: initial, onSave, onClose, decks }: Props) {
  const [word,         setWord]         = useState(initial.word);
  const [lang,         setLang]         = useState<Language>(initial.language);
  const [pos,          setPos]          = useState<PartOfSpeech>(initial.partOfSpeech);
  const [deckId,       setDeckId]       = useState<string>(initial.deckId ?? '');
  const [trans,        setTrans]        = useState(initial.translation);
  const [sentence,     setSentence]     = useState(initial.exampleSentence ?? '');
  const [sentTrans,    setSentTrans]    = useState(initial.exampleSentenceTranslation ?? '');
  const [notes,        setNotes]        = useState(initial.notes ?? '');
  const [presentTense, setPresentTense] = useState(initial.presentTense ?? '');
  const [pastTense,    setPastTense]    = useState(initial.pastTense ?? '');

  const [aiFilling, setAiFilling] = useState(false);
  const [aiUsed,    setAiUsed]    = useState(false);
  const [aiError,   setAiError]   = useState<string | null>(null);

  const canAutoFill = word.trim().length > 0 && !aiFilling;
  const canSubmit   = word.trim() && trans.trim() && !aiFilling;

  const handleAutoFill = async () => {
    if (!canAutoFill) return;
    setAiFilling(true);
    setAiUsed(false);
    setAiError(null);
    try {
      const result = await fetchWordDetailsFromAI(word.trim(), lang, pos);
      setTrans(result.translation);
      setSentence(result.sentence);
      setSentTrans(result.sentenceTranslation ?? '');
      setAiUsed(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI auto-fill failed');
    } finally {
      setAiFilling(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSave({
      ...initial,
      word:                        word.trim().toLowerCase(),
      translation:                 trans.trim(),
      language:                    lang,
      partOfSpeech:                pos,
      exampleSentence:             sentence.trim(),
      exampleSentenceTranslation:  sentTrans.trim() || undefined,
      notes:                       notes.trim()     || undefined,
      presentTense:                pos === 'verb' ? (presentTense.trim() || undefined) : undefined,
      pastTense:                   pos === 'verb' ? (pastTense.trim()    || undefined) : undefined,
      deckId:                      deckId || undefined,
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.97,  y: 10 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-x-4 top-[5vh] z-50 mx-auto max-w-lg max-h-[90vh] overflow-y-auto bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl shadow-2xl shadow-black/60"
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

        <form onSubmit={handleSubmit}>

          <div className="flex items-center justify-between px-6 py-5 border-b border-[#1C1E35]">
            <div>
              <h2 className="text-base font-bold text-white">Edit Word</h2>
              <p className="text-xs text-slate-500 mt-0.5">Update the details for this entry</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-[#111325] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">

            {/* Target Word + AI button */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Word <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={word}
                  onChange={(e) => { setWord(e.target.value); setAiUsed(false); setAiError(null); }}
                  placeholder="e.g. parlare"
                  autoFocus
                  autoComplete="off"
                  className={`${inputCls()} flex-1 font-mono`}
                />
                <motion.button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={!canAutoFill}
                  whileTap={canAutoFill ? { scale: 0.95 } : undefined}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold
                             bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/30
                             text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed
                             transition-all whitespace-nowrap"
                >
                  {aiFilling ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" />Thinking…</>
                  ) : aiUsed ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Filled</span></>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" />Auto-Fill</>
                  )}
                </motion.button>
              </div>
            </div>

            {aiError && (
              <p className="text-xs text-red-400/80 -mt-2">{aiError}</p>
            )}

            {/* Language + Part of speech */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Language <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className={selectCls}>
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]">▼</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Part of Speech <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select value={pos} onChange={(e) => setPos(e.target.value as PartOfSpeech)} className={`${selectCls} capitalize`}>
                    {PARTS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]">▼</span>
                </div>
              </div>
            </div>

            {/* Verb tenses */}
            {pos === 'verb' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Present Tense
                    <span className="ml-1.5 normal-case text-[10px] font-normal tracking-normal text-slate-600">optional</span>
                  </label>
                  <input
                    type="text"
                    value={presentTense}
                    onChange={(e) => setPresentTense(e.target.value)}
                    placeholder="e.g. corre"
                    autoComplete="off"
                    className={`${inputCls()} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Past Tense
                    <span className="ml-1.5 normal-case text-[10px] font-normal tracking-normal text-slate-600">optional</span>
                  </label>
                  <input
                    type="text"
                    value={pastTense}
                    onChange={(e) => setPastTense(e.target.value)}
                    placeholder="e.g. corrió"
                    autoComplete="off"
                    className={`${inputCls()} font-mono`}
                  />
                </div>
              </div>
            )}

            {/* Deck */}
            {decks.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Deck
                  <span className="ml-1.5 normal-case text-[10px] font-normal tracking-normal text-slate-600">optional</span>
                </label>
                <div className="relative">
                  <select value={deckId} onChange={(e) => setDeckId(e.target.value)} className={selectCls}>
                    <option value="">No Deck</option>
                    {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]">▼</span>
                </div>
              </div>
            )}

            {/* Translation */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Translation (English) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={trans}
                  onChange={(e) => setTrans(e.target.value)}
                  placeholder="e.g. to speak"
                  autoComplete="off"
                  className={inputCls(aiUsed && !!trans)}
                />
                {aiUsed && trans && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Sparkles className="w-3 h-3 text-indigo-400/50" />
                  </span>
                )}
              </div>
            </div>

            {/* Example Sentence */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Example Sentence
                <span className="ml-1.5 normal-case text-[10px] font-normal tracking-normal text-slate-600">optional</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  placeholder="e.g. Voglio parlare con te."
                  autoComplete="off"
                  className={`${inputCls(aiUsed && !!sentence)} font-mono`}
                />
                {aiUsed && sentence && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Sparkles className="w-3 h-3 text-indigo-400/50" />
                  </span>
                )}
              </div>
            </div>

            {/* Sentence Translation */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Sentence Translation
                <span className="ml-1.5 normal-case text-[10px] font-normal tracking-normal text-slate-600">optional</span>
              </label>
              <input
                type="text"
                value={sentTrans}
                onChange={(e) => setSentTrans(e.target.value)}
                placeholder="English translation of the sentence"
                autoComplete="off"
                className={inputCls()}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Notes
                <span className="ml-1.5 normal-case text-[10px] font-normal tracking-normal text-slate-600">optional</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Memory aids, grammar tips, usage notes…"
                rows={2}
                className={`${inputCls()} resize-none`}
              />
            </div>

          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-[#1C1E35] bg-[#0A0C18] rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white border border-[#1C1E35] hover:border-[#2A2C45] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors shadow-lg shadow-indigo-500/20"
            >
              Save Changes
            </button>
          </div>

        </form>
      </motion.div>
    </>
  );
}
