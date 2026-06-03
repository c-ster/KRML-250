"use client";

import type { Song } from "@/lib/api";

interface Props { songs: Song[]; }

export function DJPicks({ songs }: Props) {
  if (songs.length === 0) return <div className="text-center py-6 text-[#8A8480]">No DJ picks announced yet.</div>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {songs.map((song) => (
        <div key={song.id} className="flex items-center gap-3 bg-[#F5F3EF] border border-[#C9A66B]/40 rounded-xl px-4 py-3 hover:border-[#C9A66B] transition-colors">
          <span className="text-2xl">🎙️</span>
          <div>
            <div className="text-[#1F1F1F] font-medium">{song.canonical_title}</div>
            <div className="text-[#C9A66B] text-sm">{song.canonical_artist}</div>
            {song.decade && <div className="text-[#8A8480] text-xs">{song.decade}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
