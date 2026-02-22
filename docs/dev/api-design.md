# API Design

## NestJS Module Structure

Each module follows the pattern:
- `*.controller.ts` — HTTP endpoints, validation
- `*.service.ts` — business logic
- `*.module.ts` — DI wiring
- `dto/` — request/response DTOs with class-validator

## REST Endpoints (Planned)

### Auth
- `POST /auth/google` — initiate Google OAuth
- `POST /auth/refresh` — refresh JWT tokens
- `GET /auth/me` — current user profile

### Assessment
- `POST /assessment/start` — begin assessment
- `POST /assessment/answer` — submit answer, get next question
- `POST /assessment/complete` — finalize and get results

### Lessons
- `GET /lessons?moduleId=` — list lessons for module
- `GET /lessons/:id` — lesson detail with blocks
- `POST /lessons/:id/progress` — update lesson progress

### Exercises
- `POST /exercises/generate` — generate exercises for topic
- `POST /exercises/:id/attempt` — submit exercise answer

### Chat
- `POST /chat/message` — send message (SSE response)
- `GET /chat/history` — conversation summary

### Curriculum
- `GET /curriculum/modules` — suggested modules
- `POST /curriculum/override` — user topic preference

### Vocabulary
- `GET /vocabulary` — personal dictionary
- `POST /vocabulary/review` — flashcard result
