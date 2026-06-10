# Design System

This document defines the visual system used across Strudel Visulas.

## Goals

- Keep a coherent neon-dark visual language across all screens.
- Use shared tokens for color, spacing, typography, borders, and depth.
- Avoid one-off style values that drift from established UI patterns.

## Source Of Truth

Primary token source:

- `src/index.css` (`:root` CSS custom properties)

Core component references:

- `src/components/PresetsDialog.tsx`
- `src/components/HowItWorksDialog.tsx`
- `src/components/SettingsDrawer.tsx`

## Token Categories

Defined in `src/index.css`:

### Brand and Accent Colors

- `--primary`, `--secondary`
- `--accent`, `--accent-warm`, `--accent-red`

### Background and Surfaces

- `--bg-dark`, `--bg-darker`, `--bg-elevated`, `--bg-overlay`, `--bg-panel`
- `--surface-1`, `--surface-2`, `--surface-active`

### Text Colors

- `--text-light`, `--text-body`, `--text-muted`, `--text-soft`, `--text-dim`

### Borders

- `--border-light`, `--border-subtle`, `--border-faint`, `--border-accent`

### Radius and Shadows

- `--radius-sm`, `--radius-md`, `--radius-lg`
- `--shadow-panel`, `--shadow-accent`

### Typography

- `--sans`, `--heading`, `--mono`

## Modal Pattern

Use this pattern for overlays/dialogs:

1. Backdrop

- `position: fixed`, `inset: 0`
- `background: var(--bg-overlay)`
- `backdropFilter: blur(6px)`

2. Modal shell

- `borderRadius: var(--radius-lg)`
- `border: 1px solid var(--border-accent)`
- `background: var(--bg-elevated)`
- `boxShadow: var(--shadow-panel), var(--shadow-accent)`

3. Header row

- Bottom border with `var(--border-subtle)`
- Monospace title in `var(--primary)`
- Metadata text in `var(--text-muted)`
- Close button with subtle border/text token pairing

4. Content rows/cards

- Prefer `var(--surface-1)` / `var(--surface-2)` backgrounds
- Use `var(--border-faint)` / `var(--border-subtle)` for separation
- Body copy should default to `var(--text-body)`

## Component Styling Rules

- Prefer token usage in component inline styles and CSS.
- Hardcoded colors are acceptable only for explicit, intentional gradients (for example, branded CTA buttons) and should be rare.
- Keep title/label typography monospace for control surfaces and utility UI.
- Keep semantic hierarchy consistent:
  - Section label: 10-12px monospace, uppercase/letter-spacing
  - Body text: 13-14px
  - Helper text/meta: 11-12px muted

## Interaction Rules

- Preserve keyboard and close behavior for overlays.
- Keep primary actions high-contrast and obvious.
- Avoid excessive motion; use existing animation language from `src/index.css`.

## Do And Do Not

Do:

- Use tokenized values from `src/index.css`.
- Match existing dialog structures before introducing new patterns.
- Reuse established spacing/radius rhythm (`6`, `8`, `10`, `12`, `16`).

Do not:

- Introduce isolated color palettes for a single modal/component.
- Replace tokenized values with arbitrary RGBA/hex unless justified.
- Mix unrelated type systems that conflict with `--sans` and `--mono`.

## Checklist For UI Changes

Before merging UI updates:

1. Verify token usage in updated components.
2. Compare against existing dialog/panel patterns.
3. Check text contrast for readability.
4. Run smoke tests:
   - `yarn test src/components/ui-components.smoke.test.tsx`
5. Validate responsiveness for desktop and mobile widths.

## Related Docs

- `README.md`
- `docs/ai-agents.md`
