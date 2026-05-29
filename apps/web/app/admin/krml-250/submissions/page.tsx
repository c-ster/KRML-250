"use client";

import { useEffect, useRef, useState } from "react";
import { adminApi, type Submission } from "@/lib/api";
import { Pagination } from "@/components/krml250/Pagination";

const PAGE_SIZE = 50;

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      adminApi.submissions(page * PAGE_SIZE, PAGE_SIZE, search || undefined)
        .then(setSubmissions)
        .catch((e) => setError(e.detail || "Failed to load"))
        .finally(() => setLoading(false));
    }, 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [page, search]);

  function handleSearch(q: string) {
    setSearch(q);
    setPage(0);
  }

  async function downloadCSV() {
    const csv = await adminApi.exportSubmissions();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "submissions.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Submissions</h1>
        <button onClick={downloadCSV} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg text-sm">Export CSV</button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by song or why text..."
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-sm w-80"
        />
      </div>
      {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {loading ? (
        <p className="text-zinc-400 animate-pulse">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-500 text-left">
                <th className="pb-2 pr-4">Slot</th>
                <th className="pb-2 pr-4">Song</th>
                <th className="pb-2 pr-4">Why</th>
                <th className="pb-2 pr-4">Town</th>
                <th className="pb-2 pr-4">Active</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {submissions.map((s) => (
                <tr key={s.id} className={`hover:bg-zinc-800/50 ${!s.active ? "opacity-50" : ""}`}>
                  <td className="py-2 pr-4 text-amber-400 font-bold">#{s.submission_slot}</td>
                  <td className="py-2 pr-4"><div className="text-zinc-100">{s.song?.canonical_title ?? s.song_id}</div><div className="text-zinc-500 text-xs">{s.song?.canonical_artist}</div></td>
                  <td className="py-2 pr-4 text-zinc-400 max-w-xs truncate">{s.why_text}</td>
                  <td className="py-2 pr-4 text-zinc-500 capitalize">{s.town_tag?.replace(/_/g, " ") ?? "—"}</td>
                  <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs ${s.active ? "bg-green-900/50 text-green-400" : "bg-zinc-800 text-zinc-500"}`}>{s.active ? "Active" : "Inactive"}</span></td>
                  <td className="py-2 text-zinc-600 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-600">No submissions found.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            count={submissions.length}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </div>
      )}
    </div>
  );
}
