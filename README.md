# Celestia — AI Spanish Tutor

Персональный AI-тьютор по испанскому языку. Сочетает адаптивность живого репетитора с интерактивными упражнениями в стиле Duolingo/Skyeng.

**Испанский из Испании (Castellano)** — vosotros, distinción, лексика Испании.
**Интерфейс**: русский (MVP).

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
| Монорепо | Turborepo |
| Фронтенд | Next.js (App Router) |
| Бэкенд | NestJS |
| БД | PostgreSQL + Prisma |
| CSS | CSS Modules + Design Tokens |
| State | Zustand (client) + TanStack Query (server) |
| UI примитивы | Radix UI (headless) |
| Тесты | Vitest + RTL + Playwright |
| Фронт-архитектура | Feature-Sliced Design |
| Линтинг | Biome |
| AI | Claude API (Anthropic) |
| Auth | Google OAuth |

## Project Structure

```
tutor-claude/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # NestJS backend
├── packages/
│   └── shared/           # Shared types, constants, Zod schemas
├── docs/
│   ├── PRODUCT.md        # Product vision, features, roadmap
│   ├── TECH.md           # Tech stack, decisions, principles
│   ├── dev/              # Technical decision docs
│   │   ├── architecture.md
│   │   ├── styling.md
│   │   ├── state.md
│   │   ├── testing.md
│   │   ├── api-design.md
│   │   └── ai-integration.md
│   ├── plan/             # Implementation phases (0-8)
│   └── grammar/          # A1-C2 grammar curriculum (Instituto Cervantes)
├── CLAUDE.md             # Instructions for Claude Code
├── AGENTS.md             # Instructions for OpenAI Codex
└── README.md             # ← you are here
```

## Documentation

| Документ | Что внутри |
|---|---|
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Видение продукта, проблема, MVP-фичи, роадмап |
| [`docs/TECH.md`](docs/TECH.md) | Стек, архитектурные решения, принципы разработки |
| [`docs/dev/`](docs/dev/) | Детальные технические решения (архитектура, стили, стейт, тесты, API, AI) |
| [`docs/plan/`](docs/plan/) | Фазы реализации (Phase 0–8) |
| [`docs/grammar/`](docs/grammar/) | Грамматический каркас A1–C2 по Instituto Cervantes |

## Development Principles

1. **Separation of concerns** — Presentation / State / Logic
2. **SOLID** — одна ответственность на модуль, зависимости через интерфейсы
3. **Container/Presentational** — контейнеры подключают сторы, презентационные компоненты — чистые пропсы
4. **Design Tokens** — все визуальные значения через CSS custom properties
5. **Feature-Sliced Design** — переиспользуемые примитивы в `shared/ui/`, фичи в `features/`

## AI Agents

Проект использует два AI-агента параллельно:
- **Claude Code** (`CLAUDE.md`) — основной агент разработки
- **OpenAI Codex** (`AGENTS.md`) — second opinion, code review
