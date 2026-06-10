'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, ChevronRight, Plus, Gamepad2,
  Zap, Settings2, CheckCircle2, LogOut, Layers,
  Upload, Download, AlertCircle, Pencil,
  ArrowUp, ArrowDown, ArrowUpDown, Sparkles,
} from 'lucide-react';
import { Word, WordStatus, Language, Deck, PartOfSpeech } from '@/lib/types';
import { VOCAB_DATA } from '@/lib/data';
import { AppSettings, DEFAULT_SETTINGS } from '@/lib/settings';
import {
  fetchWords, upsertWord, upsertWords, deleteWord,
  fetchSettings, saveSettingsToDb,
  fetchDecks,
  fetchUserStats,
  localStorageWordCount, migrateLocalStorageToCloud, dismissMigration,
} from '@/lib/db';
import { UserStats, DEFAULT_STATS } from '@/lib/gamification';
import { StatsCard } from './StatsCard';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from './AuthGuard';
import { StatusBadge, STATUS_CONFIG } from './StatusBadge';
import { WordDetailPanel } from './WordDetailPanel';
import { SettingsPanel } from './settings/SettingsPanel';
import { AddWordModal } from './AddWordModal';
import { EditWordModal } from './EditWordModal';
import { MigrationDialog } from './MigrationDialog';
import { DeckManagementModal } from './DeckManagementModal';
import { ImportModal } from './ImportModal';

// ── Constants ────────────────────────────────────────────────────────────────

const POS_COLOR: Record<string, string> = {
  verb:        'text-violet-400',
  noun:        'text-blue-400',
  adjective:   'text-pink-400',
  adverb:      'text-cyan-400',
  preposition: 'text-orange-400',
  conjunction: 'text-teal-400',
  pronoun:     'text-indigo-400',
  phrase:      'text-rose-400',
};

const LANG_FLAG: Record<Language, string> = {
  Spanish: '🇪🇸', Italian: '🇮🇹', English: '🇬🇧', French: '🇫🇷', German: '🇩🇪',
};

type StatusFilter = WordStatus | 'all';
const STATUS_PILL: { value: StatusFilter; label: string }[] = [
  { value: 'all',        label: 'All' },
  { value: 'unknown',    label: 'Unknown' },
  { value: 'half-known', label: 'Half Known' },
  { value: 'known',      label: 'Known' },
];

type ToastType = 'success' | 'error';

// ── Export helper ────────────────────────────────────────────────────────────

function buildCSV(words: Word[], decks: Deck[]): string {
  const deckMap = Object.fromEntries(decks.map((d) => [d.id, d.name]));
  const escape  = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header  = 'Target Word,Translation,Language,Part of Speech,Example Sentence,Example Sentence Translation,Status,Deck';
  const rows    = words.map((w) => [
    escape(w.word),
    escape(w.translation),
    w.language,
    w.partOfSpeech,
    escape(w.exampleSentence ?? ''),
    escape(w.exampleSentenceTranslation ?? ''),
    w.status,
    escape(w.deckId ? (deckMap[w.deckId] ?? '') : ''),
  ].join(','));
  return [header, ...rows].join('\n');
}

// ── Inner component (rendered only when authenticated) ───────────────────────

