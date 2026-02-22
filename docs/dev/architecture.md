# Architecture

## Single Next.js Application

No separate backend — Next.js handles both frontend and API via Server Actions and Route Handlers.

```
┌──────────────────────────────────────────┐
│            Next.js (Vercel)              │
│                                          │
│  ┌─────────┐  ┌──────────────────────┐   │
│  │  React   │  │  Server Actions      │   │
│  │  Client  │──│  Route Handlers      │───┼──► PostgreSQL
│  │          │  │  Server Components   │   │
│  └─────────┘  └──────────┬───────────┘   │
│                          │               │
└──────────────────────────┼───────────────┘
                           │
                     ┌─────▼──────┐
                     │  Claude    │
                     │  API       │
                     └────────────┘
```

## Server-Side Architecture

- **Server Actions** — mutations (submit answer, save progress, update profile)
- **Route Handlers** — SSE streaming (chat), webhooks, Auth.js
- **React Server Components** — data fetching, initial page renders

## Project Structure (FSD-lite)

```
src/
├── app/                    # Next.js App Router (routes, layouts)
│   ├── (auth)/             # Auth routes (login)
│   ├── (app)/              # Protected app routes
│   │   ├── assessment/
│   │   ├── lesson/
│   │   ├── chat/
│   │   └── vocabulary/
│   └── api/                # Route Handlers
│       └── chat/route.ts   # SSE streaming
├── modules/                # Feature modules (FSD-lite)
│   ├── assessment/
│   │   ├── components/     # UI components
│   │   ├── actions.ts      # Server Actions
│   │   ├── store.ts        # Zustand store (complex state)
│   │   └── hooks.ts        # React hooks + TanStack Query
│   ├── exercise/
│   ├── chat/
│   ├── lesson/
│   ├── onboarding/
│   ├── vocabulary/
│   └── progress/
└── shared/
    ├── ui/                 # shadcn/ui components (Button, Card, Dialog...)
    ├── lib/                # Prisma client, AI client, auth config, rate limiter
    ├── hooks/              # Shared React hooks
    └── types/              # TypeScript types
```

## Key Principles

- **FSD-lite**: 3 layers — `app/` (routes), `modules/` (features), `shared/` (reusables)
- **Import rule**: `modules/` import from `shared/`, never from each other
- **Colocation**: Server Actions live inside their feature module
- **Separation of Concerns**: Presentation / State / Logic
- **Container/Presentational**: Containers connect stores, pass data via props
- **Mobile-first**: Tailwind mobile-first, touch-friendly (min 44px targets)
