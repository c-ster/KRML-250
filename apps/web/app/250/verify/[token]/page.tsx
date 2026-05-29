"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { participantsApi } from "@/lib/api";
import { useParticipantSession } from "@/hooks/useParticipantSession";

interface Props {
  params: { token: string };
}

export default function VerifyTokenPage({ params }: Props) {
  const router = useRouter();
  const { saveSession } = useParticipantSession();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [participantName, setParticipantName] = useState("");

  useEffect(() => {
    async function verify() {
      try {
        const result = await participantsApi.verify(params.token);
        saveSession(result.access_token, result.participant);
        document.cookie = `krml250_token=${result.access_token}; path=/; max-age=${60 * 60 * 24 * 30}`;
        setParticipantName(result.participant.name);
        setStatus("success");
        setTimeout(() => router.push("/250/submit"), 2000);
      } catch (err: any) {
        setError(err?.detail || "This verification link is invalid or has expired.");
        setStatus("error");
      }
    }
    verify();
  }, [params.token, saveSession, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🎵</div>
          <p className="text-zinc-300 text-lg">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">Welcome, {participantName}!</h1>
          <p className="text-zinc-400 mb-2">Your email is verified. Redirecting you to submit your songs...</p>
          <Link href="/250/submit" className="text-amber-400 hover:text-amber-300 text-sm">Click here if not redirected →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-3">Verification Failed</h1>
        <p className="text-zinc-400 mb-6">{error}</p>
        <Link href="/250/verify" className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold px-6 py-3 rounded-xl transition-colors">Try Again</Link>
      </div>
    </div>
  );
}
