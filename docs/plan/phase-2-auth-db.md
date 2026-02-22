# Phase 2: Auth & Database

## Goal
Google OAuth login, database schema, base app layout with protected routes.

## Steps

1. **Prisma Schema** — User, UserProfile, Assessment, AssessmentAnswer, Module, Lesson, LessonBlock, LessonProgress, Exercise, ExerciseAttempt, VocabularyWord, MistakeEntry, UserInterest, AiUsage, AiLimits, AiSettings
   - **No `ChatMessage` model** — per Conversation Data Strategy (PRODUCT.md): do NOT store full chat history. Chat messages exist only in-memory during session. Extracted insights stored as `MistakeEntry` and `UserInterest`
   - Full schema spec with fields, types, relations, and indexes: `docs/dev/database.md` (create before implementation)
2. **Auth.js setup** — Google OAuth provider, PrismaAdapter, JWT session strategy, user creation callback on first login
   - Middleware matcher: `/(app)/` routes only
   - Session includes `userId` via JWT callback
3. **Protected routes** — Next.js middleware for (app)/ routes, redirect to login
4. **App Layout** — sidebar navigation, user avatar, mobile-responsive
5. **AI rate-limiting foundation** — AiUsage tracking table, AiLimits per user, AiSettings (model defaults per endpoint), flexible settings in DB

## Verification
- Google login → session → user saved in DB
- Protected routes redirect to login
- Prisma Studio shows data
- AI usage tracking records token consumption
