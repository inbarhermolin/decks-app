'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Word, Language, Deck } from '@/lib/types';
import { VOCAB_DATA } from '@/lib/data';
import { AppSettings, DEFAULT_SETTINGS } from '@/lib/settings';
import {
  GameModeId,
  QueueItem,
  WordResult,
  MissedForms,
  buildSession,
  makeRetryItem,
  applyProgressUpdates,
  computeEligibleUpgrades,
  applyApprovedUpgrades,
} from '@/lib/practice';
import {
  fetchWords,
  fetchSettings,
  fetchDecks,
  upsertWords,
  updateUserStats,
} from '@/lib/db';
import { computeSessionXP } from '@/lib/gamification';
import { useAuth } from '@/lib/auth';
import { AuthGuard }               from '../AuthGuard';
import { PreGameSetup }            from './PreGameSetup';
import { GameModeSelect }          from './GameModeSelect';
import { GameHeader }              from './GameHeader';
import { FlashcardGame }           from './games/FlashcardGame';
import { SentenceTranslationGame } from './games/SentenceTranslationGame';
import { WordTranslationGame }     from './games/WordTranslationGame';
import { VerbConjugationGame }     from './games/VerbConjugationGame';
import { ListeningGame }           from './games/ListeningGame';
import { AIQuestionGame }          from './games/AIQuestionGame';
import { SummaryScreen }           from './SummaryScreen';

// ── Component ─────────────────────────────────────────────────────────────────

type Phase = 'pregame' | 'select-mode' | 'playing' | 'summary';

const LANGUAGE = 'Italian' as const;

