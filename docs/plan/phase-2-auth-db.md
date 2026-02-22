# Phase 2: Auth & Database

## Goal
Google OAuth login, database schema, base app layout.

## Steps

1. **Prisma Schema** — User, UserProfile, Assessment, Module, Lesson, LessonProgress, Exercise, ExerciseAttempt, VocabularyWord, MistakeEntry, ChatMessage
2. **NestJS Auth** — Google OAuth 2.0 (Passport.js), JWT tokens (access + refresh), Guards, @CurrentUser() decorator
3. **Client Auth** — Login page, Zustand auth store, API client with JWT, protected routes middleware
4. **App Layout** — root layout, (auth)/login, (app)/layout with sidebar + navbar

## Verification
- Google login → JWT → user saved in DB
- Protected routes redirect to login
- Prisma Studio shows data
