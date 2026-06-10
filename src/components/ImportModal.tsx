'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, AlertCircle, Check, Loader2, FileText, ArrowLeft } from 'lucide-react';
import { Word, Language, PartOfSpeech, WordStatus, Deck } from '@/lib/types';

// ── CSV parsing ───────────────────────────────────────────────────────────────

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current   = '';
  let inQuotes  = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (!inQuotes) { inQuotes = true; continue; }
      if (line[i + 1] === '"') { current += '"'; i++; continue; }
      inQuotes = false;
      continue;
    }
    if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

interface ParsedRow {
  word: string;
  translation: string;
  exampleSentence: string;
  language?: string;
  status?: string;
}

interface ParseResult {
  rows: ParsedRow[];
  error?: string;
}

function parseCSV(text: string): ParseResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { rows: [], error: 'File appears empty or contains only a header row.' };
  }

  const headers  = parseCSVRow(lines[0]).map((h) => h.toLowerCase().trim());
  const wordIdx  = headers.findIndex((h) => h === 'target word' || h === 'word');
  const transIdx = headers.findIndex((h) => h === 'translation');
  const sentIdx  = headers.findIndex((h) => h.includes('sentence') || h === 'example');
  const langIdx  = headers.findIndex((h) => h === 'language' || h === 'lang');
  const statIdx  = headers.findIndex((h) => h === 'status');

  if (wordIdx === -1) {
    return { rows: [], error: 'Missing required column "Target Word". Check your CSV headers.' };
  }
  if (transIdx === -1) {
    return { rows: [], error: 'Missing required column "Translation". Check your CSV headers.' };
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols        = parseCSVRow(lines[i]);
    const word        = cols[wordIdx]?.trim()  ?? '';
    const translation = cols[transIdx]?.trim() ?? '';
    if (!word || !translation) continue;
    rows.push({
      word,
      translation,
      exampleSentence: sentIdx >= 0 ? (cols[sentIdx]?.trim() ?? '') : '',
      language:        langIdx >= 0 ? cols[langIdx]?.trim() : undefined,
      status:          statIdx >= 0 ? cols[statIdx]?.trim() : undefined,
    });
  }

  if (rows.length === 0) {
    return { rows: [], error: 'No valid rows found. Make sure each row has a word and translation.' };
  }

  return { rows };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LANGUAGES: Language[] = ['Italian', 'Spanish', 'French', 'German', 'English'];

const VALID_STATUSES = new Set<string>(['known', 'half-known', 'unknown']);
const STATUS_ALIASES: Record<string, WordStatus> = {
  'halfknown': 'half-known',
  'half known': 'half-known',
  'learning': 'half-known',
};

function resolveStatus(raw?: string): WordStatus {
  if (!raw) return 'unknown';
  const lower = raw.toLowerCase();
  if (VALID_STATUSES.has(lower)) return lower as WordStatus;
  return STATUS_ALIASES[lower] ?? 'unknown';
}

function resolveLanguage(raw: string | undefined, fallback: Language): Language {
  if (!raw) return fallback;
  const match = LANGUAGES.find((l) => l.toLowerCase() === raw.toLowerCase());
  return match ?? fallback;
}

