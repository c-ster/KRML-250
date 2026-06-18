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
  const [devVerifyUrl, setDevVerifyUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consentRules) { setError("You must agree to the campaign rules."); return; }
    setLoading(true);
    setError("");
    try {
      const result = await participantsApi.register({ name, email, city, zip, town, consent_campaign_rules: consentRules, consent_publish_submission: consentPublish });
      if (result.dev_verify_url) setDevVerifyUrl(result.dev_verify_url);
      setStep("sent");
    } catch (err: any) {
      setError(err?.detail ? `${err.detail}${err.status ? ` (${err.status})` : ""}` : `Something went wrong. Please try again.${err?.status ? ` (${err.status})` : ""}`);
    } finally {
      setLoading(false);
    }
  }

  if (step === "sent") {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="font-serif text-2xl font-bold text-[#1F1F1F] mb-3">Check your inbox</h1>
          <p className="text-[#6B6560] mb-2">We sent a verification link to <strong className="text-[#2F5D62]">{email}</strong>.</p>
          <p className="text-[#8A8480] text-sm">Click the link in the email to verify your address and unlock your submission. The link expires in 24 hours.</p>
          {devVerifyUrl && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-left">
              <p className="font-medium text-amber-800 mb-1">Dev mode — no email sent</p>
              <a href={devVerifyUrl} className="text-[#2F5D62] underline break-all">Click here to verify directly</a>
            </div>
          )}
          <div className="mt-8"><Link href="/250" className="text-[#2F5D62] hover:text-[#1F1F1F] text-sm">← Back to KRML 250</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="mb-8"><Link href="/250" className="text-[#6B6560] hover:text-[#1F1F1F] text-sm">← Back to KRML 250</Link></div>
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-[#1F1F1F] mb-2">Join KRML 250</h1>
          <p className="text-[#6B6560]">Verify your email to submit your three songs.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-[#D8D4CE] rounded-2xl p-6">
          <div>
            <label className="block text-sm font-medium text-[#1F1F1F] mb-1">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#F5F3EF] border border-[#D8D4CE] rounded-lg px-4 py-3 text-[#1F1F1F] placeholder-[#8A8480] focus:outline-none focus:border-[#2F5D62] transition-colors"
              placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1F1F1F] mb-1">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F5F3EF] border border-[#D8D4CE] rounded-lg px-4 py-3 text-[#1F1F1F] placeholder-[#8A8480] focus:outline-none focus:border-[#2F5D62] transition-colors"
              placeholder="you@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1F1F1F] mb-1">City</label>
              <input type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#F5F3EF] border border-[#D8D4CE] rounded-lg px-4 py-3 text-[#1F1F1F] placeholder-[#8A8480] focus:outline-none focus:border-[#2F5D62] transition-colors"
                placeholder="City" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F1F1F] mb-1">ZIP Code</label>
              <input type="text" required value={zip} onChange={(e) => setZip(e.target.value)}
                className="w-full bg-[#F5F3EF] border border-[#D8D4CE] rounded-lg px-4 py-3 text-[#1F1F1F] placeholder-[#8A8480] focus:outline-none focus:border-[#2F5D62] transition-colors"
                placeholder="93940" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1F1F1F] mb-1">Your Town</label>
            <select required value={town} onChange={(e) => setTown(e.target.value)}
              className="w-full bg-[#F5F3EF] border border-[#D8D4CE] rounded-lg px-4 py-3 text-[#1F1F1F] focus:outline-none focus:border-[#2F5D62] transition-colors">
              <option value="" disabled>Select your town</option>
              {TOWNS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consentRules} onChange={(e) => setConsentRules(e.target.checked)} className="mt-1 w-4 h-4 accent-[#2F5D62]" />
              <span className="text-[#6B6560] text-sm">I have read and agree to the <Link href="/250/rules" className="text-[#2F5D62] hover:underline">KRML 250 campaign rules</Link>. <span className="text-red-500">*</span></span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consentPublish} onChange={(e) => setConsentPublish(e.target.checked)} className="mt-1 w-4 h-4 accent-[#2F5D62]" />
              <span className="text-[#6B6560] text-sm">I consent to having my submission and name published publicly as part of the KRML 250 campaign.</span>
            </label>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#2F5D62] hover:bg-[#245059] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-colors">
            {loading ? "Sending..." : "Send Verification Email"}
          </button>
        </form>
      </div>
    </div>
  );
}
