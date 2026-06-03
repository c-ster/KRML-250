"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SongAutocomplete } from "@/components/krml250/SongAutocomplete";
import { submissionsApi, type Submission, type SongSearchResult } from "@/lib/api";
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

export default function EditPage() {
  const router = useRouter();
  const { participant, loading } = useParticipantSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [replaceSlot, setReplaceSlot] = useState<number>(1);
  const [newSong, setNewSong] = useState<SongSearchResult | null>(null);
  const [whyText, setWhyText] = useState("");
  const [townTag, setTownTag] = useState("");
  const [decadeTag, setDecadeTag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !participant) router.push("/250/verify?redirect=/250/edit");
  }, [participant, loading, router]);

  useEffect(() => {
    if (!participant) return;
    submissionsApi.mine().then(setSubmissions).catch(() => {});
  }, [participant]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newSong) { setError("Please select a replacement song."); return; }
    if (!whyText.trim()) { setError("Please explain why you chose this song."); return; }
    setError("");
    setSubmitting(true);
    try {
      await submissionsApi.edit({ replace_slot: replaceSlot, song_id: newSong.id, why_text: whyText, town_tag: townTag || undefined, decade_tag: decadeTag || undefined });
      setDone(true);
    } catch (err: any) {
      setError(err?.detail || "Edit failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center"><p className="text-[#6B6560] animate-pulse text-[#6B6560]">Loading...</p></div>;

  if (participant?.has_used_edit) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-[#1F1F1F] mb-3">Edit Already Used</h1>
          <p className="text-[#6B6560] mb-6">You have already used your one-time edit. Each participant gets one change.</p>
          <Link href="/250" className="text-[#C9A66B] hover:text-amber-300">← Back to KRML 250</Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-[#1F1F1F] mb-3">Song Replaced!</h1>
          <p className="text-[#6B6560] mb-6">Your submission has been updated.</p>
          <Link href="/250/swipe" className="bg-[#2F5D62] hover:bg-[#245059] text-zinc-900 font-bold px-6 py-3 rounded-xl transition-colors">Keep Swiping →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="mb-6"><Link href="/250" className="text-[#6B6560] hover:text-[#1F1F1F] text-sm">← Back to KRML 250</Link></div>
        <h1 className="font-serif text-3xl font-bold text-[#1F1F1F] mb-2">Edit Your Submission</h1>
        <p className="text-[#6B6560] mb-2">You have <strong className="text-[#C9A66B]">one edit</strong> available. Replace one of your three songs.</p>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-amber-300 text-sm mb-8">⚠️ This action is permanent. Choose carefully.</div>
        {submissions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[#6B6560] mb-3 uppercase tracking-wider">Your current songs</h2>
            <div className="space-y-2">
              {submissions.map((sub) => (
                <div key={sub.id} className="flex items-center gap-3 bg-white border border-[#D8D4CE] rounded-lg px-4 py-3">
                  <span className="text-[#C9A66B] font-bold w-6">#{sub.submission_slot}</span>
                  <div>
                    <div className="text-[#1F1F1F] text-sm font-medium">{sub.song?.canonical_title ?? sub.song_id}</div>
                    <div className="text-[#8A8480] text-xs">{sub.song?.canonical_artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Replace slot</label>
            <select value={replaceSlot} onChange={(e) => setReplaceSlot(Number(e.target.value))} className="w-full bg-white border border-[#D8D4CE] rounded-lg px-4 py-3 text-[#1F1F1F] focus:outline-none focus:border-amber-500">
              <option value={1}>Song 1</option>
              <option value={2}>Song 2</option>
              <option value={3}>Song 3</option>
            </select>
          </div>
          <SongAutocomplete value={newSong} onChange={setNewSong} label="Replacement Song" />
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Why this song?</label>
            <textarea required value={whyText} onChange={(e) => setWhyText(e.target.value)} rows={3} maxLength={500} className="w-full bg-white border border-[#D8D4CE] rounded-lg px-4 py-3 text-[#1F1F1F] placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none" placeholder="Tell us why..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select value={townTag} onChange={(e) => setTownTag(e.target.value)} className="bg-white border border-[#D8D4CE] rounded-lg px-3 py-2 text-[#1F1F1F] text-sm focus:outline-none focus:border-amber-500">
              <option value="">Any town</option>
              {TOWNS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={decadeTag} onChange={(e) => setDecadeTag(e.target.value)} className="bg-white border border-[#D8D4CE] rounded-lg px-3 py-2 text-[#1F1F1F] text-sm focus:outline-none focus:border-amber-500">
              <option value="">Any decade</option>
              {DECADES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <button type="submit" disabled={submitting} className="w-full bg-[#2F5D62] hover:bg-[#245059] disabled:opacity-50 text-zinc-900 font-bold py-4 rounded-xl text-lg transition-colors">
            {submitting ? "Saving..." : "Replace This Song (One-Time Edit)"}
          </button>
        </form>
      </div>
    </div>
  );
}
