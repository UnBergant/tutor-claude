# Celestia — AI Spanish Tutor

Personalized AI-powered web app for learning Spanish (Castellano). Combines adaptive tutoring with interactive Duolingo/Skyeng-style exercises.

## Key Features

- **AI assessment** — maps specific knowledge gaps and assigns an A1-C2 reference level
- **Personal curriculum** — dynamically generated modules that adapt based on mistakes and progress
- **Interactive exercises** — gap fill, multiple choice, match pairs, word reorder, free writing, reading comprehension
- **Chat with Celestia** — free conversation with real-time mistake correction and idiom usage
- **Gamification** — streaks, accuracy tracking, lesson completion stats

## Tech Stack

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | Next.js (App Router), React, TypeScript | Vercel |
| Backend | NestJS, Prisma, TypeScript | Railway |
| Database | PostgreSQL | Railway |
| AI | Claude API (Anthropic) | — |
| Auth | Google OAuth | — |

## Project Structure

```
tutor-claude/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types, constants, utilities
├── PRODUCT.md        # Product vision, features, roadmap
├── TECH.md           # Architecture and tech decisions
├── turbo.json
└── package.json
```

Monorepo managed with **Turborepo**.

## Getting Started

```bash
npm install
npm run build
```

## Documentation

- [PRODUCT.md](./PRODUCT.md) — product vision, MVP features, roadmap
- [TECH.md](./TECH.md) — architecture, stack, hosting, technical decisions

