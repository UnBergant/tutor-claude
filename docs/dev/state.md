# State Management

## Client State — Zustand

Lightweight stores for UI and domain state:

```ts
// features/assessment/assessment.store.ts
import { create } from 'zustand'

interface AssessmentState {
  currentQuestion: number
  answers: Record<number, string>
  setAnswer: (questionId: number, answer: string) => void
  nextQuestion: () => void
}

export const useAssessmentStore = create<AssessmentState>((set) => ({
  currentQuestion: 0,
  answers: {},
  setAnswer: (id, answer) => set((s) => ({ answers: { ...s.answers, [id]: answer } })),
  nextQuestion: () => set((s) => ({ currentQuestion: s.currentQuestion + 1 })),
}))
```

## Server State — TanStack Query

API data fetching, caching, and synchronization:

```ts
// features/lesson/hooks/useLessons.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/lib/api'

export function useLessons(moduleId: string) {
  return useQuery({
    queryKey: ['lessons', moduleId],
    queryFn: () => api.get(`/lessons?moduleId=${moduleId}`),
  })
}
```

## Container/Presentational Pattern

```tsx
// Container — connects state
function LessonContainer({ lessonId }: { lessonId: string }) {
  const { data: lesson } = useLesson(lessonId)
  const { progress, setProgress } = useLessonStore()
  return <LessonView lesson={lesson} progress={progress} onProgress={setProgress} />
}

// Presentational — pure props
function LessonView({ lesson, progress, onProgress }: LessonViewProps) {
  return <div>...</div>
}
```
