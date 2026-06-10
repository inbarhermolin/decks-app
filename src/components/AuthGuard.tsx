'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface Props {
  children: React.ReactNode;
}

export function AuthGuard({ children }: Props) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [session, loading, router]);

  // While Supabase resolves the session, show a minimal branded loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080F] flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs text-slate-600 tracking-widest uppercase">Loading…</p>
        </motion.div>
      </div>
    );
  }

  // Not authenticated — redirect is in flight, render nothing
  if (!session) return null;

  return <>{children}</>;
}
