'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Word } from '@/lib/types';

interface Props {
  token: string;
  allWords: Word[];
  children: React.ReactNode;
}

function cleanToken(token: string): string {
  return token
    .toLowerCase()
    .replace(/^[^a-zA-ZÀ-ÖØ-öø-ÿ]+|[^a-zA-ZÀ-ÖØ-öø-ÿ]+$/g, '');
}

export function WordPopover({ token, allWords, children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const clean = cleanToken(token);
  const match = allWords.find((w) => w.word.toLowerCase() === clean);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  if (!match) {
    return <span>{children}</span>;
  }

  return (
    <span ref={ref} className="relative inline">
      <span
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="cursor-pointer underline decoration-dotted decoration-indigo-500/50 underline-offset-2 hover:text-indigo-300 transition-colors"
      >
        {children}
      </span>

      {open && (
        <span
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-[#111325] border border-indigo-500/30 rounded-xl p-3 shadow-2xl shadow-black/50 flex flex-col gap-1 text-left pointer-events-none"
        >
          <span className="text-sm font-mono font-bold text-white">{match.word}</span>
          <span className="text-xs text-slate-300">{match.translation}</span>
          <span className="text-[10px] text-slate-500 capitalize">{match.partOfSpeech}</span>
          {match.partOfSpeech === 'verb' && match.presentTense && (
            <span className="text-[10px] text-indigo-400 font-mono leading-relaxed border-t border-indigo-500/20 pt-1 mt-0.5">
              {match.presentTense}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
