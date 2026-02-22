# Phase 3: Assessment Engine

## Goal
Onboarding + level assessment — key feature for personalization.

## Steps

1. **Onboarding UI** — stepper: Welcome → Experience → Goal → Assessment
2. **Assessment Flow** — Zustand store, components, dynamic difficulty via AI
3. **Assessment Server Actions** — question generation via Claude API, gap analysis, level mapping
4. **Claude API integration** — AI client wrapper, structured output, Castellano system prompt
5. **Results** — visualization of strengths/weaknesses, first module proposals, save to UserProfile

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
