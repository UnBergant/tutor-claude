# Architecture

## Monorepo (Turborepo)

```
tutor-claude/
├── apps/
│   ├── web/          # Next.js (App Router) — frontend
│   └── api/          # NestJS — backend API
├── packages/
│   └── shared/       # Shared types, constants, Zod schemas
├── turbo.json        # Pipeline config
├── biome.json        # Linter/formatter
└── package.json      # Workspaces root
```

## Frontend Structure (Feature-Sliced Design)

```
apps/web/src/
├── app/              # Next.js App Router (routes, layouts)
├── shared/           # Reusable across all features
│   ├── ui/           # UI primitives (Button, Input, Card, Modal...)
│   ├── lib/          # Utilities, API client, helpers
│   ├── tokens/       # CSS custom properties (design tokens)
│   └── hooks/        # Shared React hooks
├── features/         # Feature modules (self-contained)
│   ├── assessment/
│   ├── exercise/
│   ├── lesson/
│   ├── chat/
│   ├── vocabulary/
│   ├── onboarding/
│   ├── home/
│   ├── mistakes/
│   └── progress/
└── widgets/          # Composite UI blocks (sidebar, navbar)
```

## Backend Structure (NestJS Modules)

```
apps/api/src/
├── auth/             # Google OAuth, JWT, guards
├── users/            # User management
├── assessment/       # Assessment flow
├── curriculum/       # Curriculum generation
├── exercises/        # Exercise generation & evaluation
├── lessons/          # Lesson management
├── chat/             # Chat with Celestia
├── vocabulary/       # Personal dictionary
├── spaced-repetition/# Review scheduling
├── ai/               # Claude API integration
├── prisma/           # Prisma service
└── common/           # Shared decorators, pipes, filters
```

## Key Principles

- **Separation of Concerns**: Presentation / State / Logic
- **SOLID**: Single responsibility, dependency inversion via interfaces
- **Container/Presentational**: Containers connect stores, pass data via props to pure components
- **Design Tokens**: All visual values via CSS custom properties
