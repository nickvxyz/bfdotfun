---
paths:
  - "src/app/globals.css"
  - "src/**/*.css"
---

# CSS Rules — BurnFat.fun

## File location
ALL styles go in `src/app/globals.css` inside `@layer components`. Never create new CSS files, never use CSS modules, never use style tags.

## BEM methodology — strict
- Format: `.block__element--modifier`
- Block = component (`.hero`, `.counter`, `.banner`)
- Element = child (`.hero__title`, `.counter__number`)
- Modifier = state/variant (`.banner--green`, `.faq__item--open`)
- Never nest BEM classes — keep selectors flat

## CSS custom properties — mandatory
Always use vars, never raw hex:
- Colors: `--c-black` `--c-white` `--c-green` `--c-orange` `--c-yellow`
- Font sizes: `--fs-label` `--fs-body` `--fs-small` `--fs-cta`
- Fonts: `--font-mono` `--font-inter`
- Spacing: `--spacing-section`

## Hard rules
- Zero border-radius — enforced globally via `* { border-radius: 0 !important }`, never override
- Monospace font everywhere: `font-family: var(--font-mono)`
- Keyframes go outside `@layer` blocks
- Responsive: `clamp()` for typography, breakpoints at 900px and 768px only
- Dark mode overrides: `[data-theme="dark"] .classname { }` — always in the Dark Mode section at bottom of file

## Patterns to avoid
- No `!important` except the global border-radius reset
- No hardcoded `#000000` or `#ffffff` — use `var(--c-black)` / `var(--c-white)`
- No `px` for font sizes in component styles — use CSS vars or `clamp()`
- No inline styles except `display: none` visibility toggles
