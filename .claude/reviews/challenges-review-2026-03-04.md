# Challenges Feature — Combined Review Log (2026-03-04)

## Review 1: Architecture + Bug Review

### CRITICAL
1. **[slug]/page.tsx:118** — Wrong email verify API path (`/api/email-verify` → should be `/api/email-verify/send`)
2. **rewards/route.ts + useClaimReward.ts:59** — Response shape mismatch (`{ reward_usdc, proof }` flat vs `{ reward: {...} }` expected)
3. **rewards/route.ts** — Missing `contract_challenge_id` in response
4. **finalize/route.ts** — No on-chain `setMerkleRoot` call after computing root
5. **weight-entries/route.ts:184-226** — Only first active challenge attributed (silent data loss for multi-challenge users)
6. **finalize/route.ts:101** — Float rounding loses micro-USDC (sum != prize pool)

### HIGH
7. **rewards/claim/route.ts:70-103** — `batchId` from `useSendCalls` is not an EVM tx hash (same bug as BurnFatTreasury had)
8. **[slug]/route.ts:105** — `.single()` on update (should be `.maybeSingle()`)
9. **join/route.ts:141-144** — Race condition on invite code `use_count` (non-atomic check+increment)
10. **email-verify/send/route.ts:29** — `Math.random()` for verification code (not crypto-secure)
11. **finalize/route.ts:66-68** — No auto-transition from `active` → `ended` (admin UI gap)
12. **useChallengeCreate.ts:85-92** — `contractChallengeId` always null (ChallengeCreated event not parsed)

### MEDIUM
13. **challenges/route.ts:64** — No slug format validation (path traversal risk)
14. **challenges/route.ts:28** — Public GET returns all columns including internal fields
15. **invites/route.ts** — No `max_uses` validation (accepts 0 or negative)
16. **feed/route.ts** — No auth — private challenge participant data publicly readable
17. **email-verify/confirm/route.ts:43-45** — No rate limiting on code brute force
18. **admin/page.tsx:81-83** — Participant list never fetched (always empty)
19. **RLS policies** — Grant all access to all roles (intentional but fragile)

### LOW
20. **Multiple files** — `getSession()` copy-pasted in every route (no shared helper)
21. **feed/route.ts** — Fragile Supabase join handling
22. **merkle.ts:13** — Unnecessary type assertion
23. **[slug]/page.tsx:197** — Unreachable `!slug` condition

---

## Review 2: UX Review

### CRITICAL
24. **challenges/page.tsx:125** — CSS class `challenge-card--inactive` has no styles (should be `--ended`)
25. **admin/page.tsx:81** — Participants table permanently empty (API not implemented)
26. **admin/page.tsx:112-132** — `window.confirm()` blocked in iframe/Farcaster context

### HIGH
27. **[slug]/page.tsx:270-274** — Eligibility rules hidden from participants and creators
28. **[slug]/page.tsx:384-398** — Email verify error resets entire flow (loses partial progress)
29. **create/page.tsx:187-196** — No sign-in button on create page when unauthenticated
30. **[slug]/page.tsx:56-57** — Auth loading state not handled (join section flashes)
31. **ChallengesTab.tsx:36-62** — Claim button disabled during error state (user stuck, can't retry)
32. **challenges/page.tsx:88-90** — Create button visible to unauthenticated users → dead-end

### MEDIUM
33. **admin/page.tsx:157** — Non-creator sees loading before permission error
34. **create/page.tsx:248-253** — No slug format validation feedback
35. **create/page.tsx:95-117** — Validation errors shown far from offending field
36. **[slug]/page.tsx:405-408** — "Sign in to join" is plain text, no button
37. **ChallengeFeed.tsx:76-77** — No guard against negative delta display
38. **admin/page.tsx:194-195** — No explanation when finalize unavailable
39. **ChallengesTab.tsx:94-95** — Draft challenges appear in "past" bucket

### LOW
40. **[slug]/page.tsx:223** — Status badge uses raw enum, not label mapping
41. **globals.css** — No focus styles on challenge inputs
42. **admin/page.tsx:290-300** — Invite codes section visible for non-invite-only challenges
43. **ChallengesTab.tsx** — Error state has no retry button
44. **create/page.tsx:419** — USDC requirement note only on step 3
45. **challenges/page.tsx:109** — Loading state is plain text, no skeleton
