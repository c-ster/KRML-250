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
    <div className="bg-white border border-[#D8D4CE] rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
      <div className="text-center">
        <div className="font-serif text-2xl font-bold text-[#1F1F1F] leading-tight">{song.canonical_title}</div>
        <div className="text-[#2F5D62] text-lg mt-1">{song.canonical_artist}</div>
        <div className="flex justify-center gap-3 mt-2 text-sm text-[#8A8480]">
          {song.decade && <span>{song.decade}</span>}
          {song.release_year && <span>({song.release_year})</span>}
          {song.aaa_fit_score && <span className="text-[#C9A66B]">AAA fit: {song.aaa_fit_score}/10</span>}
        </div>
        {song.dj_pick && (
          <span className="inline-block mt-2 px-3 py-1 bg-[#C9A66B]/15 text-[#B8924A] text-xs rounded-full border border-[#C9A66B]/40">⭐ DJ Pick</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => onVote("yes")} disabled={loading}
          className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl bg-[#E8F4F0] border border-[#2F5D62]/30 hover:bg-[#D0EBE5] hover:border-[#2F5D62] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="text-3xl">👍</span>
          <span className="text-[#2F5D62] text-sm font-medium">Yes</span>
        </button>
        <button onClick={() => onVote("unknown")} disabled={loading}
          className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl bg-[#F5F3EF] border border-[#D8D4CE] hover:bg-[#E8E5E0] hover:border-[#B8B0A8] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="text-3xl">🤷</span>
          <span className="text-[#6B6560] text-sm font-medium">Unsure</span>
        </button>
        <button onClick={() => onVote("no")} disabled={loading}
          className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="text-3xl">👎</span>
          <span className="text-red-500 text-sm font-medium">No</span>
        </button>
      </div>
      <button onClick={onDefend} disabled={loading}
        className="w-full py-3 border border-[#C9A66B]/50 text-[#B8924A] rounded-xl hover:bg-[#C9A66B]/10 transition-colors text-sm font-medium disabled:opacity-50">
        ✍️ Write a Defense
      </button>
    </div>
  );
}
