# Celestia — AI Spanish Tutor

Персональный AI-тьютор по испанскому языку. Сочетает адаптивность живого репетитора с интерактивными упражнениями в стиле Duolingo/Skyeng.

**Испанский из Испании (Castellano)** — vosotros, distinción, лексика Испании.
**Интерфейс**: English (MVP).

## Что делает Celestia

- **Оценка уровня** — AI определяет конкретные пробелы (не просто «B1», а «знает Present Indicative, слабо с Subjuntivo»)
- **Персональная программа** — модули генерируются под пользователя, адаптируются после каждого урока
- **Интерактивные упражнения** — 6 типов: заполнить пропуск, выбор ответа, соединить пары, составить предложение, свободный ввод, чтение с вопросами
- **Чат с Celestia** — свободный разговор + ситуационный режим (ресторан, собеседование, знакомство)
- **Личный словарь** — автосбор слов из уроков и чатов, flashcard-повторение
- **Spaced repetition** — интервальное повторение (1д → 3д → 7д → 30д)
- **Журнал ошибок** — паттерны ошибок, динамика прогресса
- **Геймификация** — streak, точность, фраза дня

## Tech Stack

| Аспект | Решение |
|---|---|
| Фреймворк | Next.js (App Router) — full-stack |
| БД | PostgreSQL + Prisma |
| Стилизация | Tailwind CSS |
| UI компоненты | shadcn/ui (Radix-based) |
| Упражнения | Кастомные exercise-компоненты (GapFill, MatchPairs и т.д.) |
| State | Zustand (complex client state) + TanStack Query (server) |
| Тесты | Vitest + Playwright |
| Фронт-архитектура | FSD-lite (app / modules / shared) |
| Линтинг | Biome |
| AI | Claude API (Anthropic) |
| Auth | Auth.js (next-auth v5) + Google |

## Project Structure

```
celestia/
├── src/
│   ├── app/                    # Next.js App Router (routes)
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── (auth)/             # Auth routes
│   │   ├── (app)/              # App routes (dashboard, lesson, chat...)
│   │   └── api/                # Route Handlers (SSE streaming и т.д.)
│   ├── modules/                # Feature modules (FSD-lite)
│   │   ├── assessment/
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
├── docs/
│   ├── PRODUCT.md              # Product vision, features, roadmap
│   ├── TECH.md                 # Tech stack, decisions, principles
│   ├── dev/                    # Technical decision docs
│   └── grammar/                # A1-C2 grammar curriculum (Instituto Cervantes)
├── CLAUDE.md                   # Instructions for Claude Code
├── AGENTS.md                   # Instructions for OpenAI Codex
└── README.md                   # ← you are here
```

## Documentation

| Документ | Что внутри |
|---|---|
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Видение продукта, проблема, MVP-фичи, роадмап |
| [`docs/TECH.md`](docs/TECH.md) | Стек, архитектурные решения, принципы разработки |
| [`docs/dev/`](docs/dev/) | Детальные технические решения (архитектура, стили, стейт, тесты, API, AI) |
| [`docs/plan/`](docs/plan/) | Фазы реализации (Phase 0–8) |
| [`docs/grammar/`](docs/grammar/) | Грамматический каркас A1-C2 по Instituto Cervantes |

## Development Principles

1. **Mobile-first** — Tailwind mobile-first утилиты, touch-friendly интерфейс
2. **Separation of concerns** — Presentation (Tailwind + shadcn/ui) / State (Zustand + TanStack Query) / Logic (хуки, Server Actions)
3. **SOLID** — одна ответственность на модуль, зависимости через интерфейсы
4. **FSD-lite** — UI-примитивы в `shared/ui/`, фичевые модули в `modules/`, маршруты в `app/`
5. **Server-first** — Server Components по умолчанию, Client Components только при необходимости

## AI Agents

Проект использует два AI-агента параллельно:
- **Claude Code** (`CLAUDE.md`) — основной агент разработки
- **OpenAI Codex** (`AGENTS.md`) — second opinion, code review
