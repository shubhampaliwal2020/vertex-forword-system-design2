# Implement the Vertex course page from seeded Sanity content

## Goal

Implement the course detail page shown in the provided reference image and wire it to the existing seeded Sanity course data. The page must render real course, outcome, module, lesson, duration, and student-count values from the server-side Sanity query when available, while retaining the existing fallback behavior for the reference course when Sanity is unavailable.

## Sources reviewed

- `AGENTS.md` and `CLAUDE.md` for repository workflow and validation rules.
- `app/course/[slug]/page.tsx` and `app/course/[slug]/CourseContent.tsx` for the current route and accordion behavior.
- `app/globals.css` for the existing Vertex visual language and responsive rules.
- `sanity/lib/data.ts`, `sanity/schemaTypes/courseType.ts`, `sanity/schemaTypes/moduleType.ts`, and `sanity/schemaTypes/lessonType.ts` for the content contract.
- `seed.ndjson` and `app/course/fallbackData.ts` for the actual seeded and fallback course shapes.
- The provided course-page screenshot as the visual source of truth.

## Current findings

- The course route already has the major visual sections, but it uses hardcoded `POPULAR`, a hardcoded 35% progress value, a text mark instead of the seeded cover image, and only the first module's lessons for the continue link.
- `getCourseBySlug` already resolves module lesson references and instructor/category references server-side.
- Seeded course titles and outcome tokens differ from the screenshot's illustrative copy, so the implementation should honor the current Sanity content rather than fabricate screenshot-only data.
- The Sanity course schema stores `price` as a string, while seeded NDJSON uses numeric values; do not broaden the page scope into a schema migration unless type checking proves it is necessary.

## Implementation decisions

- Keep the page as a server component and keep Sanity access in `sanity/lib/data.ts`.
- Use the Sanity cover image through the existing `sanity/lib/image.ts` helper when it can resolve the asset; retain the stylized course mark as a resilient fallback.
- Render `course.popular` conditionally instead of always showing the badge.
- Derive module counts and lesson links from all resolved modules. Keep the existing accordion as the interaction model, with an accessible expand/collapse-all control.
- Preserve the current fallback course for the reference slug and avoid inventing progress storage; show the existing presentational progress affordance until learner progress exists.
- Map outcome icon tokens from seeded content to the existing local icon treatment, with a default icon for unknown tokens.
- Keep styling scoped to the existing course classes in `app/globals.css`; do not add a new dependency or design system.

## Expected files

- `app/course/[slug]/page.tsx`
- `app/course/[slug]/CourseContent.tsx` if module/lesson display needs correction
- `app/globals.css`
- `sanity/lib/data.ts` only if the existing projection is missing a field required by the page

## Requirements

- Match the reference hierarchy: header, breadcrumb, two-column course hero, metadata, primary/secondary actions, learning outcomes, course content list, and bottom progress bar.
- Use real seeded Sanity values for course title, summary, level, duration, student count, outcomes, module titles/summaries, and lesson titles/durations.
- Make the course cover image visible when available and keep a non-blank fallback visual when it is not.
- Ensure the continue action points to the first lesson across the complete ordered module list.
- Ensure `course.popular === false` does not render a misleading popular badge.
- Keep keyboard focus styles and semantic labels intact.
- Keep the layout usable at tablet and mobile widths without horizontal overflow.
- Do not add auth, progress persistence, bookmark persistence, or unrelated pages.

## Acceptance criteria

- `/course/nextjs-for-production` renders the fallback reference course when the live query has no matching document.
- A seeded Sanity course route renders its actual title, metadata, outcomes, modules, and lesson links.
- The course cover uses the Sanity image when available and falls back cleanly otherwise.
- Popular status is data-driven.
- All ordered modules are represented and expandable, and the first lesson link is correct.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` complete successfully.

## Manual test steps

1. Start the app with `npm run dev`.
2. Open `/course/nextjs-for-production` and compare the hierarchy and spacing with the reference image.
3. Open a seeded route such as `/course/nextjs-app-router-in-depth` and confirm its Sanity title and outcomes appear.
4. Expand individual modules and then use the expand/collapse-all control.
5. Resize to mobile width and confirm the hero, outcome cards, module rows, and progress bar do not overflow.