"use client";

import { useRef, useState } from "react";
import type { Song } from "@/lib/api";

interface Props {
  song: Song;
  onVote: (vote: "yes" | "no" | "unknown") => void;
  onDefend: () => void;
  loading?: boolean;
}

const SWIPE_THRESHOLD = 60; // px required to register a swipe

export function SongCard({ song, onVote, onDefend, loading = false }: Props) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const isDragging = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    if (loading) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (loading || touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    // Only track horizontal swipes; ignore if primarily vertical (scrolling)
    if (!isDragging.current && Math.abs(dy) > Math.abs(dx)) return;
    isDragging.current = true;
    e.preventDefault();
    setDragX(dx);
  }

  function handleTouchEnd() {
    if (loading || !isDragging.current) {
      setDragX(0);
      return;
    }
    const dx = dragX;
    setDragX(0);
    isDragging.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
    if (dx > SWIPE_THRESHOLD) onVote("yes");
    else if (dx < -SWIPE_THRESHOLD) onVote("no");
    // small swipes do nothing — user can retry
  }

  const rotation = Math.min(Math.max(dragX / 12, -15), 15);
  const yesOpacity = Math.min(Math.max(dragX / SWIPE_THRESHOLD, 0), 1);
  const noOpacity = Math.min(Math.max(-dragX / SWIPE_THRESHOLD, 0), 1);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: dragX !== 0 ? `translateX(${dragX}px) rotate(${rotation}deg)` : undefined,
        transition: dragX === 0 ? "transform 0.25s ease-out" : "none",
        touchAction: "pan-y",
      }}
      className="bg-white border border-[#D8D4CE] rounded-2xl p-6 flex flex-col gap-5 shadow-sm select-none relative"
    >
      {/* Swipe overlay indicators */}
      {yesOpacity > 0 && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-start pl-6 pointer-events-none"
          style={{ opacity: yesOpacity }}>
          <span className="border-4 border-[#2F5D62] text-[#2F5D62] font-black text-2xl px-3 py-1 rounded-lg rotate-[-15deg]">YES</span>
        </div>
      )}
      {noOpacity > 0 && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-end pr-6 pointer-events-none"
          style={{ opacity: noOpacity }}>
          <span className="border-4 border-red-400 text-red-400 font-black text-2xl px-3 py-1 rounded-lg rotate-[15deg]">NOPE</span>
        </div>
      )}

      <div className="text-center">
        <div className="font-serif text-2xl font-bold text-[#1F1F1F] leading-tight">{song.canonical_title}</div>
        <div className="text-[#2F5D62] text-lg mt-1">{song.canonical_artist}</div>
        <div className="flex justify-center gap-3 mt-2 text-sm text-[#8A8480]">
          {song.decade && <span>{song.decade}</span>}
          {song.release_year && <span>({song.release_year})</span>}
          {song.aaa_fit_score && <span className="text-[#C9A66B]">AAA fit: {song.aaa_fit_score}/10</span>}
        </div>
        {song.dj_pick && (
          <span className="inline-block mt-2 px-3 py-1 bg-[#C9A66B]/15 text-[#B8924A] text-xs rounded-full border border-[#C9A66B]/40">⭐ DJ Pick</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => onVote("yes")} disabled={loading}
          className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl bg-[#E8F4F0] border border-[#2F5D62]/30 hover:bg-[#D0EBE5] hover:border-[#2F5D62] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="text-3xl">👍</span>
          <span className="text-[#2F5D62] text-sm font-medium">Yes</span>
        </button>
        <button onClick={() => onVote("unknown")} disabled={loading}
          className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl bg-[#F5F3EF] border border-[#D8D4CE] hover:bg-[#E8E5E0] hover:border-[#B8B0A8] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="text-3xl">🤷</span>
          <span className="text-[#6B6560] text-sm font-medium">Unsure</span>
        </button>
        <button onClick={() => onVote("no")} disabled={loading}
          className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="text-3xl">👎</span>
          <span className="text-red-500 text-sm font-medium">No</span>
        </button>
      </div>

      <p className="text-center text-xs text-[#8A8480]">← swipe left to skip · swipe right to nominate →</p>

      <button onClick={onDefend} disabled={loading}
        className="w-full py-3 border border-[#C9A66B]/50 text-[#B8924A] rounded-xl hover:bg-[#C9A66B]/10 transition-colors text-sm font-medium disabled:opacity-50">
        ✍️ Write a Defense
      </button>
    </div>
  );
}
