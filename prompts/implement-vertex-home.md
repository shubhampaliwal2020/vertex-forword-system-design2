# Implement the Vertex home page

## Goal

Replace the current design-system specimen at the root route with a responsive, high-fidelity implementation of `Design/vertex-home.png`.

## Instructions and sources reviewed

- `AGENTS.md` — requires a saved implementation prompt and approval before code changes; it also requires the provided UI reference to be reproduced exactly and responsively.
- Next.js 16.3.5 App Router documentation for pages/layouts, Server and Client Components, and CSS.
- Existing `package.json`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, and `next.config.ts`.
- Visual source of truth: `Design/vertex-home.png`.

## Current state

- The project is a minimal Next.js 16.3.5 / React 19 / Tailwind v4 app.
- `/` currently renders a static Vertex design-system page using global CSS.
- There are no existing app components, data clients, or image assets beyond the design references.

## Decisions and assumptions

- Implement the visible landing page only at `/`; do not introduce Sanity, Clerk, analytics, search APIs, or backend functionality as they are outside this UI request.
- Keep the route a Server Component. The search field, navigation items, notification button, course links, and primary CTA will be accessible presentational controls until their target routes/behaviors exist.
- Use inline SVG/CSS for the Vertex mark, UI icons, course identity marks, and avatar treatment so that no external image service or dependency is required.
- Use CSS to faithfully reproduce the warm off-white canvas, thin peach borders, centered hero composition, orange gradient CTA, course cards, and the lower decorative peach block pattern shown in the reference.
- Use display and UI font fallbacks available without adding external font loading. Update the root metadata from the old design-system copy to Vertex home-page copy.
- Preserve the existing design-system implementation only through Git history; this home-page request intentionally replaces the current root screen.

## Files expected to change

- `app/page.tsx` — static semantic markup and reusable local SVG/icon primitives for the home page.
- `app/globals.css` — Vertex landing-page layout, visual tokens, control/card styling, decorative artwork, and responsive breakpoints.
- `app/layout.tsx` — page-level metadata and root typography classes if needed.

## Requirements

- Match the desktop reference at its primary visual hierarchy:
  - top navigation with Vertex brand, Courses, My Learning, notification icon, and circular avatar;
  - centered hero with the “INTELLIGENT LEARNING” eyebrow, two-line serif heading, supporting copy, orange CTA, and wide search field with keyboard shortcut;
  - All Courses header and right-aligned link;
  - three course cards with unique visual marks, course content, and metadata row;
  - weekly-content announcement divider and the soft peach architectural/footer artwork at the bottom.
- Make the page responsive: preserve the reference composition on desktop; condense navigation, scale the headline/search, and stack course cards cleanly on smaller screens.
- Use semantic headings, navigation, form controls, accessible labels, visible keyboard focus, and decorative SVGs marked as hidden from assistive technology.
- Do not add secrets, client-side tokens, data access, network calls, or dependencies.

## Security considerations

- The implementation is entirely static. It must not introduce external API calls, credentials, user data collection, or new browser storage.
- Buttons and form controls must have accessible names even while their business behavior is intentionally deferred.

## Acceptance criteria

- `/` visually aligns with `Design/vertex-home.png` in desktop layout, spacing, color, typography hierarchy, cards, borders, and footer decoration.
- It remains usable and unclipped at tablet and mobile widths.
- The page has no console/runtime errors and keyboard focus is visible on interactive controls.
- `npm run lint` and `npm run build` pass.

## Checks to run

1. `npm run lint`
2. `npm run build`
3. Start `npm run dev` and inspect the root route.

## Manual test steps

1. Open the local root route at desktop width and compare it directly to `Design/vertex-home.png`.
2. Confirm that the top nav, hero, course card grid, announcement divider, and decorative bottom artwork match the reference.
3. Resize to tablet and mobile widths and confirm that no content overlaps, truncates, or horizontally overflows.
4. Use Tab to confirm visible focus treatment on the navigation controls, CTA, search field, and course links.
