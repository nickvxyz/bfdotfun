---
name: commit
description: Stage, commit with conventional message, push, and verify
user-invocable: true
---

# Commit & Push — BurnFat.fun

## Pre-commit checks
```bash
cd /home/claude/projects/burnfatdotfun
npm run build
npm run lint
```

If either fails — stop. Fix first. Do not commit broken code.

## Stage and review
```bash
git status
git diff --stat
git diff
```

Review what changed. Only stage files that belong to this change — no unrelated files.

```bash
git add [specific files]
```

Do NOT use `git add -A` unless every changed file is part of this task.

## Commit message

Format: `type: short description`

Types:
- `feat:` — new feature
- `fix:` — bug fix
- `style:` — CSS/visual only
- `refactor:` — restructure, no behavior change
- `chore:` — config, deps, tooling

Message should describe WHY, not WHAT. Keep it under 72 characters.

## Push
```bash
git push origin main
```

## Verify
```bash
git log --oneline -1
git status
```

Task is done when:
1. Build passes
2. Lint passes
3. Commit exists with descriptive message
4. Push confirmed
5. Working tree is clean
