# Phase 6: Design Polish & Production

> **Known issues:** see [design-issues.md](../dev/design-issues.md) and [product-issues.md](../dev/product-issues.md) (filter by "Phase 6")

## Goal
Full design system finalization, component catalog, mobile verification, E2E tests, production hardening. Runs after all features are built and UX is validated.

## Steps

### Design System & Storybook
1. **Design Documentation** — create `docs/design/tokens.md` (source of truth: colors, typography, spacing, radius, shadows) and `docs/design/components.md` (component specs: variants, states, behavior). AI-designer workflow: spec → implement → verify in Storybook.
2. **Design System Layer** — two-part approach:
   - **Wrapper components** (`src/shared/ui/`) for variative elements: `<Text variant="heading">`, `<Stack gap="md">`, `<Card variant="section">`, `<ExerciseChip state="correct">`. Extend existing shadcn components (Button already has CVA variants) rather than creating parallel abstractions.
   - **tw presets** (`src/shared/styles/tw-presets.ts`) — JS string constants for non-component patterns (e.g. `tw.fadeIn`, `tw.badge`, `tw.avatar`). Used with `cn()` for predictable overrides via `tailwind-merge`. Rule: extract to preset only if used 3+ times. Keep `@apply` only for animations and pseudo-elements (already in place).
3. **Storybook 8** — install and configure (Vite-based, works with Next.js + Tailwind v4). Write `.stories.tsx` for all shared UI components (~15 shadcn + ~10 custom). Auto-generated controls from TS types, a11y addon.
4. **Design Tokens (full)** — finalize Tailwind theme: refine colors, typography scale, spacing, radius, shadows based on real usage from Phases 1-5
5. **Component Polish** — audit and refine all shadcn/ui customizations, consistent visual language across all features
6. **Mobile-first Verification** — all components work on 320px+ screens, touch targets minimum 44px, test on real devices
7. **Animations & Transitions** — consistent motion design, loading states, micro-interactions

### Refactoring
8. **Decompose `lesson/actions.ts`** (789 LOC) — extract types → `types.ts`, SRS logic → `lib/srs.ts`, AI generation helpers → `generation.ts`; keep `queries.ts` for reads

### Production Hardening
9. **E2E Tests (Playwright)** — 3-5 critical flows: login → assessment → lesson → chat → vocabulary
10. **Performance** — lazy loading, image optimization (Next.js Image), AI response caching
11. **Production Config** — environment variables audit, error tracking, monitoring, analytics
12. **Update Docs** — CLAUDE.md, README.md with production URLs and setup instructions

## Verification
- `docs/design/` contains up-to-date token and component specs
- Wrapper components (`Text`, `Stack`, `Card`, `ExerciseChip`) cover all variative patterns
- tw presets used consistently for non-component patterns, no raw Tailwind duplication
- Storybook renders all components with all variants and states
- All base components render correctly with final theme
- Changing Tailwind theme variables updates entire design
- Layout works on mobile (320px) through desktop (1440px)
- Touch targets minimum 44px on real devices
- E2E tests pass
- App works on production URL
- AI rate limits enforced in production
