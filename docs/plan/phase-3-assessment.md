# Phase 3: Assessment Engine

## Goal
Onboarding + level assessment — key feature for personalization.

## Steps

1. **Onboarding UI** — stepper: Welcome → Experience → Goal → Assessment
2. **Assessment Flow** — Zustand store, components, exercise-based only (no free chat at this phase)
3. **Assessment Server Actions** — question generation via Claude API, gap analysis, level mapping
4. **Claude API integration** — AI client wrapper, structured output, Castellano system prompt
5. **Results** — visualization of strengths/weaknesses, first module proposals, save to UserProfile

## Assessment Algorithm

- Pre-assessment calibrates starting difficulty (beginner → A1, intermediate → B1, advanced → B2)
- **10-20 questions** per assessment session (adaptive)
- Question types: gap fill + multiple choice (reuse Phase 4 exercise components if Phase 4 is done; otherwise simple UI)
- **Adaptive difficulty**: start at calibrated level; 2 correct in a row → move up one sub-level; 2 wrong in a row → move down one sub-level
- **Stop criteria**: min 10 questions AND (confidence > 80% on current level OR max 20 questions reached)
- **Gap map format**: `{ topicId: string, level: A1-C2, status: 'known' | 'weak' | 'unknown', confidence: 0-100 }[]`
- Reference grammar topics from `docs/grammar/` (use markdown as Claude API context)
- Assessment is **exercise-only** (no conversation). Free conversation assessment is post-MVP

## Key Files
- src/modules/onboarding/ (components, steps)
- src/modules/assessment/ (components, store, actions)
- src/shared/lib/ai.ts (Claude API client)
- src/shared/lib/ai/prompts/ (system, assessment prompts)

## Verification
- User completes onboarding → assessment → sees results
- AI generates adequate questions per level
- Results saved in DB
- Token usage tracked per assessment session
