# Celestia — Implementation Plan

## Approach

**Vertical slices / function-first** — each phase delivers a working user flow, not a horizontal layer. Minimal UI from the start, design polish at the end after UX validation.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 0 | [Project Foundation & Tooling](phase-0-foundation.md) | ✅ Done |
| 1 | [Auth, Database & App Shell](phase-1-auth-app-shell.md) | ✅ Done |
| 2 | [Assessment Engine](phase-2-assessment.md) | ✅ Done |
| 3 | [Exercise Engine & Curriculum](phase-3-exercises-curriculum.md) | ✅ Done |
| 4 | [Progress, SRS & Gamification](phase-4-progress.md) | 🔄 In Progress |
| 5 | [Chat with Celestia](phase-5-chat.md) | ⏳ Pending |
| 6 | [Design Polish & Production](phase-6-polish-deploy.md) | ⏳ Pending |

## Dependencies

Strictly linear — each phase requires the previous one:

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
```

- Phase 1 (Auth/DB/Shell) unlocks all subsequent phases
- Phase 2 (Assessment) builds first exercise components (GapFill, MultipleChoice) reused in Phase 3
- Phase 3 (Exercises/Curriculum) expands to all 6 exercise types + lesson flow
- Phase 4 (Progress/SRS) builds on exercise data from Phase 3 — no chat dependency
- Phase 5 (Chat) reuses AI infrastructure from Phases 2-3, vocabulary auto-collection feeds Phase 4
- Phase 6 (Polish) finalizes design system and production after all features are validated
