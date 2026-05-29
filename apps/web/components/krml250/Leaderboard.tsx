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
      {title && <h2 className="text-xl font-bold text-zinc-100 mb-4">{title}</h2>}
      <div className="space-y-2">
        {displayed.map((entry, index) => (
          <div key={entry.song.id} className="flex items-center gap-4 bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 hover:border-zinc-600 transition-colors">
            <div className="w-8 text-center flex-shrink-0">
              {entry.rank !== null ? <span className="text-amber-400 font-bold text-lg">#{entry.rank}</span> : <span className="text-zinc-600 text-sm font-bold">{index + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-zinc-100 font-medium truncate">{entry.song.canonical_title}</div>
              <div className="text-zinc-400 text-sm truncate">{entry.song.canonical_artist}{entry.song.decade && <span className="ml-2 text-zinc-600">· {entry.song.decade}</span>}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {entry.song.dj_pick && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">DJ</span>}
              {entry.song.krml_seeded && <span className="text-xs bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">KRML</span>}
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-zinc-300 text-sm">{entry.nomination_count} <span className="text-zinc-500">noms</span></div>
              {showScores && <div className="text-amber-500 text-xs">{(entry.score * 100).toFixed(1)}pts</div>}
            </div>
          </div>
        ))}
      </div>
      {displayed.length === 0 && <div className="text-center py-8 text-zinc-500">No songs yet — be the first to nominate!</div>}
    </div>
  );
}
