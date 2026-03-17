# Garmin Integration & Data Verification — Multi-Option Plan

## Context
burnfat.fun challenges have USDC prize pools. Currently all weight data is self-reported — users type numbers manually. With real money at stake, cheating is trivial: type fake weights, claim prizes. We need verified data from physical smart scales. Garmin Index S2 is the primary target device.

## The Core Question
Does Garmin's official API expose a `source` field (device vs manual)? This determines which option is viable. We won't know until we apply and ask. All options below account for both answers.

---

## OPTION A: Server-Side API Only (No Native App)

**What it is:** burnfat.fun stays a website. Users click "Connect Garmin" in their browser, authorize via OAuth, and Garmin sends scale data to our server automatically via webhook.

**When to choose:** If Garmin API DOES expose source field (device vs manual).

**What I build:**
- `POST /api/garmin/auth` — starts OAuth flow in browser
- `GET /api/garmin/callback` — handles redirect, stores encrypted tokens
- `POST /api/garmin/webhook` — receives push notifications from Garmin when user syncs scale
- `GET /api/garmin/sync` — manual pull fallback
- `POST /api/garmin/disconnect` — revoke access
- DB: `device_connections` table, `source` + `verified` columns on `weight_entries`
- UI: "Connect Garmin" button on profile, connection status, source badges on entries
- Challenge rules: `requires_verification` flag, min 80% verified entries

**Timeline (me building):** 1-2 weeks after Garmin approval

**Pros:**
- Fastest to build
- Zero cost (no App Store fees, no middleware fees)
- No friction for users (no app download)
- burnfat.fun stays a pure webapp
- Garmin Index S2 syncs via WiFi → cloud → our server (no Bluetooth needed)

**Cons:**
- IF Garmin doesn't expose source field → useless. Can't tell device readings from manual entries.
- Can't read device serial number (Unit ID) — website has no hardware access
- No push notifications for weigh-in reminders
- No App Store presence

**Risk:** Medium. Depends entirely on Garmin's answer about source field.

---

## OPTION B: Capacitor Wrapper (Website → App Store)

**What it is:** Take the existing burnfat.fun React codebase, wrap it in a Capacitor shell, publish to App Store and Google Play. Same website inside, but with native capabilities added via plugins.

**When to choose:** If Garmin API does NOT expose source field. Or if you want App Store presence regardless.

**What I build:**
- Everything from Option A (server-side OAuth + webhook)
- Capacitor project setup (`@capacitor/core`, `@capacitor/cli`)
- Custom Capacitor plugin for Garmin SDK bridge (Swift for iOS, Kotlin for Android)
  - `getDeviceUnitId()` — reads scale serial number via Bluetooth
  - `verifyDeviceOwnership()` — challenge-response to confirm user owns the device
- Secure token storage in device keychain (not localStorage)
- App icons, splash screen, App Store metadata
- Apple Developer account setup ($99/year)
- Google Play developer account ($25 one-time)

**Timeline (me building):** 2-3 weeks after Garmin approval + 1-2 weeks App Store review

**Pros:**
- GUARANTEED device verification — reads serial number directly
- Doesn't depend on Garmin exposing source field
- App Store presence (discoverability, trust)
- Push notifications possible
- Same codebase as website — minimal maintenance overhead
- Users who don't want the app can still use the website for basic features

**Cons:**
- Users must download an app for verified challenges
- App Store review adds 1-2 weeks
- $99/year Apple Developer + $25 Google Play
- Need macOS for iOS builds (you may need to set up or rent a Mac)
- Two deployment targets (Vercel for web + App Store for native)

**Risk:** Low. Device verification is guaranteed. Main risk is App Store rejection (unlikely for a fitness app).

---

## OPTION C: React Native / Expo (Rebuild as Mobile App)

**What it is:** Rebuild burnfat.fun UI using React Native components. Shares TypeScript/business logic but UI is rebuilt with native components (not HTML/CSS). Published to App Store + Google Play.

**When to choose:** If you want a truly native-feeling app (smoother animations, native navigation, native UI elements). Or if Capacitor plugins prove insufficient for Garmin SDK.

