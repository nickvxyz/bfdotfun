---
name: component
description: Scaffold a new component with correct file structure and conventions
user-invocable: true
---

# New Component — BurnFat.fun

When the user says `/component ComponentName`, create a new component following project conventions.

## Decide: server or client?

- **Server component** (default): No directive needed. Use when the component only renders HTML/CSS with no interactivity.
- **Client component**: Add `'use client'` at top. Use ONLY when the component needs state, effects, event handlers, or browser APIs.

## File location

- Client components: `src/components/ComponentName.tsx`
- Server sections: add directly to `src/app/page.tsx` or create in `src/app/`

## Component template (client)

```tsx
'use client';

import { useState } from 'react';

interface ComponentNameProps {
  // define props
}

export function ComponentName({ }: ComponentNameProps) {
  return (
    <section className="component-name">
    </section>
  );
}
```

## Component template (server)

```tsx
interface ComponentNameProps {
  // define props
}

export function ComponentName({ }: ComponentNameProps) {
  return (
    <section className="component-name">
    </section>
  );
}
```

## CSS

Add styles to `src/app/globals.css` inside `@layer components`:

```css
@layer components {
  .component-name {
    /* Use CSS vars for colors: --c-black, --c-white, --c-green, --c-orange, --c-yellow */
    /* Use CSS vars for fonts: --fs-label, --fs-body, --fs-small, --fs-cta */
    /* Zero border-radius — never override */
  }

  .component-name__element {
  }

  .component-name__element--modifier {
  }
}
```

## Checklist before done

- [ ] Named export (not default)
- [ ] BEM class names matching component name (kebab-case)
- [ ] All styles in globals.css `@layer components`
- [ ] Colors and fonts use CSS vars
- [ ] No inline styles
- [ ] TypeScript interface for props (even if empty initially)
- [ ] `'use client'` only if actually needed
- [ ] Import added where the component is used
