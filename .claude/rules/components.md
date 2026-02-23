---
paths:
  - "src/components/**/*.tsx"
  - "src/components/**/*.ts"
---

# React Component Rules — BurnFat.fun

## Server vs client — decide first
- Default: server component (no directive needed)
- Add `"use client"` ONLY if the component needs: `useState`, `useEffect`, `useRef`, event handlers, browser APIs
- Never add `"use client"` just in case — it disables server optimisations

## File conventions
- One component per file
- Filename = component name (PascalCase)
- Lives in `src/components/`
- Import via `@/components/ComponentName`

## TypeScript
- Explicit prop types inline: `({ prop }: { prop: string })`
- No `any` — ever
- No non-null assertions (`!`) without a comment explaining why it's safe
- `as const` on static data arrays (see ACTIVITY_FEED in LiveCounter)

## Patterns in this codebase
- SVG icons: add to `ICONS` map in the relevant component, render via `{ICONS[item.icon]}`
- State isolation: each client component manages its own state, no cross-component state
- No external state management library — keep it local

## What exists already (don't duplicate)
- `LiveCounter` — counter animation + activity feed, accepts `hook` and `label` props
- `WaitlistForm` — email + consent form, submits to Formspree
- `FaqAccordion` — accordion with single-open state
- `ThemeToggle` — dark/light switcher using `useSyncExternalStore` + MutationObserver
