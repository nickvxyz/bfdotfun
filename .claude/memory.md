## 2026-03-01
**Recent commits:**
0a99d49 chore: update auto-memory notes
f4c56c7 fix: suppress hydration warning for theme anti-flash script
f333154 fix: add dark mode support for miniapp layout on main page

**Files changed:**
.claude/memory.md

---

## 2026-03-01
**Recent commits:**
8b7cc08 fix: add icons metadata to /app layout for Base App pin icon
0a99d49 chore: update auto-memory notes
f4c56c7 fix: suppress hydration warning for theme anti-flash script

**Files changed:**
src/app/app/layout.tsx

---

## 2026-03-01
**Recent commits:**
b264c9b fix: add og:url and metadataBase to /app layout for Base App pin
8b7cc08 fix: add icons metadata to /app layout for Base App pin icon
0a99d49 chore: update auto-memory notes

**Files changed:**
src/app/app/layout.tsx

---

## 2026-03-01
**Recent commits:**
a4a274c revert: keep homeUrl as /app per mini app spec
b264c9b fix: add og:url and metadataBase to /app layout for Base App pin
8b7cc08 fix: add icons metadata to /app layout for Base App pin icon

**Files changed:**
.claude/memory.md
src/app/app/layout.tsx

---

## 2026-03-01
**Recent commits:**
b45c259 style: reduce footer height to ~60% of previous size
a4a274c revert: keep homeUrl as /app per mini app spec
b264c9b fix: add og:url and metadataBase to /app layout for Base App pin

**Files changed:**
src/app/globals.css

---

## 2026-03-01
**Recent commits:**
cb8d50e feat: update favicon and app icons to BF logo
b45c259 style: reduce footer height to ~60% of previous size
a4a274c revert: keep homeUrl as /app per mini app spec

**Files changed:**
public/favicon.ico
public/splash.png
src/app/favicon.ico

---

## 2026-03-01
**Recent commits:**
c0c9928 feat: add gate modal, sun/moon theme toggle, fix footer theme colors
cb8d50e feat: update favicon and app icons to BF logo
b45c259 style: reduce footer height to ~60% of previous size

**Files changed:**
src/app/globals.css
src/app/page.tsx
src/components/GateModal.tsx
src/components/ThemeToggle.tsx

---

## 2026-03-01
**Recent commits:**
7907c3d feat: add gate modal to Farcaster mini app route
c0c9928 feat: add gate modal, sun/moon theme toggle, fix footer theme colors
cb8d50e feat: update favicon and app icons to BF logo

**Files changed:**
src/app/app/page.tsx

---

## 2026-03-01
**Recent commits:**
8c1ddc7 fix: correct mini app launch URL and remove duplicate favicon
7907c3d feat: add gate modal to Farcaster mini app route
c0c9928 feat: add gate modal, sun/moon theme toggle, fix footer theme colors

**Files changed:**
src/app/app/layout.tsx
src/app/favicon.ico

---

## 2026-03-01
**Recent commits:**
3cb752c fix: handle localStorage unavailable in GateModal for Base App webview
8c1ddc7 fix: correct mini app launch URL and remove duplicate favicon
7907c3d feat: add gate modal to Farcaster mini app route

**Files changed:**
src/components/GateModal.tsx

---

## 2026-03-01
**Recent commits:**
cf712f0 revert: remove gate modal from /app route
3cb752c fix: handle localStorage unavailable in GateModal for Base App webview
8c1ddc7 fix: correct mini app launch URL and remove duplicate favicon

**Files changed:**
src/app/app/page.tsx

---

## 2026-03-01
**Recent commits:**
392c844 feat: add gate modal to /app route, skip for Base App webview
cf712f0 revert: remove gate modal from /app route
3cb752c fix: handle localStorage unavailable in GateModal for Base App webview

**Files changed:**
src/app/app/page.tsx

---

## 2026-03-02
**Recent commits:**
8cd53cc feat: profile redesign, dashboard→profile rename, UI/UX audit fixes
392c844 feat: add gate modal to /app route, skip for Base App webview
cf712f0 revert: remove gate modal from /app route

