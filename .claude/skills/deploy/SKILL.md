---
name: deploy
description: Deploy changes to production. Run after a task is complete and verified. Commits, pushes to main, triggers Vercel deploy.
user-invocable: false
---

# Deploy Workflow

## Pre-deploy checklist

```bash
npm run build    # Must pass — zero errors
npm run lint     # Must pass — zero warnings on changed files
git diff --stat  # Confirm only expected files changed
```

If build or lint fails — do NOT deploy. Fix first.

## Deploy steps

```bash
git add -A
git commit -m "[type]: [description]"
git push origin main
```

Commit message types:
- `feat:` new feature
- `fix:` bug fix
- `style:` CSS/visual only
- `refactor:` restructure, no behaviour change
- `chore:` config, deps, tooling

## After push

Vercel auto-deploys from main. Deployment typically takes 60-90 seconds.

Confirm deploy triggered:
```bash
curl -s -X POST "https://api.vercel.com/v1/integrations/deploy/prj_LMfNxOqAfnNJ0FakUadZWsGV8YGB/4xbZGE9n9Z" > /dev/null && echo "Deploy triggered"
```

## Done condition

Task is complete when:
1. `npm run build` passes
2. `npm run lint` passes
3. Git commit exists with descriptive message
4. Push confirmed on main branch
