"use client";

import { useEffect, useState } from "react";
import { adminApi, type CampaignSetting } from "@/lib/api";

const BOOL_KEYS = ["nominations_open", "swipe_open", "predictions_open", "results_published", "top5_revealed"];
const KEY_LABELS: Record<string, string> = { nominations_open: "Nominations Open", swipe_open: "Swipe Voting Open", predictions_open: "Predictions Open", results_published: "Results Published", top5_revealed: "Top 5 Revealed", ranking_weights: "Ranking Weights (JSON)" };

export default function AdminSettings() {
  const [settings, setSettings] = useState<CampaignSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    adminApi.settings().then(setSettings).catch((e) => setError(e.detail || "Failed to load")).finally(() => setLoading(false));
  }, []);

  function getValue(key: string): string {
    if (edits[key] !== undefined) return edits[key];
    return settings.find((s) => s.key === key)?.value ?? "";
  }

  async function saveSetting(key: string) {
    const value = edits[key];
    if (value === undefined) return;
    setSaving(key);
    try {
      const updated = await adminApi.updateSetting(key, value);
      setSettings((prev) => prev.map((s) => (s.key === key ? updated : s)));
      setSaved(key); setTimeout(() => setSaved(null), 2000);
    } catch (e: any) { setError(e.detail || "Save failed"); }
    finally { setSaving(null); }
  }

  async function toggleBool(key: string) {
    const current = getValue(key);
    const next = current === "true" ? "false" : "true";
    setEdits((e) => ({ ...e, [key]: next }));
    setSaving(key);
    try {
      const updated = await adminApi.updateSetting(key, next);
      setSettings((prev) => prev.map((s) => (s.key === key ? updated : s)));
    } catch (e: any) { setError(e.detail || "Toggle failed"); setEdits((e) => ({ ...e, [key]: current })); }
    finally { setSaving(null); }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Campaign Settings</h1>
      {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {loading ? <p className="text-zinc-400 animate-pulse">Loading...</p> : (
        <div className="space-y-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-5">
            <h2 className="text-zinc-100 font-semibold mb-4">Campaign Phases</h2>
            <div className="space-y-3">
              {BOOL_KEYS.map((key) => {
                const isOn = getValue(key) === "true";
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="text-zinc-100 text-sm font-medium">{KEY_LABELS[key] ?? key}</div>
                    <button onClick={() => toggleBool(key)} disabled={saving === key} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${isOn ? "bg-amber-500" : "bg-zinc-700"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOn ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-5">
            <h2 className="text-zinc-100 font-semibold mb-2">Ranking Weights (JSON)</h2>
            <p className="text-zinc-500 text-xs mb-3">Default: {`{"nominations":0.40,"swipe":0.25,"editorial":0.15,"defense":0.10,"balance":0.10}`}</p>
            <textarea value={edits["ranking_weights"] ?? getValue("ranking_weights")} onChange={(e) => setEdits((prev) => ({ ...prev, ranking_weights: e.target.value }))} rows={4} className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-100 text-sm font-mono focus:outline-none focus:border-amber-500 resize-none" />
            <div className="flex items-center gap-3 mt-3">
              <button onClick={() => saveSetting("ranking_weights")} disabled={saving === "ranking_weights"} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 font-bold px-4 py-2 rounded-lg text-sm">{saving === "ranking_weights" ? "Saving..." : "Save Weights"}</button>
              {saved === "ranking_weights" && <span className="text-green-400 text-sm">✓ Saved</span>}
            </div>
          </div>
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-5">
            <h2 className="text-zinc-100 font-semibold mb-3">All Settings</h2>
            <div className="space-y-2">
              {settings.map((s) => (
                <div key={s.id} className="flex items-start gap-3 text-sm">
                  <code className="text-amber-400 flex-shrink-0 w-40">{s.key}</code>
                  <span className="text-zinc-400 font-mono truncate">{s.value}</span>
                  <span className="text-zinc-600 text-xs flex-shrink-0">{new Date(s.updated_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