function Dashboard() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [words, setWords]               = useState<Word[]>(VOCAB_DATA);
  const [decks, setDecks]               = useState<Deck[]>([]);
  const [appSettings, setAppSettings]   = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading]           = useState(true);

  const [query, setQuery]               = useState('');
  const [langFilter, setLangFilter]     = useState<Language | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deckFilter, setDeckFilter]     = useState<string | 'all'>('all');
  const [selected, setSelected]         = useState<Word | null>(null);

  const [editingWord, setEditingWord]   = useState<Word | null>(null);
  const [sortField, setSortField]        = useState<'word' | 'type' | null>(null);
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc');

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addWordOpen, setAddWordOpen]   = useState(false);
  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [migrateCount, setMigrateCount] = useState(0);

  const [toast, setToast]         = useState<{ msg: string; type: ToastType } | null>(null);
  const [userStats, setUserStats] = useState<UserStats>(DEFAULT_STATS);
  const [filling, setFilling]     = useState(false);

  // ── Load from cloud on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [cloudWords, cloudSettings, cloudDecks, cloudStats] = await Promise.all([
          fetchWords(user.id),
          fetchSettings(user.id),
          fetchDecks(user.id).catch(() => [] as Deck[]),
          fetchUserStats(user.id).catch(() => ({ ...DEFAULT_STATS })),
        ]);
        setWords(cloudWords.length > 0 ? cloudWords : VOCAB_DATA);
        setAppSettings(cloudSettings);
        setDecks(cloudDecks);
        setUserStats(cloudStats);

        if (cloudWords.length === 0) {
          await upsertWords(VOCAB_DATA, user.id);
        }
      } catch (err) {
        console.error('[DB] Failed to load data:', err);
      } finally {
        setLoading(false);
      }

      const count = localStorageWordCount();
      if (count > 0) setMigrateCount(count);
    })();
  }, [user]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showToast = useCallback((msg: string, type: ToastType = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), type === 'error' ? 5000 : 3500);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStatusChange = useCallback(async (id: string, status: WordStatus) => {
    setWords((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)));
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
    if (!user) return;
    const updated = words.find((w) => w.id === id);
    if (updated) await upsertWord({ ...updated, status }, user.id);
  }, [user, words]);

  const handleAddWord = useCallback(async (incoming: Word) => {
    const normalized = incoming.word.toLowerCase();
    if (words.some((w) => w.word.toLowerCase() === normalized)) {
      showToast('This word already exists in your dictionary', 'error');
      return;
    }
    const wordToSave = { ...incoming, word: normalized };
    setWords((prev) => [wordToSave, ...prev]);
    setAddWordOpen(false);
    if (user) await upsertWord(wordToSave, user.id);
    showToast(`"${wordToSave.word}" added to your collection`);
  }, [user, words, showToast]);

  const handleEditWord = useCallback(async (updated: Word) => {
    const normalized = { ...updated, word: updated.word.toLowerCase() };
    setWords((prev) => prev.map((w) => (w.id === normalized.id ? normalized : w)));
    setSelected((prev) => (prev?.id === normalized.id ? normalized : prev));
    setEditingWord(null);
    if (user) await upsertWord(normalized, user.id);
    showToast(`"${normalized.word}" updated`);
  }, [user, showToast]);

  const handleDeleteWord = useCallback(async (id: string) => {
    const word = words.find((w) => w.id === id);
    setWords((prev) => prev.filter((w) => w.id !== id));
    setSelected(null);
    if (user) await deleteWord(id).catch(console.error);
    showToast(`"${word?.word ?? 'Word'}" removed`);
  }, [user, words, showToast]);

  const handleImportWords = useCallback(async (newWords: Word[]) => {
    if (user) await upsertWords(newWords, user.id);
    setWords((prev) => [...newWords, ...prev]);
    setImportModalOpen(false);
    showToast(`Imported ${newWords.length} word${newWords.length !== 1 ? 's' : ''} successfully`);
  }, [user, showToast]);

  const handleExport = useCallback(() => {
    const exportWords = words.filter((w) => {
      const matchD = deckFilter === 'all' || w.deckId === deckFilter;
      const matchL = langFilter === 'all' || w.language === langFilter;
      return matchD && matchL;
    });

    const csv   = buildCSV(exportWords, decks);
    const label = deckFilter !== 'all'
      ? (decks.find((d) => d.id === deckFilter)?.name ?? 'deck').replace(/\s+/g, '-')
      : 'all';
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `decks-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${exportWords.length} word${exportWords.length !== 1 ? 's' : ''}`);
  }, [words, decks, deckFilter, langFilter, showToast]);

  const handleSettingsChange = useCallback(async (s: AppSettings) => {
    setAppSettings(s);
    if (user) await saveSettingsToDb(user.id, s);
  }, [user]);

  const handleMigrate = useCallback(async () => {
    if (!user) return;
    await migrateLocalStorageToCloud(user.id);
    const refreshed = await fetchWords(user.id);
    setWords(refreshed);
    setMigrateCount(0);
  }, [user]);

  const handleDismissMigration = useCallback(() => {
    dismissMigration();
    setMigrateCount(0);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push('/login');
  }, [signOut, router]);

  // When decks change from DeckManagementModal, sync deleted deck IDs out of local word state
  const handleDecksChange = useCallback((updated: Deck[]) => {
    const surviving = new Set(updated.map((d) => d.id));
    setWords((prev) => prev.map((w) =>
      w.deckId && !surviving.has(w.deckId) ? { ...w, deckId: undefined } : w,
    ));
    setDecks(updated);
    // Reset deck filter if the filtered deck was deleted
    if (deckFilter !== 'all' && !surviving.has(deckFilter)) {
      setDeckFilter('all');
    }
  }, [deckFilter]);

  const handleFillVerbs = useCallback(async () => {
    if (!user || filling) return;

    const toFill = words.filter(
      (w) => w.partOfSpeech === 'verb' && (!w.presentTense || !w.pastTense),
    );
    if (toFill.length === 0) {
      showToast('All verbs already have conjugation data');
      return;
    }

    setFilling(true);
    showToast(`Filling conjugations for ${toFill.length} verb${toFill.length !== 1 ? 's' : ''}…`);

    try {
      const res = await fetch('/api/fill-verbs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          words: toFill.map((w) => ({ id: w.id, word: w.word, language: w.language })),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { results } = await res.json() as {
        results: Array<{ id: string; partOfSpeech: PartOfSpeech; presentTense?: string; pastTense?: string }>;
      };

      const updateMap = new Map(results.map((r) => [r.id, r]));
      const updatedWords = words.map((w) => {
        const u = updateMap.get(w.id);
        if (!u) return w;
        return {
          ...w,
          partOfSpeech: u.partOfSpeech,
          presentTense: u.presentTense ?? w.presentTense,
          pastTense:    u.pastTense    ?? w.pastTense,
        };
      });

      setWords(updatedWords);
      await upsertWords(updatedWords, user.id);

      const filled = results.filter((r) => r.presentTense || r.pastTense).length;
      showToast(`Done — ${filled} verb${filled !== 1 ? 's' : ''} conjugated`);
    } catch (err) {
      console.error('[fill-verbs]', err);
      showToast('Failed to fill verb conjugations', 'error');
    } finally {
      setFilling(false);
    }
  }, [user, words, filling, showToast]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const languages = useMemo(
    () => [...new Set(words.map((w) => w.language))] as Language[],
    [words],
  );

  const wordCountPerDeck = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of words) {
      if (w.deckId) counts[w.deckId] = (counts[w.deckId] ?? 0) + 1;
    }
    return counts;
  }, [words]);

  const stats = useMemo(() => ({
    total:     words.length,
    known:     words.filter((w) => w.status === 'known').length,
    halfKnown: words.filter((w) => w.status === 'half-known').length,
    unknown:   words.filter((w) => w.status === 'unknown').length,
  }), [words]);

  const pct = stats.total > 0 ? Math.round((stats.known / stats.total) * 100) : 0;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return words.filter((w) => {
      const matchQ = !q || w.word.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q);
      const matchS = statusFilter === 'all' || w.status === statusFilter;
      const matchL = langFilter   === 'all' || w.language === langFilter;
      const matchD = deckFilter   === 'all' || w.deckId === deckFilter;
      return matchQ && matchS && matchL && matchD;
    });
  }, [words, query, statusFilter, langFilter, deckFilter]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const cmp = sortField === 'type'
        ? (a.partOfSpeech ?? '').localeCompare(b.partOfSpeech ?? '')
        : a.word.localeCompare(b.word);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const handleSort = (field: 'word' | 'type') => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortField(null); setSortDir('asc'); }
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const pillCount = (v: StatusFilter) =>
    v === 'all' ? words.length : words.filter((w) => w.status === v).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#07080F] relative">

      {/* Top glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 35% at 50% 0%, rgba(99,102,241,0.09), transparent)' }}
      />

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#07080F]/85 backdrop-blur-lg border-b border-[#1C1E35]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4 relative z-10">

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/25">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">Decks</span>
          </div>

          <div className="hidden md:flex items-center gap-5">
            {[
              { color: 'bg-emerald-400', label: 'known',    count: stats.known },
              { color: 'bg-amber-400',   label: 'learning', count: stats.halfKnown },
              { color: 'bg-red-400',     label: 'new',      count: stats.unknown },
            ].map(({ color, label, count }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                <span className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-300">{count}</span> {label}
                </span>
              </div>
            ))}

            {/* Streak */}
            {userStats.streak > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                <span className="text-sm leading-none">🔥</span>
                <span className="text-sm font-bold text-orange-400 tabular-nums">{userStats.streak}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-[#0D0F1C] border border-transparent hover:border-[#1C1E35] transition-all"
              title="Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSignOut}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-[#0D0F1C] border border-transparent hover:border-[#1C1E35] transition-all"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/practice')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 border border-[#2A2C45] hover:border-indigo-500/40 hover:text-indigo-400 transition-colors"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              Practice
            </button>
            <button
              onClick={() => setAddWordOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Word
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5 relative z-10">

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-[#0D0F1C] border border-[#1C1E35] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && (
          <>
            {/* Progress card */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-[#0D0F1C] rounded-2xl border border-[#1C1E35] p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-300">Collection progress</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {stats.total} words across {languages.length} language{languages.length !== 1 ? 's' : ''}
                    {decks.length > 0 && ` · ${decks.length} deck${decks.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white leading-none">{pct}%</p>
                  <p className="text-xs text-slate-600 mt-1">mastered</p>
                </div>
              </div>

              <div className="h-1.5 bg-[#1C1E35] rounded-full overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ boxShadow: '0 0 10px rgba(52,211,153,0.5)' }}
                />
              </div>

              {stats.total > 0 && (
                <div className="h-1 rounded-full overflow-hidden flex mb-3">
                  <motion.div initial={{ flex: 0 }} animate={{ flex: stats.unknown }}    transition={{ duration: 0.8, delay: 0.5 }} className="bg-red-500/70" />
                  <motion.div initial={{ flex: 0 }} animate={{ flex: stats.halfKnown }} transition={{ duration: 0.8, delay: 0.6 }} className="bg-amber-500/70" />
                  <motion.div initial={{ flex: 0 }} animate={{ flex: stats.known }}     transition={{ duration: 0.8, delay: 0.7 }} className="bg-emerald-500/70" />
                </div>
              )}

              <div className="flex gap-4">
                {[
                  { label: 'Known',    count: stats.known,     color: 'bg-emerald-400' },
                  { label: 'Learning', count: stats.halfKnown, color: 'bg-amber-400' },
                  { label: 'New',      count: stats.unknown,   color: 'bg-red-400' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                    {count} {label}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Gamification stats */}
            <StatsCard stats={userStats} dailyGoal={appSettings.dailyGoal} />

            {/* Practice CTA */}
            {(stats.unknown + stats.halfKnown) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="bg-gradient-to-r from-indigo-950/70 to-violet-950/50 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="w-9 h-9 bg-indigo-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-none mb-0.5">
                    {stats.unknown + stats.halfKnown} words need practice
                  </p>
                  <p className="text-xs text-slate-500">
                    {stats.unknown} new · {stats.halfKnown} still learning
                  </p>
                </div>
                <button
                  onClick={() => router.push('/practice')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-500/20 flex-shrink-0"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  Start Practice
                </button>
              </motion.div>
            )}

            {/* ── Action toolbar (Decks · Import · Export) ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.09 }}
              className="flex items-center gap-2 flex-wrap"
            >
              <button
                onClick={() => setDeckModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 border border-[#1C1E35] hover:border-indigo-500/40 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all"
              >
                <Layers className="w-3.5 h-3.5" />
                Manage Decks
                {decks.length > 0 && (
                  <span className="ml-0.5 text-slate-600 font-normal">{decks.length}</span>
                )}
              </button>

              <div className="ml-auto flex items-center gap-2">
                {(() => {
                  const verbsNeedingFill = words.filter(
                    (w) => w.partOfSpeech === 'verb' && (!w.presentTense || !w.pastTense),
                  ).length;
                  return verbsNeedingFill > 0 ? (
                    <button
                      onClick={handleFillVerbs}
                      disabled={filling}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-violet-400 border border-violet-500/30 hover:border-violet-500/50 hover:bg-violet-500/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title={`${verbsNeedingFill} verb${verbsNeedingFill !== 1 ? 's' : ''} missing conjugation data`}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${filling ? 'animate-pulse' : ''}`} />
                      {filling ? 'Filling…' : `Fill ${verbsNeedingFill} Verb${verbsNeedingFill !== 1 ? 's' : ''}`}
                    </button>
                  ) : null;
                })()}
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 border border-[#1C1E35] hover:border-[#2A2C45] hover:text-slate-300 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import CSV
                </button>
                <button
                  onClick={handleExport}
                  disabled={words.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 border border-[#1C1E35] hover:border-[#2A2C45] hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search words or translations…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#0D0F1C] border border-[#1C1E35] rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
                />
              </div>

              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={langFilter}
                    onChange={(e) => setLangFilter(e.target.value as Language | 'all')}
                    className="pl-3 pr-9 py-2.5 bg-[#0D0F1C] border border-[#1C1E35] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 appearance-none cursor-pointer min-w-[140px] hover:border-[#2A2C45] transition-colors"
                  >
                    <option value="all">All Languages</option>
                    {languages.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]">▼</span>
                </div>

                {decks.length > 0 && (
                  <div className="relative">
                    <select
                      value={deckFilter}
                      onChange={(e) => setDeckFilter(e.target.value)}
                      className="pl-3 pr-9 py-2.5 bg-[#0D0F1C] border border-[#1C1E35] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 appearance-none cursor-pointer min-w-[130px] hover:border-[#2A2C45] transition-colors"
                    >
                      <option value="all">All Decks</option>
                      {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]">▼</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Status pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex flex-wrap gap-2"
            >
              {STATUS_PILL.map(({ value, label }) => {
                const active = statusFilter === value;
                const cfg    = value !== 'all' ? STATUS_CONFIG[value as WordStatus] : null;
                return (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                      active
                        ? value === 'all'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : `${cfg!.badge} ring-2 ring-offset-1 ring-offset-[#07080F] ${cfg!.ring}`
                        : value === 'all'
                          ? 'bg-[#0D0F1C] text-slate-500 border border-[#1C1E35] hover:border-[#2A2C45] hover:text-slate-400'
                          : `${cfg!.badge} opacity-50 hover:opacity-80`
                    }`}
                  >
                    {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                    {label}
                    <span className="opacity-50 font-normal ml-0.5">{pillCount(value)}</span>
                  </button>
                );
              })}

              {/* Active deck chip */}
              {deckFilter !== 'all' && (
                <button
                  onClick={() => setDeckFilter('all')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-950/60 text-indigo-400 border border-indigo-500/30 hover:border-indigo-500/50 transition-all"
                >
                  <Layers className="w-3 h-3" />
                  {decks.find((d) => d.id === deckFilter)?.name ?? 'Deck'}
                  <span className="text-indigo-600 ml-0.5">×</span>
                </button>
              )}
            </motion.div>

            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0D0F1C] rounded-2xl border border-[#1C1E35] overflow-hidden"
            >
              <div className="flex items-center gap-4 px-6 py-3 border-b border-[#1C1E35] bg-[#0A0C18]">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handleSort('word')}
                    className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest transition-colors text-slate-600 hover:text-slate-400"
                  >
                    Word
                    {sortField === 'word' && sortDir === 'asc'  ? <ArrowUp   className="w-3 h-3 text-indigo-400" /> :
                     sortField === 'word' && sortDir === 'desc' ? <ArrowDown className="w-3 h-3 text-indigo-400" /> :
                                                                  <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </button>
                </div>
                <div className="hidden sm:block flex-1 min-w-0 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Translation</div>
                <div className="hidden sm:block w-28    text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Language</div>
                <div className="hidden lg:block w-24">
                  <button
                    onClick={() => handleSort('type')}
                    className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest transition-colors text-slate-600 hover:text-slate-400"
                  >
                    Type
                    {sortField === 'type' && sortDir === 'asc'  ? <ArrowUp   className="w-3 h-3 text-indigo-400" /> :
                     sortField === 'type' && sortDir === 'desc' ? <ArrowDown className="w-3 h-3 text-indigo-400" /> :
                                                                  <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </button>
                </div>
                <div className="w-28                    text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Status</div>
                <div className="w-14" />
              </div>

              <div className="divide-y divide-[#1C1E35]/50">
                <AnimatePresence mode="popLayout">
                  {sorted.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="py-16 text-center"
                    >
                      <div className="w-12 h-12 bg-[#111325] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#1C1E35]">
                        <Search className="w-5 h-5 text-slate-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">No words match your filters</p>
                      <p className="text-xs text-slate-700 mt-1">Try adjusting your search or filter options</p>
                    </motion.div>
                  ) : (
                    sorted.map((word, i) => (
                      <motion.div
                        key={word.id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.025, duration: 0.2 }}
                        onClick={() => setSelected(word)}
                        className={`flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-[#111325] transition-colors group ${
                          selected?.id === word.id
                            ? 'bg-[#0F1225] border-l-2 border-l-indigo-500'
                            : 'border-l-2 border-l-transparent'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-white truncate block font-mono">{word.word}</span>
                          <span className="sm:hidden text-xs text-slate-600 truncate block mt-0.5">{word.translation}</span>
                        </div>
                        <div className="hidden sm:block flex-1 min-w-0">
                          <span className="text-sm text-slate-400 truncate block">{word.translation}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 w-28 flex-shrink-0">
                          <span className="text-base leading-none">{LANG_FLAG[word.language]}</span>
                          <span className="text-sm text-slate-400">{word.language}</span>
                        </div>
                        <div className="hidden lg:flex items-center w-24 flex-shrink-0">
                          <span className={`text-xs font-medium capitalize ${POS_COLOR[word.partOfSpeech] ?? 'text-slate-500'}`}>
                            {word.partOfSpeech}
                          </span>
                        </div>
                        <div className="w-28 flex-shrink-0">
                          <StatusBadge status={word.status} size="sm" />
                        </div>
                        <div className="w-14 flex-shrink-0 flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingWord(word); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#2A2C45] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100"
                            title="Edit word"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-[#2A2C45] group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {sorted.length > 0 && (
                <div className="px-6 py-3 border-t border-[#1C1E35]/50 bg-[#0A0C18] text-xs text-slate-700">
                  Showing{' '}
                  <span className="font-medium text-slate-500">{sorted.length}</span> of{' '}
                  <span className="font-medium text-slate-500">{words.length}</span> words
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>

      {/* Panels & modals */}
      <WordDetailPanel word={selected} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} onDelete={handleDeleteWord} />

      {settingsOpen && (
        <SettingsPanel settings={appSettings} onClose={() => setSettingsOpen(false)} onChange={handleSettingsChange} />
      )}

      <AnimatePresence>
        {addWordOpen && (
          <AddWordModal
            decks={decks}
            defaultDeckId={deckFilter !== 'all' ? deckFilter : undefined}
            onAdd={handleAddWord}
            onClose={() => setAddWordOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingWord && (
          <EditWordModal
            word={editingWord}
            decks={decks}
            onSave={handleEditWord}
            onClose={() => setEditingWord(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deckModalOpen && user && (
          <DeckManagementModal
            decks={decks}
            wordCountPerDeck={wordCountPerDeck}
            userId={user.id}
            onClose={() => setDeckModalOpen(false)}
            onDecksChange={handleDecksChange}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {importModalOpen && (
          <ImportModal
            decks={decks}
            onClose={() => setImportModalOpen(false)}
            onImport={handleImportWords}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {migrateCount > 0 && (
          <MigrationDialog
            wordCount={migrateCount}
            onSync={handleMigrate}
            onDismiss={handleDismissMigration}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: 16,  scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-xl shadow-black/40 backdrop-blur-sm whitespace-nowrap ${
              toast.type === 'error'
                ? 'bg-red-950/90 border border-red-500/30 text-red-400'
                : 'bg-emerald-950/90 border border-emerald-500/30 text-emerald-400'
            }`}
          >
            {toast.type === 'error'
              ? <AlertCircle className="w-4 h-4 flex-shrink-0" />
              : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            }
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Public export (wrapped in AuthGuard) ─────────────────────────────────────

export function VocabDashboard() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}