**Files changed:**
.claude/TEAM.md
.claude/agents/ux.md
.claude/memory.md
package-lock.json
package.json
src/app/api/auth/connect/route.ts
src/app/api/auth/disconnect/route.ts
src/app/api/auth/me/route.ts
src/app/api/auth/nonce/route.ts
src/app/api/auth/profile/route.ts

---

## 2026-03-02
**Recent commits:**
6561237 fix: code review cleanup — naming, dead code, accessibility
8cd53cc feat: profile redesign, dashboard→profile rename, UI/UX audit fixes
392c844 feat: add gate modal to /app route, skip for Base App webview

**Files changed:**
src/app/coaches/page.tsx
src/app/companies/page.tsx
src/app/globals.css
src/components/ConnectWalletButton.tsx
src/components/FaqAccordion.tsx
src/components/GateModal.tsx

---

## 2026-03-03
**Recent commits:**
4a5e226 feat: add burn submissions, retrospective claims, smart contract, and on-chain verification
6561237 fix: code review cleanup — naming, dead code, accessibility
8cd53cc feat: profile redesign, dashboard→profile rename, UI/UX audit fixes

**Files changed:**
.claude/memory.md
CLAUDE.md
contracts/BurnFatTreasury.sol
src/app/api/auth/me/route.ts
src/app/api/auth/profile/route.ts
src/app/api/burn-units/route.ts
src/app/api/counter/route.ts
src/app/api/submissions/route.ts
src/app/api/weight-entries/route.ts
src/app/globals.css

---

## 2026-03-03
**Recent commits:**
fe5ab90 fix: add .npmrc with legacy-peer-deps for Vercel build
4a5e226 feat: add burn submissions, retrospective claims, smart contract, and on-chain verification
6561237 fix: code review cleanup — naming, dead code, accessibility

**Files changed:**
.npmrc

---

## 2026-03-03
**Recent commits:**
a06bc73 feat: profile chart, fat mass tracking, auth flow fixes
fe5ab90 fix: add .npmrc with legacy-peer-deps for Vercel build
4a5e226 feat: add burn submissions, retrospective claims, smart contract, and on-chain verification

**Files changed:**
package-lock.json
package.json
src/app/api/weight-entries/route.ts
src/app/globals.css
src/app/profile/entries/page.tsx
src/app/profile/page.tsx
src/components/BodyFatMeter.tsx
src/components/ConnectWalletButton.tsx
src/components/Header.tsx
src/components/WeightChart.tsx

---

## 2026-03-03
**Recent commits:**
46e02c7 fix: Smart Wallet sign-in — ERC-1271 verification, RLS bypass, race condition guard
a06bc73 feat: profile chart, fat mass tracking, auth flow fixes
fe5ab90 fix: add .npmrc with legacy-peer-deps for Vercel build

**Files changed:**
eslint.config.mjs
src/app/api/auth/connect/route.ts
src/app/api/auth/nonce/route.ts
src/app/profile/layout.tsx
src/components/ConnectWalletButton.tsx
src/components/Header.tsx
src/lib/auth.tsx
src/lib/supabase/admin.ts
src/lib/viem.ts

---

## 2026-03-03
**Recent commits:**
0c9497d fix: code review + UX audit — .single(), nonce validation, IS_DEV dedup, UX polish
46e02c7 fix: Smart Wallet sign-in — ERC-1271 verification, RLS bypass, race condition guard
a06bc73 feat: profile chart, fat mass tracking, auth flow fixes

**Files changed:**
src/app/api/auth/connect/route.ts
src/app/api/auth/me/route.ts
src/app/api/auth/profile/route.ts
src/app/api/burn-units/route.ts
src/app/api/counter/route.ts
src/app/api/submissions/route.ts
src/app/api/weight-entries/route.ts
src/app/globals.css
src/app/profile/page.tsx
src/app/profile/retrospective/page.tsx

---

## 2026-03-03
**Recent commits:**
e70e4d2 chore: update CLAUDE.md and memory with auth fixes, patterns learned
0c9497d fix: code review + UX audit — .single(), nonce validation, IS_DEV dedup, UX polish
46e02c7 fix: Smart Wallet sign-in — ERC-1271 verification, RLS bypass, race condition guard

**Files changed:**
.claude/memory.md
CLAUDE.md

---
