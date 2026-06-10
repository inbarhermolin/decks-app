'use client';

import { Word } from '@/lib/types';
import { WordPopover } from './WordPopover';

interface Props {
  sentence: string;
  allWords: Word[];
  className?: string;
}

export function ClickableSentence({ sentence, allWords, className }: Props) {
  // Split on whitespace, keeping spaces as tokens so we can reconstruct spacing
  const tokens = sentence.match(/\S+|\s+/g) ?? [sentence];

  return (
    <span className={className}>
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
        return (
          <WordPopover key={i} token={token} allWords={allWords}>
            {token}
          </WordPopover>
        );
      })}
    </span>
  );
}
