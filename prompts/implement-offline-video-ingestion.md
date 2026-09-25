# Implement offline video ingestion

## Goal

Implement the offline video ingestion pipeline for Vertex. It must turn supported lesson video sources into Sanity `video` documents containing ordered chapter markers and short timestamped transcript chunks. The pipeline must not run in a Next.js request path and must not expose Sanity write credentials to the browser.

## Skills and guidance read

- `sanity-best-practices`: model video metadata as structured Sanity fields, keep streaming providers external, and use server-side writes.
- Repository guidance in `AGENTS.md`: video documents are internal lookup documents keyed by a sanitized ID derived from the video URL; chapters are preferred over transcript chunks; whole transcripts must not be returned in request-path data.
- Existing repository conventions in `sanity/env.ts`, `sanity/lib/client.ts`, `sanity/schemaTypes/*`, `videos.json`, `seed.ndjson`, and `prompts/seed-samples-content.md`.

## Current code inspected

- `videos.json` has 120 records keyed by lesson slug. Each record currently includes `id`, `title`, `channel`, `duration`, and `query`, but no transcript or chapter data.
- `seed.ndjson` contains the lesson documents and their canonical `videoUrl` values. The object key in `videos.json` is the lesson-slug association.
- There is no registered `video` schema type, offline script, Sanity write client, transcript parser, chapter parser, or script runner.
- `app/api/search/route.ts` already expects video documents with `url`, `chapters`, and `chunks`, and applies chapter-first matching conceptually.
- The current lesson player supports YouTube URLs only. Do not claim Vimeo or Bunny ingestion support unless playback and ingestion are both implemented in the same change; otherwise fail clearly for unsupported providers.

## Decisions and assumptions

- Add a root-level `scripts/` area for offline tooling.
- Add a `video` Sanity document schema with:
  - `sourceId` or equivalent provider identifier
  - canonical `url`
  - ordered `chapters` objects containing `startSeconds` and `label`
  - ordered `chunks` objects containing `startSeconds` and `text`
  - only minimal optional source metadata needed for re-ingestion/debugging
- Use a deterministic Sanity document ID derived from the canonical video URL and sanitized to Sanity's accepted ID characters. Re-running ingestion must update the same document instead of creating duplicates.
- Resolve the source URL from the lesson data rather than trusting metadata in `videos.json`; preserve the existing source files unchanged.
- Normalize captions into short, non-empty, ordered chunks. Merge adjacent caption cues where appropriate, but never store one whole transcript field.
- Normalize authored/provider chapter data into clean, ordered chapter markers, removing invalid, duplicate, negative, or out-of-range entries.
- Provide a dry-run mode that performs loading, provider parsing, normalization, and validation without writing to Sanity.
- Use a direct development dependency and a documented npm script for running TypeScript tooling. Do not rely on an incidental transitive package.
- Keep provider-specific fetching behind a small adapter interface so unsupported providers fail with an actionable message and do not produce partial documents.
- For external transcript/chapter fetching, use a maintained package or documented HTTP source after checking its API and license compatibility. Keep credentials and optional API keys in environment variables, with a committed `.env.example` update if new variables are required.
- Use a Sanity write client only in the offline script. Never import it from the app or expose its token to client code.

## Expected files

- `sanity/schemaTypes/videoType.ts`
- `sanity/schemaTypes/index.ts`
- `scripts/ingest-videos.ts`
- `scripts/video-providers/types.ts`
- `scripts/video-providers/<provider>.ts` for each provider actually supported
- focused normalization/ID helpers and tests, following the repository's available test strategy
- `package.json` and lockfile for the script/dependency entry
- `.env.example` if the repository has one or if new environment variables are needed
- a short operator document or README section describing setup, dry run, write run, and verification

Avoid unrelated changes to UI, search ranking, or seed content.

## Functional requirements

1. Load the 120 source records and associate each lesson slug with its canonical lesson `videoUrl` from the seed data or Sanity, with a clear error for missing or conflicting associations.
2. Parse and canonicalize supported YouTube URLs at minimum, including watch, short, and embed forms already recognized by the lesson player. If the existing task scope requires Vimeo or Bunny, implement their adapter and playback contract together; otherwise report them as unsupported rather than silently ingesting bad data.
3. Fetch or accept provider chapter markers and captions through provider adapters, then normalize them into the Sanity shape.
4. Ensure chapter and chunk arrays are sorted, timestamps are finite non-negative numbers, text/labels are trimmed and non-empty, and duplicate timestamps do not create ambiguous records.
5. Ensure chunks remain bounded in size and preserve enough timestamps for search result deep links.
6. Upsert one `video` document per unique canonical URL using deterministic IDs. Do not create a document for a failed or unsupported source.
7. Support `--dry-run` and a normal write mode. Dry run should print a concise summary and actionable validation errors without requiring a write token.
8. Make failures observable: report the lesson slug, URL, provider, and failure reason, and exit non-zero if any source fails.
9. Keep the output compatible with the existing search route and the schema's GROQ projections.
10. Do not modify `videos.json` or `seed.ndjson`.

## Security and operational requirements

- Read `SANITY_API_WRITE_TOKEN` only in the offline process and never log it.
- Keep project ID, dataset, API version, and any provider credentials in environment variables.
- Do not place transcript fetching or Sanity writes in `app/`, route handlers, client components, or build-time page rendering.
- Do not return whole transcript/chunk arrays from request-path APIs as part of this task.
- Avoid destructive dataset replacement by default; use deterministic upserts and require an explicit flag for any destructive behavior.

## Acceptance criteria

- A registered Sanity `video` document type validates the required URL, chapters, and chunks shape.
- The documented dry-run command processes the current source set without writing and validates all generated documents.
- A write run upserts stable IDs and is idempotent when repeated.
- Invalid timestamps, empty transcript text, missing lesson mappings, duplicate URLs, and unsupported providers fail with useful diagnostics.
- Generated documents contain ordered chapter markers and short timestamped chunks, not a whole transcript blob.
- At least one fixture or unit-level test covers URL canonicalization, deterministic IDs, caption/chapter normalization, and invalid input rejection.
- `npm run lint`, `npx tsc --noEmit`, and the focused ingestion tests/check command pass.
- The operator documentation includes required environment variables, dry-run and write commands, and a Sanity query to verify document count and shape.

## Manual verification

1. Install dependencies.
2. Copy the documented environment variables into the local environment, including a Sanity write token only for the write run.
3. Run the dry-run command and confirm it writes nothing and reports the expected source count.
4. Run the focused tests/checks.
5. Run the write command against a non-production or explicitly selected dataset.
6. Query Sanity for the `video` document count, non-empty `chunks`, ordered timestamps, and unique URLs.
7. Run the ingestion command a second time and confirm the document count does not increase.
8. Open one lesson/search path and confirm the stored video URL and timestamp shape are compatible with existing consumers.

## Checks to run

- `npm run lint`
- `npx tsc --noEmit`
- the focused ingestion test/check command
- dry-run ingestion
- a production build only if the schema or runtime imports require it
