import Link from "next/link";

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6"><Link href="/250" className="text-zinc-500 hover:text-zinc-300 text-sm">← Back to KRML 250</Link></div>
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">Official Rules</h1>
        <p className="text-zinc-400 mb-8">KRML 250 — The Soundtrack of the Monterey Bay</p>
        <div className="prose prose-invert max-w-none space-y-8 text-zinc-300">
          <section>
            <h2 className="text-xl font-bold text-amber-400 mb-3">1. Eligibility</h2>
            <p>KRML 250 is open to residents of the Monterey Bay region including Monterey, Carmel, Pacific Grove, Seaside, Marina, Salinas, Santa Cruz, Watsonville, Castroville, and surrounding communities. Participants must be 13 years of age or older. One submission per email address.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-amber-400 mb-3">2. How to Participate</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Step 1: Register.</strong> Provide your name, email address, and town of residence. Verify your email via the link we send.</li>
              <li><strong>Step 2: Submit.</strong> Once verified, nominate exactly 3 songs. Each nomination requires a written explanation.</li>
              <li><strong>Step 3: Vote.</strong> Use the swipe interface to vote Yes, No, or Unsure on other songs.</li>
              <li><strong>Step 4: Defend.</strong> Write a public defense (up to 500 characters) for any song you feel strongly about.</li>
              <li><strong>Step 5: Predict.</strong> Before July 3, 2026, guess the Top 5 songs in order for a chance to win a prize.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold text-amber-400 mb-3">3. Song Selection</h2>
            <p>Songs must be real, commercially released recordings. There is no restriction on genre, era, or artist origin — but your explanation should connect the song to the Monterey Bay experience.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-amber-400 mb-3">4. Ranking Methodology</h2>
            <p>The final KRML 250 list is determined by a weighted scoring system combining:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Nomination count</strong> (40%)</li>
              <li><strong>Swipe votes</strong> (25%)</li>
              <li><strong>Editorial score</strong> (15%)</li>
              <li><strong>Defense quality</strong> (10%)</li>
              <li><strong>Diversity balance</strong> (10%)</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold text-amber-400 mb-3">5. Editing Submissions</h2>
            <p>Each participant may change one of their three nominated songs, one time only, before nominations close.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-amber-400 mb-3">6. Prediction Contest</h2>
            <p>Participants who correctly predict the Top 5 songs in exact order will be eligible for the grand prize: a limited-edition KRML 250 hoodie. Prize has no cash value and is not transferable.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-amber-400 mb-3">7. Reveal Date</h2>
            <p>The KRML 250 list will be revealed on <strong className="text-amber-400">July 3, 2026</strong>, on-air and at KRML.com.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-amber-400 mb-3">8. Privacy</h2>
            <p>Your name and submitted songs may be published publicly as part of the campaign. Your email address will not be shared with third parties.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-amber-400 mb-3">9. Modifications</h2>
            <p>KRML reserves the right to modify these rules at any time. Continued participation after any change constitutes acceptance of the updated rules.</p>
          </section>
        </div>
        <div className="mt-10 text-center">
          <Link href="/250/verify" className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold px-6 py-3 rounded-xl transition-colors">I Agree — Let Me Submit My Songs</Link>
        </div>
      </div>
    </div>
  );
}
