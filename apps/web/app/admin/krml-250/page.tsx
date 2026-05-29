"use client";

import { useEffect, useState } from "react";
import { adminApi, type AdminMetrics } from "@/lib/api";

function MetricCard({ label, value, accent = false }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`bg-zinc-800 border rounded-xl px-5 py-4 ${accent ? "border-amber-500/40" : "border-zinc-700"}`}>
      <div className={`text-3xl font-bold mb-1 ${accent ? "text-amber-400" : "text-zinc-100"}`}>{value}</div>
      <div className="text-zinc-500 text-sm">{label}</div>
    </div>
  );
}

function StatusBadge({ label, on }: { label: string; on: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${on ? "bg-green-900/30 border-green-700 text-green-400" : "bg-zinc-800 border-zinc-700 text-zinc-500"}`}>
      <span className={`w-2 h-2 rounded-full ${on ? "bg-green-400" : "bg-zinc-600"}`} />
      {label}: {on ? "Open" : "Closed"}
    </div>
  );
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.metrics().then(setMetrics).catch((e) => setError(e.detail || "Failed to load metrics"));
  }, []);

  if (error) return <div className="p-8"><div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg">{error}</div></div>;
  if (!metrics) return <div className="p-8 text-zinc-400 animate-pulse">Loading metrics...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Dashboard</h1>
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Campaign Phases</h2>
        <div className="flex flex-wrap gap-3">
          <StatusBadge label="Nominations" on={metrics.nominations_open} />
          <StatusBadge label="Swipe Voting" on={metrics.swipe_open} />
          <StatusBadge label="Predictions" on={metrics.predictions_open} />
          <StatusBadge label="Results Published" on={metrics.results_published} />
          <StatusBadge label="Top 5 Revealed" on={metrics.top5_revealed} />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard label="Participants" value={metrics.total_participants} />
        <MetricCard label="Verified" value={metrics.verified_participants} accent />
        <MetricCard label="Songs in Library" value={metrics.total_songs} />
        <MetricCard label="Active Submissions" value={metrics.total_submissions} />
        <MetricCard label="Swipe Votes" value={metrics.total_swipe_votes} />
        <MetricCard label="Defenses" value={metrics.total_defenses} />
        <MetricCard label="Pending Defenses" value={metrics.pending_defenses} accent={metrics.pending_defenses > 0} />
        <MetricCard label="Predictions" value={metrics.total_predictions} />
      </div>
      {metrics.pending_defenses > 0 && (
        <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-300 text-sm">
          ⚠️ {metrics.pending_defenses} defense{metrics.pending_defenses !== 1 ? "s" : ""} need review.{" "}
          <a href="/admin/krml-250/defenses?status=pending" className="underline hover:text-amber-200">Review now →</a>
        </div>
      )}
    </div>
  );
}
