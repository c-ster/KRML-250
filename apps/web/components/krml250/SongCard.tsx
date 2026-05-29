"use client";

import type { Song } from "@/lib/api";

interface Props {
  song: Song;
  onVote: (vote: "yes" | "no" | "unknown") => void;
  onDefend: () => void;
  loading?: boolean;
}

export function SongCard({ song, onVote, onDefend, loading = false }: Props) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 flex flex-col gap-5 shadow-xl">
      <div className="text-center">
        <div className="text-2xl font-bold text-zinc-100 leading-tight">{song.canonical_title}</div>
        <div className="text-amber-400 text-lg mt-1">{song.canonical_artist}</div>
        <div className="flex justify-center gap-3 mt-2 text-sm text-zinc-500">
          {song.decade && <span>{song.decade}</span>}
          {song.release_year && <span>({song.release_year})</span>}
          {song.aaa_fit_score && <span className="text-amber-600">AAA fit: {song.aaa_fit_score}/10</span>}
        </div>
        {song.dj_pick && <span className="inline-block mt-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">⭐ DJ Pick</span>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => onVote("yes")} disabled={loading} className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl bg-green-900/40 border border-green-700/50 hover:bg-green-800/60 hover:border-green-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="text-3xl">👍</span><span className="text-green-400 text-sm font-medium">Yes</span>
        </button>
        <button onClick={() => onVote("unknown")} disabled={loading} className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl bg-zinc-700/40 border border-zinc-600/50 hover:bg-zinc-600/60 hover:border-zinc-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="text-3xl">🤷</span><span className="text-zinc-400 text-sm font-medium">Unsure</span>
        </button>
        <button onClick={() => onVote("no")} disabled={loading} className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl bg-red-900/40 border border-red-700/50 hover:bg-red-800/60 hover:border-red-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="text-3xl">👎</span><span className="text-red-400 text-sm font-medium">No</span>
        </button>
      </div>
      <button onClick={onDefend} disabled={loading} className="w-full py-3 border border-amber-500/40 text-amber-400 rounded-xl hover:bg-amber-500/10 transition-colors text-sm font-medium disabled:opacity-50">
        ✍️ Write a Defense
      </button>
    </div>
  );
}
