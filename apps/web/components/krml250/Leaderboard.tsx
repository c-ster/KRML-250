"use client";

import type { LeaderboardSong } from "@/lib/api";

interface Props {
  songs: LeaderboardSong[];
  showScores?: boolean;
  title?: string;
  limit?: number;
}

export function Leaderboard({ songs, showScores = false, title = "Top Songs", limit }: Props) {
  const displayed = limit ? songs.slice(0, limit) : songs;

  return (
    <div>
      {title && <h2 className="font-serif text-xl font-bold text-[#1F1F1F] mb-4">{title}</h2>}
      <div className="space-y-2">
        {displayed.map((entry, index) => (
          <div key={entry.song.id} className="flex items-center gap-4 bg-white border border-[#D8D4CE] rounded-xl px-4 py-3 hover:border-[#C9A66B] transition-colors">
            <div className="w-8 text-center flex-shrink-0">
              {entry.rank !== null
                ? <span className="text-[#C9A66B] font-bold text-lg">#{entry.rank}</span>
                : <span className="text-[#8A8480] text-sm font-bold">{index + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[#1F1F1F] font-medium truncate">{entry.song.canonical_title}</div>
              <div className="text-[#6B6560] text-sm truncate">
                {entry.song.canonical_artist}
                {entry.song.decade && <span className="ml-2 text-[#8A8480]">· {entry.song.decade}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {entry.song.dj_pick && <span className="text-xs bg-[#C9A66B]/20 text-[#B8924A] px-2 py-0.5 rounded-full border border-[#C9A66B]/40">DJ</span>}
              {entry.song.krml_seeded && <span className="text-xs bg-[#2F5D62]/10 text-[#2F5D62] px-2 py-0.5 rounded-full border border-[#2F5D62]/20">KRML</span>}
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-[#6B6560] text-sm">{entry.nomination_count} <span className="text-[#8A8480]">noms</span></div>
              {showScores && <div className="text-[#C9A66B] text-xs">{(entry.score * 100).toFixed(1)}pts</div>}
            </div>
          </div>
        ))}
      </div>
      {displayed.length === 0 && <div className="text-center py-8 text-[#8A8480]">No songs yet — be the first to nominate!</div>}
    </div>
  );
}
