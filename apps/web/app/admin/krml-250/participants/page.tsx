"use client";

import { useEffect, useState } from "react";
import { adminApi, type Participant } from "@/lib/api";

export default function AdminParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminApi.participants(0, 500).then(setParticipants).catch((e) => setError(e.detail || "Failed to load")).finally(() => setLoading(false));
  }, []);

  async function downloadCSV() {
    const csv = await adminApi.exportParticipants();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "participants.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = participants.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()) || p.town.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Participants</h1>
        <button onClick={downloadCSV} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg text-sm">Export CSV</button>
      </div>
      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or town..." className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-sm w-80" />
      </div>
      {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {loading ? <p className="text-zinc-400 animate-pulse">Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-500 text-left">
                <th className="pb-2 pr-4">Name</th><th className="pb-2 pr-4">Email</th><th className="pb-2 pr-4">Town</th><th className="pb-2 pr-4">Verified</th><th className="pb-2 pr-4">Edit Used</th><th className="pb-2">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/50">
                  <td className="py-3 pr-4 text-zinc-100 font-medium">{p.name}</td>
                  <td className="py-3 pr-4 text-zinc-400">{p.email}</td>
                  <td className="py-3 pr-4 text-zinc-400 capitalize">{p.town.replace(/_/g, " ")}</td>
                  <td className="py-3 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs ${p.email_verified_at ? "bg-green-900/50 text-green-400" : "bg-zinc-800 text-zinc-500"}`}>{p.email_verified_at ? "Yes" : "No"}</span></td>
                  <td className="py-3 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs ${p.has_used_edit ? "bg-amber-900/50 text-amber-400" : "bg-zinc-800 text-zinc-500"}`}>{p.has_used_edit ? "Used" : "Available"}</span></td>
                  <td className="py-3 text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-zinc-600 text-sm mt-3">{filtered.length} of {participants.length} participants</p>
        </div>
      )}
    </div>
  );
}
