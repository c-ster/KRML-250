"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SongAutocomplete } from "@/components/krml250/SongAutocomplete";
import { predictionsApi, type SongSearchResult } from "@/lib/api";
import { useParticipantSession } from "@/hooks/useParticipantSession";

export default function PredictPage() {
  const router = useRouter();
  const { participant, loading } = useParticipantSession();
  const [picks, setPicks] = useState<(SongSearchResult | null)[]>([null, null, null, null, null]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [existing, setExisting] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && !participant) router.push("/250/verify?redirect=/250/predict");
  }, [participant, loading, router]);

  useEffect(() => {
    if (!participant) return;
    predictionsApi.mine().then(() => setExisting(true)).catch(() => {});
  }, [participant]);

  function updatePick(index: number, song: SongSearchResult | null) {
    setPicks((prev) => prev.map((p, i) => (i === index ? song : p)));
  }

  function validate(): string | null {
    if (picks.some((p) => !p)) return "Please select a song for each of the 5 spots.";
    const ids = picks.filter(Boolean).map((p) => p!.id);
    if (new Set(ids).size !== 5) return "All 5 predictions must be different songs.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setSubmitting(true);
    try {
      const ids = picks.map((p) => p!.id) as [string, string, string, string, string];
      if (existing) await predictionsApi.update(ids);
      else await predictionsApi.submit(ids);
      setDone(true);
    } catch (err: any) {
      setError(err?.detail || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="min-h-screen bg-zinc-900 flex items-center justify-center"><p className="text-zinc-400 animate-pulse">Loading...</p></div>;

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔮</div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-3">Prediction Locked In!</h1>
          <p className="text-zinc-400 mb-2">Your Top 5 prediction is saved. You can update it any time before July 3, 2026.</p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-amber-300 text-sm">
            🎁 If your Top 5 matches the official list, you&apos;ll win a limited-edition KRML 250 hoodie!
          </div>
          <Link href="/250" className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold px-6 py-3 rounded-xl transition-colors">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="mb-6"><Link href="/250" className="text-zinc-500 hover:text-zinc-300 text-sm">← Back to KRML 250</Link></div>
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">Predict the Top 5</h1>
        <p className="text-zinc-400 mb-2">{existing ? "Update your prediction" : "Guess the five songs that will top the KRML 250 list"}. Match all 5 in order and win a hoodie!</p>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-300 text-sm mb-8">
          🎁 Correct predictions revealed July 3, 2026. You can update until then.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {picks.map((pick, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0 mt-9">{index + 1}</div>
              <div className="flex-1">
                <SongAutocomplete value={pick} onChange={(song) => updatePick(index, song)} label={`#${index + 1} Pick`} placeholder="Search for a song..." />
              </div>
            </div>
          ))}
          {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <button type="submit" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 font-bold py-4 rounded-xl text-lg transition-colors mt-4">
            {submitting ? "Saving..." : existing ? "Update My Prediction" : "Submit My Top 5 Prediction"}
          </button>
        </form>
      </div>
    </div>
  );
}
