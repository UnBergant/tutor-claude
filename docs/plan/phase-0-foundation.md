# Phase 0: Project Foundation & Tooling

## Goal
Set up Next.js project with all tooling configured.

## Steps

1. **Next.js init** — App Router, TypeScript, Tailwind CSS
2. **shadcn/ui** — install and configure, add base components (Button, Card, Input, Dialog, Select, Tabs, Toast, Badge, Progress, Avatar)
3. **Project structure** — FSD-lite: `src/app/`, `src/modules/`, `src/shared/`
4. **Prisma** — init schema, PostgreSQL connection
5. **Tooling** — Biome (lint/format), Vitest, Playwright, Husky + lint-staged
6. **Auth.js** — next-auth v5, Google provider, session management
7. **.nvmrc** — pin Node version
8. **Update docs** — CLAUDE.md + AGENTS.md with new structure and commands

## Key Files
- package.json, next.config.ts, tailwind.config.ts
- components.json (shadcn/ui)
- prisma/schema.prisma
- biome.json
- src/app/layout.tsx, src/app/globals.css

## Verification
- `npm run build` — project builds
- `npm run dev` — app starts on localhost:3000
- `npm run lint` — Biome checks pass
- shadcn/ui components render on test page
- Auth.js Google login works