function Session() {
  const router = useRouter();
  const { user } = useAuth();

  const [phase, setPhase]               = useState<Phase>('pregame');
  const [sessionBatchSize, setSessionBatchSize] = useState<number | null>(null);
  const [gameMode, setGameMode]         = useState<GameModeId | null>(null);
  const [queue, setQueue]               = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [originalCount, setOriginalCount] = useState(0);
  const [results, setResults]           = useState<Map<string, WordResult>>(new Map());
  const [eligibleUpgrades, setEligibleUpgrades] = useState<Word[]>([]);
  const [sessionXP, setSessionXP]               = useState(0);

  // Cloud-loaded words, settings, and decks
  const [allWords, setAllWords] = useState<Word[]>(VOCAB_DATA);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [decks, setDecks]       = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [cloudWords, cloudSettings, cloudDecks] = await Promise.all([
        fetchWords(user.id),
        fetchSettings(user.id),
        fetchDecks(user.id).catch(() => [] as Deck[]),
      ]);
      // Merge seed conjugations back in for any seed word that lacks them in DB
      const seedMap = new Map(VOCAB_DATA.map((w) => [w.id, w]));
      const merged = cloudWords.map((w) => {
        const seed = seedMap.get(w.id);
        if (!seed || w.conjugations?.length) return w;
        return { ...w, conjugations: seed.conjugations };
      });
      setAllWords(merged.length > 0 ? merged : VOCAB_DATA);
      setSettings(cloudSettings);
      setDecks(cloudDecks);
    })();
  }, [user]);

  // Words filtered to Italian + selected deck — used for session building
  const practiceWords = useMemo(
    () => allWords.filter(
      (w) => w.language === LANGUAGE && (!selectedDeckId || w.deckId === selectedDeckId),
    ),
    [allWords, selectedDeckId],
  );

  // ── Round completion ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    if (queue.length === 0)  return;
    if (currentIndex < queue.length) return;

    const allResults   = [...results.values()];
    const practisedIds = new Set(allResults.map((r) => r.word.id));
    const updatedWords = applyProgressUpdates(allWords, allResults);

    if (user) upsertWords(updatedWords, user.id).catch(console.error);

    // XP + stats update
    const xp          = computeSessionXP(allResults);
    const wordsPassed = allResults.filter((r) => r.passed).length;
    setSessionXP(xp);
    if (user) updateUserStats(user.id, xp, wordsPassed).catch(console.error);

    const eligible = computeEligibleUpgrades(updatedWords, practisedIds, settings.upgradeThreshold);
    setEligibleUpgrades(eligible);
    setAllWords(updatedWords);
    setPhase('summary');
  }, [phase, queue.length, currentIndex, results, settings.upgradeThreshold, allWords, user]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDeckChange = useCallback((deckId: string | null) => {
    setSelectedDeckId(deckId);
  }, []);

  const handlePreGameStart = useCallback((batchSize: number) => {
    setSessionBatchSize(batchSize);
    setPhase('select-mode');
  }, []);

  const handleModeSelect = useCallback(
    (mode: GameModeId) => {
      const sessionSettings = sessionBatchSize !== null
        ? { ...settings, batchSize: sessionBatchSize }
        : settings;
      const session = buildSession(practiceWords, LANGUAGE, sessionSettings, mode);
      if (session.length === 0) return;

      const initResults = new Map<string, WordResult>();
      for (const item of session) {
        initResults.set(item.word.id, {
          word: item.word,
          originalStatus: item.word.status,
          passed: false,
          passedFirstTry: false,
          totalAttempts: 0,
        });
      }
      setGameMode(mode);
      setQueue(session);
      setOriginalCount(session.length);
      setResults(initResults);
      setCurrentIndex(0);
      setPhase('playing');
    },
    [practiceWords, settings, sessionBatchSize],
  );

  const handleResult = useCallback(
    (passed: boolean, missedForms?: MissedForms) => {
      const item = queue[currentIndex];
      if (!item) return;

      setResults((prev) => {
        const next = new Map(prev);
        const r    = prev.get(item.word.id) ?? {
          word: item.word,
          originalStatus: item.word.status,
          passed: false,
          passedFirstTry: false,
          totalAttempts: 0,
        };
        next.set(item.word.id, {
          ...r,
          totalAttempts:  r.totalAttempts + 1,
          passed:         r.passed || passed,
          passedFirstTry: r.passedFirstTry || (passed && item.attemptNumber === 1),
        });
        return next;
      });

      if (!passed) {
        const retryItem = missedForms?.pronouns.length
          ? makeRetryItem(item, missedForms.pronouns, missedForms.tense)
          : makeRetryItem(item);
        setQueue((prev) => [...prev, retryItem]);
      }
      setCurrentIndex((i) => i + 1);
    },
    [queue, currentIndex],
  );

  const handleSummaryDone = useCallback(
    async (approvedIds: Set<string>) => {
      const finalWords = applyApprovedUpgrades(allWords, approvedIds);
      if (user) await upsertWords(finalWords, user.id).catch(console.error);
      router.push('/');
    },
    [allWords, user, router],
  );

  const handlePracticeAgain = useCallback(() => {
    setPhase('pregame');
    setGameMode(null);
    setQueue([]);
    setCurrentIndex(0);
    setResults(new Map());
    setOriginalCount(0);
    setEligibleUpgrades([]);
    setSessionXP(0);
    setSessionBatchSize(null);
    // Keep selectedDeckId — user likely wants to stay in the same deck
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const clearedCount = useMemo(() => {
    let n = 0;
    results.forEach((r) => { if (r.passed) n++; });
    return Math.min(n, originalCount);
  }, [results, originalCount]);

  const currentItem = phase === 'playing' ? queue[currentIndex] ?? null : null;

  void gameMode;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#07080F]">
      <AnimatePresence mode="wait">

        {phase === 'pregame' && (
          <motion.div key="pregame" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
            <PreGameSetup
              words={allWords}
              decks={decks}
              settings={settings}
              selectedDeckId={selectedDeckId}
              onDeckChange={handleDeckChange}
              onStart={handlePreGameStart}
              onBack={() => router.push('/')}
            />
          </motion.div>
        )}

        {phase === 'select-mode' && (
          <motion.div key="select-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
            <GameModeSelect
              language={LANGUAGE}
              allWords={practiceWords}
              onSelect={handleModeSelect}
              onBack={() => setPhase('pregame')}
            />
          </motion.div>
        )}

        {phase === 'playing' && currentItem && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col min-h-screen">
            <GameHeader
              language={LANGUAGE}
              cleared={clearedCount}
              total={originalCount}
              isRetry={currentItem.attemptNumber > 1}
              onBack={() => setPhase('select-mode')}
            />
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentItem.uid}
                  initial={{ x: 48, opacity: 0 }}
                  animate={{ x: 0,  opacity: 1 }}
                  exit={{ x: -48,   opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="w-full max-w-lg"
                >
                  {currentItem.gameMode === 'flashcard' && (
                    <FlashcardGame item={currentItem} onResult={handleResult} />
                  )}
                  {currentItem.gameMode === 'sentence-translation' && (
                    <SentenceTranslationGame item={currentItem} allWords={allWords} onResult={handleResult} />
                  )}
                  {currentItem.gameMode === 'word-translation' && (
                    <WordTranslationGame item={currentItem} allWords={allWords} onResult={handleResult} />
                  )}
                  {currentItem.gameMode === 'verb-conjugation' && (
                    <VerbConjugationGame item={currentItem} onResult={handleResult} />
                  )}
                  {currentItem.gameMode === 'listening' && (
                    <ListeningGame item={currentItem} onResult={handleResult} />
                  )}
                  {currentItem.gameMode === 'ai-question' && (
                    <AIQuestionGame item={currentItem} onResult={handleResult} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {phase === 'summary' && (
          <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <SummaryScreen
              results={[...results.values()]}
              eligibleUpgrades={eligibleUpgrades}
              language={LANGUAGE}
              sessionXP={sessionXP}
              onDone={handleSummaryDone}
              onPracticeAgain={handlePracticeAgain}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

export function PracticeSession() {
  return (
    <AuthGuard>
      <Session />
    </AuthGuard>
  );
}
