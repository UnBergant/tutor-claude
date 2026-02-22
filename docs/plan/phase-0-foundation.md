# Phase 0: Monorepo Foundation & Tooling

## Goal
Convert from stub to working Turborepo monorepo with configured tooling.

## Steps

1. **Turborepo init** — root package.json (workspaces), turbo.json pipeline (build, lint, test, dev), remove src/index.ts stub
2. **Create packages** — apps/web (Next.js App Router), apps/api (NestJS), packages/shared (types, constants, utils)
3. **Next.js setup** — App Router, TypeScript, path aliases, CSS Modules
4. **NestJS setup** — TypeScript strict, modular structure (auth/, users/, lessons/, exercises/, chat/)
5. **Shared package** — TypeScript types, constants, Zod schemas
6. **Tooling** — Biome (lint/format), Vitest (tests), Husky + lint-staged (pre-commit), .nvmrc
7. **Update docs** — TECH.md, CLAUDE.md, AGENTS.md

## Key Files
- turbo.json, root package.json
- apps/web/package.json, apps/web/next.config.ts
- apps/api/package.json, apps/api/nest-cli.json
- packages/shared/package.json, packages/shared/tsconfig.json
- biome.json

## Verification
- `npm run build` — all 3 packages build
- `npm run dev` — web and api start in parallel
- `npm run lint` — Biome checks entire monorepo
