"use client";

import { useEffect, useState } from "react";
import { adminApi, type SongRanking } from "@/lib/api";

export default function AdminRankings() {
  const [rankings, setRankings] = useState<SongRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [freezing, setFreezing] = useState(false);
  const [error, setError] = useState("");
  const [frozenMsg, setFrozenMsg] = useState("");

  useEffect(() => {
    adminApi.rankings().then(setRankings).catch((e) => setError(e.detail || "Failed to load")).finally(() => setLoading(false));
  }, []);

  async function downloadCSV() {
    const csv = await adminApi.exportRankings();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "rankings.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function freeze() {
    setFreezing(true);
    try { const result = await adminApi.freezeRankings(); setFrozenMsg(result.message); }
    catch (e: any) { setError(e.detail || "Freeze failed"); }
    finally { setFreezing(false); }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Rankings Engine</h1>
        <div className="flex gap-3">
          <button onClick={downloadCSV} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg text-sm">Export CSV</button>
          <button onClick={freeze} disabled={freezing} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 font-bold px-4 py-2 rounded-lg text-sm">{freezing ? "Freezing..." : "🔒 Freeze Final Rankings"}</button>
        </div>
      </div>
      {frozenMsg && <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-4 text-sm">✓ {frozenMsg}</div>}
      {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {loading ? <p className="text-zinc-400 animate-pulse">Computing rankings...</p> : (
        <>
          <p className="text-zinc-500 text-sm mb-4">{rankings.length} songs ranked. Live computation — freeze when ready to publish.</p>
          <div className="space-y-2">
            {rankings.slice(0, 50).map((r) => (
              <div key={r.song.id} className="bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3">
                <div className="flex items-start gap-4">
                  <div className="w-10 text-center flex-shrink-0 pt-1"><span className="text-amber-400 font-bold text-lg">#{r.rank}</span></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-zinc-100 font-medium">{r.song.canonical_title}</div>
                    <div className="text-zinc-400 text-sm">{r.song.canonical_artist}</div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-zinc-500">
                      <span>Noms: {r.nomination_count}</span>
                      <span>👍 {r.yes_votes} / 👎 {r.no_votes}</span>
                      <span>Defenses: {r.approved_defenses}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-amber-400 font-bold">{(r.score * 100).toFixed(1)}</div>
                    <div className="text-zinc-600 text-xs">score</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-zinc-700/50 grid grid-cols-5 gap-1">
                  {([["Nom", r.score_components.nomination_score], ["Swipe", r.score_components.swipe_score], ["Editorial", r.score_components.editorial_score], ["Defense", r.score_components.defense_score], ["Balance", r.score_components.balance_score]] as const).map(([label, val]) => (
                    <div key={label as string} className="text-center">
                      <div className="text-xs text-zinc-500">{label}</div>
                      <div className="text-xs text-zinc-300">{((val as number) * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {rankings.length > 50 && <p className="text-zinc-600 text-sm text-center py-2">Showing top 50 of {rankings.length}. Export CSV for full list.</p>}
          </div>
        </>
      )}
    </div>
  );
}
