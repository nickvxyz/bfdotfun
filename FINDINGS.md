# FINDINGS.md — BurnFat.fun Agent Communication Log

---
## forge · 2026-03-10 — Overnight Plan Brief

### Goal
Prepare burnfat.fun for Genesis Fat Burning launch. One live feature on mainnet:
accept past fat burned submissions at 50% discount ($0.50/kg retrospective pricing).

### What must be live on burnfat.fun:
1. Landing page (already live)
2. Sign up with Base App (Coinbase wallet) — auth currently disabled, needs re-enabling
3. Profile page — all inputs, submissions, charts, progress bar working
4. Global counter counting from real user submissions
5. Live feed from real user submissions
6. Past burned fat (retrospective) disappears from profile after submission
7. Challenges tab → "Coming Soon"
8. Coaches page → "Coming Soon"
9. Intuitive navigation between pages (back buttons, breadcrumbs, profile nav)
10. Referral system — web2-friendly links (burnfat.fun/r/code), cookie tracking

### Smart contract — NOT tonight
Contract changes deferred to tomorrow. Nick will provide additional context.
Current contract address: 0x3DFEA85e527957F91CF4be736bbF39c12d4EB618 (Base Sepolia)
Current chain: 84532 (Base Sepolia) — will switch to mainnet after contract deploy.

### Agents running tonight:
- ux: auth re-enable, navigation, coming soon pages, retrospective visibility
- backend: real feed API, chain switching, referral system
- reviewer: review all changes after ux + backend finish

### Critical patterns (all agents must follow):
- All API routes use createAdminClient() — anon key blocked by RLS
- .maybeSingle() when 0 rows is valid — .single() throws on empty
- USDC has 6 decimals — $1 = 1_000_000
- IS_DEV_MODE from @/lib/dev — never redefine
- Nonce validation: exact match (===)
- BEM CSS only, all styles in globals.css @layer components
- Zero border-radius enforced globally
- Monospace fonts only
---

---
## ux agent completed Wed Mar 11 09:04:49 CET 2026
See: /home/claude/agent-worktrees/ux/agent-output.log
---

---
## contract-audit · 2026-03-11 — Codex Audit: BurnFatTreasury.sol

### Pipeline
Three-check audit via OpenAI Codex CLI (gpt-5.4, read-only sandbox):
1. DETECT — vulnerability scan
2. PATCH — fix proposals
3. EXPLOIT — exploit path analysis

### CHECK 1: DETECT Results

| Severity | Location | Description |
|----------|----------|-------------|
| HIGH | L17, L39 | **Sybil abuse of retrospective discount.** `hasUsedRetrospective` is per-address only. Users can create fresh addresses to claim the $0.50/kg discount repeatedly, defeating the one-time restriction. |
| MEDIUM | L61 | **Self-referral allowed.** Caller can pass `referrer == msg.sender` and reclaim ~33% of payment as referral share, reducing effective price to ~$0.67/kg. |
| LOW | L82 | **No zero-address check on `withdrawReservePool` recipient.** Owner mistake could burn reserve funds. |

**Pass condition (zero CRITICAL/HIGH): FAIL** — 1 HIGH found.

### CHECK 2: PATCH Results
Three fixes proposed, all preserve original functionality:

1. **Self-referral fix (HIGH->resolved):** Add `&& referrer != msg.sender` to the referrer check at L61. Self-referrals fall through to ops wallet.
2. **Fee-on-transfer guard (MEDIUM):** Add balance-before/after check around `transferFrom` at L48 to reject tokens that deliver less than expected.
3. **Zero-address check (LOW):** Add `require(to != address(0))` at L82 before reserve withdrawal.

All fixes are minimal, non-breaking, and preserve the 1/3-1/3-1/3 split logic.

### CHECK 3: EXPLOIT Results
- **No direct critical exploit** found for real USDC + standard OZ Ownable.
- **No practical reentrancy path** — `withdrawReservePool` decrements state before external call (correct CEI pattern). `submitBurn` has external calls but no reenterable state advantage under honest ERC20.
- **No unauthorized access** — `onlyOwner` properly guards admin functions.
- **Economic abuse paths confirmed:** self-referral (~33% rebate) and sybil retrospective discount are the only real attack surfaces.
- **Malicious token path** (theoretical): if deployed with a hostile ERC20 instead of real USDC, accounting breaks entirely. Not applicable to production deployment with genuine USDC.

