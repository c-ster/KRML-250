"use client";

import { useEffect, useState } from "react";

const REVEAL_DATE = new Date("2026-07-03T12:00:00-07:00");

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; }

function getTimeLeft(): TimeLeft {
  const diff = REVEAL_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  const isRevealed = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (!mounted) {
    return (
      <div className="flex gap-4 justify-center">
        {["--", "--", "--", "--"].map((v, i) => <CountdownUnit key={i} value={v} label={["Days", "Hours", "Min", "Sec"][i]} />)}
      </div>
    );
  }

  if (isRevealed) {
    return <div className="text-center py-6"><p className="text-3xl font-bold text-amber-400">🎶 The Soundtrack is Revealed! 🎶</p></div>;
  }

  return (
    <div className="text-center">
      <p className="text-zinc-400 text-sm mb-3 uppercase tracking-widest">Reveal on July 3, 2026</p>
      <div className="flex gap-3 justify-center">
        <CountdownUnit value={String(timeLeft.days).padStart(2, "0")} label="Days" />
        <Separator />
        <CountdownUnit value={String(timeLeft.hours).padStart(2, "0")} label="Hours" />
        <Separator />
        <CountdownUnit value={String(timeLeft.minutes).padStart(2, "0")} label="Min" />
        <Separator />
        <CountdownUnit value={String(timeLeft.seconds).padStart(2, "0")} label="Sec" />
      </div>
    </div>
  );
}

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 min-w-[60px] text-center">
        <span className="text-3xl font-bold text-amber-400 tabular-nums">{value}</span>
      </div>
      <span className="text-zinc-500 text-xs mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function Separator() {
  return <div className="flex items-center pb-5"><span className="text-2xl text-zinc-600 font-bold">:</span></div>;
}
