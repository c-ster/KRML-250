# KRML 250 — The Soundtrack of the Monterey Bay

A listener-driven music campaign for KRML radio station. Verified participants submit 3 songs, swipe-vote on songs, write defenses, and predict the Top 5.

**Reveal date**: July 3, 2026

## Structure

```
apps/web    Next.js 14 (App Router) — public at /250, admin at /admin/krml-250
apps/api    FastAPI — all backend logic, PostgreSQL
packages/types  Shared TypeScript interfaces
```

## Quick Start

### API
```bash
cd apps/api
python -m venv venv && source venv/bin/activate
pip install -e .
cp .env.example .env  # fill in values
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```

### Web
```bash
cd apps/web
cp .env.example .env.local  # fill in values
npm install
npm run dev
```