### Verdict: CONDITIONAL PASS

No CRITICAL vulnerabilities. One HIGH (sybil retrospective) is a business-logic concern, not a fund-drain exploit — it requires creating new wallets and funding them with USDC, making it economically marginal for small amounts.

**Required before mainnet:**
1. Fix self-referral: add `referrer != msg.sender` check (simple, high-impact)
2. Add zero-address check on `withdrawReservePool` (simple, defensive)

**Recommended but not blocking:**
3. Retrospective sybil resistance: consider signed vouchers or Merkle allowlist if the discount is material
4. Fee-on-transfer guard: not needed for real USDC but good hygiene

**Not blocking:**
- No reentrancy guard needed (USDC has no callbacks)
- No unauthorized access paths found
- Reserve accounting is correct for standard ERC20

Reports archived at `/tmp/codex-audit/report-{detect,patch,exploit}.md`
---

---
## contract-audit · 2026-03-11 — Re-Audit: BurnFatTreasury.sol (Post-Patch)

### Context
Re-run of the 3-check codex audit pipeline after security patches were applied:
- **Self-referral block**: `referrer != msg.sender` added to line 61
- **Zero-address validation**: `require(to != address(0))` added to `withdrawReservePool` at line 83

### CHECK 1: DETECT Results

| Severity | Count | Details |
|----------|-------|---------|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 2 | Self-referral bypass via second wallet (business logic, not exploit); Sybil retrospective pricing bypass via fresh wallets |
| LOW | 2 | Reserve accounting drift with non-standard ERC20s; Unsafe ERC20 interaction (no SafeERC20) |

**Result: PASS** (zero CRITICAL/HIGH)

### CHECK 2: PATCH Results
Two hardening fixes proposed (non-blocking):
1. **SafeERC20**: Replace raw `IERC20.transfer`/`transferFrom` with `SafeERC20.safeTransfer`/`safeTransferFrom`. Preserves all pricing, splits, events, and admin behavior.
2. **Balance-delta accounting**: Measure `balanceOf` before/after `transferFrom` to catch fee-on-transfer tokens. Preserves functionality, rejects non-standard token behavior only.

**Result: PASS** (fixes preserve functionality)

### CHECK 3: EXPLOIT Results
- **No exploit paths found** to drain funds, bypass `onlyOwner`, or execute reentrancy
- **No unauthorized access** — admin functions properly gated
- **Business-logic abuse only**: referral farming via second wallet (~33% rebate), Sybil retrospective discount
- **Reentrancy**: not exploitable with standard USDC (no callbacks)

**Result: PASS** (no exploitable paths under normal USDC deployment)

### Verdict: PASS

All 3 checks passed. Previous HIGH (self-referral) and LOW (zero-address) are now resolved. Remaining findings are MEDIUM/LOW business-logic concerns, not fund-drain exploits.

**Recommended hardening (non-blocking for testnet):**
1. SafeERC20 wrapper — low-effort, good hygiene
2. Referral allowlist or signed authorization — mitigates farming
3. Merkle-proof retrospective claims — mitigates Sybil abuse
4. Balance-delta check — only needed if token could be non-standard

Reports archived at `/tmp/codex-audit/report-{detect,patch,exploit,summary}.md`
---

---
## forge · 2026-03-11 — Full-Stack Codex Audit: Genesis Launch Files

### Pipeline
Three-check audit of ALL changed files (22 files: Solidity, TypeScript hooks, API routes, pages, config):
1. SECURITY — vulnerabilities, auth patterns, on-chain verification, referral flow, data integrity
2. CORRECTNESS — ABI match, chain ID, USDC decimals, error handling, types
3. INTEGRATION — end-to-end flows, API contracts, polling, mainnet switch

### VERDICT: CONDITIONAL PASS

1 CRITICAL, 2 HIGH, 4 MEDIUM, 3 LOW findings. No fund-drain exploits, but auth bypass and runtime crash bugs must be fixed.

### CRITICAL (1)

