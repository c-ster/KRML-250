"use client";

import type { Sponsor } from "@/lib/api";

interface Props { placementType: string; sponsors?: Sponsor[]; }

export function SponsorPlacement({ placementType, sponsors = [] }: Props) {
  const active = sponsors.filter((s) => s.active && s.placement_type === placementType && (!s.starts_at || new Date(s.starts_at) <= new Date()) && (!s.ends_at || new Date(s.ends_at) >= new Date()));
  if (active.length === 0) return null;
  return (
    <div className="border-t border-zinc-800 pt-4 mt-4">
      <p className="text-zinc-600 text-xs uppercase tracking-widest mb-3 text-center">Presented by</p>
      <div className="flex flex-wrap justify-center gap-6 items-center">
        {active.map((sponsor) => (
          <div key={sponsor.id}>
            {sponsor.link_url ? (
              <a href={sponsor.link_url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity"><SponsorContent sponsor={sponsor} /></a>
            ) : <SponsorContent sponsor={sponsor} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function SponsorContent({ sponsor }: { sponsor: Sponsor }) {
  if (sponsor.image_url) return <img src={sponsor.image_url} alt={sponsor.sponsor_name} className="h-10 object-contain filter brightness-75 hover:brightness-100 transition-all" />;
  return <span className="text-zinc-400 font-medium text-sm hover:text-zinc-200 transition-colors">{sponsor.sponsor_name}</span>;
}
