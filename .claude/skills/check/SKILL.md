---
name: check
description: Run all verification checks (TypeScript, ESLint, build). Use before committing or deploying.
user-invocable: true
---

# Verification Checks

Run all three checks in sequence. Stop on first failure.

## Steps

1. **TypeScript** — type errors block everything
```bash
npx tsc --noEmit
```

2. **ESLint** — lint errors block everything
```bash
npm run lint
```

3. **Build** — confirms production build works
```bash
npm run build
```

## Output

Report results as:
- PASS: all three checks passed
- FAIL: which check failed and the error output
