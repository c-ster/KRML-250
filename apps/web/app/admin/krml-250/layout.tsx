"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminSession } from "@/hooks/useParticipantSession";

const NAV_ITEMS = [
  { href: "/admin/krml-250", label: "Dashboard" },
  { href: "/admin/krml-250/participants", label: "Participants" },
  { href: "/admin/krml-250/songs", label: "Songs" },
  { href: "/admin/krml-250/submissions", label: "Submissions" },
  { href: "/admin/krml-250/defenses", label: "Defenses" },
  { href: "/admin/krml-250/predictions", label: "Predictions" },
  { href: "/admin/krml-250/rankings", label: "Rankings" },
  { href: "/admin/krml-250/sponsors", label: "Sponsors" },
  { href: "/admin/krml-250/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { adminToken, loaded, saveAdminToken } = useAdminSession();
  const [tokenInput, setTokenInput] = useState("");
  const pathname = usePathname();

  if (!loaded) return <div className="min-h-screen bg-zinc-900 flex items-center justify-center"><p className="text-zinc-400 animate-pulse">Loading...</p></div>;

  if (!adminToken) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">Admin Access</h1>
          <p className="text-zinc-400 mb-6">Enter the admin token to continue.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (tokenInput.trim()) saveAdminToken(tokenInput.trim()); }} className="space-y-3">
            <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Admin token" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500" />
            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold py-3 rounded-lg transition-colors">Enter</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex">
      <nav className="w-52 flex-shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col">
        <div className="px-4 py-5 border-b border-zinc-800">
          <div className="text-amber-400 font-bold text-sm">KRML 250 Admin</div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={`block px-4 py-2.5 text-sm transition-colors ${pathname === item.href ? "text-amber-400 bg-amber-500/10 border-r-2 border-amber-500" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"}`}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-zinc-800">
          <Link href="/250" className="text-zinc-600 hover:text-zinc-400 text-xs">← Public site</Link>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
