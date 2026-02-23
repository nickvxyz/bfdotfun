---
name: dev
description: Main development workflow for burnfat.fun. Invoked for any coding task. Covers explore → plan → implement → verify cycle.
user-invocable: false
---

# Dev Workflow

## Before writing any code

1. Use the `explorer` subagent to understand the relevant files
2. Identify what already exists — never duplicate patterns
3. Check globals.css for existing BEM classes before adding new ones

## Implementation rules

**React/Next.js:**
- Default to server components — only add `'use client'` if the component needs state, effects, or browser APIs
- Client components live in src/components/, server sections stay in page.tsx
- Import paths use `@/` alias

**CSS:**
- All styles go in `src/app/globals.css` inside `@layer components`
- Use BEM: `.block__element--modifier`
- Colors: always CSS vars (`--c-black`, `--c-white`, `--c-green`, `--c-orange`, `--c-yellow`)
- Font sizes: `--fs-label`, `--fs-body`, `--fs-small`, `--fs-cta`
- Spacing: `--spacing-section`
- Zero border-radius — enforced globally, don't override
- Responsive: mobile breakpoints at 900px (grid collapse) and 768px (padding)
- Typography: `clamp()` for responsive font sizes

**TypeScript:**
- Strict mode — no `any`, no ignoring errors
- After every change: mentally verify TypeScript would pass

## After every change

Run verification:
```bash
npm run build
npm run lint
```

If either fails — fix before considering the task done. Do not move on with broken build or lint errors.

## Memory

After completing a task, append to `.claude/memory.md`:
```
## [date] — [task summary]
- What changed: [files]
- Key decisions: [why you did it this way]
- Watch out for: [any gotchas discovered]
```
