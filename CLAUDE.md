# KRML 250 — Project Guide for Claude

## What This Is
A listener-driven music campaign for KRML 94.7 Radio (Monterey Bay, CA). Listeners submit 3 songs, swipe-vote nominations, write defenses, and predict the Top 5. Results reveal July 3, 2026.

## Architecture
- **`apps/web`** — Next.js 14 frontend, deployed to Vercel
- **`apps/api`** — FastAPI backend, deployed to Railway
- **`packages/`** — shared types (if any)
- Database: PostgreSQL on Railway

### API proxy
Next.js rewrites `/api/v1/*` → `${API_URL}/api/v1/*` (see `apps/web/next.config.mjs`).
`API_URL` must be set in Vercel env vars pointing to the Railway public URL:
`https://krml-250-production.up.railway.app`

The Railway internal URL (`krml-250.railway.internal`) is only for service-to-service calls within Railway.

## Design System
The KRML 250 site uses the KRML Radio brand palette — warm, coastal California editorial aesthetic.

| Token | Hex | Usage |
|-------|-----|-------|
| Sand | `#F5F3EF` | Page background |
| White | `#FFFFFF` | Card backgrounds |
| Charcoal | `#1F1F1F` | Primary text |
| Muted | `#6B6560` | Secondary text, labels |
| Faint | `#8A8480` | Placeholder, metadata |
| Border | `#D8D4CE` | Card borders, dividers |
| Ocean teal | `#2F5D62` | Primary CTA buttons, links, progress bars |
| Teal dark | `#245059` | Hover state for teal |
| Gold | `#C9A66B` | Accent: ranks, DJ picks, badges |
| Gold dark | `#B8924A` | Hover state for gold |

**Typography:**
- Headings: `font-serif` (Georgia) — `<h1>`, `<h2>`, section titles
- Body: system sans-serif (no import needed)
- Use `font-serif font-bold` on page titles and card headers

**Component patterns:**
- Cards: `bg-white border border-[#D8D4CE] rounded-xl` with `hover:border-[#C9A66B]`
- Primary button: `bg-[#2F5D62] hover:bg-[#245059] text-white font-bold rounded-xl`
- Gold accent button/border: `border border-[#C9A66B]/50 text-[#B8924A] hover:bg-[#C9A66B]/10`
- Inputs: `bg-[#F5F3EF] border border-[#D8D4CE] focus:border-[#2F5D62]`
- Error states: `bg-red-50 border border-red-200 text-red-600`
- Empty states: `text-[#8A8480]`
- Back links: `text-[#6B6560] hover:text-[#1F1F1F] text-sm`

**Do NOT use:** dark zinc classes (`bg-zinc-900`, `text-zinc-100`, etc.) or amber (`text-amber-400`, `bg-amber-500`). The amber/zinc dark theme has been replaced.

## Key Files
- `apps/web/app/globals.css` — CSS custom properties for KRML colors
- `apps/web/app/layout.tsx` — root layout, body background
- `apps/web/app/250/page.tsx` — landing page (server component, fetches leaderboard)
- `apps/web/app/250/verify/page.tsx` — join/sign-in form
- `apps/web/app/250/submit/page.tsx` — song submission (requires auth)
- `apps/web/app/250/swipe/page.tsx` — swipe voting (requires auth)
- `apps/web/app/250/predict/page.tsx` — Top 5 prediction (requires auth)
- `apps/web/lib/api.ts` — typed API client (all calls go through `/api/v1/*`)
- `apps/api/app/routers/participants.py` — registration + email verification
- `apps/api/app/services/email.py` — email sending (SMTP or SendGrid)
- `apps/api/app/core/config.py` — environment variable definitions

## Auth Flow
1. User POSTs to `/api/v1/participants` → gets verification email
2. Email links to `/250/verify/{token}` → POSTs to `/api/v1/participants/verify`
3. Returns JWT stored in `localStorage` as `krml250_token`
4. Protected pages check auth via `useParticipantSession` hook

## Email Configuration (Railway env vars)
```
EMAIL_PROVIDER=smtp   # or: sendgrid | none (logs only, for dev)
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
FROM_EMAIL=noreply@krml.com
FRONTEND_URL=https://krml-250-web.vercel.app
```

## Common Tasks

### Restyling a page
Use the KRML color tokens above. Headings get `font-serif`. Primary actions use ocean teal. Gold is for accents only.

### Adding a new API endpoint
1. Add route to `apps/api/app/routers/<router>.py`
2. Add typed wrapper to `apps/web/lib/api.ts`
3. Use via the api client in the page/component

### Fixing a build failure on Vercel
The `/250` landing page is a server component that fetches from the API at build time. Always guard array data with `Array.isArray()` before using `.slice()` or array methods — the API may be unreachable during Vercel builds.

### Deployment
- **Web**: push to `main` (or connected branch) → Vercel auto-deploys
- **API**: push to connected Railway branch → Railway auto-deploys
- Railway branch connected to production: `claude/lucid-babbage-fAdGH`
