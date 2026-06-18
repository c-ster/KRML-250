import Link from "next/link";
import Image from "next/image";
import { Countdown } from "@/components/krml250/Countdown";
import { Leaderboard } from "@/components/krml250/Leaderboard";
import { TownLeaderboard } from "@/components/krml250/TownLeaderboard";
import { DecadeLeaderboard } from "@/components/krml250/DecadeLeaderboard";
import { DJPicks } from "@/components/krml250/DJPicks";
import { type LeaderboardSong, type TownEntry, type DecadeEntry, type Song } from "@/lib/api";

async function getData() {
  try {
    const [songs, towns, decades, djPicks] = await Promise.allSettled([
      fetch(`${process.env.API_URL ?? "http://localhost:8000"}/api/v1/leaderboard/songs?per_page=10`, { next: { revalidate: 60 } }).then(r => r.json()),
      fetch(`${process.env.API_URL ?? "http://localhost:8000"}/api/v1/leaderboard/towns`, { next: { revalidate: 60 } }).then(r => r.json()),
      fetch(`${process.env.API_URL ?? "http://localhost:8000"}/api/v1/leaderboard/decades`, { next: { revalidate: 60 } }).then(r => r.json()),
      fetch(`${process.env.API_URL ?? "http://localhost:8000"}/api/v1/leaderboard/dj-picks`, { next: { revalidate: 60 } }).then(r => r.json()),
    ]);
    return {
      songs: songs.status === "fulfilled" && Array.isArray(songs.value) ? (songs.value as LeaderboardSong[]) : [],
      towns: towns.status === "fulfilled" && Array.isArray(towns.value) ? (towns.value as TownEntry[]) : [],
      decades: decades.status === "fulfilled" && Array.isArray(decades.value) ? (decades.value as DecadeEntry[]) : [],
      djPicks: djPicks.status === "fulfilled" && Array.isArray(djPicks.value) ? (djPicks.value as Song[]) : [],
    };
  } catch {
    return { songs: [], towns: [], decades: [], djPicks: [] };
  }
}

