import Link from "next/link";
import { TownLeaderboard } from "@/components/krml250/TownLeaderboard";
import type { TownEntry } from "@/lib/api";

async function getTowns(): Promise<TownEntry[]> {
  try {
    const res = await fetch(`${process.env.API_URL ?? "http://localhost:8000"}/api/v1/leaderboard/towns`, { next: { revalidate: 60 } });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export default async function TownsPage() {
  const towns = await getTowns();
  return (
    <div className="min-h-screen bg-[#F5F3EF] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6"><Link href="/250" className="text-[#6B6560] hover:text-[#1F1F1F] text-sm">← Back to KRML 250</Link></div>
        <h1 className="font-serif text-3xl font-bold text-[#1F1F1F] mb-2">🌊 Songs by Town</h1>
        <p className="text-[#6B6560] mb-8">See which towns are most represented in the KRML 250 nominations.</p>
        <TownLeaderboard entries={towns} />
      </div>
    </div>
  );
}
