# AI Integration — Claude API

## Architecture

`AiService` wraps the Anthropic SDK, used by domain services:

```
AssessmentService → AiService → Claude API
ExerciseGenerationService → AiService → Claude API
ChatService → AiService → Claude API
CurriculumService → AiService → Claude API
```

## Key Patterns

### Structured Output
Use Claude's `tool_use` for typed JSON responses:
- Exercise generation → Exercise JSON schema
- Assessment questions → Question JSON schema
- Gap analysis → GapAnalysis JSON schema

### Castellano Validation
- System prompt with hard Spain-Spanish rules (vosotros, distinción)
- Latin American vocabulary blocklist (~200 terms)
- Self-verification in same prompt (confidence scoring)

### Error Handling
- Retry with exponential backoff
- Rate limiting awareness
- Graceful degradation for non-critical AI calls

### Prompts
Stored in `apps/api/src/ai/prompts/`:
- `system.ts` — base Celestia persona + Castellano rules
- `assessment.ts` — question generation prompts
- `exercise.ts` — exercise generation prompts
- `chat.ts` — conversation prompts
- `curriculum.ts` — module generation prompts
