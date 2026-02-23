---
paths:
  - "src/app/**/*.tsx"
  - "src/app/**/*.ts"
  - "next.config.ts"
---

# Next.js App Router Rules — BurnFat.fun

## Route structure
- `src/app/page.tsx` — main landing page (server component)
- `src/app/layout.tsx` — root layout, loads Inter font, anti-flash script, ThemeToggle
- `src/app/app/page.tsx` — Farcaster mini app at `/app` route
- `src/app/app/layout.tsx` — mini app layout with fc:miniapp + fc:frame metadata
- `src/app/privacy/page.tsx` — privacy policy
- New routes: add `src/app/<route>/page.tsx`

## Metadata
- Root metadata in `layout.tsx` — title, description, OG tags, twitter card
- Route-specific metadata: export `metadata` or `generateMetadata` from the page file
- Mini app metadata: `fc:miniapp` and `fc:frame` in `src/app/app/layout.tsx`

## Static by default
This is a static site — no `getServerSideProps`, no API routes, no database.
All pages should prerender as static (verify with `○` in build output).
If a page shows `λ` (dynamic), investigate and fix.

## Imports
- Always use `@/` path alias, never relative `../../`
- Next.js components: use `<Link>` for internal navigation (not `<a>`), `<Image>` for optimised images

## Farcaster mini app
- SDK: `@farcaster/miniapp-sdk`
- Always call `sdk.actions.ready()` after init to dismiss loading screen
- `sdk.context` is async — await it
- Handle the case where app runs outside Warpcast (catch errors from sdk calls)
