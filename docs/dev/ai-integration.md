# AI Integration — Claude API

## Architecture

Claude API wrapper in `shared/lib/ai.ts`, used by Server Actions:

```
modules/assessment/actions.ts → ai.generateQuestion() → Claude API
modules/exercise/actions.ts   → ai.generateExercise() → Claude API
modules/exercise/actions.ts   → ai.evaluateAnswer()   → Claude API (Haiku)
app/api/chat/route.ts         → ai.chat()             → Claude API (streaming)
modules/lesson/actions.ts     → ai.generateLesson()   → Claude API
```

## Model Selection by Task

| Task | Model | Approx Cost |
|---|---|---|
| Check answer (yes/no) | Haiku | ~$0.001 |
| Generate exercises | Sonnet | ~$0.01-0.03 |
| Free chat | Sonnet | ~$0.01-0.05 |
| Assessment questions | Sonnet | ~$0.02-0.05 |
| Evaluate free writing | Sonnet | ~$0.01-0.03 |

## Structured Output

Use Claude's `tool_use` for typed JSON responses:
- Exercise generation → Exercise JSON schema
- Assessment questions → Question JSON schema
- Gap analysis → GapAnalysis JSON schema

## Castellano Validation

- System prompt with hard Spain-Spanish rules (vosotros, distinción)
- Latin American vocabulary blocklist (~200 terms)
- Self-verification in same prompt (confidence scoring)

## Rate Limiting & Cost Control

### Per-Account Limits (MVP)
- Daily and monthly token limits per user, stored in DB
- Flexible settings — adjustable at any time without code changes
- Limits configurable per user (owner can have higher limits than friends)
- UI shows remaining quota ("80% дневного лимита осталось")
- Graceful limit exceeded state ("Лимит на сегодня исчерпан")

### Database Schema
```
AiUsage: userId, model, tokensInput, tokensOutput, endpoint, createdAt
AiLimits: userId, dailyTokens, monthlyTokens (default values + per-user overrides)
AiSettings: model defaults per endpoint, global rate limits
```

### Caching Strategy
- Assessment questions by topic+level — cache 24h
- Exercise batches — generate 10 per call, serve one at a time
- Chat — never cache (unique context)
- Cross-user exercise cache by topic (post-MVP) — reuse exercises generated for one user

### Post-MVP
- Admin dashboard for token consumption monitoring (per user, per endpoint, per day)
- Cross-user exercise caching (exercises generated for one user can be served to others on same topic)
- Budget alerts when approaching monthly spend threshold

## Prompts

Stored in `src/shared/lib/ai/prompts/`:
- `system.ts` — base Celestia persona + Castellano rules
- `assessment.ts` — question generation prompts
- `exercise.ts` — exercise generation prompts
- `chat.ts` — conversation prompts
- `curriculum.ts` — module generation prompts

## Error Handling

- Retry with exponential backoff (max 3 retries)
- Rate limiting awareness (429 handling)
- Graceful degradation for non-critical AI calls
- Timeout handling for long-running generations
