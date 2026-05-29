"use client";

import { useEffect, useState } from "react";
import { adminApi, type Defense } from "@/lib/api";

const STATUS_FILTER_OPTIONS = ["all", "pending", "approved", "rejected"];

export default function AdminDefenses() {
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [excerpt, setExcerpt] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    adminApi.defenses(statusFilter === "all" ? undefined : statusFilter).then(setDefenses).catch((e) => setError(e.detail || "Failed to load")).finally(() => setLoading(false));
  }, [statusFilter]);

  async function handleAction(id: string, status: string) {
    setSaving(id);
    try {
      const updated = await adminApi.updateDefense(id, status, excerpt[id]);
      setDefenses((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch (e: any) { setError(e.detail || "Action failed"); } finally { setSaving(null); }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Defense Queue</h1>
        <div className="flex gap-2">
          {STATUS_FILTER_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === s ? "bg-amber-500 text-zinc-900 font-semibold" : "bg-zinc-800 text-zinc-400 hover:text-zinc-100"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {loading ? <p className="text-zinc-400 animate-pulse">Loading...</p> : defenses.length === 0 ? <p className="text-zinc-500">No defenses with status: {statusFilter}</p> : (
        <div className="space-y-4">
          {defenses.map((defense) => (
            <div key={defense.id} className={`bg-zinc-800 border rounded-xl p-5 ${defense.approval_status === "pending" ? "border-amber-500/30" : defense.approval_status === "approved" ? "border-green-700/30" : "border-red-700/30"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-zinc-100 font-semibold">{defense.song?.canonical_title ?? defense.song_id}</div>
                  <div className="text-zinc-500 text-sm">{defense.song?.canonical_artist}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${defense.approval_status === "pending" ? "bg-amber-900/50 text-amber-400" : defense.approval_status === "approved" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>{defense.approval_status}</span>
              </div>
              <blockquote className="border-l-2 border-zinc-600 pl-4 text-zinc-300 text-sm mb-4">{defense.defense_text}</blockquote>
              {defense.approval_status === "pending" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Approved excerpt (optional, shown publicly)</label>
                    <textarea value={excerpt[defense.id] ?? ""} onChange={(e) => setExcerpt((prev) => ({ ...prev, [defense.id]: e.target.value }))} rows={2} placeholder="Paste a shorter excerpt to display publicly..." className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(defense.id, "approved")} disabled={saving === defense.id} className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm">{saving === defense.id ? "..." : "✓ Approve"}</button>
                    <button onClick={() => handleAction(defense.id, "rejected")} disabled={saving === defense.id} className="bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm">{saving === defense.id ? "..." : "✕ Reject"}</button>
                  </div>
                </div>
              )}
              {defense.approval_status === "approved" && defense.approved_excerpt && (
                <div className="bg-green-900/20 border border-green-700/30 rounded-lg px-3 py-2 text-green-300 text-xs">Public excerpt: {defense.approved_excerpt}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
