# Finish and verify the Vertex search page

## Goal

Make `/search?q=data%20fetching` render real search results in the browser and preserve the supplied `Design/vertex-search.png` layout. The search API and visual structure already exist; fix the verified client request failure without rebuilding the working Sanity/MCP backend or restyling the page beyond the reference.

## Guidance read

- `AGENTS.md`: design image is source of truth; use prompt/approval workflow; results are grounded in Sanity; keep MCP, LLM, and Sanity credentials server-side; video actions remain in-site with `?start=`.
- `sanity-best-practices` (`references/groq.md`, `references/nextjs.md`): focused Sanity projections and server-side data access.
- Installed Next.js 16 docs: `01-app/01-getting-started/03-layouts-and-pages.md`, `05-server-and-client-components.md`, and `03-api-reference/03-file-conventions/route.md`.

## Existing implementation and runtime evidence

- `Design/vertex-search.png` shows the header, centered query/count, search field, result count/sort toolbar, mixed video and lesson cards, and browse-catalog footer.
- `app/search/page.tsx` passes the query into the client results view. `app/search/SearchResults.tsx` already implements the screenshot's hierarchy, cards, sorting, result links, loading/error/empty states, and footer.
- `app/globals.css` already contains desktop and mobile styling for the reference layout; preserve it unless browser verification proves a specific mismatch.
- `app/api/search/route.ts` already provides server-side Context MCP/OpenAI search with a grounded Sanity keyword fallback, result validation, metadata hydration, and counts. Keep credentials and Sanity operations server-only.
- A direct local POST to `/api/search` with `data fetching` returned HTTP 200, 13 results across 2 courses, including video and lesson results. The count is live data and must not be changed to the reference image's example count.
- The same route loaded through the browser repeatedly ended at zero results because its client POST was reported as `net::ERR_ABORTED`; the current `SearchResults.tsx` fetch effect aborts through its cleanup. A direct fetch from browser context returned HTTP 200 and the same 13 real results.
- `app/lesson/[slug]/LessonPlayer.tsx` supports the existing in-site video start-time links.
- `.env.local` has server-side search configuration; do not display or expose values.

## Implementation decision

- Keep the current design and server search route. Fix the client effect lifecycle so a valid initial search is not canceled and shown as a false empty result, while stale/unmounted responses cannot update state.
- Preserve distinct video and lesson result cards, live result/course counts, current sort options, Sanity thumbnails/fallbacks, and the always-visible browse-catalog footer.
- Do not hardcode the screenshot's result content, counts, timestamps, or course marks. The actual endpoint currently returns 13 results across 2 courses.
- Keep no-query, loading, error, and no-result states meaningful. An aborted/unavailable request must not silently become a “0 results” state.
- Keep search submission navigation, lesson/video links, and analytics behavior already present. Avoid unrelated backend or design changes.

## Expected files

- `app/search/SearchResults.tsx` for the client request lifecycle and state handling.
- `app/globals.css` only if a verified screenshot mismatch requires a narrowly scoped correction.
- `app/api/search/route.ts` only if post-change API checks reveal a concrete defect; direct local endpoint currently succeeds.

## Security considerations

- Do not expose the Sanity read token, MCP URL, or OpenAI key to browser code.
- Render Sanity/model content as text; retain server-side validation and image hydration.
- Keep results tied to real lesson/course documents. Never fabricate counts or timestamps.
- Keep full transcript data out of the request response.

## Acceptance criteria

- A browser visit to `/search?q=data%20fetching` completes the client request and renders the returned video and lesson cards instead of a false zero-result state.
- The displayed total and course count match the API payload; the local observed payload is 13 results across 2 courses.
- The page hierarchy and card anatomy match the supplied screenshot; the browse footer remains below completed results.
- Video and lesson actions resolve to their matching lesson; video actions retain `?start=<seconds>`.
- No-query, loading, actual error, no-match, and mobile stacked-card states remain usable.
- No private credentials reach the browser.

## Checks

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- browser check of `/search?q=data%20fetching` at desktop and mobile widths

## Manual verification

1. Load `/search?q=data%20fetching` and confirm real API results appear, with counts matching the response.
2. Confirm the desktop layout matches the supplied screenshot without hardcoded sample content.
3. Open one video result and verify the lesson URL includes its start seconds; open one lesson result and verify the matching lesson.
4. Verify the search footer, no-query state, and a genuine empty query result.
5. Narrow to mobile width and confirm the cards stack without horizontal overflow.
