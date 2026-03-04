# UX Agent Memory — BurnFat.fun

## Auth flow patterns
- `AuthProvider` exposes `loading` — always destructure and use it to gate UI during session check and sign-in
- Header reads `loading` from `useAuth()` to show "Signing in..." during wallet interaction — prevents blank state
- `handleSignIn` in Header guards with `if (loading) return` to prevent double-trigger
- `loading` must be in `useCallback` dep arrays when used inside (React Compiler enforces this)

## Router.push in render — always use useEffect
- Calling `router.push()` directly in render body (e.g., redirect guards) causes React warnings and hydration issues
- Pattern: check condition, render `null`, AND wrap redirect in `useEffect` with the condition as dep

## Inline styles — violation locations
- `submit/page.tsx` had two inline styles: error text and "Try Again" button — replaced with `.submit__error` and `.submit__retry` classes
- BodyFatMeter inline styles are acceptable — they are data-driven color values from CSS vars, not static overrides
- LiveCounter inline styles (transform translateY) are acceptable — animation math

## CSS class additions (submit page)
- `.submit__error` — orange, 13px, margin-bottom 12px (replaces inline style on error paragraph)
- `.submit__retry` — orange, underline, pointer cursor, no border/background (replaces inline style on retry button)

## Progress calculation
- Profile page progress bar used `stats.startWeight` (fetched once at mount)
- After profile save, `updateUser()` updates `user.starting_weight` in context but `stats` does not refetch
- Fixed: use `user?.starting_weight` and `user?.goal_weight` directly in `progress` calc — live values

## Delta sign convention (entries table)
- `delta_kg > 0` = weight decreased = fat burned = GOOD = green color, shown as `−5.0`
- `delta_kg < 0` = weight increased = BAD = orange color, shown as `+5.0`
- This is correct and intentional — do not change
