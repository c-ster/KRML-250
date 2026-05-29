"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { defensesApi, songsApi, type Song } from "@/lib/api";
import { useParticipantSession } from "@/hooks/useParticipantSession";

interface Props {
  params: { songId: string };
}

export default function DefendPage({ params }: Props) {
  const router = useRouter();
  const { participant, loading } = useParticipantSession();
  const [song, setSong] = useState<Song | null>(null);
  const [defenseText, setDefenseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !participant) router.push(`/250/verify?redirect=/250/defend/${params.songId}`);
  }, [participant, loading, router, params.songId]);

  useEffect(() => {
    songsApi.get(params.songId).then(setSong).catch(() => setError("Song not found."));
  }, [params.songId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!defenseText.trim()) { setError("Please write your defense."); return; }
    setError("");
    setSubmitting(true);
    try {
      await defensesApi.submit(params.songId, defenseText);
      setDone(true);
    } catch (err: any) {
      setError(err?.detail || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !song) return <div className="min-h-screen bg-zinc-900 flex items-center justify-center"><p className="text-zinc-400 animate-pulse">Loading...</p></div>;

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✍️</div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-3">Defense Submitted!</h1>
          <p className="text-zinc-400 mb-2">Your defense for &ldquo;{song.canonical_title}&rdquo; is pending review.</p>
          <p className="text-zinc-500 text-sm mb-6">If approved, it may appear on the leaderboard.</p>
          <div className="flex flex-col gap-3">
            <Link href="/250/swipe" className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold px-6 py-3 rounded-xl transition-colors">Keep Swiping →</Link>
            <Link href="/250" className="text-zinc-400 hover:text-zinc-300 text-sm">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="mb-6"><Link href="/250/swipe" className="text-zinc-500 hover:text-zinc-300 text-sm">← Back to Swipe</Link></div>
        <h1 className="text-3xl font-bold text-zinc-100 mb-1">Write a Defense</h1>
        <p className="text-zinc-400 mb-6">Make the case for why this song belongs on the KRML 250.</p>
        <div className="bg-zinc-800 border border-amber-500/20 rounded-xl px-5 py-4 mb-6">
          <div className="text-xl font-bold text-zinc-100">{song.canonical_title}</div>
          <div className="text-amber-400">{song.canonical_artist}</div>
          {song.decade && <div className="text-zinc-500 text-sm mt-1">{song.decade}</div>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Your defense <span className="text-zinc-500">(max 500 characters)</span></label>
            <textarea required value={defenseText} onChange={(e) => setDefenseText(e.target.value)} rows={5} maxLength={500} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none" placeholder="Why does this song capture the soul of the Monterey Bay? Tell us..." />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>Be specific and passionate.</span>
              <span>{defenseText.length}/500</span>
            </div>
          </div>
          {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <button type="submit" disabled={submitting || defenseText.length < 10} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 font-bold py-4 rounded-xl text-lg transition-colors">
            {submitting ? "Submitting..." : "Submit Defense"}
          </button>
        </form>
      </div>
    </div>
  );
}
