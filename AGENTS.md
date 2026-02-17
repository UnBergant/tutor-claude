# AGENTS.md

This file provides guidance to OpenAI Codex when working with code in this repository.
This project uses both Claude Code (CLAUDE.md) and OpenAI Codex (AGENTS.md) simultaneously. Keep both files in sync when making changes to project instructions.

## Build

```bash
npm run build    # compiles TypeScript to dist/ via tsc
```

No test runner or linter is configured yet.

## Project Overview

**Celestia** — an AI-powered personal Spanish tutor web app. Combines real tutor personalization with interactive Duolingo/Skyeng-style exercises. Spanish from Spain (Castellano), not Latin American. Interface language: Russian (MVP).

Key docs:
- `PRODUCT.md` — product vision, problem statement, MVP features (assessment, personal program, interactive exercises, chat with Celestia, gamification), and phased roadmap
- `TECH.md` — architecture, tech stack, hosting, and key technical decisions

## Architecture

- **Turborepo monorepo** — `apps/web` (Next.js), `apps/api` (NestJS), `packages/shared` (shared types)
- **Frontend**: Next.js (App Router) on Vercel, mobile-first
- **Backend**: NestJS + Prisma + PostgreSQL on Railway
- **AI**: Claude API for lesson/exercise generation, assessment, conversation, mistake correction
- **Auth**: Google OAuth
