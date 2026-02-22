# State Management

## Server State — TanStack Query

Primary tool for API data. Handles fetching, caching, and background refetching:

```ts
import { useQuery } from '@tanstack/react-query'

export function useLessons(moduleId: string) {
  return useQuery({
    queryKey: ['lessons', moduleId],
    queryFn: () => fetch(`/api/lessons?moduleId=${moduleId}`).then(r => r.json()),
  })
}
```

## Client State — Zustand (complex features only)

Used only when a feature has complex multi-step state that React's `useState` can't cleanly handle. Applied to: assessment flow, exercise engine, chat.

**Not used for:** simple UI toggles, form state, single-value state.

```ts
// modules/assessment/store.ts
import { create } from 'zustand'

interface AssessmentState {
  step: 'welcome' | 'experience' | 'goal' | 'assessment' | 'results'
  currentQuestion: number
  answers: Record<number, string>
  setAnswer: (questionId: number, answer: string) => void
  nextQuestion: () => void
  setStep: (step: AssessmentState['step']) => void
}

export const useAssessmentStore = create<AssessmentState>((set) => ({
  step: 'welcome',
  currentQuestion: 0,
  answers: {},
  setAnswer: (id, answer) => set((s) => ({ answers: { ...s.answers, [id]: answer } })),
  nextQuestion: () => set((s) => ({ currentQuestion: s.currentQuestion + 1 })),
  setStep: (step) => set({ step }),
}))
```

## Container/Presentational Pattern

```tsx
// Container — connects state
function ExerciseContainer({ exerciseId }: { exerciseId: string }) {
  const { data: exercise } = useExercise(exerciseId)
  const { submitAnswer } = useExerciseActions()
  return <GapFill exercise={exercise} onSubmit={submitAnswer} />
}

// Presentational — pure props, no state awareness
function GapFill({ exercise, onSubmit }: GapFillProps) {
  return <div>...</div>
}
```
