# Feature Lifecycle

Standard process for implementing any feature or task. Ensures completeness, quality, and documentation.

## Applicability

Every task follows this lifecycle. If a task is large and can be split into independent subtasks — split it first, then run each subtask through the full lifecycle independently.

**Atomicity check:** a task is atomic when it delivers a single, testable outcome. If you can describe it as "A and B" — it's two tasks.

## Lifecycle Steps

```
0. CONTEXT CHECK ──→ 1. PLAN ──→ 2. IMPLEMENT ──→ 3. VERIFY ──→ 4. TEST ──→ 5. REVIEW ──→ 6. DOCUMENT ──→ 7. CLOSE
                        │                                                        │
                        │  (findings)                                            │
                        └────────────────────── fix & re-verify ◄────────────────┘
```

---

### 0. CONTEXT CHECK

**Goal:** ensure the AI agent has enough context window to complete the full lifecycle.

Before starting any task, check the current context usage. If it exceeds **20%**, suggest the developer compact the context (`/compact`) before proceeding.

A fresh context ensures the agent has room for the full cycle — planning, implementation, testing, and review — without hitting limits mid-task and losing continuity.

---

### 1. PLAN

**Goal:** understand scope, get alignment, prevent rework.

#### a. Specification & Scope Analysis
- Read the task spec from `docs/plan/`
- Explore related code in the codebase
- Determine what the task touches:
  - New Prisma models or schema changes? → migration needed
  - New routes or pages? → routing, layout, navigation
  - New server actions or queries? → module actions/queries files
  - AI prompts? → `src/shared/lib/ai/prompts/`
  - New shared components or utilities? → `src/shared/`
  - State management? → Zustand store or Server Components

#### b. Atomicity Check
- If the task has multiple independent deliverables — split into subtasks
- Each subtask runs through the full lifecycle independently
- Subtasks should be ordered by dependencies (data model → server logic → UI)

#### c. Conflict Check
- Verify the plan doesn't conflict with:
  - Global project conventions (CLAUDE.md, AGENTS.md)
  - Architecture rules (FSD-lite, import boundaries, SRP)
  - Product requirements (`docs/PRODUCT.md`)
  - Design decisions (`docs/dev/styling.md`, `docs/dev/design-issues.md`)
  - Open issues in `design-issues.md`
- **If conflict found** → notify the user before proceeding

#### d. Plan Review
- Claude creates implementation plan (plan mode)
- `/toxic-opinion` — Codex reviews the plan for blind spots
- User approves the plan (or requests changes)

---

### 2. IMPLEMENT

**Goal:** clean, maintainable code following project conventions.

#### Code Structure Principles
- **Single Responsibility (SRP):** one file = one responsibility
- **Types separate:** interfaces and types → `types.ts` in the module folder
- **Small files:** if a file exceeds ~200 lines — decompose it
- **Helpers separate:** utility functions → dedicated files with descriptive names
- **No duplication:** extract to `src/shared/lib/` when logic is used 2+ times

#### Component Patterns
- **Container/Presentational:** container connects data (stores, server actions), presentational is pure UI with props
- **One component = one file:** no multiple exports of components from a single file
- **Hooks extraction:** move hook logic to `hooks.ts` when it exceeds ~10 lines
- **Props interface:** define next to the component, or in `types.ts` if reused

#### Architecture Rules
- **FSD-lite:** `modules/` never import from each other, only from `shared/`
- **Server actions** separate from **queries** (mutations vs reads)
- **Server Components** by default, Client Components only when needed (interactivity, hooks, browser APIs)
- **Prisma migrations:** run `npx prisma migrate dev` when schema changes

#### Conventions
- Biome formatting: double quotes, semicolons, 2-space indent
- Path alias: `@/*` → `src/*`
- Imports: explicit, no barrel files

---

### 3. VERIFY

**Goal:** confirm the code compiles, passes lint, and works in the browser.

#### Automated Checks
```bash
npm run build    # TypeScript compilation + Next.js build
npm run lint     # Biome linter — zero errors
```

#### Manual Checks
- Test the feature in the browser (dev server)
- Check edge cases:
  - Empty data (no lessons, no vocabulary, new user)
  - Error states (API failure, network error)
  - Mobile viewport (320px minimum)
- Verify animations respect `prefers-reduced-motion`

---

### 4. TEST

**Goal:** automated coverage for business logic and user flows.

#### a. Unit Tests (Vitest) — always
- Cover business logic, utilities, store logic
- Colocated: `feature.test.ts` next to `feature.ts`
- Test: happy path + edge cases + error cases
- Run: `npm run test`

#### b. E2E Tests (Playwright) — by default YES
- Write E2E for any task that adds or changes a user flow
- Test the full path: navigate → interact → verify result
- Located in `tests/e2e/`
- Run: `npm run test:e2e`

**E2E exception** (must be explicitly justified):
- Task has no UI (refactoring, types, utilities)
- Task doesn't change any observable user flow behavior

#### c. All Green
```bash
npm run test       # all unit tests pass
npm run test:e2e   # all E2E tests pass
```

---

### 5. REVIEW

**Goal:** catch bugs, design issues, and missed requirements.

#### a. Self-Review
- Claude reviews all changed files for:
  - Logic errors and edge cases
  - Security issues (OWASP top 10)
  - Performance concerns
  - Accessibility gaps
  - Convention violations

#### b. Codex Review
- Run `/toxic-review` for second opinion
- Codex independently analyzes the changes

#### c. Findings Resolution
- Classify findings: CRITICAL / NON-CRITICAL
- **Fix ALL findings** — both critical and non-critical
- Defer to backlog **only if** the fix:
  - Requires architectural changes outside the current task scope
  - Risks regression in unrelated modules
- Deferred items → add to `design-issues.md` with phase tag, or create a Jira issue
- After fixes: re-run VERIFY step (build + lint + manual check)

---

### 6. DOCUMENT

**Goal:** keep project docs in sync with reality.

- [ ] `docs/plan/` — update task spec, mark as ✅ Done
- [ ] `design-issues.md` — close resolved items, add newly discovered
- [ ] `MEMORY.md` — record architectural decisions, new patterns, key learnings
- [ ] `CLAUDE.md` / `AGENTS.md` — update if project structure changed (new modules, new shared libs, new routes)

---

### 7. CLOSE

**Goal:** clean commit, final verification, phase tracking.

```bash
npm run build      # final build check
npm run test       # unit tests green
npm run test:e2e   # E2E tests green
```

- Commit with [Conventional Commits](https://www.conventionalcommits.org/) message
- Update `docs/plan/README.md` if this closes a phase/sub-phase
- Context compact (`/compact`) before moving to next task