**What I build:**
- New React Native project with Expo
- Rebuild all screens using React Native components (not HTML/CSS)
- Garmin Health SDK integration via native module
- Apple HealthKit integration via `expo-health` (bonus: gets ALL health data, not just Garmin)
- Android Health Connect integration
- All API routes stay on Vercel (shared backend)
- Push notifications via Expo Notifications

**Timeline (me building):** 3-4 weeks after Garmin approval + 1-2 weeks App Store review

**Pros:**
- Best mobile UX (native feel, smooth animations)
- Full Garmin Health SDK access (Bluetooth, Unit ID, raw FIT data)
- Apple HealthKit + Android Health Connect (gets data from ALL scales, not just Garmin)
- Push notifications
- Cross-platform (iOS + Android from one codebase)

**Cons:**
- Most work — UI rebuild required (React Native components ≠ HTML/CSS)
- Two UIs to maintain (website stays React/Next.js, app is React Native)
- Expo managed workflow may not support Garmin SDK → bare workflow needed
- Learning curve for React Native specifics

**Risk:** Medium. More work but more capable. Risk is in the rebuild effort, not the technology.

---

## OPTION D: Full Native Swift iOS App

**What it is:** Build a proper native iPhone app from scratch in Swift/SwiftUI. Maximum control, best possible UX.

**When to choose:** Only if burnfat.fun becomes primarily a mobile product and you're willing to invest significantly in iOS.

**What I build:**
- SwiftUI app with native navigation, animations, design
- Direct Garmin Connect IQ SDK integration
- Apple HealthKit integration (native, first-class)
- Core Data or SwiftData for local storage
- Wallet connection via WalletConnect Swift SDK
- All API routes stay on Vercel (shared backend)

**Timeline (me building):** 4-6 weeks + 1-2 weeks App Store review

**Pros:**
- Best possible iOS experience
- Direct access to every Apple/Garmin API
- No wrapper overhead, no plugin limitations
- Apple loves native apps (easier App Store approval)

**Cons:**
- iOS only — Android requires separate Kotlin app (doubles the work)
- Completely separate codebase from website
- No code sharing with web
- Most expensive to maintain long-term
- Overkill for current stage

**Risk:** Low technical risk, high time/cost risk. Only makes sense if mobile becomes the primary platform.

---

## OPTION E: Third-Party Middleware (Terra API)

**What it is:** Use Terra API as a middleman. Terra connects to Garmin, Withings, Fitbit, Apple Health, and 500+ other sources. You get one unified API.

**When to choose:** If you want to support many scale/wearable brands quickly. Or if Garmin's direct API is too restrictive.

**What I build:**
- Terra API account setup
- `POST /api/terra/webhook` — receives normalized data from Terra
- Terra widget for user-facing device connection (drop-in UI)
- Backend mapping: Terra data → weight_entries with source tracking
- Challenge verification rules

**Timeline (me building):** 1 week

**Pros:**
- Fastest to implement (1 week)
- Supports 500+ devices out of the box
- Terra handles OAuth, token refresh, data normalization
- Supabase direct integration available
- Good documentation

**Cons:**
- **$499/month** minimum ($6,000/year)
- Vendor dependency — Terra goes down, your verification goes down
- May obscure raw data fields (including source attribution)
- Overkill for 1-2 integrations
- Another middleman between you and the data

**Risk:** Low technical risk, high cost risk. Only justified if supporting many device brands.

---

## OPTION F: Withings First (Instead of Garmin)

**What it is:** Skip Garmin, start with Withings. Their API is free, publicly documented, and CONFIRMED to include a source field (`attrib`) distinguishing device from manual entries.

**When to choose:** If you want GUARANTEED source attribution without waiting for Garmin's answer. Or as a second integration after Garmin.

**What I build:**
- Same as Option A but targeting Withings API instead
- Withings OAuth 2.0 flow
- Withings webhook for body measurements
- Source field mapping: `attrib=0` (device) → verified=true, `attrib=1` (manual) → verified=false

**Timeline (me building):** 1-2 weeks (no approval wait — public API)

