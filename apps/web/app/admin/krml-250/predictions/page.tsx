"use client";

import { useEffect, useState } from "react";
import { adminApi, type Prediction } from "@/lib/api";
import { Pagination } from "@/components/krml250/Pagination";

const PAGE_SIZE = 25;

export default function AdminPredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    adminApi.predictions(page * PAGE_SIZE, PAGE_SIZE)
      .then(setPredictions)
      .catch((e) => setError(e.detail || "Failed to load"))
      .finally(() => setLoading(false));
  }, [page]);

  async function downloadCSV() {
    const csv = await adminApi.exportPredictions();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "predictions.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Predictions</h1>
        <button onClick={downloadCSV} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg text-sm">Export CSV</button>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {loading ? (
        <p className="text-zinc-400 animate-pulse">Loading...</p>
      ) : predictions.length === 0 && page === 0 ? (
        <p className="text-zinc-500">No predictions submitted yet.</p>
      ) : (
        <div>
          <div className="space-y-4">
            {predictions.map((pred) => (
              <div key={pred.id} className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-zinc-500 text-xs">Participant: {pred.participant_id}</div>
                  <div className="text-zinc-600 text-xs">
                    {new Date(pred.created_at).toLocaleDateString()}
                    {pred.locked_at && <span className="ml-2 text-amber-400">🔒 Locked</span>}
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((i) => {
                    const song = (pred as any)[`song_${i}`];
                    const sid = (pred as any)[`song_${i}_id`];
                    return (
                      <div key={i} className="bg-zinc-700 rounded-lg p-2 text-center">
                        <div className="text-amber-400 text-xs font-bold mb-1">#{i}</div>
                        <div className="text-zinc-100 text-xs font-medium truncate">{song?.canonical_title ?? sid?.slice(0, 8) + "..."}</div>
                        <div className="text-zinc-500 text-xs truncate">{song?.canonical_artist ?? ""}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            count={predictions.length}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </div>
      )}
    </div>
  );
}
