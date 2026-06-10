'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { UserStats, getTodayString } from '@/lib/gamification';

const GOAL_SHOWN_KEY = 'decks-goal-shown-date';

interface Props {
  stats:     UserStats;
  dailyGoal: number;
}

function formatXP(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

export function StatsCard({ stats, dailyGoal }: Props) {
  const goalReached   = dailyGoal > 0 && stats.todayWordsCount >= dailyGoal;
  const isToday       = stats.todayDate === getTodayString();
  const todayCount    = isToday ? stats.todayWordsCount : 0;
  const progressPct   = dailyGoal > 0 ? Math.min(100, Math.round((todayCount / dailyGoal) * 100)) : 0;
  const confettiFired = useRef(false);

  // Fire confetti once per day when the goal is first reached
  useEffect(() => {
    if (!goalReached || !isToday || confettiFired.current) return;
    const today = getTodayString();
    if (typeof window !== 'undefined' && localStorage.getItem(GOAL_SHOWN_KEY) === today) return;

    confettiFired.current = true;
    if (typeof window !== 'undefined') localStorage.setItem(GOAL_SHOWN_KEY, today);

    import('canvas-confetti').then((m) => {
      const fire = m.default;
      fire({ particleCount: 80,  spread: 60,  origin: { x: 0.3, y: 0.55 } });
      fire({ particleCount: 80,  spread: 60,  origin: { x: 0.7, y: 0.55 } });
      setTimeout(() => fire({ particleCount: 50, spread: 80, origin: { x: 0.5, y: 0.4 } }), 220);
    });
  }, [goalReached, isToday]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1,  y: 0  }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="bg-[#0D0F1C] rounded-2xl border border-[#1C1E35] overflow-hidden"
    >
      {/* Gradient top accent */}
      <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-400" />

      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Total XP */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0 text-xl">
            ⭐
          </div>
          <div>
            <p className="text-xl font-bold text-white tabular-nums leading-none">
              {formatXP(stats.totalXP)}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">Total XP</p>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl border ${
            stats.streak > 0
              ? 'bg-orange-500/10 border-orange-500/20'
              : 'bg-[#111325] border-[#1C1E35]'
          }`}>
            🔥
          </div>
          <div>
            <p className={`text-xl font-bold tabular-nums leading-none ${stats.streak > 0 ? 'text-orange-400' : 'text-slate-600'}`}>
              {stats.streak}
              <span className="text-sm font-normal text-slate-600 ml-1">
                day{stats.streak !== 1 ? 's' : ''}
              </span>
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">Current streak</p>
          </div>
        </div>

        {/* Daily Goal */}
        <div className="flex flex-col justify-center gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-600 uppercase tracking-wider font-semibold">
              Daily Goal
            </p>
            {goalReached && isToday ? (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/25 px-2 py-0.5 rounded-full"
              >
                ✓ Goal Reached!
              </motion.span>
            ) : (
              <span className="text-[11px] text-slate-600 tabular-nums">
                {todayCount}/{dailyGoal}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-[#1C1E35] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
              className={`h-full rounded-full ${
                goalReached && isToday
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  : 'bg-gradient-to-r from-indigo-500 to-violet-500'
              }`}
              style={goalReached && isToday ? { boxShadow: '0 0 8px rgba(52,211,153,0.5)' } : undefined}
            />
          </div>

          <p className="text-[10px] text-slate-700 leading-tight">
            {goalReached && isToday
              ? `${todayCount} words today 🎉`
              : todayCount > 0
                ? `${dailyGoal - todayCount} more to reach your goal`
                : `Practice ${dailyGoal} words today`}
          </p>
        </div>

      </div>
    </motion.div>
  );
}
