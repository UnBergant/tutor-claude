# State Management

## Server State — Server Components + Server Actions

Data is fetched on the server via Prisma inside Server Components — no client-side fetching layer needed. Mutations use Server Actions (`"use server"` functions) with `revalidatePath()` for cache invalidation.

```tsx
// Server Component — data loaded on the server, no client-side fetch
async function LessonsPage() {
  const lessons = await prisma.lesson.findMany({ where: { moduleId } });
  return <LessonList lessons={lessons} />;
}
```

```ts
// Server Action — mutation + cache invalidation
"use server";
export async function completeLesson(lessonId: string) {
  await prisma.lessonProgress.update({ ... });
  revalidatePath("/lessons");
}
```

## Client State — Zustand (complex features only)

Used only when a feature has complex multi-step state that React's `useState` can't cleanly handle. Applied to: assessment flow, exercise engine, lesson flow.

**Not used for:** simple UI toggles, form state, single-value state.

```ts
// modules/lesson/store.ts
import { create } from 'zustand'

interface LessonState {
  phase: 'explanation' | 'exercises' | 'transition' | 'complete'
  blockIndex: number
  setPhase: (phase: LessonState['phase']) => void
  nextBlock: () => void
}

export const useLessonStore = create<LessonState>((set) => ({
  phase: 'explanation',
  blockIndex: 0,
  setPhase: (phase) => set({ phase }),
  nextBlock: () => set((s) => ({ blockIndex: s.blockIndex + 1, phase: 'explanation' })),
}))
```

## Container/Presentational Pattern

```tsx
// Container — connects state
function ExerciseContainer({ exerciseId }: { exerciseId: string }) {
  const { submitAnswer } = useExerciseActions()
  return <GapFill exercise={exercise} onSubmit={submitAnswer} />
}

// Presentational — pure props, no state awareness
function GapFill({ exercise, onSubmit }: GapFillProps) {
  return <div>...</div>
}
```