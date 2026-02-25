# Phase 6: Design Polish & Production

## Goal
Full design system finalization, mobile verification, E2E tests, production hardening. Runs after all features are built and UX is validated.

## Steps

### Design System Polish
1. **Design Tokens (full)** — finalize Tailwind theme: refine colors, typography scale, spacing, radius, shadows based on real usage from Phases 1-5
2. **Component Polish** — audit and refine all shadcn/ui customizations, consistent visual language across all features
3. **Mobile-first Verification** — all components work on 320px+ screens, touch targets minimum 44px, test on real devices
4. **Animations & Transitions** — consistent motion design, loading states, micro-interactions

### Production Hardening
5. **E2E Tests (Playwright)** — 3-5 critical flows: login → assessment → lesson → chat → vocabulary
6. **Performance** — lazy loading, image optimization (Next.js Image), AI response caching
7. **Production Config** — environment variables audit, error tracking, monitoring, analytics
8. **Update Docs** — CLAUDE.md, README.md with production URLs and setup instructions

## Verification
- All base components render correctly with final theme
- Changing Tailwind theme variables updates entire design
- Layout works on mobile (320px) through desktop (1440px)
- Touch targets minimum 44px on real devices
- E2E tests pass
- App works on production URL
- AI rate limits enforced in production
