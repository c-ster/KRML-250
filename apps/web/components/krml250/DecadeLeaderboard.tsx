"use client";

import type { DecadeEntry } from "@/lib/api";

interface Props { entries: DecadeEntry[]; }

export function DecadeLeaderboard({ entries }: Props) {
  const sorted = [...entries].sort((a, b) => b.nomination_count - a.nomination_count);
  return (
    <div className="space-y-3">
      {sorted.map((entry) => (
        <div key={entry.decade} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-amber-400 text-lg">{entry.decade}</h3>
            <div className="text-right">
              <div className="text-zinc-300 text-sm">{entry.song_count} <span className="text-zinc-500">songs</span></div>
              <div className="text-zinc-500 text-xs">{entry.nomination_count} nominations</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {entry.top_songs.map((song) => <span key={song.id} className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full">{song.canonical_title}</span>)}
          </div>
        </div>
      ))}
      {entries.length === 0 && <div className="text-center py-8 text-zinc-500">No decade data yet.</div>}
    </div>
  );
}