**Pros:**
- Source attribution GUARANTEED (documented `attrib` field)
- Free API access for individual developers
- No business application needed
- Withings Body+ scale (~$100) measures weight, body fat, water %, muscle mass, bone mass
- Can start immediately while waiting for Garmin approval

**Cons:**
- Smaller user base than Garmin
- Withings scales less common than Garmin Index S2
- Users may not want to buy a Withings scale
- Eventually need Garmin too for broader coverage

**Risk:** Very low. Everything is documented and confirmed.

---

## RECOMMENDED SEQUENCE

1. **Now:** Apply to Garmin Developer Program. Ask about source field.
2. **This week:** Build Option F (Withings) — guaranteed verification, no waiting.
3. **When Garmin responds (2 days):**
   - If source field exposed → add Option A (server-side Garmin)
   - If NOT exposed → add Option B (Capacitor wrapper for device ID access)
4. **Month 2:** Evaluate if App Store presence is needed → upgrade to Option B or C
5. **Month 3+:** If 3+ device brands needed → evaluate Option E (Terra)

## External Dependencies (Not My Work — Needs You)

| Task | Who | Time |
|------|-----|------|
| Apply to Garmin Developer Program | You (business owner) | 15 min |
| Apple Developer account ($99/year) | You (if choosing B/C/D) | 30 min |
| Google Play developer ($25) | You (if choosing B/C/D) | 15 min |
| Buy a Garmin Index S2 for testing ($150) | You | Ship time |
| Buy a Withings Body+ for testing ($100) | You (if choosing F) | Ship time |
| macOS machine for iOS builds | You (if choosing B/C/D) | Rent or buy |

## What I Build For ALL Options (Shared Backend)

Regardless of which option you pick, these are needed:

```
Database:
- device_connections table (OAuth tokens per user per provider)
- source + verified columns on weight_entries
- requires_verification on challenges
- verification_flags table (fraud detection)

API routes:
- /api/[provider]/auth — OAuth initiation
- /api/[provider]/callback — token exchange
- /api/[provider]/webhook — receive device data
- /api/[provider]/sync — manual pull
- /api/[provider]/disconnect — revoke

Verification logic:
- Max 1 weigh-in per 4 hours
- Flag delta > 2kg in 24h
- Flag sustained loss > 1.5kg/week
- Body composition consistency checks
- Device change mid-challenge flag

UI:
- "Connect Device" section in profile
- Source badges on weight entries ("Scale" vs "Manual")
- Challenge creation: "Require verified data" toggle
- Challenge join: eligibility check against verification rules
```

---

## WORKSTREAM 1: Smart Contract (agent: `contract-evm`)

### 1A. Update `contracts/BurnFatTreasury.sol`
- Change `submitBurn(uint256 kgAmount, bool isRetrospective)` → `submitBurn(uint256 kgAmount, bool isRetrospective, address referrer)`
- Split logic change:
  - `referrer != address(0)` → transfer referral share (1/3) to referrer wallet
  - `referrer == address(0)` → transfer referral share (1/3) to operations wallet
- Remove: `uint256 public referralPool`, `withdrawReferralPool()`, `ReferralPoolWithdrawn` event
- Add: `ReferralPaid(address indexed referrer, address indexed user, uint256 amount)` event
- Keep: `reservePool`, `withdrawReservePool()` unchanged

### 1B. Update ABI to match new contract
**`src/lib/contracts/BurnFatTreasury.ts`**:
- Add `referrer` address parameter to `submitBurn` inputs
- Remove `referralPool` view function
- Add `ReferralPaid` event

### 1C. Add Base mainnet to `hardhat.config.ts`
- Add `base` network: `url: "https://mainnet.base.org"`, same accounts pattern

### 1D. Create `scripts/deploy-treasury-mainnet.ts`
- Same as existing deploy script but with mainnet USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### 1E. Switch hooks from `baseSepolia` to `base`
3 files, same change (`import { base }` instead of `import { baseSepolia }`, use `base.id`):
- `src/hooks/useBurnSubmit.ts` (lines 7, 149)
- `src/hooks/useClaimReward.ts` (lines 6, 88)
- `src/hooks/useChallengeCreate.ts` (lines 7, 99)

