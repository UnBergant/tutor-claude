# TECH.md — Celestia: Technology Stack

## Architecture

```
┌──────────────────────────────┐
│       Next.js (Vercel)       │
│  App Router + Route Handlers │
│  + Server Actions            │
└──────────┬───────────┬───────┘
           │           │
     ┌─────▼──────┐  ┌─▼────────────┐
     │ PostgreSQL  │  │  Claude API   │
     │ (Neon)      │  │  (Anthropic)  │
     └────────────┘  └──────────────┘
```

## Project Structure

```
celestia/
├── src/
│   ├── app/                    # Next.js App Router (routes)
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx      # App layout (nav, sidebar)
│   │   │   ├── page.tsx        # Home / dashboard
│   │   │   ├── assessment/
│   │   │   ├── lesson/
│   │   │   ├── chat/
│   │   │   └── vocabulary/
│   │   └── api/                # Route Handlers
│   │       └── chat/route.ts   # SSE streaming
│   ├── modules/                # Feature modules (FSD-lite)
│   │   ├── assessment/
│   │   │   ├── components/
│   │   │   ├── actions.ts      # Server Actions
│   │   │   ├── store.ts        # Zustand (complex state)
│   │   │   └── hooks.ts
│   │   ├── onboarding/
│   │   ├── exercise/
│   │   ├── chat/
│   │   ├── lesson/
│   │   ├── vocabulary/
│   │   └── progress/
│   └── shared/
│       ├── ui/                 # shadcn/ui components
│       ├── lib/                # Prisma, AI client, auth, rate limiter
│       ├── hooks/
│       └── types/
├── prisma/
│   └── schema.prisma
├── components.json             # shadcn/ui config
├── tailwind.config.ts
├── next.config.ts
├── biome.json
└── package.json
```

## Technical Decisions

| Aspect | Decision |
|---|---|
| Framework | Next.js (App Router) — full-stack |
| Database | PostgreSQL + Prisma |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (Radix-based, copied into project) |
| Exercises | Custom exercise components (GapFill, MatchPairs, etc.) |
| State (client) | Zustand (complex feature state only) |
| State (server) | TanStack Query |
| Testing | Vitest + Playwright (minimal set) |
| Frontend Architecture | FSD-lite (app / modules / shared) |
| Linting | Biome |
| AI | Claude API (Anthropic) |
| Auth | Auth.js (next-auth v5) + Google provider |
| AI Rate Limiting | Per-account limits (daily/monthly), stored in DB |

## Development Principles

1. **Mobile-first** — Tailwind mobile-first utilities, touch-friendly interface; PWA candidate post-MVP
2. **Separation of Concerns**: Presentation (Tailwind + shadcn/ui) / State (Zustand + TanStack Query) / Logic (hooks, Server Actions)
3. **SOLID**: each module has single responsibility; dependencies via interfaces; Open/Closed via props and composition
4. **FSD-lite**: reusable UI primitives in `shared/ui/`, feature modules in `modules/`, routes in `app/`
5. **Container/Presentational**: container components connect stores and pass data via props to pure presentational components
6. **Server-first**: Server Components by default, Client Components only when needed (interactivity, hooks)

## Hosting & Infrastructure

| Service | What | Tier |
|---|---|---|
| Vercel | Next.js (full-stack) | Free |
| Neon / Vercel Postgres | PostgreSQL | Free tier |
| Anthropic | Claude API | Pay-per-use |

Post-MVP:

| Service | What | Tier |
|---|---|---|
| Upstash | Redis (caching, sessions) | Free tier |

## Key Technical Decisions

- **Single Next.js project over Turborepo monorepo** — Server Actions + Route Handlers eliminate the need for a separate backend; simpler deployment, less boilerplate
- **Tailwind CSS over CSS Modules** — utility-first approach, mobile-first out of the box, no naming overhead, consistent design
- **shadcn/ui over raw Radix UI** — pre-built accessible components, fully customizable (copied into project), Tailwind-native
- **Custom exercise components** — interactive exercise types (GapFill, MatchPairs, etc.) built on top of shadcn/ui primitives
- **Auth.js (next-auth v5) over Passport.js + JWT** — native Next.js integration, built-in session management, Google provider out of the box
- **FSD-lite over full Feature-Sliced Design** — simplified three-layer structure (app / modules / shared) better suited for a single Next.js project
- **Prisma over TypeORM** — better TypeScript integration, cleaner migrations, auto-generated types
- **Zustand only for complex state** — not everywhere; simple state handled by React hooks and Server Components
- **TanStack Query for server state** — automatic caching, deduplication, background refetching
- **Biome over ESLint + Prettier** — single tool for linting and formatting, faster
- **AI rate-limiting per account** — daily/monthly token limits in DB, model selection by task complexity (Haiku for checks, Sonnet for generation)
- **No Redis in MVP** — PostgreSQL handles all MVP needs; Redis added later for caching and scaling
- **Claude API as sole AI provider (MVP)** — handles all generation: assessment, lessons, exercises, conversation

## Detailed Documentation

| Topic | File |
|---|---|
| Architecture & folder structure | [`docs/dev/architecture.md`](dev/architecture.md) |
| Styling approach & component patterns | [`docs/dev/styling.md`](dev/styling.md) |
| State management (Zustand + TanStack Query) | [`docs/dev/state.md`](dev/state.md) |
| Testing strategy | [`docs/dev/testing.md`](dev/testing.md) |
| API design & Route Handlers | [`docs/dev/api-design.md`](dev/api-design.md) |
| AI integration & prompts | [`docs/dev/ai-integration.md`](dev/ai-integration.md) |
