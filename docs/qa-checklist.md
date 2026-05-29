# KRML 250 QA & Launch Checklist

## Pre-Launch Setup

- [ ] PostgreSQL database provisioned and accessible
- [ ] `DATABASE_URL` environment variable configured (API)
- [ ] `SECRET_KEY` set to a strong random value
- [ ] `ADMIN_TOKEN` set to a strong secret
- [ ] `EMAIL_PROVIDER` configured (`none` for dev, `smtp` or `sendgrid` for prod)
- [ ] `FRONTEND_URL` set to production domain
- [ ] `NEXT_PUBLIC_API_URL` and `API_URL` configured in web app
- [ ] `ADMIN_SECRET` set in web app (same as `ADMIN_TOKEN`)
- [ ] Alembic migrations run: `cd apps/api && alembic upgrade head`
- [ ] Seed data loaded (dev only): `python seed.py`
- [ ] CORS origins updated for production domain

---

## Participant Flow

### Registration
- [ ] Visit `/250/verify` and fill out the registration form
- [ ] All required fields validated (name, email, city, zip, town, consent)
- [ ] Consent checkbox required to proceed
- [ ] Form submission sends a verification email (check logs/inbox)

### Email Verification
- [ ] Verification email received with correct link
- [ ] Clicking link navigates to `/250/verify/[token]`
- [ ] Valid token verifies account and redirects to `/250/submit`
- [ ] Invalid/expired token shows error with "Try Again" link
- [ ] After verification, `krml250_token` stored in localStorage
- [ ] Cookie set for middleware protection

---

## Submission Flow

- [ ] Navigate to `/250/submit` (requires auth)
- [ ] Three song slots with autocomplete
- [ ] `why_text` required for each slot (max 500 chars)
- [ ] Validation: all 3 songs required, no duplicates
- [ ] Submission succeeds and prompts to swipe

### One-Time Edit
- [ ] Navigate to `/250/edit`
- [ ] Edit succeeds and sets `has_used_edit=true`
- [ ] Visiting again shows "already used" screen

---

## Swipe Voting Flow

- [ ] Navigate to `/250/swipe` (requires auth)
- [ ] Songs loaded from API (batch of 10)
- [ ] Yes/No/Unsure buttons record votes
- [ ] "Write a Defense" links to `/250/defend/[songId]`
- [ ] After all songs, done screen appears

---

## Admin Portal (`/admin/krml-250`)

- [ ] Admin token stored in sessionStorage
- [ ] Dashboard metrics load
- [ ] Participants searchable, CSV export works
- [ ] Songs editable inline, merge works
- [ ] Defenses filterable, approve/reject works
- [ ] Rankings compute, freeze button works
- [ ] Settings toggles update immediately

---

## Reveal Day Checklist (July 3, 2026)

- [ ] Freeze rankings via admin
- [ ] Set `results_published=true`
- [ ] After on-air announcement, set `top5_revealed=true`
- [ ] Archive exported CSVs
