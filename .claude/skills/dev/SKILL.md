---
name: dev
description: Main development workflow for burnfat.fun. Invoked for any coding task. Covers explore → plan → implement → verify cycle.
user-invocable: false
allowed-tools: Read, Edit, Write, MultiEdit, Bash, Grep, Glob, Task
---

# Dev Workflow

## Live context
- Git status: !`cd /home/claude/projects/burnfatdotfun && git status --short 2>/dev/null || echo "clean"`
- Last commit: !`cd /home/claude/projects/burnfatdotfun && git log --oneline -1 2>/dev/null`
- Lint state: !`cd /home/claude/projects/burnfatdotfun && npx eslint src/ --format compact 2>&1 | tail -3 || echo "unknown"`

## Before writing any code

1. Use the `explorer` subagent to understand relevant files
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
- Zero border-radius — enforced globally, never override
- Responsive: breakpoints at 900px and 768px only
- Dark mode: add `[data-theme="dark"] .classname {}` overrides in the dark mode section

**TypeScript:**
- Strict mode — no `any`, no ignoring errors
- Verify TypeScript mentally before finishing

## After every change

```bash
npm run build
npm run lint
```

Both must pass. Do not consider a task done until they do.

## Memory

After completing a task, append to `.claude/memory.md`:
```
## [date] — [task summary]
- What changed: [files]
- Key decisions: [why]
- Watch out for: [gotchas]
```
