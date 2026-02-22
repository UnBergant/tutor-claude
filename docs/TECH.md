# TECH.md — Celestia: Technology Stack

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Next.js App   │────▶│   NestJS API    │────▶│  PostgreSQL  │
│   (Vercel)      │     │   (Railway)     │     │  (Railway)   │
└─────────────────┘     └────────┬────────┘     └──────────────┘
                                 │
                           ┌─────▼──────┐
                           │  Claude    │
                           │  API       │
                           └────────────┘
```

## Monorepo Structure (Turborepo)

```
tutor-claude/
├── apps/
│   ├── web/          # Next.js frontend (App Router)
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types, constants, Zod schemas
├── turbo.json        # Build pipeline
├── biome.json        # Linter/formatter
└── package.json      # Workspaces root
```

## Принятые технические решения

| Аспект | Решение |
|---|---|
| Монорепо | Turborepo |
| Фронтенд | Next.js (App Router) |
| Бэкенд | NestJS |
| БД | PostgreSQL + Prisma |
| CSS | CSS Modules + Design Tokens (CSS custom properties) |
| State (client) | Zustand |
| State (server) | TanStack Query |
| UI примитивы | Radix UI (headless) |
| Тесты | Vitest + React Testing Library + Playwright |
| Структура фронта | Feature-Sliced Design |
| Линтинг | Biome |
| AI | Claude API (Anthropic) |
| Auth | Google OAuth |

## Принципы разработки

1. **Разделение concerns**: Presentation (CSS Modules + Radix) / State (Zustand + TanStack Query) / Logic (хуки, сервисы)
2. **SOLID**: каждый модуль — одна ответственность; зависимости через интерфейсы; Open/Closed через пропсы и композицию
3. **Компонентный подход**: переиспользуемые UI-примитивы в `shared/ui/`, фичевые компоненты в `features/`
4. **Design Tokens**: все визуальные значения (цвета, размеры, шрифты, тени, радиусы) через CSS custom properties — смена дизайна = смена переменных
5. **Container/Presentational**: компоненты-контейнеры подключают сторы и передают данные через пропсы в чистые презентационные компоненты

## Hosting & Infrastructure

| Service | What | Tier |
|---|---|---|
| Vercel | Next.js frontend | Free |
| Railway | NestJS backend + PostgreSQL | Free ($5 credit/mo) |
| Anthropic | Claude API | Pay-per-use |

Post-MVP:

| Service | What | Tier |
|---|---|---|
| Upstash | Redis (caching, sessions) | Free tier |

## Key Technical Decisions

- **Turborepo monorepo** — shared types between frontend and backend, unified tooling
- **Prisma over TypeORM** — better TypeScript integration, cleaner migrations, auto-generated types
- **CSS Modules over CSS-in-JS** — better performance, native CSS features, no runtime cost
- **Zustand over Redux** — minimal boilerplate, no providers/context needed, fine-grained subscriptions
- **TanStack Query for server state** — automatic caching, deduplication, background refetching
- **Radix UI (headless)** — accessible primitives without opinionated styling
- **Biome over ESLint + Prettier** — single tool for linting and formatting, faster
- **Feature-Sliced Design** — scalable frontend architecture with clear boundaries between features
- **No Redis in MVP** — PostgreSQL handles all MVP needs; Redis added later for caching and scaling
- **Mobile-first web** — PWA candidate post-MVP
- **Claude API as sole AI provider (MVP)** — handles all generation: assessment, lessons, exercises, conversation

## Detailed Documentation

| Topic | File |
|---|---|
| Architecture & folder structure | [`docs/dev/architecture.md`](dev/architecture.md) |
| Styling approach & component patterns | [`docs/dev/styling.md`](dev/styling.md) |
| State management (Zustand + TanStack Query) | [`docs/dev/state.md`](dev/state.md) |
| Testing strategy | [`docs/dev/testing.md`](dev/testing.md) |
| API design & REST endpoints | [`docs/dev/api-design.md`](dev/api-design.md) |
| AI integration & prompts | [`docs/dev/ai-integration.md`](dev/ai-integration.md) |
