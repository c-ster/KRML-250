import Link from "next/link";
import { DecadeLeaderboard } from "@/components/krml250/DecadeLeaderboard";
import type { DecadeEntry } from "@/lib/api";

async function getDecades(): Promise<DecadeEntry[]> {
  try {
    const res = await fetch(`${process.env.API_URL ?? "http://localhost:8000"}/api/v1/leaderboard/decades`, { next: { revalidate: 60 } });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export default async function DecadesPage() {
  const decades = await getDecades();
  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6"><Link href="/250" className="text-zinc-500 hover:text-zinc-300 text-sm">← Back to KRML 250</Link></div>
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">📻 Songs by Decade</h1>
        <p className="text-zinc-400 mb-8">Explore nominations across every era of music.</p>
        <DecadeLeaderboard entries={decades} />
      </div>
    </div>
  );
}
