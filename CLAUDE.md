# CLAUDE.md — BurnFat.fun

## Commands
```bash
npm run dev      # Dev server (Turbopack)
npm run build    # Production build — must pass before any deploy
npm run lint     # ESLint — must pass before any deploy
npx tsc --noEmit # TypeScript check without building
```

## Architecture
Multi-layer web app: live counter + activity feed, user accounts, coach profiles, Farcaster mini app, smart contracts on Base.

- **Next.js 15 App Router** — server components by default
- **Tailwind CSS v4** — via `@import "tailwindcss"` in globals.css
- **TypeScript strict mode**
- **Path alias:** `@/*` → `./src/*`
- **Database:** Supabase PostgreSQL — `users`, `weight_entries`, `burn_units`, `submissions`, `global_counter`, `pro_groups`
- **Auth:** Wallet-based (Coinbase Smart Wallet via wagmi), ERC-1271 signature verification, httpOnly session cookies
- **On-chain:** wagmi + viem on Base (mainnet + Sepolia), BurnFatTreasury contract for USDC payments
- **Farcaster:** Mini app at `/app` with platform detection (Warpcast / Base App / browser)

## Routes

### Pages
- `/` — landing page (server component): GateModal, Header, LiveCounter, WaitlistForm, card sections
- `/app` — Farcaster mini app (client): platform detection, GateModal (skipped for Base App)
- `/feed` — pseudo-live activity feed with generated entries
- `/coaches` — coach directory (mock data)
- `/companies` — company wellness campaigns (mock data)
- `/profile` — user dashboard: stats, weight, BMI, profile form (auth required)
- `/profile/entries` — weight log: add entries, view history with deltas
- `/profile/submit` — submit burn units to global ledger ($1/kg USDC)
- `/profile/retrospective` — one-time historical fat loss claim ($0.50/kg USDC)
- `/privacy` — static privacy policy

### API
- `POST /api/auth/nonce` — generate sign-in nonce (httpOnly cookie)
- `POST /api/auth/connect` — verify signature, upsert user, set session
- `POST /api/auth/disconnect` — clear session
- `GET /api/auth/me` — current user from session
- `PATCH /api/auth/profile` — update profile fields
- `GET|POST /api/weight-entries` — weight entry CRUD (auto-calculates delta, creates burn_units, optional fat_mass_kg)
- `GET /api/burn-units` — query burn units (optional `?status=unsubmitted`)
- `GET /api/counter` — global counter singleton (total_kg, total_submissions)
- `GET|POST /api/submissions` — submission CRUD with on-chain tx verification

## Components
- `Header.tsx` — nav links, ThemeToggle, auth UI (sign in / signing in... / user dropdown), mobile burger, double-click guard
- `LiveCounter.tsx` — global counter display + animated burn feed
- `ConnectWalletButton.tsx` — wallet connection states (connect / sign in / connected)
- `ThemeToggle.tsx` — dark/light mode toggle, persists to localStorage
- `GateModal.tsx` — "How it works" overlay, localStorage dismiss, try/catch for webview
- `WaitlistForm.tsx` — email + consent → Formspree
- `FaqAccordion.tsx` — FAQ items with ARIA (currently hidden)
- `WeightChart.tsx` — custom SVG weight chart with W/M/3M/Y time range tabs, goal line, BMI trend
- `BodyFatMeter.tsx` — horizontal body fat % bar with colored zones (lean/healthy/elevated/high)

## Key libraries
- `src/lib/auth.tsx` — AuthProvider, User interface, useAuth hook (beginSignIn/cancelSignIn/signIn/signOut), dev mode support
- `src/lib/dev.ts` — IS_DEV_MODE flag, mock data (DEV_USER, DEV_ENTRIES, DEV_BURN_UNITS)
- `src/lib/wagmi.ts` — wagmi config: Base + Base Sepolia, coinbaseWallet smartWalletOnly (preference object format for SDK v4)
- `src/lib/supabase/client.ts` — browser Supabase client
- `src/lib/supabase/server.ts` — anon key Supabase client (middleware/SSR only, NOT for API routes)
- `src/lib/supabase/admin.ts` — service role key Supabase client (all API routes use this to bypass RLS)
- `src/lib/supabase/middleware.ts` — session cookie sync middleware
- `src/lib/contracts/BurnFatTreasury.ts` — contract ABI + address
- `src/lib/contracts/erc20.ts` — minimal ERC20 ABI (approve, allowance, balanceOf)
- `src/lib/pricing.ts` — USDC pricing constants and helpers
- `src/lib/viem.ts` — server-side public clients: `baseClient` (mainnet, auth verification) + `baseSepoliaClient` (testnet, tx verification)
- `src/providers/Providers.tsx` — WagmiProvider + QueryClientProvider + AuthProvider + crypto.randomUUID polyfill

