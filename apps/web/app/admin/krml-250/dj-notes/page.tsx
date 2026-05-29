"use client";

import { useEffect, useState } from "react";
import { adminApi, type DJNote } from "@/lib/api";

const EMPTY_FORM = { dj_name: "", song_id: "", note: "", display_publicly: false };

export default function AdminDJNotes() {
  const [notes, setNotes] = useState<DJNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [songSearch, setSongSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      setNotes(await adminApi.djNotes());
    } catch (e: any) {
      setError(e.detail || "Failed to load DJ notes");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSongSearch("");
    setShowForm(true);
  }

  function openEdit(note: DJNote) {
    setEditingId(note.id);
    setForm({
      dj_name: note.dj_name,
      song_id: note.song_id,
      note: note.note,
      display_publicly: note.display_publicly,
    });
    setSongSearch(note.song ? `${note.song.canonical_title} — ${note.song.canonical_artist}` : note.song_id);
    setShowForm(true);
  }

  function cancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSongSearch("");
  }

  async function handleSave() {
    if (!form.dj_name.trim() || !form.song_id.trim() || !form.note.trim()) {
      setError("DJ name, song ID, and note are all required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        const updated = await adminApi.updateDJNote(editingId, form);
        setNotes((prev) => prev.map((n) => (n.id === editingId ? updated : n)));
      } else {
        const created = await adminApi.createDJNote(form);
        setNotes((prev) => [created, ...prev]);
      }
      cancel();
    } catch (e: any) {
      setError(e.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublic(note: DJNote) {
    try {
      const updated = await adminApi.updateDJNote(note.id, { display_publicly: !note.display_publicly });
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    } catch (e: any) {
      setError(e.detail || "Update failed");
    }
  }

  const filtered = songSearch && !editingId
    ? notes
    : notes.filter((n) =>
        !songSearch ||
        n.song?.canonical_title.toLowerCase().includes(songSearch.toLowerCase()) ||
        n.song?.canonical_artist.toLowerCase().includes(songSearch.toLowerCase()) ||
        n.dj_name.toLowerCase().includes(songSearch.toLowerCase())
      );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">DJ Notes</h1>
        <button
          onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Add Note
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-5 mb-6">
          <h2 className="text-zinc-100 font-semibold mb-4">
            {editingId ? "Edit Note" : "New DJ Note"}
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">DJ Name</label>
              <input
                value={form.dj_name}
                onChange={(e) => setForm((f) => ({ ...f, dj_name: e.target.value }))}
                placeholder="e.g. Maria"
                className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Song ID</label>
              <input
                value={form.song_id}
                onChange={(e) => setForm((f) => ({ ...f, song_id: e.target.value }))}
                placeholder="Paste song UUID"
                className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-xs text-zinc-600 mt-1">Copy the ID from the Songs page.</p>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-zinc-500 mb-1 block">Note</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={4}
              placeholder="DJ's editorial note about this song..."
              className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="display_publicly"
              checked={form.display_publicly}
              onChange={(e) => setForm((f) => ({ ...f, display_publicly: e.target.checked }))}
              className="accent-amber-500"
            />
            <label htmlFor="display_publicly" className="text-sm text-zinc-300">
              Display publicly on leaderboard
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Note"}
            </button>
            <button
              onClick={cancel}
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <input
          value={songSearch}
          onChange={(e) => setSongSearch(e.target.value)}
          placeholder="Filter by song, artist, or DJ name…"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
        />
      </div>

      {loading ? (
        <p className="text-zinc-400 animate-pulse">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-zinc-500">No DJ notes yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => (
            <div
              key={note.id}
              className={`bg-zinc-800 border rounded-xl p-5 ${note.display_publicly ? "border-amber-500/30" : "border-zinc-700"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-400 font-semibold text-sm">{note.dj_name}</span>
                    <span className="text-zinc-600 text-xs">on</span>
                    <span className="text-zinc-100 text-sm font-medium truncate">
                      {note.song?.canonical_title ?? note.song_id}
                    </span>
                    {note.song && (
                      <span className="text-zinc-500 text-sm truncate">
                        — {note.song.canonical_artist}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed">{note.note}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => togglePublic(note)}
                    title={note.display_publicly ? "Public — click to hide" : "Private — click to publish"}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      note.display_publicly
                        ? "bg-amber-900/50 text-amber-400 hover:bg-amber-900/80"
                        : "bg-zinc-700 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {note.display_publicly ? "Public" : "Private"}
                  </button>
                  <button
                    onClick={() => openEdit(note)}
                    className="text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <div className="mt-2 text-zinc-600 text-xs font-mono">{note.song_id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
