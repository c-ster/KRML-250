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
  const [showAddForm, setShowAddForm] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addArtist, setAddArtist] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setShowAddForm(false); setOpen(false); return; }
    setLoading(true);
    try { const data = await songsApi.search(q); setResults(data); setOpen(true); }
    catch { setResults([]); setOpen(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(query), 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowAddForm(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const select = (song: SongSearchResult) => {
    onChange(song);
    setQuery(`${song.canonical_title} — ${song.canonical_artist}`);
    setOpen(false);
    setShowAddForm(false);
  };

  const clear = () => { onChange(null); setQuery(""); setResults([]); setShowAddForm(false); };

  async function handleAdd() {
    if (!addTitle.trim() || !addArtist.trim()) { setAddError("Both title and artist are required."); return; }
    setAdding(true);
    setAddError("");
    try {
      const song = await songsApi.suggest(addTitle.trim(), addArtist.trim());
      select(song);
      setShowAddForm(false);
      setAddTitle("");
      setAddArtist("");
    } catch {
      setAddError("Could not add song. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  const noResults = open && !loading && !value && query.length >= 2 && results.length === 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {label && <label className="block text-sm font-medium text-[#1F1F1F] mb-1">{label}</label>}
      <div className="relative">
        <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); if (value) onChange(null); setShowAddForm(false); }} onFocus={() => results.length > 0 && setOpen(true)} placeholder={placeholder} disabled={disabled} className="w-full bg-[#F5F3EF] border border-[#D8D4CE] rounded-lg px-4 py-3 text-[#1F1F1F] placeholder-[#8A8480] focus:outline-none focus:border-[#2F5D62] disabled:opacity-50 disabled:cursor-not-allowed pr-10" />
        {value && !disabled && <button type="button" onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8480] hover:text-[#1F1F1F]">✕</button>}
        {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8480] text-sm">⋯</span>}
      </div>
      {value && <div className="mt-1 text-xs text-[#2F5D62]">✓ {value.canonical_title} — {value.canonical_artist}{value.decade && ` (${value.decade})`}</div>}

      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-[#D8D4CE] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((song) => (
            <li key={song.id}>
              <button type="button" onMouseDown={() => select(song)} className="w-full text-left px-4 py-3 hover:bg-[#F5F3EF] transition-colors">
                <div className="text-[#1F1F1F] font-medium">{song.canonical_title}</div>
                <div className="text-[#6B6560] text-sm">{song.canonical_artist}</div>
                {song.decade && <div className="text-[#8A8480] text-xs">{song.decade}</div>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {noResults && !showAddForm && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#D8D4CE] rounded-lg shadow-lg px-4 py-3">
          <p className="text-[#6B6560] text-sm mb-2">No songs found for &ldquo;{query}&rdquo;.</p>
          <button type="button" onMouseDown={() => { setShowAddForm(true); setAddTitle(query); setOpen(false); }}
            className="text-sm font-medium text-[#2F5D62] hover:text-[#1F1F1F] underline">
            + Don&apos;t see your song? Add it
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="mt-2 bg-white border border-[#C9A66B]/50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-[#1F1F1F]">Add a song to the catalog</p>
          <p className="text-xs text-[#8A8480]">It will be reviewed before counting toward rankings.</p>
          <input type="text" value={addTitle} onChange={(e) => setAddTitle(e.target.value)}
            placeholder="Song title" className="w-full bg-[#F5F3EF] border border-[#D8D4CE] rounded-lg px-3 py-2 text-[#1F1F1F] placeholder-[#8A8480] text-sm focus:outline-none focus:border-[#2F5D62]" />
          <input type="text" value={addArtist} onChange={(e) => setAddArtist(e.target.value)}
            placeholder="Artist name" className="w-full bg-[#F5F3EF] border border-[#D8D4CE] rounded-lg px-3 py-2 text-[#1F1F1F] placeholder-[#8A8480] text-sm focus:outline-none focus:border-[#2F5D62]" />
          {addError && <p className="text-red-500 text-xs">{addError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} disabled={adding}
              className="flex-1 bg-[#2F5D62] hover:bg-[#245059] disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
              {adding ? "Adding..." : "Add Song"}
            </button>
            <button type="button" onClick={() => { setShowAddForm(false); setAddError(""); }}
              className="px-4 text-sm text-[#6B6560] hover:text-[#1F1F1F] border border-[#D8D4CE] rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
