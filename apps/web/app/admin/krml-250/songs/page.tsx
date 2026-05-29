"use client";

import { useEffect, useState } from "react";
import { adminApi, type Song } from "@/lib/api";

const STATUS_OPTIONS = ["pending", "approved", "excluded", "needs_review"];

export default function AdminSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Song>>({});
  const [mergeMode, setMergeMode] = useState(false);
  const [keepId, setKeepId] = useState("");
  const [mergeId, setMergeId] = useState("");
  const [mergeConfirm, setMergeConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.songs(0, 500).then(setSongs).catch((e) => setError(e.detail || "Failed to load")).finally(() => setLoading(false));
  }, []);

  const filtered = songs.filter((s) => !search || s.canonical_title.toLowerCase().includes(search.toLowerCase()) || s.canonical_artist.toLowerCase().includes(search.toLowerCase()));

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const updated = await adminApi.updateSong(id, editData);
      setSongs((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditId(null);
    } catch (e: any) { setError(e.detail || "Save failed"); } finally { setSaving(false); }
  }

  async function doMerge() {
    if (!keepId || !mergeId) return;
    setSaving(true);
    try {
      const updated = await adminApi.mergeSongs(keepId, mergeId);
      setSongs((prev) => prev.filter((s) => s.id !== mergeId).map((s) => (s.id === keepId ? updated : s)));
      setMergeMode(false); setKeepId(""); setMergeId(""); setMergeConfirm(false);
    } catch (e: any) { setError(e.detail || "Merge failed"); } finally { setSaving(false); }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Songs</h1>
        <button onClick={() => setMergeMode(!mergeMode)} className={`px-4 py-2 rounded-lg text-sm transition-colors ${mergeMode ? "bg-amber-500 text-zinc-900" : "bg-zinc-700 hover:bg-zinc-600 text-zinc-100"}`}>
          {mergeMode ? "Cancel Merge" : "Merge Songs"}
        </button>
      </div>
      {mergeMode && (
        <div className="bg-zinc-800 border border-amber-500/30 rounded-xl p-4 mb-6">
          <h3 className="text-amber-400 font-semibold mb-3">Merge Songs</h3>
          <p className="text-zinc-400 text-sm mb-3">The &ldquo;merge&rdquo; song will be absorbed into the &ldquo;keep&rdquo; song and deleted.</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Keep Song ID</label>
              <input value={keepId} onChange={(e) => setKeepId(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500" placeholder="ID to keep..." />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Merge Song ID (will be deleted)</label>
              <input value={mergeId} onChange={(e) => setMergeId(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500" placeholder="ID to merge..." />
            </div>
          </div>
          {!mergeConfirm ? (
            <button onClick={() => setMergeConfirm(true)} disabled={!keepId || !mergeId} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 font-bold px-4 py-2 rounded-lg text-sm">Merge Songs →</button>
          ) : (
            <div className="flex items-center gap-3 bg-red-900/30 border border-red-700 rounded-lg px-4 py-3">
              <span className="text-red-300 text-sm">This will permanently delete the merged song. Are you sure?</span>
              <button onClick={doMerge} disabled={saving} className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded text-sm">{saving ? "Merging…" : "Yes, merge"}</button>
              <button onClick={() => setMergeConfirm(false)} className="text-zinc-400 hover:text-zinc-200 text-sm">Cancel</button>
            </div>
          )}
        </div>
      )}
      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search songs..." className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-sm w-80" />
      </div>
      {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {loading ? <p className="text-zinc-400 animate-pulse">Loading...</p> : (
        <div className="space-y-1">
          {filtered.map((song) =>
            editId === song.id ? (
              <div key={song.id} className="bg-zinc-800 border border-amber-500/30 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500">Title</label>
                    <input defaultValue={song.canonical_title} onChange={(e) => setEditData((d) => ({ ...d, canonical_title: e.target.value }))} className="w-full mt-1 bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Artist</label>
                    <input defaultValue={song.canonical_artist} onChange={(e) => setEditData((d) => ({ ...d, canonical_artist: e.target.value }))} className="w-full mt-1 bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Decade</label>
                    <input defaultValue={song.decade ?? ""} onChange={(e) => setEditData((d) => ({ ...d, decade: e.target.value }))} className="w-full mt-1 bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">AAA Fit Score (1-10)</label>
                    <input type="number" min={1} max={10} defaultValue={song.aaa_fit_score ?? ""} onChange={(e) => setEditData((d) => ({ ...d, aaa_fit_score: Number(e.target.value) || undefined }))} className="w-full mt-1 bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Status</label>
                    <select defaultValue={song.status} onChange={(e) => setEditData((d) => ({ ...d, status: e.target.value as Song["status"] }))} className="w-full mt-1 bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500">
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked={song.dj_pick} onChange={(e) => setEditData((d) => ({ ...d, dj_pick: e.target.checked }))} className="accent-amber-500" />
                      <span className="text-zinc-300 text-sm">DJ Pick</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked={song.krml_seeded} onChange={(e) => setEditData((d) => ({ ...d, krml_seeded: e.target.checked }))} className="accent-amber-500" />
                      <span className="text-zinc-300 text-sm">KRML Seeded</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(song.id)} disabled={saving} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 font-bold px-4 py-2 rounded-lg text-sm">{saving ? "Saving..." : "Save"}</button>
                  <button onClick={() => setEditId(null)} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div key={song.id} className="flex items-center gap-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-3 group">
                <div className="flex-1 min-w-0">
                  <span className="text-zinc-100 font-medium">{song.canonical_title}</span>
                  <span className="text-zinc-400 ml-2 text-sm">— {song.canonical_artist}</span>
                  {song.decade && <span className="text-zinc-600 ml-2 text-xs">{song.decade}</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {song.dj_pick && <span className="text-xs text-amber-400">DJ</span>}
                  {song.aaa_fit_score && <span className="text-xs text-zinc-500">{song.aaa_fit_score}/10</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${song.status === "approved" ? "bg-green-900/50 text-green-400" : song.status === "excluded" ? "bg-red-900/50 text-red-400" : song.status === "needs_review" ? "bg-amber-900/50 text-amber-400" : "bg-zinc-700 text-zinc-400"}`}>{song.status}</span>
                  <button onClick={() => { setEditId(song.id); setEditData({}); }} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-200 text-xs px-2 py-1 rounded transition-all">Edit</button>
                </div>
              </div>
            )
          )}
          <p className="text-zinc-600 text-sm mt-3">{filtered.length} of {songs.length} songs</p>
        </div>
      )}
    </div>
  );
}
