# Phase 1: Design System & Shared UI

## Goal
Reusable UI component library + design tokens — foundation for all features.

## Steps

1. **Design Tokens** — CSS custom properties: colors, typography, spacing (4px scale), radius, shadows, breakpoints
2. **Global styles** — CSS reset, base typography, token imports
3. **Shared UI Components** (apps/web/src/shared/ui/):
   - Button (primary, secondary, outline, ghost × sm, md, lg)
   - Input (text, password; default, focus, error, disabled)
   - Card, Badge, ProgressBar, Avatar, Icon
   - Modal (Radix Dialog), Select (Radix Select), Tabs (Radix Tabs), Toast (Radix Toast)
4. **Component pattern** — CSS Modules + data-attributes for variants, design tokens for values

## Verification
- All components render on test page `/dev/ui`
- Changing CSS variables in `:root` instantly updates design
- Unit tests for each component (render, props, a11y)
