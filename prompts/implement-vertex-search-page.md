# Implement Vertex search page from the design

## Goal

Implement `/search` to match `Design/vertex-search.png` on desktop and adapt cleanly to mobile. Keep results grounded in the existing Sanity Context MCP search flow and real Sanity course and lesson data. Do not hardcode the sample result count, course count, content, or timestamps.

## Guidance read

- `AGENTS.md`: prompt and approval workflow; design image is the source of truth; search returns video moments and lesson results; keep all Sanity tokens, MCP calls, and LLM calls server-side; video results link to in-site lesson playback using `?start=`.
- `sanity-best-practices` and its `nextjs.md`, `groq.md`, and image guidance: keep data access server-side, use focused GROQ projections, and build image URLs from Sanity image sources.
- Next.js 16 App Router docs: `01-app/01-getting-started/03-layouts-and-pages.md` and `05-server-and-client-components.md`; the page can remain a Server Component and interactive results/search controls remain client-side.

## Existing implementation inspected

- `Design/vertex-search.png`: header, centered search title and count, search field, results toolbar, alternating video and lesson cards, and a peach browse-catalog footer.
- `app/search/page.tsx` and `app/search/SearchResults.tsx`: `/search` and client-side POST to `/api/search` already work, but visual details are incomplete; the current result cards use a generic video placeholder and lesson icon, and the footer is only shown for zero results.
- `app/api/search/route.ts`: existing server-only Context MCP and OpenAI flow validates model output with Zod and computes counts from returned matches. Result DTOs currently omit image URLs and structured lesson/module numbering; model-provided `timestampLabel` is freeform.
- `sanity/lib/client.ts`, `sanity/lib/data.ts`, `sanity/lib/image.ts`, and course/lesson schemas: existing server Sanity client and lesson thumbnail/course cover image sources are available.
- `app/lesson/[slug]/LessonPlayer.tsx`: supports in-site playback starting from a `start` query parameter.
- `app/globals.css`: existing search styles provide a base to refine; app uses Tailwind 4 with page styles in this file.
- `package.json`: Next 16, React 19, TypeScript, Sanity, MCP and AI SDK dependencies already exist.

## Decisions

- Preserve the existing MCP plus LLM search architecture and server-only credential boundary. Do not create a second search backend or expose Sanity/MCP/LLM credentials to browser code.
- If the Context/LLM request is unavailable, use a server-side Sanity keyword fallback over lesson titles, key points, notes, chapter labels, and filtered transcript chunks so the page remains populated from real content. Prefer chapters per video and fetch only matched transcript chunks, never a full transcript.
- Hydrate result thumbnail URLs on the server using validated lesson slugs and Sanity image sources. Prefer lesson thumbnails and fall back to the course cover; render a branded fallback when neither exists.
- Derive timestamps as `MM:SS` from validated integer `startSeconds`; do not trust freeform model timestamp labels for the displayed value.
- Add structured module title/number and lesson position to result data only where they can be derived from the course's ordered embedded modules and lesson references. Keep API/model content factual and fail closed or omit unavailable metadata rather than inventing it.
- Match the reference header, title, spacing, typography, compact search field, result toolbar, thumbnail/play overlay, key-point lesson preview, actions, and peach browse-catalog footer. Keep the footer visible after completed searches even when matches exist.
- Retain relevance order by default and the existing type sort as an alternate. Keep usable no-query, loading, error, and no-match states.
- Reuse existing global styles and components where practical. Do not add analytics, progress, notifications behavior, or unrelated features.

## Expected files

- `app/search/SearchResults.tsx` — result presentation, search interaction, header, sort and browse-catalog footer.
- `app/globals.css` — targeted desktop and responsive search styling.
- `app/api/search/route.ts` — add validated structured metadata and server-side Sanity thumbnail hydration while preserving grounded MCP behavior.
- `sanity/lib/data.ts` — only if a small focused server helper makes the route clearer.

## Security and data requirements

- Keep the Sanity read token, Context MCP URL, and OpenAI key in server-only code.
- Do not trust model-produced image URLs; resolve images from Sanity after the model returns slugs.
- Validate API input and model output; render returned content as text, not HTML.
- Keep video documents internal to search. Results must resolve to a real lesson and course.
- Do not fetch whole transcript arrays or put transcript ingestion in the request path.
- Preserve `startSeconds` in the lesson link so the existing player seeks in place.

## Acceptance criteria

- Desktop `/search?q=data%20fetching` matches the supplied image's page hierarchy and card anatomy.
- Result content and counts come from Sanity/MCP output; video and lesson cards remain distinct.
- Search still returns real Sanity results when the Context/LLM provider is unavailable, using the server-only keyword fallback.
- Video cards show a Sanity thumbnail or branded fallback, an overlay play button, derived timestamp badge, course and module/lesson metadata, and a working in-site seek link.
- Lesson cards show returned key points, course and module metadata, and a working lesson link.
- The browse-catalog footer appears after a completed search, including when results are present; empty results also explain how to browse the catalog.
- No-query, loading, API error, and empty states remain usable.
- Cards stack without horizontal overflow on mobile while retaining the desktop layout at the reference width.
- No private key or Sanity token is sent to the browser.

## Checks

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` because the API route changes.

## Manual verification

1. Run `npm run dev` with the existing Sanity Context and OpenAI server variables configured.
2. Search for `data fetching` and compare the desktop result page to `Design/vertex-search.png`.
3. Confirm displayed counts reflect the returned results and the footer remains visible beneath them.
4. Follow a video action and verify the lesson page receives `?start=<seconds>` and seeks in the embedded player.
5. Follow a lesson action and verify it opens the matching lesson.
6. Check no-query, no-match, and an unavailable search service state.
7. Narrow the viewport and verify cards stack and controls remain usable.