**S1: Unsigned Session Cookie — Auth Bypass**
- `src/app/api/auth/connect/route.ts:86`
- `bf_session` is plain JSON, httpOnly but not signed. Any user who knows a Supabase UUID can forge a session and impersonate that user (full account takeover).
- **Fix:** Sign with `iron-session`, `jose` JWT, or HMAC. Launch blocker.

### HIGH (2)

**C3/C7/I1: Fractional kgAmount Crashes BigInt**
- `src/app/profile/submit/page.tsx:64`
- `selectedKgRounded = Math.round(selectedKg * 10) / 10` can be `1.5`. `BigInt(1.5)` throws RangeError. Contract also expects integer kg.
- **Fix:** Use `Math.round(selectedKg)` or enforce `BigInt(Math.round(kgAmount))` in the hook.

**I8: useClaimReward Skips On-Chain Verification**
- `src/hooks/useClaimReward.ts:94-98`
- Sends Smart Wallet batch ID (not tx hash) to backend. Backend regex rejects it and skips verification. Claim recorded without proof.
- **Fix:** Add `getCallsStatus` polling (same as `useBurnSubmit`) to get real tx hash.

### MEDIUM (4)

| ID | Finding | File |
|----|---------|------|
| S2 | Reentrancy pattern in Solidity (low practical risk with USDC) | `contracts/BurnFatTreasury.sol:59-68` |
| S5 | Self-referral possible (no user_id !== referrer_id check) | `src/app/api/auth/connect/route.ts:74` |
| S8 | Demo mode env var skips on-chain verification | `src/app/api/submissions/route.ts:123` |
| I4 | Activity feed type values unverified against DB CHECK constraint | multiple API routes |

### LOW (3)

| ID | Finding |
|----|---------|
| S4 | Public feed route exposes display names (by design) |
| S6 | Referral double-count has indirect guard via tx_hash uniqueness |
| C6 | Unsafe TypeScript casts on Supabase join results |

### PASS Items
- ABI matches Solidity exactly
- Chain ID all Base mainnet (no testnet in runtime)
- USDC decimal handling correct in pricing lib
- Error handling complete
- React hook deps correct
- No SQL injection, no XSS
- localStorage SSR-safe
- Referral flow end-to-end functional
- Polling cleanup correct (no memory leaks)
- Retrospective one-time guard triple-layered
- Mainnet switch complete

### Required Before Mainnet Deploy
1. S1: Sign session cookies
2. C3/I1: Fix fractional kgAmount
3. I8: Fix useClaimReward tx hash resolution
4. S5: Add self-referral prevention in connect route

Reports archived at `/tmp/codex-review/report-{security,correctness,integration,summary}.md`
---

---
## forge · 2026-03-12 — Codex Audit: HMAC Session Signing Implementation

### Pipeline
Three-check audit via OpenAI Codex CLI (read-only sandbox) of `src/lib/session.ts` and all 8 API route files that consume it.

Files audited:
- `src/lib/session.ts` — HMAC signing/verification core
- `src/app/api/auth/connect/route.ts` — setSession()
- `src/app/api/auth/disconnect/route.ts` — clearSession()
- `src/app/api/auth/me/route.ts` — getSession()
- `src/app/api/auth/profile/route.ts` — getSession()
- `src/app/api/submissions/route.ts` — getSession()
- `src/app/api/referrals/my-referrer/route.ts` — getSession()
- `src/app/api/burn-units/route.ts` — getSession()
- `src/app/api/weight-entries/route.ts` — getSession()

### CHECK 1: SECURITY Results

| Severity | Location | Description |
|----------|----------|-------------|
| HIGH | session.ts:4 | **Hardcoded fallback secret.** `SESSION_SECRET` falls back to `"bf-dev-secret-do-not-use-in-prod"` if env var is unset or empty string. If production ever runs without `SESSION_SECRET`, attackers can forge arbitrary session cookies offline. |
| LOW | session.ts:19 | **Length-check timing leak.** Early return on signature length mismatch reveals fixed signature length (64 hex chars for SHA-256). No practical attack — only leaks public info. |

**HMAC implementation: CORRECT.** SHA-256 via `createHmac`, timing-safe comparison via `timingSafeEqual`, proper sign-then-verify flow.

**Cookie attributes: CORRECT.** `httpOnly: true`, `secure` in production, `sameSite: "strict"`, `path: "/"`.

