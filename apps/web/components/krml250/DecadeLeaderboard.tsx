"use client";

import type { DecadeEntry } from "@/lib/api";

interface Props { entries: DecadeEntry[]; }

export function DecadeLeaderboard({ entries }: Props) {
  const sorted = [...entries].sort((a, b) => b.nomination_count - a.nomination_count);
  return (
    <div className="space-y-3">
      {sorted.map((entry) => (
        <div key={entry.decade} className="bg-white border border-[#D8D4CE] rounded-xl p-4 hover:border-[#C9A66B] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif font-bold text-[#2F5D62] text-lg">{entry.decade}</h3>
            <div className="text-right">
              <div className="text-[#1F1F1F] text-sm">{entry.song_count} <span className="text-[#8A8480]">songs</span></div>
              <div className="text-[#8A8480] text-xs">{entry.nomination_count} nominations</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {entry.top_songs.map((song) => (
              <span key={song.id} className="text-xs bg-[#F5F3EF] text-[#6B6560] border border-[#D8D4CE] px-2 py-1 rounded-full">
                {song.canonical_title}
              </span>
            ))}
          </div>
        </div>
      ))}
      {entries.length === 0 && <div className="text-center py-8 text-[#8A8480]">No decade data yet.</div>}
    </div>
  );
}
