Frontend style guide

Design system
- Theme: dark background with subtle animated lines; glassmorphism buttons/cards; 1px outlines for focus and key accents.
- Typeface: Poppins as primary; system sans fallback.
- Color tokens (Tailwind):
  - Background: `bg-neutral-950` base; surfaces `bg-neutral-900/70` with backdrop blur.
  - Accent: use `indigo` or `violet` scale for CTAs; `emerald` for success; `rose` for errors.
  - Outline: `outline-1 outline-white/10` for default focus; increase to `outline-2 outline-indigo-400` on keyboard focus.

Implementation
- Fonts: add Google Fonts Poppins once at app root; ensure `font-poppins` utility is available.
- Layout: prefer CSS Grid/Flex; respect responsive breakpoints; minimum tap targets 44x44px.
- Motion: reduce motion if `prefers-reduced-motion`; keep line animation under 24fps equivalent.

Components
- Buttons: glass style using `backdrop-blur`, semi-transparent background, 1px outline, hover with subtle elevation.
- Cards: translucent background, soft shadow, 1px border using `border-white/10`.
- Inputs: visible focus ring; label + helper text; error state in `rose` scale.

Accessibility
- Color contrast AA+ on dark backgrounds.
- Always provide visible focus. Respect `prefers-reduced-motion`.

Example classes
```html
<button class="font-poppins relative px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 outline outline-1 outline-white/10 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-indigo-400 transition">
  Continue
</button>
```

