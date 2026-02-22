# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
This project uses both Claude Code (CLAUDE.md) and OpenAI Codex (AGENTS.md) simultaneously. Keep both files in sync when making changes to project instructions.

## Build

```bash
npm run build    # compiles TypeScript to dist/ via tsc
```

No test runner or linter is configured yet.

## Project Overview

**Celestia** — an AI-powered personal Spanish tutor web app. Combines real tutor personalization with interactive Duolingo/Skyeng-style exercises. Spanish from Spain (Castellano), not Latin American. Interface language: English (MVP).

Key docs:
- `docs/PRODUCT.md` — product vision, problem statement, MVP features (assessment, personal program, interactive exercises, chat with Celestia, gamification), and phased roadmap
- `docs/TECH.md` — architecture, tech stack, hosting, and key technical decisions
- `docs/grammar/` — complete A1-C2 grammar topic tree based on Instituto Cervantes Plan Curricular, used as reference for assessment and lesson generation

## Current Codebase

- Single-package TypeScript project.
- Entry point: `src/index.ts` (currently a minimal stub).
- Build output: `dist/` via `tsc` (`npm run build`).
- No tests or linting configured.

## Architecture (Docs)

- Single Next.js project (App Router) — Server Actions + Route Handlers replace the need for a separate backend.
- Stack: Next.js, Tailwind CSS, shadcn/ui, Prisma + PostgreSQL (Neon), Auth.js (next-auth v5), Claude API.
- FSD-lite structure: `src/app/` (routes), `src/modules/` (features), `src/shared/` (UI, lib, hooks, types).
- Full details in `docs/TECH.md`.

## Codex CLI — Second Opinion Skills

OpenAI Codex CLI (v0.104.0+) установлен глобально. Два кастомных скилла доступны глобально (`~/.claude/commands/`):

- `/toxic-opinion` — второе мнение от Codex по любому вопросу. Claude анализирует задачу, составляет адаптивный промт, запускает Codex неинтерактивно, синтезирует два анализа.
- `/toxic-review` — двойное код-ревью: Codex CLI review + собственное ревью Claude, объединение находок.

**Когда предлагать пользователю:** архитектурные решения, спорные подходы, сложный дебаг — ситуации, где вторая перспектива добавляет ценность.
