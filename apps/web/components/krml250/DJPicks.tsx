"use client";

import type { Song } from "@/lib/api";

interface Props { songs: Song[]; }

export function DJPicks({ songs }: Props) {
  if (songs.length === 0) return <div className="text-center py-6 text-zinc-500">No DJ picks announced yet.</div>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {songs.map((song) => (
        <div key={song.id} className="flex items-center gap-3 bg-zinc-800/60 border border-amber-500/20 rounded-xl px-4 py-3">
          <span className="text-2xl">🎙️</span>
          <div>
            <div className="text-zinc-100 font-medium">{song.canonical_title}</div>
            <div className="text-amber-400 text-sm">{song.canonical_artist}</div>
            {song.decade && <div className="text-zinc-500 text-xs">{song.decade}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
