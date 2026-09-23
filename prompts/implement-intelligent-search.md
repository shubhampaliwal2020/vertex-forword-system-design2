# Implement Intelligent Sanity Search

## Goal
Build Vertex intelligent search over Sanity courses and lessons. Connect a server-only Next.js search API to the Sanity Context MCP, use an LLM with MCP GROQ tools to find grounded content, and render the supplied full results page with Video and Lesson result cards.

## Skills and guidance read
- `create-agent-with-sanity-context`: use HTTP MCP transport with a bearer Sanity read token, fetch/cache `/initial-context`, pass discovered MCP tools to the model, and keep MCP server-only.
- `create-agent-with-sanity-context/references/nextjs-agent.md`: adapt the Next.js App Router MCP pattern and environment variables.
- `create-agent-with-sanity-context/references/system-prompts.md`: keep the system prompt concise, explicit, grounded, and domain-specific.
- `sanity-best-practices`: preserve server-side Sanity access and schema-aware GROQ.
- Existing `AGENTS.md`: use the Vercel AI SDK/OpenAI provider, keep browser tokens out of the client, and run lint/typecheck/build.

## Existing code inspected
- `app/page.tsx`: home search form currently submits to `#courses`; it needs to navigate to `/search?q=...`.
- `Design/vertex-search.png`: source of truth for the full result page visual treatment and result card types.
- `sanity/lib/data.ts`: course/lesson data shape and reverse course relationship.
- `sanity/schemaTypes/`: course, module, lesson, category, and instructor schemas; no video document schema currently exists.
- `sanity.config.ts`: embedded Studio config with no Context plugin.
- `package.json`: Next 16, React 19, next-sanity, Clerk, lucide; missing `ai`, `@ai-sdk/mcp`, `@ai-sdk/openai`, and `zod`.

## Decisions and assumptions
- Add `ai`, `@ai-sdk/mcp`, `@ai-sdk/openai`, and `zod` using current compatible package versions. Use the OpenAI provider and `OPENAI_MODEL` with a sensible default.
- Add `app/api/search/route.ts` as a server-only POST route. Validate `{query}` with Zod, reject empty/oversized queries, connect to `SANITY_CONTEXT_MCP_URL` using `SANITY_API_READ_TOKEN` (fall back to the existing `SANITY_API_READ_TOKEN` naming only if already present), cache initial context briefly, exclude `initial_context` from model tools, and close the MCP client in `finally`.
- Use a structured AI response validated with Zod. The result DTO must distinguish:
  - `video`: result id, lesson slug/title, course title/slug, module label, thumbnail URL or Sanity image source, description, duration, and `startSeconds`.
  - `lesson`: result id, lesson slug/title, course title/slug, module label, key points, and description.
- Instruct the model to query real `course` and `lesson` content through MCP, search lesson titles, notes plain-text projections, key points, pro tips, module titles/summaries, and course summaries. Never invent result data or counts. Video hits must resolve to the lesson using the video, and chapters should be preferred over transcript chunks when such documents exist. If the current schema has no timestamp source, video results use `startSeconds: 0` rather than fabricated timestamps.
- Return `{query, total, courseCount, results}` JSON from the API. Compute counts from validated results, not from model prose.
- Add a `/search` page and client component. Submit the query to the API, render loading/error/empty states, sort by relevance or result type locally, and link lesson results to `/lesson/<slug>` and video results to `/lesson/<slug>?start=<seconds>`.
- Use Sanity image URLs server-side or pass safe image source data to the client; do not expose Sanity tokens.
- Keep UI cards close to the supplied search design: result heading, quoted query, search box, result count, sort control, video cards with thumbnail/play/timestamp/course/module metadata, lesson cards with key points, and a browse-catalog empty state.
- Add a Context configuration path in the committed code/docs without requiring the Context Studio plugin if package compatibility is uncertain. Add a `sanity.agentContext` schema/plugin only if the installed current `@sanity/context` package supports this Sanity major; otherwise document that `SANITY_CONTEXT_MCP_URL` may point to the base endpoint or externally created slug document.
- Add `.env.example` with non-secret variable names if the project does not have one.

## Expected files
- Modify `app/page.tsx` to submit search to `/search?q=...`.
- Add `app/search/page.tsx` and a focused client component under `app/search/`.
- Add `app/api/search/route.ts` and small server search helpers if useful.
- Add/modify `sanity` schema/config only if needed for a compatible Context document or video search metadata; do not disrupt existing seeded content.
- Modify `app/globals.css` with search-result styles matching the supplied reference and responsive behavior.
- Modify `package.json`/lockfile through package installation.
- Add `.env.example` if absent.

## Security and behavior requirements
- MCP URL, Sanity read token, and OpenAI key are server-only.
- Never let the browser call Sanity Context, GROQ, or OpenAI directly.
- Validate all request and model output data with Zod.
- Never render untrusted HTML; use normal React text rendering.
- Handle missing MCP configuration, upstream errors, malformed model output, empty queries, and no results with user-facing states.
- Do not claim timestamps or result counts that are not grounded in returned documents.

## Acceptance criteria
- Home search navigates to `/search?q=<query>`.
- `/search` renders the supplied results-page structure and works at desktop/mobile widths.
- The browser calls only `/api/search`; MCP and LLM credentials never reach it.
- A configured Sanity Context endpoint can return validated Video and Lesson result DTOs over course/lesson content.
- Video result links include a start-seconds query parameter; lesson links open the lesson page.
- Empty and error states are usable and point to the catalog.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.

## Required environment variables
- `SANITY_CONTEXT_MCP_URL`
- `SANITY_API_READ_TOKEN`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional, default documented)

## Manual checks
1. Set the required server environment variables and ensure the Sanity Context endpoint points at the deployed project/dataset or configured context document.
2. Start `npm run dev`.
3. Submit `data fetching` from the home search field.
4. Confirm `/search?q=data%20fetching` loads, the API request stays same-origin, and cards link to lesson pages.
5. Test empty query, no matches, MCP unavailable, and mobile layout.
