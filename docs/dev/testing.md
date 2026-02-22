# Testing Strategy

## Stack

| Tool | Purpose |
|------|---------|
| Vitest | Unit tests for business logic and utilities |
| Playwright | E2E tests for critical user flows |

## MVP Approach — Minimal but Targeted

Focus testing effort on high-risk areas:

### Vitest (Unit Tests)
- AI response parsing and validation
- Rate limiting logic
- Spaced repetition interval calculations
- Exercise answer validation (deterministic)
- Zustand store logic for complex features

### Playwright (E2E Tests)
3-5 critical flows:
1. Login → Dashboard
2. Assessment flow (start → questions → results)
3. Exercise completion (answer → feedback)
4. Chat conversation (send message → receive stream)
5. Vocabulary review (flashcard flip → answer)

### Not in MVP
- React Testing Library component tests — add when component count grows
- API integration tests — Server Actions tested implicitly via E2E
- Visual regression tests

## Conventions

- Unit tests colocated: `ai-limiter.test.ts` next to `ai-limiter.ts`
- E2E tests: `tests/e2e/` at project root
- Run: `npm test` (Vitest) / `npm run test:e2e` (Playwright)
