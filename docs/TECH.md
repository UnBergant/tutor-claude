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
│   │   ├── exercise/
│   │   ├── chat/
│   │   ├── lesson/
│   │   └── vocabulary/
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

## Принятые технические решения

| Аспект | Решение |
|---|---|
| Фреймворк | Next.js (App Router) — full-stack |
| БД | PostgreSQL + Prisma |
| Стилизация | Tailwind CSS |
| UI компоненты | shadcn/ui (Radix-based, копируемые) |
| Упражнения | Кастомные exercise-компоненты (GapFill, MatchPairs и т.д.) |
| State (client) | Zustand (только сложный feature-стейт) |
| State (server) | TanStack Query |
| Тесты | Vitest + Playwright (минимальный набор) |
| Фронт-архитектура | FSD-lite (app / modules / shared) |
| Линтинг | Biome |
| AI | Claude API (Anthropic) |
| Auth | Auth.js (next-auth v5) + Google provider |
| AI rate-limiting | Per-account лимиты (daily/monthly), хранятся в БД |

## Принципы разработки

1. **Mobile-first** — Tailwind mobile-first утилиты, touch-friendly интерфейс; PWA-кандидат post-MVP
2. **Разделение concerns**: Presentation (Tailwind + shadcn/ui) / State (Zustand + TanStack Query) / Logic (хуки, Server Actions)
3. **SOLID**: каждый модуль — одна ответственность; зависимости через интерфейсы; Open/Closed через пропсы и композицию
4. **FSD-lite**: переиспользуемые UI-примитивы в `shared/ui/`, фичевые модули в `modules/`, маршруты в `app/`
5. **Container/Presentational**: компоненты-контейнеры подключают сторы и передают данные через пропсы в чистые презентационные компоненты
6. **Server-first**: Server Components по умолчанию, Client Components только при необходимости (интерактивность, хуки)

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
