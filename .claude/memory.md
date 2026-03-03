
## 2026-03-01
**Recent commits:**
7eb11a7 style: enforce strict alternating W/B section backgrounds
917567b fix: privacy page Back to Home button invisible on hover in dark mode
f379526 fix: remove Get Notified button from waitlist section

**Files changed:**
src/app/globals.css

---

## 2026-03-01
**Recent commits:**
67e7b19 feat: add Base App (Coinbase Wallet) support to /app mini app
7eb11a7 style: enforce strict alternating W/B section backgrounds
917567b fix: privacy page Back to Home button invisible on hover in dark mode

**Files changed:**
src/app/app/page.tsx

---

## 2026-03-01
**Recent commits:**
1c3b328 revert: remove overlay/redirect hacks, restore clean mini app
734589b fix: serve mini app from root URL, not /app
783aa7b fix: add apple-touch-icon and mini app redirect from root

**Files changed:**
public/.well-known/farcaster.json
src/app/app/layout.tsx
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/components/MiniAppHost.tsx

---

## 2026-03-01
**Recent commits:**
c25a200 feat: redesign main page to match mini app UI, add cards and faster feed
1c3b328 revert: remove overlay/redirect hacks, restore clean mini app
734589b fix: serve mini app from root URL, not /app

**Files changed:**
.claude/memory.md
src/app/app/layout.tsx
src/app/app/page.tsx
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/components/LiveCounter.tsx

---

## 2026-03-01
**Recent commits:**
f333154 fix: add dark mode support for miniapp layout on main page
c25a200 feat: redesign main page to match mini app UI, add cards and faster feed
1c3b328 revert: remove overlay/redirect hacks, restore clean mini app

**Files changed:**
src/app/globals.css

---

## 2026-03-01
**Recent commits:**
f4c56c7 fix: suppress hydration warning for theme anti-flash script
f333154 fix: add dark mode support for miniapp layout on main page
c25a200 feat: redesign main page to match mini app UI, add cards and faster feed

**Files changed:**
src/app/layout.tsx

---

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
