# Connect the Vertex app to Sanity content data

## Goal

Replace the static placeholder content on the home, course, and lesson pages with real data fetched from the Sanity dataset that matches the Vertex content model already implemented in the Studio.

## Instructions and sources reviewed

- `AGENTS.md` — requires a saved implementation prompt and approval before code changes.
- Current project state: Sanity schema and data layer exist for courses, lessons, instructors, categories, and modules; pages already render the design shell in static sample data.
- Files reviewed: `sanity/lib/data.ts`, `app/page.tsx`, `app/course/[slug]/page.tsx`, `app/lesson/[slug]/page.tsx`, and the Sanity schema files.

## Current state

- The project has a valid content model, but the app still renders hard-coded sample content instead of using real dataset queries.
- The route pages are built and compile, but they do not yet consume the server-side Sanity read layer.

## Decisions and assumptions

- Use a server-side data fetch pattern so all reads remain on the server and no sensitive tokens or client-side dataset access is introduced.
- Add graceful fallback behavior for missing content so the app still renders with predictable data if a course or lesson document has not been created yet.
- Keep the page UI matching the Vertex design references while switching from local sample objects to real data from Sanity.
- Preserve the project boundaries: no content writes, no client-side data access, and no extra backend framework.

## Files expected to change

- `app/page.tsx` — fetch and render course cards from Sanity with fallback sample data
- `app/course/[slug]/page.tsx` — fetch a course by slug and render real outcomes/modules/instructor data
- `app/lesson/[slug]/page.tsx` — fetch lesson content and related course metadata from Sanity
- optional `sanity/lib/data.ts` — adjust query shape or typing if needed for UI rendering

## Requirements

- Home page shows real courses from the dataset, with title, summary, level, duration, and module count.
- Course page renders a real course, learning outcomes, module list, and course metadata.
- Lesson page renders a real lesson, module context, notes, resources, and related lesson metadata.
- If the dataset is empty, the app falls back to safe placeholder values so the pages still render without error.
- Keep the design faithful to the existing Vertex styles and responsive behavior.

## Security considerations

- No new write tokens, API keys, or public dataset access are introduced.
- All data reads remain server-side and use the existing Sanity client abstraction.

## Acceptance criteria

- The home page pulls content from the Sanity dataset instead of hard-coded sample objects.
- The course and lesson pages render real content when documents exist.
- The application still builds successfully after the data wiring.

## Checks to run

1. `npm run lint`
2. `npm run build`
3. Start the dev server and inspect the generated routes.

## Manual test steps

1. Open the home route and confirm course cards render from Sanity data when available.
2. Navigate to a course slug and verify the course detail content loads correctly.
3. Navigate to a lesson slug and confirm the lesson details load correctly.
4. Confirm fallback rendering still works when no data exists for a slug.
