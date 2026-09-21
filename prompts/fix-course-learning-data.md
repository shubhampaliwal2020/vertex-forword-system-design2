# Fix Continue Learning course data

## Goal

Fix the Continue Learning flow so all three courses show their own correct course and lesson data instead of malformed, missing, or Next.js-specific fallback values.

## Evidence inspected

- `AGENTS.md` requires an implementation prompt and approval before code changes.
- `app/course/[slug]/page.tsx` reads course duration and chooses the first lesson for Continue Learning.
- `app/lesson/[slug]/page.tsx` builds the lesson sidebar from fallback course data when live course data is unavailable.
- `sanity/lib/data.ts` omits `duration` from both course queries.
- `app/course/fallbackData.ts` contains the three local course datasets.

## Decisions

- Include the course duration in both Sanity course queries.
- Make course page fallbacks course-specific rather than always using Next.js values.
- Resolve the lesson sidebar from the selected lesson's live course relationship and preserve the local fallback only for the matching fallback course.
- Keep the fix read-only and scoped to the existing course/lesson data flow.

## Files expected to change

- `sanity/lib/data.ts`
- `app/course/[slug]/page.tsx`
- `app/lesson/[slug]/page.tsx`

## Acceptance criteria

- Each of the three course pages displays its own duration, module count, and first lesson.
- Clicking Continue Learning on each course opens a lesson belonging to that course.
- The lesson page does not show Next.js lesson/module data for Docker or TypeScript routes.
- No malformed date/data string appears in the Continue Learning flow.

## Checks

- Run `npm run lint`.
- Run `npm run build`.
- Manually open all three course routes and click Continue Learning, then verify the breadcrumb, course title, lesson title, and sidebar remain within the selected course.
