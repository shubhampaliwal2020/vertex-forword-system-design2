# Wire homepage courses to seeded Sanity content

## Goal

Ensure the homepage course cards are rendered from the seeded Sanity course documents, with no index-based values that make live data appear to be fallback content.

## Evidence reviewed

- `app/page.tsx` already calls `getCourses()` and falls back only when the returned list is empty.
- `sanity/lib/data.ts` already projects course title, slug, summary, level, cover image, modules, and lesson durations.
- The live Sanity query returned ten seeded courses, including Next.js App Router in Depth, TypeScript for Application Developers, and DevOps with Docker and Kubernetes.
- The homepage currently chooses course icon, level fallback, duration fallback, and summary fallback from the array index.

## Implementation decisions

- Keep `getCourses()` as the server-side source of truth.
- Use each course's own cover image for the card visual through `sanity/lib/image.ts`; keep a deterministic token mark only when no image exists.
- Derive a display duration from all nested lesson durations when `course.duration` is absent.
- Use a neutral data-driven fallback for genuinely missing level/summary fields, never a position-specific value.
- Preserve local fallback courses only for an empty Sanity response, not as a merge with live courses.
- Keep the existing homepage layout and responsive styling; do not change unrelated routes.

## Expected files

- `app/page.tsx`
- `sanity/lib/data.ts` only if the shared course type needs a duration union or projection adjustment
- `app/globals.css` for card cover-image styling if required

## Acceptance criteria

- Homepage cards show the live seeded Sanity course titles and slugs.
- Card summary, level, module count, and visual are sourced from the corresponding course document or its nested lessons.
- No card metadata depends on `index`.
- `/course/<slug>` links use the Sanity slug.
- The page still renders local fallback cards when Sanity returns an empty array.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.

## Manual test

1. Open `/` with Sanity configured and confirm the seeded course titles appear.
2. Open a card and confirm its route uses the matching seeded slug.
3. Temporarily make Sanity unavailable and confirm the fallback list still renders.