## Database schema
- **users** — wallet_address (unique), display_name, role, starting_weight, goal_weight, height_cm, unit_pref, has_used_retrospective, group_id
- **weight_entries** — user_id, weight_kg, recorded_at, delta_kg, fat_mass_kg (unique per user+date)
- **burn_units** — user_id, weight_entry_id, kg_amount, status (unsubmitted/submitted_individual/submitted_via_pro), submission_id
- **submissions** — submitter_id, kg_total, usdc_amount, tx_hash (unique), submission_type (individual/pro_group/retrospective), group_id
- **global_counter** — singleton (id=1), total_kg, total_submissions (auto-incremented via trigger)
- **pro_groups** — owner_id, name, type, subscription_status

## Design system rules
- **BEM only:** `.block__element--modifier`
- **All styles in** `globals.css` `@layer components` — no style tags, no CSS modules
- **Colors (CSS vars):** `--c-black`, `--c-white`, `--c-green`, `--c-orange`, `--c-yellow`, `--c-muted`, `--c-muted-light`
- **Font sizes:** `--fs-label`, `--fs-body`, `--fs-small`, `--fs-cta`
- **Spacing:** `--spacing-section`
- **Zero border-radius** — enforced globally, never override
- **Monospace fonts only:** SF Mono → Fira Code → Consolas
- **Responsive:** `clamp()` for typography, breakpoints at 900px and 768px
- **Alternating sections:** black/white backgrounds
- **Dark mode:** `[data-theme="dark"] .classname {}` at bottom of globals.css

## Code style
- **Early returns** — reduce nesting, improve readability
- **Event handler naming** — prefix with `handle`: `handleClick`, `handleSubmit`, `handleKeyDown`
- **Accessibility** — interactive elements must have `aria-label`, `aria-expanded`, `tabindex` where appropriate
- **Descriptive names** — avoid abbreviations (`weightEntries` not `we`, `isAuthenticated` not `isAuth`)

## Key patterns
- **Auth flow:** beginSignIn() → connectAsync → pass address to signIn → nonce → sign message → verify (ERC-1271 on Base mainnet) → session cookie → navigate to /profile
- **Auth guard:** `signingIn` ref prevents useEffect session check from racing with active sign-in; `beginSignIn()`/`cancelSignIn()` exposed via context for Header to set guard before connectAsync
- **Signature verification:** Smart Wallet uses ERC-1271 — must use `publicClient.verifyMessage()` (not the viem utility). Auth verifies on Base mainnet; tx verification uses Base Sepolia
- **Supabase clients:** API routes MUST use `createAdminClient()` (service role key) — anon key is blocked by RLS. Use `.maybeSingle()` instead of `.single()` when 0 rows is valid
- **Dev mode:** triggered when `NEXT_PUBLIC_SUPABASE_ANON_KEY` is unset or placeholder — returns mock data, skips wallet. Use shared `IS_DEV_MODE` from `@/lib/dev`, never redefine inline
- **Weight tracking:** all stored in kg, displayed per user preference (kg ↔ lbs with 2.20462 factor)
- **Height:** always stored as cm, displayed as cm (kg mode) or ft/in (lbs mode)
- **Burn units:** auto-created when weight entry has positive delta, linked to submissions when paid
- **USDC payments:** batched approve + submitBurn via `useSendCalls` (one wallet popup)
- **On-chain verification:** backend parses BurnSubmitted event from tx receipt, confirms payment before recording
- **Global counter:** singleton row in Supabase, auto-incremented by trigger on submission insert
- **SVG icons:** inline React components, `ICONS` map for dynamic render
- **Activity feed:** generates entries with weighted random types, rotates in ticker
- **Waitlist:** Formspree `https://formspree.io/f/mbdayrbn`

## Smart contract — BurnFatTreasury
- Deployed on Base Sepolia (testnet for closed community testing)
- Receives USDC payments for fat submissions
- Splits incoming USDC 3 ways: 1/3 operations wallet, 1/3 referral pool, 1/3 reserve pool
- `submitBurn(kgAmount, isRetrospective)` — pulls USDC, splits, emits event
- Retrospective pricing: $0.50/kg (one-time), regular: $1.00/kg
- `hasUsedRetrospective[user]` enforced on-chain

## Verification (mandatory before done)
```bash
npm run build   # zero errors required
npm run lint    # zero errors required
git log --oneline -1  # confirm commit exists
```
