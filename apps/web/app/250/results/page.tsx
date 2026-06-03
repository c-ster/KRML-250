import Link from "next/link";
import { Countdown } from "@/components/krml250/Countdown";
import { Leaderboard } from "@/components/krml250/Leaderboard";
import type { LeaderboardSong } from "@/lib/api";

async function getData() {
  const apiUrl = process.env.API_URL ?? "http://localhost:8000";
  try {
    const [settingsRes, songsRes] = await Promise.all([
      fetch(`${apiUrl}/api/v1/admin/campaign-settings`, { headers: { "X-Admin-Token": process.env.ADMIN_SECRET ?? "" }, next: { revalidate: 30 } }),
      fetch(`${apiUrl}/api/v1/leaderboard/songs?per_page=250`, { next: { revalidate: 60 } }),
    ]);
    const settings: Array<{ key: string; value: string }> = settingsRes.ok ? await settingsRes.json() : [];
    const songs: LeaderboardSong[] = songsRes.ok ? await songsRes.json() : [];
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return { resultsPublished: settingsMap.results_published === "true", top5Revealed: settingsMap.top5_revealed === "true", songs };
  } catch {
    return { resultsPublished: false, top5Revealed: false, songs: [] };
  }
}

export default async function ResultsPage() {
  const { resultsPublished, top5Revealed, songs } = await getData();

  if (!resultsPublished) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="text-5xl mb-4">📻</div>
          <h1 className="font-serif text-3xl font-bold text-[#1F1F1F] mb-3">Results Coming July 3, 2026</h1>
          <p className="text-[#6B6560] mb-8">The KRML 250 list hasn&apos;t been announced yet. Check back on reveal day!</p>
          <Countdown />
          <div className="mt-8"><Link href="/250" className="text-[#C9A66B] hover:text-amber-300 text-sm">← Back to KRML 250</Link></div>
        </div>
      </div>
    );
  }

  const top5 = top5Revealed ? songs.slice(0, 5) : null;
  const remaining = top5Revealed ? songs.slice(5) : songs;

  return (
    <div className="min-h-screen bg-[#F5F3EF] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6"><Link href="/250" className="text-[#6B6560] hover:text-[#1F1F1F] text-sm">← Back to KRML 250</Link></div>
        <div className="text-center mb-10">
          <div className="text-[#B8924A] text-sm font-semibold uppercase tracking-widest mb-2">KRML 250 — Official Results</div>
          <h1 className="text-4xl font-bold text-[#1F1F1F] mb-2">The Soundtrack of the Monterey Bay</h1>
          <p className="text-[#6B6560]">Revealed July 3, 2026</p>
        </div>
        {top5 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-[#C9A66B] mb-4 text-center">✨ The Top 5</h2>
            <div className="space-y-3">
              {top5.map((entry) => (
                <div key={entry.song.id} className="flex items-center gap-4 bg-amber-500/10 border border-amber-500/40 rounded-xl px-5 py-4">
                  <span className="text-3xl font-bold text-[#C9A66B] w-10 text-center">#{entry.rank}</span>
                  <div>
                    <div className="text-[#1F1F1F] font-bold text-lg">{entry.song.canonical_title}</div>
                    <div className="text-amber-300">{entry.song.canonical_artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {!top5Revealed && (
          <div className="bg-white border border-[#D8D4CE] rounded-xl p-6 text-center mb-8">
            <div className="text-3xl mb-2">🔒</div>
            <p className="text-zinc-300 font-semibold">Top 5 will be revealed live on July 3</p>
            <p className="text-[#8A8480] text-sm mt-1">Tune in to KRML for the announcement</p>
          </div>
        )}
        <Leaderboard songs={remaining} title="The Full KRML 250" showScores={top5Revealed} />
      </div>
    </div>
  );
}
