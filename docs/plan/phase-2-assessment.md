# Phase 2: Assessment Engine

## Goal
Onboarding + level assessment — key feature for personalization. Includes first exercise components (GapFill, MultipleChoice) reused later in Phase 3.

## Steps

1. **Onboarding UI** — stepper: Welcome → Experience → Goal → Assessment
2. **Exercise Components (MVP)** — GapFill, MultipleChoice — built as reusable components in `src/modules/exercise/`, used here for assessment and expanded in Phase 3
3. **Assessment Flow** — Zustand store, components, exercise-based only (no free chat at this phase)
4. **Assessment Server Actions** — question generation via Claude API, gap analysis, level mapping
5. **Claude API integration** — AI client wrapper, structured output, Castellano system prompt
6. **Results** — visualization of strengths/weaknesses, first module proposals, save to UserProfile

## Assessment Algorithm

### Overview

Two-phase Bayesian adaptive test: **10 items maximum**, preceded by a self-assessment prior. Designed for CEFR classification (not continuous scoring) — binary search converges in ~5-6 items for coarse classification, leaving 4 items for gap mapping.

### Self-Assessment Prior (Pre-Test)

Before the test, one question: *"How would you describe your Spanish?"*

| Answer | Prior θ₀ | Maps to |
|--------|----------|---------|
| Complete beginner | -2.0 | A1 start |
| Know some basics (greetings, simple sentences) | -1.0 | A1/A2 boundary |
| Can have simple conversations | 0.0 | A2/B1 boundary |
| Can discuss most topics comfortably | 1.0 | B1/B2 boundary |
| Advanced / near-fluent | 2.0 | B2/C1 boundary |
| Near-native / studied formally for years | 3.0 | C1/C2 boundary |

Sets initial Bayesian prior: `θ ~ N(θ₀, 1.5²)` — wide variance to express uncertainty.

### Phase 1: Level-Finding (Items 1–6)

Goal: narrow CEFR level via binary search on level boundaries.

```
FOR item_n = 1 to 6:
  1. Compute posterior P(level | responses) for each CEFR level
  2. Find the most uncertain boundary (adjacent levels with closest probabilities)
  3. Select a GATEWAY TOPIC at that boundary (see table below)
  4. AI generates a gap-fill or MC item for that topic
  5. Student responds
  6. Bayesian update: P(θ | responses) ∝ P(response_n | θ) · P(θ | prev responses)
  7. Re-estimate θ = E[θ | responses]
```

### Phase 2: Gap Mapping (Items 7–10)

Goal: probe specific topics at the determined level and one level below.

```
AFTER item 6:
  classified_level = argmax P(level | responses)

FOR items 7-10:
  1. Select untested topics at classified_level and classified_level - 1
  2. Prioritize prerequisite/foundational topics
  3. AI generates item → student responds → update gap map
```

If confidence is still < 50% after item 6, items 7-8 continue boundary probing; items 9-10 do gap mapping.

### Gateway Topics (Level Discriminators)

Based on Instituto Cervantes grammar tree from `docs/grammar/`.

| Boundary | Gateway Topic | Why It Discriminates |
|----------|--------------|---------------------|
| Pre-A1 / A1 | Noun gender & number; present tense regular verbs | Cannot function at A1 without these |
| A1 / A2 | Pretérito indefinido; imperfecto | A2 unlock — past tense narration |
| A2 / B1 | Present subjunctive in noun clauses (quiero que + subjuntivo) | B1 signature: subjunctive onset |
| B1 / B2 | Imperfect subjunctive (conditional types 2-3); relative clauses with cuyo/el cual | B2 requires subjunctive fluency |
| B2 / C1 | Advanced topicalization; complete "se" system; futuro de subjuntivo (recognition) | C1 = register awareness |
| C1 / C2 | Stylistic grammar (absolute constructions, journalistic imperfect); queísmo/dequeísmo | C2 = near-native precision |

### Item Difficulty Prediction

AI-generated items use predicted difficulty from topic position in the grammar tree:

```
difficulty(topic) = level_base + (topic_position / total_topics_in_level) × level_span
```

| Level | θ range | level_base | level_span |
|-------|---------|------------|------------|
| A1 | -2.0 to -1.0 | -2.0 | 1.0 |
| A2 | -1.0 to 0.0 | -1.0 | 1.0 |
| B1 | 0.0 to 1.0 | 0.0 | 1.0 |
| B2 | 1.0 to 2.0 | 1.0 | 1.0 |
| C1 | 2.0 to 3.0 | 2.0 | 1.0 |
| C2 | 3.0 to 4.0 | 3.0 | 1.0 |

Fixed discrimination `a = 1.0`, guessing `c = 0.25` (MC) / `c = 0.0` (gap-fill).

### Gap Map Output

```typescript
interface AssessmentResult {
  estimatedLevel: CEFRLevel;       // A1 | A2 | B1 | B2 | C1 | C2
  confidence: number;               // 0.0 – 1.0
  theta: number;                    // continuous ability estimate
  gapMap: TopicAssessment[];
}

interface TopicAssessment {
  topicId: string;
  level: CEFRLevel;
  status: "mastered" | "not_mastered" | "untested";
}
```

**Inference for untested topics (Guttman model):**
- Topics well below θ → inferred `mastered`
- Topics well above θ → inferred `not_mastered`
- Topics near θ (within 1 SE) → `untested` (priority for first lessons)

### Design Rationale

- **10 items, not 20** — for classification (6 CEFR levels), binary search converges in ~5-6 items. UX priority: 3 min vs 8 min test, critical for onboarding retention.
- **Self-assessment prior** — proven by DIALANG research, saves 1-2 items of information.
- **Bayesian EAP estimation** — stable with few items (unlike MLE which is undefined for all-correct/all-wrong).
- **Continuous refinement** — first 5 lessons double as extended assessment, correcting any misclassification.
- **No pre-calibrated item bank** — items are AI-generated with difficulty predicted from topic position. Acceptable for classification, where ±1 sub-level accuracy suffices.

### Question Types
- **Gap fill** — sentence with blank, student types the answer
- **Multiple choice** — 4 options, one correct

Each item targets a specific grammar topic but implicitly requires vocabulary and comprehension (a B2 grammar item inherently requires B1-level vocabulary to parse).

Assessment is **exercise-only** (no conversation). Free conversation assessment is post-MVP.

Reference grammar topics from `docs/grammar/` (A1–C2 topic trees as Claude API context).

## Key Files
- src/modules/onboarding/ (components, steps)
- src/modules/assessment/ (components, store, actions)
- src/modules/exercise/components/ (GapFill, MultipleChoice — shared with Phase 3)
- src/shared/lib/ai.ts (Claude API client)
- src/shared/lib/ai/prompts/ (system, assessment prompts)

## Verification
- User completes onboarding → assessment → sees results
- AI generates adequate questions per level
- Adaptive algorithm correctly narrows CEFR level within 10 items
- Gap map reflects tested + inferred topic statuses
- Results saved in DB (Assessment, AssessmentAnswer, UserProfile.level)
- Token usage tracked per assessment session
