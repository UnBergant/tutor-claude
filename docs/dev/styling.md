# Styling — Tailwind CSS + shadcn/ui

## Approach

- **Tailwind CSS** — utility-first, mobile-first responsive design
- **shadcn/ui** — copied Radix-based components for base UI (Button, Card, Dialog, Select, etc.)
- **Custom components** — interactive exercise UI built with Tailwind + custom logic
- **CSS variables** — design tokens via Tailwind theme + CSS custom properties

## Two UI Layers

### Base UI (shadcn/ui)
Standard interface elements — navigation, forms, dashboards, settings:
- Button, Input, Card, Dialog, Select, Tabs, Toast, Badge, Progress, Avatar
- Installed via `npx shadcn@latest add <component>`
- Source code copied to `src/shared/ui/` — fully owned and customizable

### Custom Exercise UI
Interactive learning components — unique to the product:
- GapFill (insert word into sentence)
- MatchPairs (drag & drop pair matching)
- ReorderWords (drag words to build sentence)
- FreeWriting (text input + AI evaluation)
- ReadingComprehension (text + questions)

These use Tailwind for styling but have fully custom logic and interactions.

## Mobile-First

- Tailwind is mobile-first by default (no prefix = mobile, `md:` = tablet, `lg:` = desktop)
- Touch targets: `min-h-[44px]` minimum tap size
- `touch-manipulation` — remove 300ms tap delay
- `active:scale-95` — visual feedback on press
- Drag & drop via `@dnd-kit/core` — works with touch and mouse

## Component Pattern

```tsx
// Custom exercise component using Tailwind + shadcn Button
import { Button } from '@/shared/ui/button'

export function GapFill({ sentence, options, onResult }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg">...</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt} className="px-4 py-2 rounded-full border ...">
            {opt}
          </button>
        ))}
      </div>
      <Button size="lg" className="w-full">Проверить</Button>
    </div>
  )
}
```
