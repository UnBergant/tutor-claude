# Styling — CSS Modules + Design Tokens

## Approach

- **CSS Modules** — scoped styles per component (`.module.css`)
- **Design Tokens** — CSS custom properties in `shared/tokens/`
- **No CSS-in-JS** — better performance, native CSS features
- **Data attributes** for variants (`data-variant`, `data-size`) instead of className composition

## Token Files

| File | Contents |
|------|----------|
| `colors.css` | Primary, secondary, neutral, semantic colors |
| `typography.css` | Font families, sizes, line-heights, weights |
| `spacing.css` | 4px scale: `--space-1` (4px) through `--space-16` (64px) |
| `radius.css` | Border radius values |
| `shadows.css` | Box shadow definitions |
| `breakpoints.css` | Media query breakpoints |

## Component Pattern

```tsx
// Button/Button.tsx
import styles from './Button.module.css'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button = ({ variant = 'primary', size = 'md', ...props }: ButtonProps) => (
  <button className={styles.root} data-variant={variant} data-size={size} {...props} />
)
```

```css
/* Button/Button.module.css */
.root {
  font-family: var(--font-body);
  border-radius: var(--radius-md);
  transition: all 0.15s ease;
}
.root[data-variant='primary'] {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.root[data-size='sm'] { padding: var(--space-1) var(--space-2); }
```

## Headless UI Primitives

Complex interactive components use **Radix UI** for accessible behavior:
- Dialog → Modal
- Select → Select dropdown
- Tabs → Tab panels
- Toast → Notifications

Radix provides behavior + a11y; CSS Modules provide styling.
