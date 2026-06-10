'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CloudUpload, HardDrive, Loader2, X } from 'lucide-react';

interface Props {
  wordCount: number;
  onSync:    () => Promise<void>;
  onDismiss: () => void;
}

export function MigrationDialog({ wordCount, onSync, onDismiss }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [done,    setDone]    = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync();
      setDone(true);
      setTimeout(onDismiss, 1400);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.96,  y: 10 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-sm bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
      >
        {/* Gradient stripe */}
        <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

        <div className="p-6">
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                {done
                  ? <CloudUpload className="w-7 h-7 text-emerald-400" />
                  : <HardDrive   className="w-7 h-7 text-indigo-400" />
                }
              </div>
              {!done && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-[#0D0F1C] flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white">{wordCount}</span>
                </div>
              )}
            </div>
          </div>

          {done ? (
            <>
              <h2 className="text-base font-bold text-white text-center mb-1">All synced!</h2>
              <p className="text-sm text-slate-500 text-center">
                Your {wordCount} word{wordCount !== 1 ? 's' : ''} are now in the cloud.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-base font-bold text-white text-center mb-2">
                Local progress found
              </h2>
              <p className="text-sm text-slate-400 text-center leading-relaxed mb-5">
                We found{' '}
                <span className="text-white font-semibold">{wordCount} word{wordCount !== 1 ? 's' : ''}</span>{' '}
                saved locally. Would you like to sync them to your cloud account?
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {syncing
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Syncing…</>
                    : <><CloudUpload className="w-4 h-4" />Yes, sync to cloud</>
                  }
                </button>

                <button
                  onClick={onDismiss}
                  disabled={syncing}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 border border-[#1C1E35] hover:border-[#2A2C45] transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-3.5 h-3.5" />
                  No thanks, start fresh
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