export default async function LandingPage() {
  const { songs, towns, decades, djPicks } = await getData();

  return (
    <main className="min-h-screen bg-[#F5F3EF]">
      <nav className="border-b border-[#D8D4CE] bg-[#F5F3EF]/95 backdrop-blur-sm sticky top-0 z-10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/250" className="flex items-center gap-2">
            <Image src="/krml-logo.png" alt="KRML 94.7" width={36} height={36} className="rounded-full" />
            <span className="font-serif font-bold text-lg text-[#1F1F1F] tracking-tight">KRML 250</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/250/towns" className="text-[#6B6560] hover:text-[#1F1F1F] transition-colors">Towns</Link>
            <Link href="/250/decades" className="text-[#6B6560] hover:text-[#1F1F1F] transition-colors">Decades</Link>
            <Link href="/250/rules" className="text-[#6B6560] hover:text-[#1F1F1F] transition-colors">Rules</Link>
            <Link href="/250/verify" className="bg-[#2F5D62] hover:bg-[#245059] text-white font-semibold px-4 py-2 rounded-lg transition-colors">Sign In</Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[560px] flex items-center justify-center text-center overflow-hidden">
        {/* Hero background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero.jpg')" }}
        />
        {/* Gradient screen — warm sand overlay to keep text readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1F1F1F]/40 via-[#1F1F1F]/30 to-[#F5F3EF]" />
        {/* Content */}
        <div className="relative z-10 px-4 py-20 max-w-3xl mx-auto">
          <div className="flex justify-center mb-4">
            <Image src="/krml-logo.png" alt="KRML 94.7" width={80} height={80} className="rounded-full opacity-90 drop-shadow-lg" />
          </div>
          <div className="text-[#E2C48A] text-xs font-semibold uppercase tracking-widest mb-3 drop-shadow">KRML Radio presents</div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight mb-4 drop-shadow-lg">
            What does the<br /><span className="text-[#E2C48A]">Monterey Bay</span><br />sound like?
          </h1>
          <p className="text-white/80 text-lg mb-2 drop-shadow">KRML 250 is a listener-driven campaign to find the 250 songs that define our stretch of California coast.</p>
          <p className="text-white/60 text-base mb-10 drop-shadow">Submit your three songs, swipe-vote the nominations, write a defense, and predict the Top 5. The results reveal on July 3, 2026.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/250/submit" className="bg-[#2F5D62] hover:bg-[#245059] text-white font-bold px-6 py-4 rounded-xl text-lg transition-colors shadow-lg">🎵 Submit Your Three Songs</Link>
            <Link href="/250/swipe" className="bg-white/90 hover:bg-white border border-white/50 text-[#1F1F1F] font-semibold px-6 py-4 rounded-xl text-lg transition-colors shadow-lg">👆 Swipe the Bay</Link>
            <Link href="/250/predict" className="bg-white/90 hover:bg-white border border-white/50 text-[#1F1F1F] font-semibold px-6 py-4 rounded-xl text-lg transition-colors shadow-lg">🔮 Predict the Top 5</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[#D8D4CE] py-10 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[#6B6560] text-xs uppercase tracking-widest mb-6">Countdown to the reveal</h2>
          <Countdown />
        </div>
      </section>

      <section className="border-t border-[#D8D4CE] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Leaderboard songs={songs} title="Top Songs So Far" limit={10} />
          {songs.length > 0 && <div className="text-center mt-6"><p className="text-[#8A8480] text-sm">Final rankings hidden until July 3, 2026</p></div>}
        </div>
      </section>

      {towns.length > 0 && (
        <section className="border-t border-[#D8D4CE] py-12 px-4 bg-white">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-serif text-xl font-bold text-[#1F1F1F] mb-4">🌊 Songs by Town</h2>
            <TownLeaderboard entries={towns.slice(0, 5)} />
            <div className="text-center mt-4"><Link href="/250/towns" className="text-[#2F5D62] hover:text-[#1F1F1F] text-sm">See all towns →</Link></div>
          </div>
        </section>
      )}

      {decades.length > 0 && (
        <section className="border-t border-[#D8D4CE] py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-serif text-xl font-bold text-[#1F1F1F] mb-4">📻 Songs by Decade</h2>
            <DecadeLeaderboard entries={decades.slice(0, 4)} />
            <div className="text-center mt-4"><Link href="/250/decades" className="text-[#2F5D62] hover:text-[#1F1F1F] text-sm">See all decades →</Link></div>
          </div>
        </section>
      )}

      {djPicks.length > 0 && (
        <section className="border-t border-[#D8D4CE] py-12 px-4 bg-white">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-serif text-xl font-bold text-[#1F1F1F] mb-2">🎙️ DJ & KRML Picks</h2>
            <p className="text-[#6B6560] text-sm mb-4">Songs selected by the KRML team</p>
            <DJPicks songs={djPicks} />
          </div>
        </section>
      )}

      <section className="border-t border-[#D8D4CE] py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-xl font-bold text-[#1F1F1F] mb-3">How does it work?</h2>
          <div className="grid sm:grid-cols-3 gap-6 text-left mt-6">
            <div className="bg-white border border-[#D8D4CE] rounded-xl p-5">
              <div className="text-3xl mb-2">🎵</div>
              <h3 className="font-semibold text-[#1F1F1F] mb-1">1. Submit</h3>
              <p className="text-[#6B6560] text-sm">Verify your email and pick three songs that represent the Monterey Bay.</p>
            </div>
            <div className="bg-white border border-[#D8D4CE] rounded-xl p-5">
              <div className="text-3xl mb-2">👆</div>
              <h3 className="font-semibold text-[#1F1F1F] mb-1">2. Vote</h3>
              <p className="text-[#6B6560] text-sm">Swipe through nominations — thumbs up or down. Your votes shape the list.</p>
            </div>
            <div className="bg-white border border-[#D8D4CE] rounded-xl p-5">
              <div className="text-3xl mb-2">🔮</div>
              <h3 className="font-semibold text-[#1F1F1F] mb-1">3. Predict</h3>
              <p className="text-[#6B6560] text-sm">Guess the Top 5 for a chance to win a limited-edition KRML hoodie.</p>
            </div>
          </div>
          <div className="mt-6"><Link href="/250/rules" className="text-[#2F5D62] hover:text-[#1F1F1F] text-sm underline">Read the official rules →</Link></div>
        </div>
      </section>

      <footer className="border-t border-[#D8D4CE] bg-white py-8 px-4 text-center text-[#8A8480] text-sm">
        <div className="flex justify-center mb-3">
          <Image src="/krml-logo.png" alt="KRML 94.7" width={48} height={48} className="rounded-full opacity-60" />
        </div>
        <p className="mb-1 font-serif">KRML 250 — The Soundtrack of the Monterey Bay</p>
        <p>© 2026 KRML Radio. Results reveal July 3, 2026.{" "}<Link href="/250/rules" className="text-[#6B6560] hover:text-[#1F1F1F] underline">Official Rules</Link></p>
      </footer>
    </main>
  );
}
