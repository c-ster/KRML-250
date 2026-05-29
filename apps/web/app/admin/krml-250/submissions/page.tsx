"use client";

import { useEffect, useState } from "react";
import { adminApi, type Submission } from "@/lib/api";

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminApi.submissions(0, 500).then(setSubmissions).catch((e) => setError(e.detail || "Failed to load")).finally(() => setLoading(false));
  }, []);

  async function downloadCSV() {
    const csv = await adminApi.exportSubmissions();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "submissions.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = submissions.filter((s) => !search || s.song?.canonical_title?.toLowerCase().includes(search.toLowerCase()) || s.song?.canonical_artist?.toLowerCase().includes(search.toLowerCase()) || s.why_text.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Submissions</h1>
        <button onClick={downloadCSV} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg text-sm">Export CSV</button>
      </div>
      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by song or why text..." className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-sm w-80" />
      </div>
      {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {loading ? <p className="text-zinc-400 animate-pulse">Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-700 text-zinc-500 text-left"><th className="pb-2 pr-4">Slot</th><th className="pb-2 pr-4">Song</th><th className="pb-2 pr-4">Why</th><th className="pb-2 pr-4">Town</th><th className="pb-2 pr-4">Active</th><th className="pb-2">Date</th></tr></thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((s) => (
                <tr key={s.id} className={`hover:bg-zinc-800/50 ${!s.active ? "opacity-50" : ""}`}>
                  <td className="py-2 pr-4 text-amber-400 font-bold">#{s.submission_slot}</td>
                  <td className="py-2 pr-4"><div className="text-zinc-100">{s.song?.canonical_title ?? s.song_id}</div><div className="text-zinc-500 text-xs">{s.song?.canonical_artist}</div></td>
                  <td className="py-2 pr-4 text-zinc-400 max-w-xs truncate">{s.why_text}</td>
                  <td className="py-2 pr-4 text-zinc-500 capitalize">{s.town_tag?.replace(/_/g, " ") ?? "—"}</td>
                  <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs ${s.active ? "bg-green-900/50 text-green-400" : "bg-zinc-800 text-zinc-500"}`}>{s.active ? "Active" : "Inactive"}</span></td>
                  <td className="py-2 text-zinc-600 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-zinc-600 text-sm mt-3">{filtered.length} submissions</p>
        </div>
      )}
    </div>
  );
}
