# Phase 1: Auth, Database & App Shell

## Goal
Working authenticated app with database, basic layouts, minimal design tokens, and early deploy. User can sign in, see the app shell, and navigate.

## Steps

1. **Minimal Design Tokens** — Celestia color palette, base font, CSS custom properties for shadcn/ui in `globals.css` via Tailwind v4 `@theme`. Just enough to avoid default grey UI — not a full design system
2. **Prisma Schema** — User, UserProfile, Assessment, AssessmentAnswer, Module, Lesson, LessonBlock, LessonProgress, Exercise, ExerciseAttempt, VocabularyWord, MistakeEntry, UserInterest, AiUsage, AiLimits, AiSettings
   - **No `ChatMessage` model** — per Conversation Data Strategy (PRODUCT.md): do NOT store full chat history. Chat messages exist only in-memory during session. Extracted insights stored as `MistakeEntry` and `UserInterest`
   - Full schema spec with fields, types, relations, and indexes: `docs/dev/database.md` (create before implementation)
3. **Auth.js setup** — Google OAuth provider, PrismaAdapter, JWT session strategy, user creation callback on first login
   - Middleware matcher: `/(app)/` routes only
   - Session includes `userId` via JWT callback
4. **Protected routes** — Next.js middleware for (app)/ routes, redirect to login
5. **Layout Components** — AppLayout (sidebar + content), AuthLayout, responsive navigation
6. **AI rate-limiting foundation** — AiUsage tracking table, AiLimits per user, AiSettings (model defaults per endpoint)
7. **Early deploy** — Vercel (full-stack Next.js) + Neon (PostgreSQL), environment variables, basic error tracking

## Verification
- Google login → session → user saved in DB
- Protected routes redirect to login
- Prisma Studio shows data
- App shell renders with Celestia branding (not default grey)
- Layout works on mobile (320px) through desktop (1440px)
- App accessible on production URL