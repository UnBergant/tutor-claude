# API Design — Server Actions + Route Handlers

## Architecture

No separate API server. Next.js handles all server-side logic:

| Mechanism | Use Case | Example |
|---|---|---|
| Server Actions | Mutations (create, update, delete) | Submit answer, save progress, update profile |
| Route Handlers | Streaming, webhooks, external integrations | Chat SSE, Auth.js callbacks |
| Server Components | Data fetching for page renders | Lesson page, dashboard |

## Server Actions (Mutations)

Colocated with their feature module:

```ts
// src/modules/exercise/actions.ts
"use server"

import { prisma } from '@/shared/lib/prisma'
import { auth } from '@/shared/lib/auth'

export async function submitAnswer(exerciseId: string, answer: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } })
  const isCorrect = exercise.correctAnswer === answer

  await prisma.exerciseAttempt.create({
    data: { exerciseId, answer, correct: isCorrect, userId: session.user.id }
  })

  return { correct: isCorrect, explanation: exercise.explanation }
}
```

## Route Handlers (Streaming & Integrations)

```ts
// src/app/api/chat/route.ts
export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { message } = await request.json()
  const stream = await anthropic.messages.create({ ..., stream: true })

  return new Response(stream.toReadableStream(), {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}
```

## Endpoints (Planned)

### Server Actions
- `submitAnswer(exerciseId, answer)` — check exercise answer
- `startAssessment()` — begin assessment flow
- `submitAssessmentAnswer(questionId, answer)` — submit + get next question
- `completeAssessment()` — finalize and get results
- `updateLessonProgress(lessonId, status, score)` — save lesson progress
- `saveVocabularyReview(wordId, correct)` — flashcard result
- `updateProfile(data)` — update user profile/preferences
- `overrideCurriculum(topics)` — user topic preference

### Route Handlers
- `POST /api/chat` — chat message (SSE streaming response)
- `GET /api/auth/[...nextauth]` — Auth.js routes
- `POST /api/auth/[...nextauth]` — Auth.js routes

### Server Components (Data Fetching)
- Lesson page — fetch lesson with blocks
- Dashboard — fetch user progress, suggested modules
- Vocabulary — fetch personal dictionary
- Assessment results — fetch strengths/weaknesses
