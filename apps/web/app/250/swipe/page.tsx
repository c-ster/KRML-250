"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SongCard } from "@/components/krml250/SongCard";
import { swipeApi, type Song } from "@/lib/api";
import { useParticipantSession } from "@/hooks/useParticipantSession";

export default function SwipePage() {
  const router = useRouter();
  const { participant, loading } = useParticipantSession();
  const [queue, setQueue] = useState<Song[]>([]);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voting, setVoting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [lastVote, setLastVote] = useState<string>("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !participant) router.push("/250/verify?redirect=/250/swipe");
  }, [participant, loading, router]);

  useEffect(() => {
    if (!participant) return;
    loadBatch();
  }, [participant]);

  async function loadBatch() {
    setFetching(true);
    try {
      const data = await swipeApi.next();
      setQueue(data.songs);
      setTotalRemaining(data.total_remaining);
      setCurrentIndex(0);
      if (data.songs.length === 0) setDone(true);
    } catch {
      setError("Failed to load songs. Please try again.");
    } finally {
      setFetching(false);
    }
  }

  async function handleVote(vote: "yes" | "no" | "unknown") {
    const song = queue[currentIndex];
    if (!song || voting) return;
    setVoting(true);
    setLastVote(vote);
    try {
      await swipeApi.vote(song.id, vote);
      const next = currentIndex + 1;
      if (next >= queue.length) {
        if (totalRemaining <= queue.length) setDone(true);
        else await loadBatch();
      } else {
        setCurrentIndex(next);
        setTotalRemaining((r) => Math.max(0, r - 1));
      }
    } catch {
      setError("Vote failed. Tap again.");
    } finally {
      setVoting(false);
      setLastVote("");
    }
  }

  function handleDefend() {
    const song = queue[currentIndex];
    if (song) router.push(`/250/defend/${song.id}`);
  }

  if (loading || fetching) return (
    <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
      <p className="text-[#6B6560] animate-pulse">Loading songs...</p>
    </div>
  );

  if (done) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="font-serif text-2xl font-bold text-[#1F1F1F] mb-3">You&apos;ve voted on everything!</h1>
          <p className="text-[#6B6560] mb-6">Amazing! Come back later as more songs are nominated.</p>
          <div className="flex flex-col gap-3">
            <Link href="/250/predict" className="bg-[#2F5D62] hover:bg-[#245059] text-white font-bold px-6 py-3 rounded-xl transition-colors">Predict the Top 5 →</Link>
            <Link href="/250" className="text-[#6B6560] hover:text-[#1F1F1F] text-sm">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const currentSong = queue[currentIndex];
  if (!currentSong) return null;

  return (
    <div className="min-h-screen bg-[#F5F3EF] px-4 py-8">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/250" className="text-[#6B6560] hover:text-[#1F1F1F] text-sm">← Home</Link>
          <span className="text-[#6B6560] text-sm">{totalRemaining} left to vote</span>
        </div>
        <div className="w-full h-1.5 bg-[#D8D4CE] rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-[#2F5D62] rounded-full transition-all duration-300"
            style={{ width: `${100 - (totalRemaining / (totalRemaining + currentIndex + 1)) * 100}%` }} />
        </div>
        <SongCard song={currentSong} onVote={handleVote} onDefend={handleDefend} loading={voting} />
        {lastVote && (
          <div className="text-center mt-4 text-[#6B6560] text-sm animate-pulse">
            {lastVote === "yes" ? "👍 Voted yes" : lastVote === "no" ? "👎 Voted no" : "🤷 Marked unsure"}
          </div>
        )}
        {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">{error}</div>}
      </div>
    </div>
  );
}
