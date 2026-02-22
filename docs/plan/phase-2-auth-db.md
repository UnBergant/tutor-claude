# Phase 2: Auth & Database

## Goal
Google OAuth login, database schema, base app layout with protected routes.

## Steps

1. **Prisma Schema** — User, UserProfile, Assessment, Module, Lesson, LessonProgress, Exercise, ExerciseAttempt, VocabularyWord, MistakeEntry, ChatMessage, AiUsage, AiLimits
2. **Auth.js setup** — Google OAuth provider, session strategy, user creation on first login
3. **Protected routes** — Next.js middleware for (app)/ routes, redirect to login
4. **App Layout** — sidebar navigation, user avatar, mobile-responsive
5. **AI rate-limiting foundation** — AiUsage tracking table, AiLimits per user, flexible settings in DB

## Verification
- Google login → session → user saved in DB
- Protected routes redirect to login
- Prisma Studio shows data
- AI usage tracking records token consumption
