# Phase 8: Polish & Deploy

## Goal
Finalization, E2E tests, deployment.

## Steps

1. **E2E tests (Playwright)** — 3-5 critical flows: login → assessment → lesson → chat → vocabulary
2. **Performance** — lazy loading, image optimization (Next.js Image), AI response caching
3. **Mobile polish** — test on real devices, touch interactions, viewport handling
4. **Deploy** — Vercel (full-stack Next.js), Vercel Postgres or Neon (PostgreSQL), environment variables
5. **Update docs** — CLAUDE.md, README.md with production URLs and setup instructions

## Verification
- E2E tests pass
- App works on production URL
- Mobile UI correct on real devices
- AI rate limits enforced in production
