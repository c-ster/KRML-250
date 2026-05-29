"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { songsApi, type SongSearchResult } from "@/lib/api";

interface Props {
  value: SongSearchResult | null;
  onChange: (song: SongSearchResult | null) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export function SongAutocomplete({ value, onChange, placeholder = "Search by title or artist...", disabled = false, label }: Props) {
  const [query, setQuery] = useState(value ? `${value.canonical_title} — ${value.canonical_artist}` : "");
  const [results, setResults] = useState<SongSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try { const data = await songsApi.search(q); setResults(data); setOpen(true); }
    catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(query), 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const select = (song: SongSearchResult) => { onChange(song); setQuery(`${song.canonical_title} — ${song.canonical_artist}`); setOpen(false); };
  const clear = () => { onChange(null); setQuery(""); setResults([]); };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && <label className="block text-sm font-medium text-zinc-300 mb-1">{label}</label>}
      <div className="relative">
        <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); if (value) onChange(null); }} onFocus={() => results.length > 0 && setOpen(true)} placeholder={placeholder} disabled={disabled} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed pr-10" />
        {value && !disabled && <button type="button" onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">✕</button>}
        {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">⋯</span>}
      </div>
      {value && <div className="mt-1 text-xs text-amber-500">✓ {value.canonical_title} — {value.canonical_artist}{value.decade && ` (${value.decade})`}</div>}
      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {results.map((song) => (
            <li key={song.id}>
              <button type="button" onMouseDown={() => select(song)} className="w-full text-left px-4 py-3 hover:bg-zinc-700 transition-colors">
                <div className="text-zinc-100 font-medium">{song.canonical_title}</div>
                <div className="text-zinc-400 text-sm">{song.canonical_artist}</div>
                {song.decade && <div className="text-zinc-500 text-xs">{song.decade}</div>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-400 text-sm">No songs found for &ldquo;{query}&rdquo;. Try a different title or artist.</div>
      )}
    </div>
  );
}
