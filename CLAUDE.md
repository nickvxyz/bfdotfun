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
- Waitlist form stores input in local state only (no submission endpoint)
- FAQ accordion uses single open item state (`null | number`)
