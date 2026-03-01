---
name: review
description: Project-specific code review against burnfat.fun conventions
user-invocable: true
auto-invocable: true
---

# Code Review — BurnFat.fun

Review all changed files against project conventions. Run this after implementing a feature or fix.

## What to check

### Get the diff
```bash
cd /home/claude/projects/burnfatdotfun && git diff --stat && git diff
```

### Check each changed file against these rules

**CSS (globals.css):**
- All styles inside `@layer components`
- BEM naming: `.block__element--modifier`
- Colors use CSS vars only: `--c-black`, `--c-white`, `--c-green`, `--c-orange`, `--c-yellow`
- Font sizes use vars: `--fs-label`, `--fs-body`, `--fs-small`, `--fs-cta`
- Zero border-radius — no overrides
- No inline styles anywhere
- Responsive uses breakpoints at 900px and 768px only

**Components:**
- Server components by default — `'use client'` only if state, effects, or browser APIs are needed
- Client components live in `src/components/`
- Named exports (except App Router pages)
- No `any` types
- All UI states handled: loading, error, empty, success
- No derived state stored — compute from source

**General:**
- No magic numbers/strings — named constants
- No empty catch blocks
- No `console.log` left behind
- No unused imports or variables
- Import order: external → internal → relative → types

## Output format

```
## Review: [files reviewed]

### Pass / Fail

**Issues found:**
- [file:line] — [what's wrong] — [how to fix]

**Looks good:**
- [things done correctly worth noting]
```

If no issues found, just say PASS with a one-line summary.
