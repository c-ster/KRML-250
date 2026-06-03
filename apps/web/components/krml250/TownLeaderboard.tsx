"use client";

import type { TownEntry } from "@/lib/api";

const TOWN_LABELS: Record<string, string> = { monterey: "Monterey", carmel: "Carmel-by-the-Sea", pacific_grove: "Pacific Grove", seaside: "Seaside", marina: "Marina", salinas: "Salinas", santa_cruz: "Santa Cruz", watsonville: "Watsonville", castroville: "Castroville", other: "Other" };

interface Props { entries: TownEntry[]; }

export function TownLeaderboard({ entries }: Props) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.town} className="bg-white border border-[#D8D4CE] rounded-xl p-4 hover:border-[#C9A66B] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-[#1F1F1F]">{TOWN_LABELS[entry.town] ?? entry.town}</h3>
            <span className="text-[#C9A66B] text-sm font-medium">{entry.nomination_count} nominations</span>
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
      {entries.length === 0 && <div className="text-center py-8 text-[#8A8480]">No town data yet.</div>}
    </div>
  );
}
