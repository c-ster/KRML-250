"use client";

import { useCallback, useEffect, useState } from "react";
import { participantsApi, type Participant } from "@/lib/api";

interface Session {
  token: string;
  participant: Participant;
}

export function useParticipantSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("krml250_token");
    const raw = localStorage.getItem("krml250_participant");
    if (token && raw) {
      try {
        const participant = JSON.parse(raw) as Participant;
        setSession({ token, participant });
      } catch {
        localStorage.removeItem("krml250_token");
        localStorage.removeItem("krml250_participant");
      }
    }
    setLoading(false);
  }, []);

  const saveSession = useCallback((token: string, participant: Participant) => {
    localStorage.setItem("krml250_token", token);
    localStorage.setItem("krml250_participant", JSON.stringify(participant));
    setSession({ token, participant });
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem("krml250_token");
    localStorage.removeItem("krml250_participant");
    setSession(null);
  }, []);

  const refreshParticipant = useCallback(async () => {
    try {
      const participant = await participantsApi.me();
      localStorage.setItem("krml250_participant", JSON.stringify(participant));
      setSession((prev) => (prev ? { ...prev, participant } : null));
    } catch {
      clearSession();
    }
  }, [clearSession]);

  return {
    session,
    loading,
    isAuthenticated: session !== null,
    participant: session?.participant ?? null,
    saveSession,
    clearSession,
    refreshParticipant,
  };
}

export function useAdminSession() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("krml250_admin_token");
    setAdminToken(token);
    setLoaded(true);
  }, []);

  const saveAdminToken = useCallback((token: string) => {
    sessionStorage.setItem("krml250_admin_token", token);
    setAdminToken(token);
  }, []);

  const clearAdminToken = useCallback(() => {
    sessionStorage.removeItem("krml250_admin_token");
    setAdminToken(null);
  }, []);

  return {
    adminToken,
    loaded,
    isAdmin: adminToken !== null,
    saveAdminToken,
    clearAdminToken,
  };
}
