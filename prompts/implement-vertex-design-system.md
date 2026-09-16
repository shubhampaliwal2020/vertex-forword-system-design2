# Implement the Vertex design system reference

## Goal

Replace the starter Next.js home page with a responsive, visual implementation of `Design/vertex-designsystem.png`. The page is a design-system reference for Vertex, not a product screen.

## Instructions and sources reviewed

- `AGENTS.md` — requires an exact visual reproduction, responsive adaptation, reuse of existing Tailwind patterns, and approval before implementation.
- `CLAUDE.md` — delegates to `AGENTS.md`.
- Next.js 16.3.5 App Router docs for global CSS and Server/Client Component boundaries.
- Existing `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, and `package.json`.
- Design reference: `Design/vertex-designsystem.png`.

## Scope and decisions

- Build the reference as a server-rendered static page; no client state, external data, or new dependencies are needed.
- Use the current Next.js App Router and Tailwind v4 setup.
- Replace the starter page, update global design tokens/typography, and update page metadata.
- Recreate the reference’s warm off-white background, bordered cards, orange primary palette, dark neutral scale, Playfair-style display headings, Inter-style UI text, spacing/radius/shadow samples, icon treatment, controls, cards, navigation, and principles strip.
- Use inline SVG icons and CSS-only primitives to avoid external asset dependencies.
- Preserve the intent and information hierarchy on small screens by stacking design-system sections and making grids horizontally/vertically adaptable.

## Files expected to change

- `app/page.tsx` — design-system specimen page.
- `app/globals.css` — global reset, palette, typography, component/sample styles, responsive rules.
- `app/layout.tsx` — Vertex metadata and font setup if needed to match the reference.

## Security and accessibility

- No credentials, API calls, user data, or client-side secrets.
- Use semantic sections and headings, accessible button/input labels, sufficient visible focus indicators, and decorative SVG icons marked appropriately.

## Acceptance criteria

- The home route visually matches the supplied desktop reference in layout, color, typography hierarchy, cards, and control states.
- All 14 visual groups in the image are represented: intro, colors, typography, type scale, spacing, radii/shadows, icons, buttons, inputs, badges, indicators, progress, cards, navigation, and principles.
- The layout remains readable and usable on narrow viewports.
- `npm run lint` and `npm run build` pass.

## Manual checks

1. Run `npm run dev` and open the home route.
2. Compare desktop rendering with `Design/vertex-designsystem.png`.
3. Resize to a narrow viewport and confirm grids stack without clipped text or controls.
4. Tab through buttons, input, and select to confirm a visible focus state.
