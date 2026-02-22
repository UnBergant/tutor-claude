# Phase 0: Project Foundation & Tooling

## Goal
Set up Next.js project with tooling and project structure. No features — only infrastructure.

## Steps

1. **Next.js init** — App Router, TypeScript, Tailwind CSS
2. **shadcn/ui** — install and configure, add base components (Button, Card, Input, Dialog, Select, Tabs, Toast, Badge, Progress, Avatar)
3. **Project structure** — FSD-lite: `src/app/`, `src/modules/`, `src/shared/`
4. **Tooling** — Biome (lint/format), Vitest, Playwright, Husky + lint-staged
   - **Biome**: single config for lint + format. Key rules: double quotes, semicolons, 2-space indent, organize imports, no unused variables, no `any` type
   - **Husky**: `pre-commit` hook only — runs lint-staged
   - **lint-staged**: run `biome check --write` on staged `*.{ts,tsx,js,json}` files
   - **Vitest**: minimal config, colocated test files (`*.test.ts` next to source)
   - **Playwright**: minimal config, `tests/e2e/` directory at root
5. **.nvmrc** — pin Node version (current LTS)
6. **Update docs** — CLAUDE.md + AGENTS.md with new structure and commands

## Key Files
- package.json, next.config.ts, tailwind.config.ts
- components.json (shadcn/ui)
- biome.json
- src/app/layout.tsx, src/app/globals.css

## Verification
- `npm run build` — project builds
- `npm run dev` — app starts on localhost:3000
- `npm run lint` — Biome checks pass
- shadcn/ui components render on test page
