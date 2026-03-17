# Review Report: HMAC Session Signing Migration

**Date:** 2026-03-12
**Branch:** exp/genesis-launch-2026-03-11
**Reviewer:** reviewer agent

---

## Status: PASS (with 1 MEDIUM advisory)

## Issues Found

### MEDIUM: SESSION_SECRET not in .env.local or .env.example
- **File:** `src/lib/session.ts:4`
- **Detail:** `SESSION_SECRET` env var is not set in `.env.local` and not documented in `.env.example`. The fallback `"bf-dev-secret-do-not-use-in-prod"` will be used silently in any environment where the var is missing — including production on Vercel if not configured there.
- **Action required:** Add `SESSION_SECRET` to Vercel env vars (prod + preview) with a strong random value (e.g., `openssl rand -hex 32`). Add `SESSION_SECRET=` to `.env.example` for documentation.
- **Note:** Deploying without this means all sessions are signed with a publicly known key, defeating the HMAC protection entirely.

### LOW: getSession does not validate `wallet` field
- **File:** `src/lib/session.ts:51`
- **Detail:** `getSession()` validates `userId` but not `wallet`. Since the HMAC signature protects against tampering, this is defense-in-depth only. No action required, but adding `&& parsed?.wallet && typeof parsed.wallet === "string"` would be thorough.

## Checklist Results

| # | Check | Result |
|---|-------|--------|
| 1 | `src/lib/session.ts` HMAC implementation correct | PASS — SHA-256, timingSafeEqual, proper cookie flags |
| 2 | All 18 read files use `import { getSession } from "@/lib/session"` | PASS — 18/18 verified |
| 3 | No inline getSession functions remain in `src/app/` | PASS — 0 matches |
| 4 | No file imports `cookies` from `next/headers` unless needed for non-session cookies | PASS — only `auth/connect` (auth_nonce) and `auth/nonce` (set nonce) |
| 5 | `bf_session` string only in `src/lib/session.ts` | PASS — single occurrence at line 5 |
| 6 | connect uses `setSession()`, disconnect uses `clearSession()` | PASS |
| 7 | Build + lint pass | PASS — zero errors |
| 8 | Dev fallback secret clearly named | PASS — `"bf-dev-secret-do-not-use-in-prod"` |

## Files Verified: 21

- `src/lib/session.ts` (new — core module)
- `src/app/api/auth/connect/route.ts` (setSession)
- `src/app/api/auth/disconnect/route.ts` (clearSession)
- `src/app/api/auth/me/route.ts` (getSession)
- `src/app/api/auth/profile/route.ts` (getSession)
- `src/app/api/burn-units/route.ts` (getSession)
- `src/app/api/submissions/route.ts` (getSession)
- `src/app/api/weight-entries/route.ts` (getSession)
- `src/app/api/referrals/route.ts` (getSession)
- `src/app/api/referrals/stats/route.ts` (getSession)
- `src/app/api/referrals/my-referrer/route.ts` (getSession)
- `src/app/api/email-verify/send/route.ts` (getSession)
- `src/app/api/email-verify/confirm/route.ts` (getSession)
- `src/app/api/challenges/route.ts` (getSession)
- `src/app/api/challenges/my/route.ts` (getSession)
- `src/app/api/challenges/[slug]/route.ts` (getSession)
- `src/app/api/challenges/[slug]/join/route.ts` (getSession)
- `src/app/api/challenges/[slug]/finalize/route.ts` (getSession)
- `src/app/api/challenges/[slug]/invites/route.ts` (getSession)
- `src/app/api/challenges/[slug]/rewards/route.ts` (getSession)
- `src/app/api/challenges/[slug]/rewards/claim/route.ts` (getSession)

## Verification

```
npm run build   ✓ zero errors
npm run lint    ✓ zero errors
```

## Verdict

Migration is complete and correct. All 18 API routes now use the shared `getSession()` from `@/lib/session`. All inline session helpers and direct `bf_session` cookie reads have been removed. The HMAC implementation is sound (SHA-256, timing-safe comparison, proper cookie flags). The one actionable item is ensuring `SESSION_SECRET` is set as an env var on Vercel before deploying — without it, the HMAC uses a known fallback key, which would be equivalent to no signing at all.
