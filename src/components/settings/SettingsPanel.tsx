'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings2 } from 'lucide-react';
import { AppSettings, LearningDirection, saveSettings } from '@/lib/settings';

interface Props {
  settings: AppSettings;
  onClose: () => void;
  onChange: (s: AppSettings) => void;
}

const DIRECTION_OPTIONS: { value: LearningDirection; label: string; desc: string }[] = [
  { value: 'target-to-english', label: 'Target → English', desc: 'Show the target language word, answer in English' },
  { value: 'english-to-target', label: 'English → Target', desc: 'Show the English word, answer in the target language' },
  { value: 'mixed',             label: 'Mixed',             desc: 'Random direction for each word' },
];

export function SettingsPanel({ settings, onClose, onChange }: Props) {
  const update = (partial: Partial<AppSettings>) => {
    const next = { ...settings, ...partial };
    onChange(next);
    saveSettings(next);
  };

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.aside
          key="panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#0D0F1C] border-l border-[#1C1E35] z-50 overflow-y-auto shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1C1E35] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-indigo-500/15 rounded-lg flex items-center justify-center">
                <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <h2 className="text-base font-semibold text-white">Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-[#1C1E35] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 px-6 py-6 space-y-8">

            {/* Section label */}
            <p className="text-[10px] text-slate-600 uppercase tracking-widest -mb-4">Goals</p>

            {/* Daily Goal */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Daily Goal</label>
              <p className="text-xs text-slate-600">Words to practice per day</p>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={settings.dailyGoal}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v)) update({ dailyGoal: Math.min(100, Math.max(1, v)) });
                  }}
                  className="w-20 bg-[#07080F] border border-[#1C1E35] rounded-lg px-3 py-2 text-white text-sm font-mono text-center focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
                />
                <span className="text-sm text-slate-500">words / day</span>
              </div>
              <div className="flex gap-2 mt-1">
                {[10, 15, 20, 50].map((n) => (
                  <button
                    key={n}
                    onClick={() => update({ dailyGoal: n })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      settings.dailyGoal === n
                        ? 'bg-amber-950/60 border border-amber-500/40 text-amber-400'
                        : 'bg-[#07080F] border border-[#1C1E35] text-slate-500 hover:border-[#2A2C45] hover:text-slate-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-slate-600 uppercase tracking-widest -mb-4">Practice</p>

            {/* Batch Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Batch Size</label>
              <p className="text-xs text-slate-600">How many words to practice per round</p>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  min={3}
                  max={50}
                  value={settings.batchSize}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v)) update({ batchSize: Math.min(50, Math.max(3, v)) });
                  }}
                  className="w-20 bg-[#07080F] border border-[#1C1E35] rounded-lg px-3 py-2 text-white text-sm font-mono text-center focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
                />
                <span className="text-sm text-slate-500">words</span>
                <input
                  type="range"
                  min={3}
                  max={50}
                  value={settings.batchSize}
                  onChange={(e) => update({ batchSize: parseInt(e.target.value) })}
                  className="flex-1 accent-indigo-500"
                />
              </div>
            </div>

            {/* Learning Direction */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Learning Direction</label>
              <p className="text-xs text-slate-600">How words are presented during practice</p>
              <div className="mt-3 space-y-2">
                {DIRECTION_OPTIONS.map((opt) => {
                  const active = settings.direction === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => update({ direction: opt.value })}
                      className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        active
                          ? 'bg-indigo-950/50 border-indigo-500/40 ring-1 ring-indigo-500/20'
                          : 'bg-[#07080F] border-[#1C1E35] hover:border-[#2A2C45]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        active ? 'border-indigo-400' : 'border-slate-700'
                      }`}>
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${active ? 'text-indigo-300' : 'text-slate-300'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upgrade Threshold */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Status Upgrade Threshold</label>
              <p className="text-xs text-slate-600">
                Consecutive correct first-try answers before a word is <span className="text-amber-400">suggested</span> for a status upgrade
              </p>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.upgradeThreshold}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v)) update({ upgradeThreshold: Math.min(10, Math.max(1, v)) });
                  }}
                  className="w-20 bg-[#07080F] border border-[#1C1E35] rounded-lg px-3 py-2 text-white text-sm font-mono text-center focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
                />
                <span className="text-sm text-slate-500">consecutive correct</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={settings.upgradeThreshold}
                onChange={(e) => update({ upgradeThreshold: parseInt(e.target.value) })}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-700">
                <span>1 (easy)</span>
                <span>10 (strict)</span>
              </div>
            </div>

          </div>

          {/* Footer note */}
          <div className="px-6 pb-6 flex-shrink-0">
            <p className="text-[11px] text-slate-700 text-center">
              Settings save automatically and apply to the next session
            </p>
          </div>
        </motion.aside>
      </>
    </AnimatePresence>
  );
}