### 1F. Pass referrer wallet to contract call
**`src/hooks/useBurnSubmit.ts`**:
- Add `referrerAddress?: string` to options interface
- Update `encodeFunctionData` args: `[BigInt(kgAmount), isRetrospective, referrerAddress || zeroAddress]`

### 1G. Compile and verify
- `npx hardhat compile` must pass
- **BLOCKED**: Actual deployment needs funded deployer wallet with ETH on Base mainnet

---

## WORKSTREAM 2: Activity Feed (agent: `backend`)

### 2A. Create `activity_feed` table
Output SQL migration for user to run in Supabase:
```sql
CREATE TABLE activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  type text NOT NULL CHECK (type IN ('profile_saved', 'weight_logged', 'fat_burned')),
  payload jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_activity_feed_created_at ON activity_feed (created_at DESC);
```

### 2B. Insert activity rows from 3 API routes
All inserts best-effort (try/catch, don't block response):

1. **`src/app/api/auth/profile/route.ts`** — after successful PATCH, insert `type: 'profile_saved'`
2. **`src/app/api/weight-entries/route.ts`** — after POST creates entry (~line 197), insert `type: 'weight_logged'` with `payload: { weight_kg, delta_kg }`
3. **`src/app/api/submissions/route.ts`** — after submission insert (~line 188), insert `type: 'fat_burned'` with `payload: { kg_total, submission_type }`

### 2C. Update `src/app/api/feed/route.ts`
- Replace current queries (submissions + users) with single query on `activity_feed` joined with `users`
- Return last 50 entries sorted by `created_at DESC`
- Map types: `fat_burned` → "burned X kg", `weight_logged` → "logged X kg", `profile_saved` → "joined"

### 2D. Switch backend verification to mainnet
**`src/app/api/submissions/route.ts`** line 125: `baseSepoliaClient` → `baseClient`

### 2E. Wire referral code on user creation
**`src/app/api/auth/connect/route.ts`** (line 8):
- Accept optional `referral_code` in POST body
- After new user creation (line 50-63), if `referral_code` provided:
  - Look up `referral_codes` table for the code
  - Insert into `referrals` table: `{ referrer_id, referee_id: newUser.id, referral_code_id }`

### 2F. Record referral reward on submission
**`src/app/api/submissions/route.ts`** — after successful insert (~line 219):
- Query `referrals` table: `referee_id = session.userId` → get `referrer_id`
- If referrer exists, insert into `referral_rewards`: `{ referrer_id, reward_usdc: usdcAmount / 3, status: 'paid', submission_id }`

---

## WORKSTREAM 3: Frontend Wiring (agent: `ux`)

### 3A. Pass referral code during auth
**`src/lib/auth.tsx`** (line 119-122):
- In `signIn()`, read `localStorage.getItem("bf_ref_code")`
- Pass as `referral_code` in the POST body to `/api/auth/connect`
- Clear localStorage on success

### 3B. Pass referrer wallet to submit pages
**`src/app/profile/submit/page.tsx`** + **`src/app/profile/retrospective/page.tsx`**:
- Fetch referrer wallet (new `GET /api/referrals/my-referrer` endpoint or extend `/api/auth/me`)
- Pass to `useBurnSubmit({ referrerAddress })`

### 3C. Update UI text
3 files — change "Requires USDC on Base Sepolia" → "Requires USDC on Base":
- `src/app/challenges/create/page.tsx` (line 427)
- `src/app/profile/retrospective/page.tsx` (line 140)
- `src/app/profile/submit/page.tsx` (line 188)

### 3D. Add polling to feed components
- **`src/components/LiveCounter.tsx`** — `setInterval` to re-fetch `/api/feed` every 20s + `/api/counter` every 20s
- **`src/app/feed/page.tsx`** — `setInterval` to re-fetch `/api/feed` every 15s

---

## WORKSTREAM 4: Audit + Review + Deploy (agents: `codex`, `reviewer`, `forge`)

### 4A. Contract security audit (tool: `codex` via contract-audit skill)
After contract-evm completes 1A-1G, forge invokes the contract-audit skill:
1. **DETECT** — find all vulnerabilities (must have zero CRITICAL/HIGH)
2. **PATCH** — verify fixes preserve functionality
3. **EXPLOIT** — attempt fund drain / unauthorized access
- Runs in `/tmp/codex-audit/` isolation, `--approval-mode suggest`
- All 3 checks must pass (non-empty reports, no CRITICAL/HIGH, no exploitable paths)
- Results appended to `FINDINGS.md`
- If any check fails → contract-evm fixes → rerun all 3 from scratch

### 4B. Code review (agent: `reviewer`)
- Review all experiment branches before merge (frontend + backend code, not contract)

### 4C. Environment variables — after contract deployment (agent: `forge`)
- `NEXT_PUBLIC_CHAIN_ID=8453`
- `NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- `NEXT_PUBLIC_BURNFAT_CONTRACT_ADDRESS=<new mainnet address>`
- `NEXT_PUBLIC_DEMO_MODE=false`

### 4D. Final merge + deploy — DEFERRED (user reviews on localhost first)
- NO merge to main, NO deploy until user reviews
- All branches ready for user inspection

---

## Execution Order

```
PARALLEL START:
  contract-evm → 1A-1G (contract + ABI + hooks + compile)
  backend      → 2A-2F (feed + referral wiring + mainnet switch)
  ux           → 3A-3D (auth referral + submit pages + UI text + polling)

AFTER contract-evm done:
  forge        → 4A (invoke contract-audit skill — Codex 3-check pipeline)

AFTER all code done:
  reviewer     → 4B (code review all branches — frontend + backend)

AFTER audit + review pass:
  forge        → 4C (env vars), 4D (merge + deploy)

BLOCKED ON USER:
  Run SQL migration (2A) in Supabase dashboard
  Fund deployer wallet → deploy contract → update env vars (4C)
```

## Agent Assignments

| Agent | Tasks | Files touched |
|-------|-------|---------------|
| `contract-evm` | 1A-1G | `contracts/BurnFatTreasury.sol`, `src/lib/contracts/BurnFatTreasury.ts`, `hardhat.config.ts`, `scripts/deploy-treasury-mainnet.ts`, `src/hooks/useBurnSubmit.ts`, `src/hooks/useClaimReward.ts`, `src/hooks/useChallengeCreate.ts` |
| `backend` | 2A-2F | `src/app/api/feed/route.ts`, `src/app/api/auth/profile/route.ts`, `src/app/api/weight-entries/route.ts`, `src/app/api/submissions/route.ts`, `src/app/api/auth/connect/route.ts` |
| `ux` | 3A-3D | `src/lib/auth.tsx`, `src/app/profile/submit/page.tsx`, `src/app/profile/retrospective/page.tsx`, `src/app/challenges/create/page.tsx`, `src/components/LiveCounter.tsx`, `src/app/feed/page.tsx` |
| `codex` (tool) | 4A | Runs in `/tmp/codex-audit/`, produces `FINDINGS.md` — DETECT/PATCH/EXPLOIT |
| `reviewer` | 4B | Read-only code review (frontend + backend), produces report |
| `forge` | 4A (invokes codex), 4C-4D | `.env.local`, merge orchestration |

## Verification
1. `npx hardhat compile` — contract compiles
2. `npm run build && npm run lint` — zero errors
3. Codex contract-audit skill passes all 3 checks (DETECT/PATCH/EXPLOIT) — results in `FINDINGS.md`
4. `reviewer` passes code review (frontend + backend branches)
5. Manual test: sign in → log weight → submit to ledger → check feed updates within 20s
6. Manual test: sign up via referral link → submit burn → verify referrer wallet received USDC

## Constraints
- **ZERO visual style changes** — keep all current CSS/UI exactly as-is
- **4D deferred** — no merge to main until user reviews on localhost
- Blocked data (wallet addresses, contract address) use placeholders — user provides later

## Blocked — Needs User Input (later)
1. **Deployer wallet** funded with ETH on Base mainnet (~$3-5 for gas)
2. **Operations wallet address** — same as deployer or separate?
3. **Run SQL migration** in Supabase dashboard to create `activity_feed` table
