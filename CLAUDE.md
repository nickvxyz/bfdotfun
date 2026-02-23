# CLAUDE.md — BurnFat.fun

## Commands
```bash
npm run dev      # Dev server (Turbopack)
npm run build    # Production build — must pass before any deploy
npm run lint     # ESLint — must pass before any deploy
npx tsc --noEmit # TypeScript check without building
```

## Architecture
Static waitlist landing page → evolving into Farcaster mini app. No backend, no API routes, no database.

- **Next.js 15 App Router** — server components by default
- **Tailwind CSS v4** — via `@import "tailwindcss"` in globals.css
- **TypeScript strict mode**
- **Path alias:** `@/*` → `./src/*`

## Component structure
- `src/app/page.tsx` — server component, static HTML sections
- `src/app/globals.css` — ALL styles (BEM, @layer components)
- `src/app/layout.tsx` — root layout
- `src/components/LiveCounter.tsx` — counter animation, banner rotation (client)
- `src/components/WaitlistForm.tsx` — email + consent, submits to Formspree (client)
- `src/components/FaqAccordion.tsx` — accordion toggle, ARIA attrs (client) [currently hidden]
- `src/app/privacy/page.tsx` — static privacy policy

## Design system rules
- **BEM only:** `.block__element--modifier`
- **All styles in** `globals.css` `@layer components` — no style tags, no CSS modules
- **Colors (CSS vars):** `--c-black`, `--c-white`, `--c-green`, `--c-orange`, `--c-yellow`
- **Font sizes:** `--fs-label`, `--fs-body`, `--fs-small`, `--fs-cta`
- **Spacing:** `--spacing-section`
- **Zero border-radius** — enforced globally, never override
- **Monospace fonts only:** SF Mono → Fira Code → Consolas
- **Responsive:** `clamp()` for typography, breakpoints at 900px and 768px
- **Alternating sections:** black/white backgrounds

## Key patterns
- SVG icons: inline React components, `ICONS` map for dynamic render
- Activity feed: rotates every 4s via `setInterval` in `useEffect`
- Counter increments when feed item has `kgDelta > 0`
- Waitlist: Formspree `https://formspree.io/f/mbdayrbn`
- FAQ: single open item state `null | number` — section currently hidden via `display:none`

## Verification (mandatory before done)
```bash
npm run build   # zero errors required
npm run lint    # zero errors required
git log --oneline -1  # confirm commit exists
```

## Memory
Session notes: `.claude/memory.md` — read at start, append after tasks.

## Farcaster Mini App (upcoming)
- Farcaster Docs: https://docs.farcaster.xyz/
- Mini Apps: https://miniapps.farcaster.xyz/
- Base MiniKit: https://docs.base.org/builderkits/minikit/quickstart
- Pattern: publish mini app → gate behind waitlist → open when ready
