"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SongAutocomplete } from "@/components/krml250/SongAutocomplete";
import { submissionsApi, type SongSearchResult } from "@/lib/api";
import { useParticipantSession } from "@/hooks/useParticipantSession";

const DECADES = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
const TOWNS = [
  { value: "monterey", label: "Monterey" },
  { value: "carmel", label: "Carmel-by-the-Sea" },
  { value: "pacific_grove", label: "Pacific Grove" },
  { value: "seaside", label: "Seaside" },
  { value: "marina", label: "Marina" },
  { value: "salinas", label: "Salinas" },
  { value: "santa_cruz", label: "Santa Cruz" },
  { value: "watsonville", label: "Watsonville" },
  { value: "castroville", label: "Castroville" },
  { value: "other", label: "Other" },
];

interface SlotState {
  song: SongSearchResult | null;
  why_text: string;
  town_tag: string;
  decade_tag: string;
}

const emptySlot = (): SlotState => ({ song: null, why_text: "", town_tag: "", decade_tag: "" });

export default function SubmitPage() {
  const router = useRouter();
  const { participant, loading } = useParticipantSession();
  const [slots, setSlots] = useState<SlotState[]>([emptySlot(), emptySlot(), emptySlot()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !participant) router.push("/250/verify?redirect=/250/submit");
  }, [participant, loading, router]);

  function updateSlot(index: number, update: Partial<SlotState>) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...update } : s)));
  }

  function validate(): string | null {
    if (slots.some((s) => !s.song)) return "Please select a song for each of the 3 slots.";
    const ids = slots.map((s) => s.song!.id);
    if (new Set(ids).size !== 3) return "All 3 songs must be different.";
    if (slots.some((s) => !s.why_text.trim())) return "Please explain why you chose each song.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setSubmitting(true);
    try {
      await submissionsApi.submit(slots.map((s) => ({ song_id: s.song!.id, why_text: s.why_text, town_tag: s.town_tag || undefined, decade_tag: s.decade_tag || undefined })));
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
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-3">Submission Received!</h1>
          <p className="text-zinc-400 mb-2">Your three songs are in. Now go vote and write defenses!</p>
          <div className="flex flex-col gap-3 mt-6">
            <Link href="/250/swipe" className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold px-6 py-3 rounded-xl transition-colors">Start Swiping →</Link>
            <Link href="/250" className="text-zinc-400 hover:text-zinc-300 text-sm">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6"><Link href="/250" className="text-zinc-500 hover:text-zinc-300 text-sm">← Back to KRML 250</Link></div>
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">Submit Your Three Songs</h1>
        <p className="text-zinc-400 mb-8">Welcome, <span className="text-amber-400">{participant?.name}</span>! Pick 3 songs that represent the sound of the Monterey Bay.</p>
        <form onSubmit={handleSubmit} className="space-y-8">
          {slots.map((slot, index) => (
            <div key={index} className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-amber-400">Song {index + 1}</h2>
              <SongAutocomplete value={slot.song} onChange={(song) => updateSlot(index, { song })} label="Song Title & Artist" placeholder="Search for a song..." />
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Why this song? <span className="text-zinc-500">(required)</span></label>
                <textarea required value={slot.why_text} onChange={(e) => updateSlot(index, { why_text: e.target.value })} rows={3} maxLength={500} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none" placeholder="Tell us why this song represents the Monterey Bay..." />
                <div className="text-right text-xs text-zinc-600 mt-1">{slot.why_text.length}/500</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select value={slot.town_tag} onChange={(e) => updateSlot(index, { town_tag: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500">
                  <option value="">Any town</option>
                  {TOWNS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select value={slot.decade_tag} onChange={(e) => updateSlot(index, { decade_tag: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500">
                  <option value="">Any decade</option>
                  {DECADES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          ))}
          {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <button type="submit" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 font-bold py-4 rounded-xl text-lg transition-colors">
            {submitting ? "Submitting..." : "Submit My Three Songs"}
          </button>
        </form>
      </div>
    </div>
  );
}
