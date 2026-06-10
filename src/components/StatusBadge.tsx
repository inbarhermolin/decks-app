import { WordStatus } from '@/lib/types';

export const STATUS_CONFIG: Record<
  WordStatus,
  { label: string; badge: string; dot: string; button: string; ring: string }
> = {
  known: {
    label: 'Known',
    badge: 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/25',
    dot: 'bg-emerald-400',
    button: 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950',
    ring: 'ring-emerald-500',
  },
  'half-known': {
    label: 'Half Known',
    badge: 'bg-amber-950/50 text-amber-400 border border-amber-500/25',
    dot: 'bg-amber-400',
    button: 'bg-amber-950/60 text-amber-400 border border-amber-500/30 hover:bg-amber-950',
    ring: 'ring-amber-500',
  },
  unknown: {
    label: 'Unknown',
    badge: 'bg-red-950/50 text-red-400 border border-red-500/25',
    dot: 'bg-red-400',
    button: 'bg-red-950/60 text-red-400 border border-red-500/30 hover:bg-red-950',
    ring: 'ring-red-500',
  },
};

interface StatusBadgeProps {
  status: WordStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const sizeClass = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-1.5',
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${cfg.badge} ${sizeClass}`}>
      <span className={`rounded-full flex-shrink-0 ${cfg.dot} ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
      {cfg.label}
    </span>
  );
}
