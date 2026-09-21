# Implement the Vertex course and lesson pages

## Goal

Build the course detail page and lesson detail page to match the provided Vertex design references for the desktop experience, with responsive behavior for smaller widths. The implementation should use the existing project structure, preserve the current landing page styling conventions, and support the Sanity content model already added for courses, modules, lessons, instructors, and categories.

## Instructions and sources reviewed

- `AGENTS.md` — requires a saved implementation prompt and approval before code changes.
- Existing project files: `app/page.tsx`, `app/globals.css`, `app/layout.tsx`, `sanity/lib/data.ts`, and the Sanity schema files already added for the Vertex domain.
- Visual source of truth: the provided course and lesson reference images in `Design/vertex-course.png` and `Design/vertex-lesson.png`.

## Current state

- The repo already contains the Sanity course/lesson schema and server-side data access layer.
- The root landing page is implemented and visually matches the provided home screen.
- There are no course or lesson routes implemented yet, and the app does not render the content detail screens from the design references.

## Decisions and assumptions

- Create the two pages as Next.js app routes using the App Router and server-rendered layout, keeping the data flow server-side and consistent with the Sanity read client.
- Reproduce the provided UI exactly: warm off-white canvas, thin peach borders, serif display type for headings, subtle orange accent color, and layout composition matching the reference.
- Use semantic markup and accessible controls for navigation, accordion items, progress bars, and action buttons.
- For this task, the content can be driven from data helpers already created, with local static fallback values if no live Sanity content exists yet. The core priority is matching the UI structure and visual detail rather than building a complex CMS-driven app beyond the design.
- Keep the implementation focused to the product-specific detail pages; do not add unrelated features or over-engineer the app.

## Files expected to change

- `app/course/[slug]/page.tsx` — course detail page matching the provided design
- `app/lesson/[slug]/page.tsx` — lesson detail page matching the provided design
- `app/globals.css` — shared styling for the course and lesson screens, plus responsive rules
- optionally `app/course/[slug]/loading.tsx` or `app/lesson/[slug]/loading.tsx` if needed for loading states
- optional `sanity/lib/data.ts` — minor adjustments if named data fields need to align with how the UI renders the content

## Requirements

- Reproduce the desktop design very closely:
  - Header with Vertex brand, Courses link, My Learning link, notification icon, and avatar.
  - Breadcrumbs and top summary area for the course page.
  - Large course title, metadata row, CTA actions, learning outcomes cards, and the course content accordion list.
  - Progress row at the bottom with a CTA button.
  - Lesson page with a left module list and a right content panel showing lesson title, metadata, video player card, tabs, notes, pro tip, resources, and bottom nav controls.
- Keep the visual treatment consistent with the project’s current design system: warm neutrals, thin peach borders, subtle drop shadows, and orange highlights.
- Use the existing CSS patterns from the project and avoid introducing a new design system or dependency-heavy UI setup.
- Ensure the pages stay usable on smaller widths: stack the layout, shrink the course/lesson metadata, and make the sidebar stack cleanly without overflow.
- Preserve keyboard focus states and accessible labels on all interactive controls.
- Do not expose secrets, tokens, or write operations; this remains a read-only UI implementation.

## Security considerations

- No new credentials, API keys, or write APIs are introduced.
- Keep the implementation read-only and consistent with the server-side Sanity data access already in place.

## Acceptance criteria

- The course page closely matches the provided reference image.
- The lesson page closely matches the provided reference image.
- The layout remains responsive and does not clip or overflow at smaller widths.
- The app still builds and the new routes render without runtime errors.

## Checks to run

1. `npm run lint`
2. `npm run build`
3. Start the dev server and inspect the course and lesson routes.

## Manual test steps

1. Open the course route and compare it to `Design/vertex-course.png`.
2. Open the lesson route and compare it to `Design/vertex-lesson.png`.
3. Resize the browser to tablet and mobile widths and check that the layouts stack cleanly.
4. Tab through interactive elements to confirm focus styling remains visible.