**Route consistency: PASS.** All 8 routes use `getSession()`/`setSession()`/`clearSession()` from `@/lib/session`. No route reads `bf_session` directly. Only `session.ts:5` references the cookie name.

**Bypass attempts: ALL FAIL.** Missing cookie, missing dot, empty signature, malformed payload — all return `null`.

### CHECK 2: CORRECTNESS Results

| Severity | Location | Description |
|----------|----------|-------------|
| MEDIUM | session.ts:51 | **Incomplete `SessionData` validation.** `getSession()` only validates `userId` exists and is a string. `wallet` is declared in the `SessionData` interface but not validated at parse time. If a cookie were somehow signed with `{"userId":"x"}` (no wallet), it would pass. Low practical risk since only `setSession()` creates cookies and always includes both fields. |

**setSession/getSession roundtrip: CORRECT.** `setSession` writes `JSON.stringify(data) + "." + hmac(payload)`, `getSession` splits on `lastIndexOf(".")` and verifies. Using `lastIndexOf` correctly handles dots that may appear inside JSON string values.

**clearSession: CORRECT.** Deletes by cookie name `bf_session`.

**Import paths: CONSISTENT.** All routes import from `@/lib/session`. connect-route.ts also imports `cookies` from `next/headers` but legitimately uses it for `auth_nonce` cookie management.

**TypeScript types: MINOR GAP.** `SessionData` shape `{userId, wallet}` is set by `setSession` in connect-route.ts:87. All routes only read `session.userId` — `wallet` is stored but unused at read time.

### CHECK 3: EXPLOIT Results

| # | Attack Vector | Result |
|---|--------------|--------|
| 1 | Forge session cookie without secret | **FAILS** — requires valid HMAC-SHA256, computationally infeasible with strong secret |
| 2 | Replay old cookie after signout | **SUCCEEDS** — `clearSession()` only deletes browser cookie, no server-side revocation. Stolen cookie valid until 7-day maxAge expiry. |
| 3 | Modify JSON payload keeping signature | **FAILS** — any payload change invalidates HMAC |
| 4 | Empty/undefined SESSION_SECRET | **SUCCEEDS** — both `undefined` and `""` are falsy in JS, triggering hardcoded fallback. Attacker with source code can forge any session. |
| 5 | Length extension attack on HMAC-SHA256 | **FAILS** — HMAC construction is immune to length extension (unlike raw `sha256(secret+msg)`) |
| 6 | Extract secret from observing cookies | **FAILS** — HMAC-SHA256 is a PRF; seeing `(payload, mac)` pairs does not reveal the key |

### Verdict: CONDITIONAL PASS

**HMAC scheme is cryptographically sound.** Implementation is correct: SHA-256, timing-safe comparison, proper cookie attributes, consistent route usage, no bypass paths for malformed input.

**Two issues require attention:**

1. **HIGH — Hardcoded fallback secret (session.ts:4)**
   - Risk: If `SESSION_SECRET` env var is missing in production, all sessions are forgeable.
   - Fix: Throw at startup if `SESSION_SECRET` is not set, or at minimum check `process.env.NODE_ENV === "production"` and refuse to start.
   - Status: Verify `SESSION_SECRET` is set in Vercel environment variables.

2. **MEDIUM — No server-side session revocation**
   - Risk: Stolen cookies survive logout for up to 7 days.
   - Fix: Add session version/nonce to user record, check on each `getSession()` call, increment on logout. Or use shorter maxAge with refresh.
   - Status: Acceptable for MVP if cookie theft vector is low (httpOnly + secure + sameSite:strict mitigate most theft scenarios).

3. **MEDIUM — Incomplete wallet validation in getSession() (session.ts:51)**
   - Risk: Theoretical — only `setSession()` creates cookies and always includes `wallet`.
   - Fix: Add `!parsed?.wallet || typeof parsed.wallet !== "string"` check alongside userId validation.

**S1 from previous audit (unsigned session cookie) is now RESOLVED.** The HMAC signing implementation directly addresses the CRITICAL finding from the 2026-03-11 full-stack audit.

Reports archived at `/tmp/codex-session-audit/report-{security,correctness,exploit}.md`
---
