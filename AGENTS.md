# AGENTS.md

This file provides guidance to OpenAI Codex when working with code in this repository.
This project uses both Claude Code (CLAUDE.md) and OpenAI Codex (AGENTS.md) simultaneously. Keep both files in sync when making changes to project instructions.

## Prerequisites

```bash
nvm use          # activate Node version from .nvmrc (required before any npm command)
npm install      # install dependencies
```

## Build & Dev

```bash
npm run dev      # start dev server (Turbopack) on localhost:3000
npm run build    # production build via Next.js
npm run start    # start production server
npm run lint     # run Biome linter
npm run lint:fix # auto-fix lint issues
npm run format   # auto-format with Biome
npm run test     # run unit tests (Vitest)
npm run test:e2e # run E2E tests (Playwright)
```

## Project Overview

**Celestia** — an AI-powered personal Spanish tutor web app. Combines real tutor personalization with interactive Duolingo/Skyeng-style exercises. Spanish from Spain (Castellano), not Latin American. Interface language: English (MVP).

Key docs:
- `docs/PRODUCT.md` — product vision, problem statement, MVP features (assessment, personal program, interactive exercises, chat with Celestia, gamification), and phased roadmap
- `docs/TECH.md` — architecture, tech stack, hosting, and key technical decisions
- `docs/grammar/` — complete A1-C2 grammar topic tree based on Instituto Cervantes Plan Curricular, used as reference for assessment and lesson generation
- `docs/plan/` — phased implementation roadmap (Phase 0–8)
- `docs/dev/` — technical decision docs (architecture, AI integration, state, styling, testing, API design)

## Current Codebase

- Next.js 16 project with App Router, TypeScript, Tailwind CSS v4, shadcn/ui.
- FSD-lite structure: `src/app/` (routes), `src/modules/` (features), `src/shared/` (UI, lib, hooks, types).
- Linting & formatting: Biome (double quotes, semicolons, 2-space indent).
- Testing: Vitest (unit, colocated `*.test.ts`), Playwright (E2E, `tests/e2e/`).
- Git hooks: Husky + lint-staged (pre-commit runs `biome check --write`).
- shadcn/ui components in `src/shared/ui/` — Button, Card, Input, Dialog, Select, Tabs, Sonner, Badge, Progress, Avatar.
- Path alias: `@/*` → `src/*`.

## Architecture

- Single Next.js project (App Router) — Server Actions + Route Handlers replace the need for a separate backend.
- Stack: Next.js, Tailwind CSS, shadcn/ui, Prisma + PostgreSQL (Neon), Auth.js (next-auth v5), Claude API.
- FSD-lite: `src/app/` (routes), `src/modules/` (features), `src/shared/` (UI, lib, hooks, types).
- Import rule: `modules/` import from `shared/`, never from each other.
- Full details in `docs/TECH.md`.