function uid(): string {
  return `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  decks: Deck[];
  onClose: () => void;
  onImport: (words: Word[]) => Promise<void>;
}

export function ImportModal({ decks, onClose, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [step,          setStep]          = useState<'upload' | 'preview'>('upload');
  const [dragging,      setDragging]      = useState(false);
  const [parseError,    setParseError]    = useState<string | null>(null);
  const [parsedRows,    setParsedRows]    = useState<ParsedRow[]>([]);
  const [defaultLang,   setDefaultLang]   = useState<Language>('Italian');
  const [defaultDeckId, setDefaultDeckId] = useState<string>('');
  const [importing,     setImporting]     = useState(false);
  const [importError,   setImportError]   = useState<string | null>(null);

  // ── File handling ──────────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
      setParseError('Please upload a .csv file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text   = e.target?.result as string;
      const result = parseCSV(text);
      if (result.error) {
        setParseError(result.error);
      } else {
        setParsedRows(result.rows);
        setParseError(null);
        setStep('preview');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleConfirmImport = async () => {
    setImporting(true);
    setImportError(null);
    try {
      const words: Word[] = parsedRows.map((row) => ({
        id:             uid(),
        word:           row.word,
        translation:    row.translation,
        language:       resolveLanguage(row.language, defaultLang),
        partOfSpeech:   'noun' as PartOfSpeech,
        status:         resolveStatus(row.status),
        exampleSentence: row.exampleSentence ?? '',
        addedAt:        new Date().toISOString(),
        consecutiveCorrect: 0,
        deckId:         defaultDeckId || undefined,
      }));
      await onImport(words);
    } catch {
      setImportError('Import failed. Please try again.');
      setImporting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />

      {/* Sheet */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.97,  y: 10 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-x-4 top-[5vh] z-50 mx-auto max-w-2xl max-h-[90vh] flex flex-col bg-[#0D0F1C] border border-[#1C1E35] rounded-2xl shadow-2xl shadow-black/60"
      >
        {/* Accent stripe */}
        <div className="h-0.5 w-full flex-shrink-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-t-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1C1E35] flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Import Words</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 'upload'
                ? 'Upload a CSV file to bulk-add words'
                : `${parsedRows.length} word${parsedRows.length !== 1 ? 's' : ''} ready to import`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-[#111325] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <AnimatePresence mode="wait">

            {/* ── Upload step ── */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-6 py-6 space-y-4"
              >
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-3 px-6 py-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    dragging
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-[#2A2C45] hover:border-indigo-500/50 hover:bg-[#0F1225]'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                    dragging ? 'bg-indigo-500/20' : 'bg-[#111325]'
                  }`}>
                    <Upload className={`w-6 h-6 transition-colors ${dragging ? 'text-indigo-400' : 'text-slate-600'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-300">
                      {dragging ? 'Drop it!' : 'Drop your CSV file here'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">or click to browse</p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Parse error */}
                {parseError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-950/40 border border-red-500/25"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300/80 leading-relaxed">{parseError}</p>
                  </motion.div>
                )}

                {/* Expected format hint */}
                <div className="bg-[#07080F] border border-[#1C1E35] rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected format</p>
                  </div>
                  <div className="font-mono text-xs space-y-0.5 pl-1">
                    <p className="text-indigo-400">Target Word, Translation, Example Sentence</p>
                    <p className="text-slate-600">parlare, to speak, Voglio parlare con te.</p>
                    <p className="text-slate-600">correr, to run, Ella corre muy rápido.</p>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed pl-1">
                    Optional columns: <span className="text-slate-600">Language, Status</span>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Preview step ── */}
            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col"
              >
                {/* Settings bar */}
                <div className="px-6 py-3.5 border-b border-[#1C1E35] bg-[#0A0C18] flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Language:</label>
                    <div className="relative">
                      <select
                        value={defaultLang}
                        onChange={(e) => setDefaultLang(e.target.value as Language)}
                        className="bg-[#0D0F1C] border border-[#1C1E35] rounded-lg pl-2.5 pr-7 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer hover:border-[#2A2C45] transition-colors"
                      >
                        {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]">▼</span>
                    </div>
                  </div>

                  {decks.length > 0 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Add to Deck:</label>
                      <div className="relative">
                        <select
                          value={defaultDeckId}
                          onChange={(e) => setDefaultDeckId(e.target.value)}
                          className="bg-[#0D0F1C] border border-[#1C1E35] rounded-lg pl-2.5 pr-7 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer hover:border-[#2A2C45] transition-colors"
                        >
                          <option value="">No Deck</option>
                          {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]">▼</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => { setStep('upload'); setParseError(null); }}
                    className="ml-auto flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Change file
                  </button>
                </div>

                {/* Preview table */}
                <div className="overflow-auto" style={{ maxHeight: '40vh' }}>
                  <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#0A0C18]">
                      <tr>
                        {['#', 'Word', 'Translation', 'Example Sentence'].map((col) => (
                          <th
                            key={col}
                            className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase tracking-widest border-b border-[#1C1E35] whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C1E35]/50">
                      {parsedRows.slice(0, 100).map((row, i) => (
                        <tr key={i} className="hover:bg-[#0F1225] transition-colors">
                          <td className="px-4 py-2.5 text-slate-700 tabular-nums w-8">{i + 1}</td>
                          <td className="px-4 py-2.5 font-mono text-white font-medium">{row.word}</td>
                          <td className="px-4 py-2.5 text-slate-400">{row.translation}</td>
                          <td className="px-4 py-2.5 text-slate-600 max-w-[220px] truncate">
                            {row.exampleSentence || <span className="text-slate-800">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 100 && (
                    <p className="px-4 py-2.5 text-xs text-slate-700 border-t border-[#1C1E35] bg-[#0A0C18]">
                      Showing first 100 of {parsedRows.length} rows
                    </p>
                  )}
                </div>

                {/* Import error */}
                {importError && (
                  <div className="px-6 py-3 border-t border-[#1C1E35]">
                    <div className="flex items-center gap-2 text-xs text-red-400">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {importError}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer — preview step only */}
        {step === 'preview' && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#1C1E35] bg-[#0A0C18] rounded-b-2xl flex-shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white border border-[#1C1E35] hover:border-[#2A2C45] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={importing}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2"
            >
              {importing ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Importing…</>
              ) : (
                <><Check className="w-4 h-4" />Import {parsedRows.length} word{parsedRows.length !== 1 ? 's' : ''}</>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
