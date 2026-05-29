"use client";

import { useEffect, useState } from "react";
import { adminApi, type Sponsor } from "@/lib/api";

const BLANK_SPONSOR: Partial<Sponsor> = { sponsor_name: "", placement_type: "landing", image_url: "", link_url: "", active: true };

export default function AdminSponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Sponsor>>(BLANK_SPONSOR);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.sponsors().then(setSponsors).catch((e) => setError(e.detail || "Failed to load")).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (editId) {
        const updated = await adminApi.updateSponsor(editId, form);
        setSponsors((prev) => prev.map((s) => (s.id === editId ? updated : s)));
      } else {
        const created = await adminApi.createSponsor(form);
        setSponsors((prev) => [created, ...prev]);
      }
      setShowForm(false); setEditId(null); setForm(BLANK_SPONSOR);
    } catch (e: any) { setError(e.detail || "Save failed"); }
    finally { setSaving(false); }
  }

  function startEdit(sponsor: Sponsor) { setForm(sponsor); setEditId(sponsor.id); setShowForm(true); }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Sponsor Placements</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(BLANK_SPONSOR); }} className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold px-4 py-2 rounded-lg text-sm">+ Add Sponsor</button>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {showForm && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-5 mb-6 space-y-4">
          <h3 className="text-zinc-100 font-semibold">{editId ? "Edit Sponsor" : "New Sponsor"}</h3>
          <div className="grid grid-cols-2 gap-4">
            {([["sponsor_name", "Sponsor Name", "text"], ["placement_type", "Placement Type", "text"], ["image_url", "Image URL", "text"], ["link_url", "Link URL", "text"]] as const).map(([key, label, type]) => (
              <div key={key}>
                <label className="text-xs text-zinc-500 mb-1 block">{label}</label>
                <input type={type} value={(form as any)[key] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500" />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="accent-amber-500" />
            <span className="text-zinc-300 text-sm">Active</span>
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 font-bold px-4 py-2 rounded-lg text-sm">{saving ? "Saving..." : "Save"}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}
      {loading ? <p className="text-zinc-400 animate-pulse">Loading...</p> : (
        <div className="space-y-3">
          {sponsors.map((s) => (
            <div key={s.id} className={`flex items-center gap-4 bg-zinc-800 border rounded-xl px-4 py-3 ${s.active ? "border-zinc-700" : "border-zinc-800 opacity-60"}`}>
              <div className="flex-1"><div className="text-zinc-100 font-medium">{s.sponsor_name}</div><div className="text-zinc-500 text-xs">{s.placement_type} · {s.link_url ?? "no link"}</div></div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${s.active ? "bg-green-900/50 text-green-400" : "bg-zinc-700 text-zinc-500"}`}>{s.active ? "Active" : "Inactive"}</span>
              <button onClick={() => startEdit(s)} className="text-zinc-500 hover:text-zinc-200 text-xs px-2 py-1 rounded">Edit</button>
            </div>
          ))}
          {sponsors.length === 0 && <p className="text-zinc-500">No sponsors yet.</p>}
        </div>
      )}
    </div>
  );
}
