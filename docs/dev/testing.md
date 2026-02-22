# Testing Strategy

## Stack

| Tool | Purpose |
|------|---------|
| Vitest | Unit and integration tests |
| React Testing Library | Component testing |
| Playwright | E2E tests |

## Test Pyramid

- **Unit tests** — pure functions, utils, store logic, services
- **Component tests** — render, props, user interactions, a11y
- **Integration tests** — API endpoints, database operations
- **E2E tests** — critical user flows (login → assessment → lesson → chat)

## Conventions

- Test files colocated: `Button.test.tsx` next to `Button.tsx`
- API tests: `*.spec.ts` in test/ directory per module
- E2E tests: `tests/e2e/` at root level
