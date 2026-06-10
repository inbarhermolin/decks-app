'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Pencil, Trash2, Check, AlertCircle, Loader2, Layers } from 'lucide-react';
import { Deck } from '@/lib/types';
import { createDeck, renameDeck, deleteDeck } from '@/lib/db';

interface Props {
  decks: Deck[];
  wordCountPerDeck: Record<string, number>;
  userId: string;
  onClose: () => void;
  onDecksChange: (decks: Deck[]) => void;
}

export function DeckManagementModal({ decks, wordCountPerDeck, userId, onClose, onDecksChange }: Props) {
  const [newDeckName, setNewDeckName]       = useState('');
  const [creating, setCreating]             = useState(false);
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [editName, setEditName]             = useState('');
  const [savingId, setSavingId]             = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [error, setError]                   = useState<string | null>(null);

  const handleCreate = async () => {
    const name = newDeckName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const deck = await createDeck(name, userId);
      onDecksChange([...decks, deck]);
      setNewDeckName('');
    } catch {
      setError('Failed to create deck. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (deck: Deck) => {
    setEditingId(deck.id);
    setEditName(deck.name);
    setError(null);
  };

  const handleRename = async (id: string) => {
    const name = editName.trim();
    if (!name) { setEditingId(null); return; }
    setSavingId(id);
    setError(null);
    try {
      await renameDeck(id, name);
      onDecksChange(decks.map((d) => (d.id === id ? { ...d, name } : d)));
      setEditingId(null);
    } catch {
      setError('Failed to rename deck. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await deleteDeck(id);
      onDecksChange(decks.filter((d) => d.id !== id));
      setConfirmDeleteId(null);
    } catch {
      setError('Failed to delete deck. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.97,  y: 10 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-x-4 top-[10vh] z-50 mx-auto max-w-md max-h-[80vh] flex flex-col bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl shadow-2xl shadow-black/60"
      >
        {/* Accent stripe */}
        <div className="h-0.5 w-full flex-shrink-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-t-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1C1E35] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Manage Decks</h2>
              <p className="text-xs text-slate-500 mt-0.5">{decks.length} deck{decks.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-[#111325] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Deck list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 min-h-0">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-950/40 border border-red-500/25 text-xs text-red-400 mb-1"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {decks.length === 0 && (
            <div className="py-8 text-center">
              <div className="w-10 h-10 bg-[#111325] rounded-xl flex items-center justify-center mx-auto mb-3 border border-[#1C1E35]">
                <Layers className="w-5 h-5 text-slate-700" />
              </div>
              <p className="text-sm text-slate-600">No decks yet.</p>
              <p className="text-xs text-slate-700 mt-1">Create your first one below.</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {decks.map((deck) => {
              const wc           = wordCountPerDeck[deck.id] ?? 0;
              const isEditing    = editingId === deck.id;
              const isSaving     = savingId === deck.id;
              const isConfirming = confirmDeleteId === deck.id;
              const isDeleting   = deletingId === deck.id;

              return (
                <motion.div
                  key={deck.id}
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.18 }}
                  className="bg-[#07080F] border border-[#1C1E35] rounded-xl px-4 py-3 overflow-hidden"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(deck.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 bg-transparent border-b border-indigo-500/50 text-white text-sm focus:outline-none pb-0.5 caret-indigo-400"
                      />
                      <button
                        onClick={() => handleRename(deck.id)}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : isConfirming ? (
                    <div className="space-y-2.5">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Delete{' '}
                        <span className="font-semibold text-white">"{deck.name}"</span>?
                        {wc > 0 && (
                          <span className="text-amber-400">
                            {' '}{wc} word{wc !== 1 ? 's' : ''} will be unassigned.
                          </span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(deck.id)}
                          disabled={isDeleting}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/50 text-red-400 border border-red-500/25 hover:bg-red-950 transition-colors disabled:opacity-50"
                        >
                          {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 border border-[#1C1E35] hover:border-[#2A2C45] hover:text-slate-300 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{deck.name}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{wc} word{wc !== 1 ? 's' : ''}</p>
                      </div>
                      <button
                        onClick={() => startEdit(deck)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                        title="Rename"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setConfirmDeleteId(deck.id); setError(null); }}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Create new deck */}
        <div className="px-6 py-4 border-t border-[#1C1E35] flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="New deck name…"
              className="flex-1 bg-[#07080F] border border-[#1C1E35] rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
            />
            <button
              onClick={handleCreate}
              disabled={!newDeckName.trim() || creating}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
