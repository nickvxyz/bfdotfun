# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint (next/core-web-vitals + typescript)
```

## Architecture

Static waitlist landing page for BurnFat.fun — a public ledger for fat burned by humans. No backend, no API routes, no database. All data is mock/hardcoded.

- **Next.js 15 App Router** with server component page (`src/app/page.tsx`) and isolated client components
- **Tailwind CSS v4** imported via `@import "tailwindcss"` in `globals.css`; custom styles use `@layer base` and `@layer components` to avoid cascade conflicts
- **Path alias:** `@/*` maps to `./src/*`

### Component structure

- `src/app/page.tsx` — **Server component**. Renders static sections (hero, statement, counter text, footer) as pure HTML. Imports client components only where interactivity is needed.
- `src/components/LiveCounter.tsx` — Client component. Counter animation, banner rotation on 4s interval, bump/shake effects. State is isolated from other components.
- `src/components/WaitlistForm.tsx` — Client component. Email input, consent checkbox, form submission. Local state only (no API endpoint).
- `src/components/FaqAccordion.tsx` — Client component. Accordion toggle with ARIA attributes. Expand/collapse via CSS `max-height` transition.
- `src/app/privacy/page.tsx` — Server component. Static privacy policy page.

### Design system

BEM CSS methodology. All styles in `globals.css` using `@layer components`. CSS custom properties defined in `:root` for colors (`--c-black`, `--c-white`, `--c-green`, `--c-orange`, `--c-yellow`), font sizes (`--fs-label`, `--fs-body`, `--fs-small`, `--fs-cta`), and spacing (`--spacing-section`).

All text uses monospace fonts (`SF Mono → Fira Code → Consolas`). Zero border-radius enforced globally. Alternating black/white section backgrounds. Neon accent colors on activity banners.

Responsive typography uses CSS `clamp()`. Mobile breakpoints at 900px (grid collapse) and 768px (padding reduction).

### Key patterns

- SVG icons are inline React components with an `ICONS` map for dynamic rendering
- Activity feed rotates on a 4-second interval via `setInterval` in `useEffect`
- Counter increments when a feed item has `kgDelta > 0`
- Waitlist form submits to Formspree (`https://formspree.io/f/mbdayrbn`)
- FAQ accordion uses single open item state (`null | number`)

## Farcaster Mini App — Reference Documentation

This project will evolve into a Farcaster mini app. Reference these docs when building mini app features.

### Farcaster / Warpcast

- **Farcaster Docs (overview):** https://docs.farcaster.xyz/
- **Mini Apps Docs (SDK, spec, guides):** https://miniapps.farcaster.xyz/
- **Mini Apps Specification:** https://miniapps.farcaster.xyz/docs/specification
- **Mini Apps Getting Started:** https://miniapps.farcaster.xyz/docs/getting-started
- **Publishing a Mini App:** https://miniapps.farcaster.xyz/docs/guides/publishing
- **Mini Apps GitHub repo (tooling + examples):** https://github.com/farcasterxyz/miniapps
- **Neynar starter (create mini app in 60s):** https://docs.neynar.com/docs/create-farcaster-miniapp-in-60s

### Base

- **Base Mini App Quickstart:** https://docs.base.org/mini-apps/quickstart/create-new-miniapp
- **Base Mini App Context (user profiles, launch source):** https://docs.base.org/mini-apps/core-concepts/context
- **Base MiniKit Quickstart:** https://docs.base.org/builderkits/minikit/quickstart
- **Base Mini Apps Guide (community curated):** https://www.dtso.org/web3/mini-apps-guide

### Waitlist mode pattern

There is no official "waitlist mode" in the Farcaster mini app spec. It is an app-level pattern:

1. **Publish the mini app** so it appears in Warpcast discovery and users can add it to their collection (via `useAddFrame` hook)
2. **Gate full functionality** inside the app — show only a waitlist/signup screen (like the current BurnFat.fun landing page)
3. **When ready to launch**, remove the gate and expose full features

This lets the mini app build an audience and collect interest before the full product is live, while being visible and opt-in-able within Warpcast.
