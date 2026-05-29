import Link from "next/link";
import { Countdown } from "@/components/krml250/Countdown";
import { Leaderboard } from "@/components/krml250/Leaderboard";
import { TownLeaderboard } from "@/components/krml250/TownLeaderboard";
import { DecadeLeaderboard } from "@/components/krml250/DecadeLeaderboard";
import { DJPicks } from "@/components/krml250/DJPicks";
import { leaderboardApi, type LeaderboardSong, type TownEntry, type DecadeEntry, type Song } from "@/lib/api";

async function getData() {
  try {
    const [songs, towns, decades, djPicks] = await Promise.allSettled([
      fetch(`${process.env.API_URL ?? "http://localhost:8000"}/api/v1/leaderboard/songs?per_page=10`, { next: { revalidate: 60 } }).then(r => r.json()),
      fetch(`${process.env.API_URL ?? "http://localhost:8000"}/api/v1/leaderboard/towns`, { next: { revalidate: 60 } }).then(r => r.json()),
      fetch(`${process.env.API_URL ?? "http://localhost:8000"}/api/v1/leaderboard/decades`, { next: { revalidate: 60 } }).then(r => r.json()),
      fetch(`${process.env.API_URL ?? "http://localhost:8000"}/api/v1/leaderboard/dj-picks`, { next: { revalidate: 60 } }).then(r => r.json()),
    ]);
    return {
      songs: songs.status === "fulfilled" ? (songs.value as LeaderboardSong[]) : [],
      towns: towns.status === "fulfilled" ? (towns.value as TownEntry[]) : [],
      decades: decades.status === "fulfilled" ? (decades.value as DecadeEntry[]) : [],
      djPicks: djPicks.status === "fulfilled" ? (djPicks.value as Song[]) : [],
    };
  } catch {
    return { songs: [], towns: [], decades: [], djPicks: [] };
  }
}

export default async function LandingPage() {
  const { songs, towns, decades, djPicks } = await getData();

  return (
    <main className="min-h-screen bg-zinc-900">
      <nav className="border-b border-zinc-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/250" className="text-amber-400 font-bold text-lg tracking-tight">KRML 250</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/250/towns" className="text-zinc-400 hover:text-zinc-100 transition-colors">Towns</Link>
            <Link href="/250/decades" className="text-zinc-400 hover:text-zinc-100 transition-colors">Decades</Link>
            <Link href="/250/rules" className="text-zinc-400 hover:text-zinc-100 transition-colors">Rules</Link>
            <Link href="/250/verify" className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold px-4 py-2 rounded-lg transition-colors">Sign In</Link>
          </div>
        </div>
      </nav>

      <section className="px-4 py-16 text-center max-w-3xl mx-auto">
        <div className="text-amber-500 text-sm font-semibold uppercase tracking-widest mb-3">KRML Radio presents</div>
        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-100 leading-tight mb-4">
          What does the<br /><span className="text-amber-400">Monterey Bay</span><br />sound like?
        </h1>
        <p className="text-zinc-400 text-lg mb-2">KRML 250 is a listener-driven campaign to find the 250 songs that define our stretch of California coast.</p>
        <p className="text-zinc-500 text-base mb-10">Submit your three songs, swipe-vote the nominations, write a defense, and predict the Top 5. The results reveal on July 3, 2026.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/250/submit" className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold px-6 py-4 rounded-xl text-lg transition-colors">🎵 Submit Your Three Songs</Link>
          <Link href="/250/swipe" className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-semibold px-6 py-4 rounded-xl text-lg transition-colors">👆 Swipe the Bay</Link>
          <Link href="/250/predict" className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-semibold px-6 py-4 rounded-xl text-lg transition-colors">🔮 Predict the Top 5</Link>
        </div>
      </section>

      <section className="border-t border-zinc-800 py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-zinc-400 text-sm uppercase tracking-widest mb-6">Countdown to the reveal</h2>
          <Countdown />
        </div>
      </section>

      <section className="border-t border-zinc-800 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Leaderboard songs={songs} title="Top Songs So Far" limit={10} />
          {songs.length > 0 && <div className="text-center mt-6"><p className="text-zinc-500 text-sm">Final rankings hidden until July 3, 2026</p></div>}
        </div>
      </section>

      {towns.length > 0 && (
        <section className="border-t border-zinc-800 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">🌊 Songs by Town</h2>
            <TownLeaderboard entries={towns.slice(0, 5)} />
            <div className="text-center mt-4"><Link href="/250/towns" className="text-amber-400 hover:text-amber-300 text-sm">See all towns →</Link></div>
          </div>
        </section>
      )}

      {decades.length > 0 && (
        <section className="border-t border-zinc-800 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">📻 Songs by Decade</h2>
            <DecadeLeaderboard entries={decades.slice(0, 4)} />
            <div className="text-center mt-4"><Link href="/250/decades" className="text-amber-400 hover:text-amber-300 text-sm">See all decades →</Link></div>
          </div>
        </section>
      )}

      {djPicks.length > 0 && (
        <section className="border-t border-zinc-800 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-zinc-100 mb-2">🎙️ DJ & KRML Picks</h2>
            <p className="text-zinc-500 text-sm mb-4">Songs selected by the KRML team</p>
            <DJPicks songs={djPicks} />
          </div>
        </section>
      )}

      <section className="border-t border-zinc-800 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold text-zinc-100 mb-3">How does it work?</h2>
          <div className="grid sm:grid-cols-3 gap-6 text-left mt-6">
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5">
              <div className="text-3xl mb-2">🎵</div>
              <h3 className="font-semibold text-zinc-100 mb-1">1. Submit</h3>
              <p className="text-zinc-400 text-sm">Verify your email and pick three songs that represent the Monterey Bay.</p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5">
              <div className="text-3xl mb-2">👆</div>
              <h3 className="font-semibold text-zinc-100 mb-1">2. Vote</h3>
              <p className="text-zinc-400 text-sm">Swipe through nominations — thumbs up or down. Your votes shape the list.</p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5">
              <div className="text-3xl mb-2">🔮</div>
              <h3 className="font-semibold text-zinc-100 mb-1">3. Predict</h3>
              <p className="text-zinc-400 text-sm">Guess the Top 5 for a chance to win a limited-edition KRML hoodie.</p>
            </div>
          </div>
          <div className="mt-6"><Link href="/250/rules" className="text-amber-400 hover:text-amber-300 text-sm underline">Read the official rules →</Link></div>
        </div>
      </section>

      <footer className="border-t border-zinc-800 py-8 px-4 text-center text-zinc-600 text-sm">
        <p className="mb-1">KRML 250 — The Soundtrack of the Monterey Bay</p>
        <p>© 2026 KRML Radio. Results reveal July 3, 2026.{" "}<Link href="/250/rules" className="text-zinc-500 hover:text-zinc-400 underline">Official Rules</Link></p>
      </footer>
    </main>
  );
}
