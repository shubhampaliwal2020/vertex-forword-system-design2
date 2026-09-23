# Implement Sanity-Wired Lesson Page

## Goal
Implement the lesson page to match the supplied Vertex lesson UI and wire it to the existing Sanity lesson content. The lesson video must play inline through its stored streaming-provider URL, never send the learner to an external provider page.

## Skills and guidance read
- `sanity-best-practices`: store provider video URLs rather than Sanity video files; render Portable Text with typed components; preserve server-only Sanity fetching.
- `sanity-best-practices/references/nextjs.md`: keep content fetching in the App Router server route and preserve the existing standalone/embedded project setup.
- `sanity-best-practices/references/portable-text.md`: use `PortableText` from `next-sanity` with explicit block, mark, and list components.
- Existing `AGENTS.md`: preserve the server/client boundary, use existing Vertex styles, and run lint/build checks after route changes.

## Existing code inspected
- `app/lesson/[slug]/page.tsx`: already contains the lesson shell, sidebar, content, resources, and static mock player; currently ignores `lesson.videoUrl` and `lesson.notes`.
- `sanity/lib/data.ts`: `getLessonBySlug` reverse-resolves the parent course and returns lesson content, module navigation, `videoUrl`, notes, key points, pro tip, and resources.
- `sanity/schemaTypes/lessonType.ts`: lesson stores a required `videoUrl`, thumbnail, metadata, Portable Text notes, key points, pro tip, and resource links.
- `app/globals.css`: contains the Vertex cream/orange/serif visual system but no lesson-specific layout styles.
- `app/course/[slug]/CourseContent.tsx`: establishes course lesson link and module numbering conventions.
- `app/course/fallbackData.ts`: fallback lessons may not have a playable URL.
- `package.json`: Next 16, React 19, next-sanity, lucide-react; no dependency addition is required.

## Decisions and assumptions
- Keep `app/lesson/[slug]/page.tsx` as the server component so Sanity tokens and data fetching remain server-only.
- Add a small client player component for the iframe and optional start-time query handling only if needed; do not recreate provider controls.
- Support YouTube watch/youtu.be/embed URLs safely by parsing with `URL` and allow only YouTube hosts. Preserve already-embedded URLs. Render a graceful unavailable state for unsupported or missing fallback URLs.
- Use the provider iframe with `allow="autoplay; encrypted-media; picture-in-picture"`, a descriptive title, and responsive 16:9 sizing. The provider owns playback controls.
- Render Sanity Portable Text notes in the Notes tab using `PortableText` from `next-sanity`; keep the Lesson Content tab as the default.
- Make the tabs functional with a small client wrapper or tab component, without moving Sanity fetching into the browser.
- Preserve the supplied visual direction: narrow lesson sidebar, warm paper background, dark rounded video frame, orange accents, serif headings, compact metadata, resources, and bottom lesson navigation.
- Fix lesson navigation to use the active lesson’s flattened index, not the active module’s local lesson index.
- Use `lesson.title`, `lesson.duration`, `lesson.studentCount`, `lesson.keyPoints`, `lesson.proTip`, `lesson.resources`, and `lesson.notes` as the source of truth. Do not invent timestamps or player progress.

## Expected files
- Modify `app/lesson/[slug]/page.tsx` to use the real video component, notes, safe navigation indexes, and accurate Sanity-driven content.
- Add one focused client component under `app/lesson/[slug]/` for provider playback/tab interaction if that keeps the route server-rendered.
- Modify `app/globals.css` with lesson layout/player/sidebar/content styles and responsive behavior matching the reference at desktop and mobile widths.
- Avoid unrelated schema, seed, auth, or course-page changes.

## Security and behavior requirements
- Never interpolate an arbitrary Sanity URL into an iframe without provider parsing/validation.
- Keep all Sanity access on the server; no browser token or direct Sanity fetch.
- Use external resource links with `target="_blank"` and `rel="noreferrer noopener"` when rendered.
- Handle absent notes, resources, key points, and video URL without throwing.
- Keep the page accessible: semantic headings, tab roles/selection, iframe title, keyboard-focusable controls, and visible focus states.

## Acceptance criteria
- `/lesson/<sanity-lesson-slug>` displays the supplied lesson layout using live Sanity data.
- A seeded YouTube lesson renders a working inline YouTube player with provider controls.
- The player is responsive and remains within the main content column on narrow screens.
- Lesson Content and Notes tabs switch correctly; notes render as Portable Text when present.
- Sidebar module/lesson labels and previous/next links are derived from the returned course structure.
- Resource cards link to their URLs when URLs exist.
- Missing/unsupported video URLs show a clear non-breaking fallback state.
- Desktop and mobile layouts do not overflow horizontally.

## Checks
- Run `npx eslint "app/lesson/[slug]/page.tsx" "app/lesson/[slug]/LessonPlayer.tsx"` (adjust the new component filename if different).
- Run `npm run lint`.
- Run `npm run build` because the route and server/client boundary change.
- Manually open a seeded lesson route and verify the inline player, tab switching, resource links, sidebar, and previous/next navigation at desktop and mobile widths.
