"use client";

import { useState } from "react";
import Link from "next/link";
import { participantsApi } from "@/lib/api";

const TOWNS = [
  { value: "monterey", label: "Monterey" },
  { value: "carmel", label: "Carmel-by-the-Sea" },
  { value: "pacific_grove", label: "Pacific Grove" },
  { value: "seaside", label: "Seaside" },
  { value: "marina", label: "Marina" },
  { value: "salinas", label: "Salinas" },
  { value: "santa_cruz", label: "Santa Cruz" },
  { value: "watsonville", label: "Watsonville" },
  { value: "castroville", label: "Castroville" },
  { value: "other", label: "Other" },
];

type Step = "form" | "sent";

export default function VerifyPage() {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [town, setTown] = useState("");
  const [consentRules, setConsentRules] = useState(false);
  const [consentPublish, setConsentPublish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consentRules) { setError("You must agree to the campaign rules."); return; }
    setLoading(true);
    setError("");
    try {
      await participantsApi.register({ name, email, city, zip, town, consent_campaign_rules: consentRules, consent_publish_submission: consentPublish });
      setStep("sent");
    } catch (err: any) {
      setError(err?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "sent") {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-3">Check your inbox</h1>
          <p className="text-zinc-400 mb-2">We sent a verification link to <strong className="text-amber-400">{email}</strong>.</p>
          <p className="text-zinc-500 text-sm">Click the link in the email to verify your address and unlock your submission. The link expires in 24 hours.</p>
          <div className="mt-8"><Link href="/250" className="text-amber-400 hover:text-amber-300 text-sm">← Back to KRML 250</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="mb-8"><Link href="/250" className="text-zinc-500 hover:text-zinc-300 text-sm">← Back to KRML 250</Link></div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Join KRML 250</h1>
          <p className="text-zinc-400">Verify your email to submit your three songs.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500" placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500" placeholder="you@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">City</label>
              <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500" placeholder="City" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">ZIP Code</label>
              <input type="text" required value={zip} onChange={(e) => setZip(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500" placeholder="93940" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Your Town</label>
            <select required value={town} onChange={(e) => setTown(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-amber-500">
              <option value="" disabled>Select your town</option>
              {TOWNS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consentRules} onChange={(e) => setConsentRules(e.target.checked)} className="mt-1 w-4 h-4 accent-amber-500" />
              <span className="text-zinc-400 text-sm">I have read and agree to the <Link href="/250/rules" className="text-amber-400 hover:underline">KRML 250 campaign rules</Link>. <span className="text-red-400">*</span></span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consentPublish} onChange={(e) => setConsentPublish(e.target.checked)} className="mt-1 w-4 h-4 accent-amber-500" />
              <span className="text-zinc-400 text-sm">I consent to having my submission and name published publicly as part of the KRML 250 campaign.</span>
            </label>
          </div>
          {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 font-bold py-4 rounded-xl text-lg transition-colors">
            {loading ? "Sending..." : "Send Verification Email"}
          </button>
        </form>
      </div>
    </div>
  );
}
