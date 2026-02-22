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
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types, constants, utilities
├── turbo.json
└── package.json
```

## Frontend

| Technology | Purpose |
|---|---|
| Next.js (App Router) | React framework, SSR, routing |
| React | UI components |
| TypeScript | Type safety |

- Hosted on **Vercel**
- Mobile-first responsive design

## Backend

| Technology | Purpose |
|---|---|
| NestJS | API framework, modular architecture |
| Prisma | ORM, migrations, type-safe queries |
| TypeScript | Type safety |

- Hosted on **Railway**
- REST API

## Database

| Technology | Purpose |
|---|---|
| PostgreSQL | Users, progress, generated lessons, assessments, conversation history |

- Hosted on **Railway**
- Redis (Upstash) added post-MVP for caching AI responses and scaling

## AI

| Technology | Purpose |
|---|---|
| Claude API (Anthropic) | Lesson generation, assessment, conversation, exercise creation, mistake correction |

## Authentication

| Technology | Purpose |
|---|---|
| Google OAuth | Social login (MVP) |

## Hosting & Infrastructure

| Service | What | Tier |
|---|---|---|
| Vercel | Next.js frontend | Free |
| Railway | NestJS backend + PostgreSQL | Free ($5 credit/mo) |
| Anthropic | Claude API | Pay-per-use |

Post-MVP additions:
| Service | What | Tier |
|---|---|---|
| Upstash | Redis (caching, sessions) | Free tier |

## Key Technical Decisions

- **Turborepo monorepo** — shared types between frontend and backend, unified tooling
- **Prisma over TypeORM** — better TypeScript integration, cleaner migrations, auto-generated types
- **No Redis in MVP** — PostgreSQL handles all MVP needs; Redis added later for caching and scaling
- **Mobile-first web** — PWA candidate post-MVP
- **Claude API as sole AI provider (MVP)** — handles all generation: assessment, lessons, exercises, conversation