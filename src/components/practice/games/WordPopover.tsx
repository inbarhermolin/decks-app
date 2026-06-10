'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Word } from '@/lib/types';

interface Props {
  token:     string;
  allWords:  Word[];
  children:  React.ReactNode;
  wordData?: Word; // optional — bypasses allWords lookup (use when the word object is already known)
}

function cleanToken(token: string): string {
  return token
    .toLowerCase()
    .replace(/^[^a-zA-ZÀ-ÖØ-öø-ÿ]+|[^a-zA-ZÀ-ÖØ-öø-ÿ]+$/g, '');
}

export function WordPopover({ token, allWords, children, wordData }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const clean = cleanToken(token);
  const match = wordData ?? allWords.find((w) => w.word.toLowerCase() === clean);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  // Words with no vocabulary match still get cursor-pointer so users know they can tap —
  // but we only open a popover when we actually have data to show.
  if (!match) {
    return (
      <span
        className="cursor-pointer hover:text-slate-300 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </span>
    );
  }

  return (
    <span ref={ref} className="relative inline">
      <span
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="cursor-pointer underline decoration-dotted decoration-indigo-400/60 underline-offset-2 hover:text-indigo-300 transition-colors"
      >
        {children}
      </span>

      {open && (
        <span
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#111325] border border-indigo-500/30 rounded-xl p-3 shadow-2xl shadow-black/60 flex flex-col gap-1.5 text-left"
          style={{ pointerEvents: 'none' }}
        >
          <span className="text-sm font-mono font-bold text-white">{match.word}</span>
          <span className="text-xs text-slate-300 leading-snug">{match.translation}</span>
          <span className="text-[10px] text-slate-500 capitalize">{match.partOfSpeech}</span>
          {match.partOfSpeech === 'verb' && match.presentTense && (
            <span className="text-[10px] text-indigo-400 font-mono leading-relaxed border-t border-indigo-500/20 pt-1.5 mt-0.5">
              {match.presentTense}
            </span>
          )}
          {match.notes && (
            <span className="text-[10px] text-slate-600 italic leading-snug border-t border-[#1C1E35] pt-1.5 mt-0.5">
              {match.notes}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
