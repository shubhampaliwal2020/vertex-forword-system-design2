# Harden offline video ingestion

## Goal

Complete and verify the existing offline pipeline that turns seeded lesson video sources into Sanity `video` documents with chapter markers and timestamped transcript chunks. Keep it outside all Next.js request paths and keep write credentials server-side/offline only.

## Skills and guidance read

- `sanity-best-practices`: use structured Sanity fields and keep streaming video on the external provider.
- `AGENTS.md`: video documents are internal lookup records; IDs are derived from video URLs; chapters take precedence over transcript chunks; whole transcripts are not request-path results.

## Current code inspected

- `scripts/video-ingestion.ts` already loads `videos.json` and lesson URLs from `seed.ndjson`, canonicalizes YouTube URLs, fetches captions and chapters, normalizes data, supports fixtures and `--dry-run`, and upserts with a Sanity transaction.
- `scripts/video-ingestion.test.ts` covers YouTube URL canonicalization, stable IDs, caption parsing/normalization, and chapter normalization. `npm run test:ingestion` currently passes.
- `sanity/schemaTypes/videoType.ts` defines the `video` fields and `sanity/schemaTypes/index.ts` already registers it.
- `app/api/search/route.ts` consumes `url`, `chapters`, and `chunks`; the lesson player currently supports YouTube. Do not add Vimeo or Bunny ingestion in this task.
- `scripts/README.md` documents the existing fixture, dry-run, and write commands.
- `videos.json` and `seed.ndjson` are source inputs and must remain unchanged.

## Decisions and assumptions

- Improve the existing script and test/documentation surfaces in place; do not scaffold another ingestion architecture or add unnecessary dependencies.
- Keep YouTube as the only supported provider. Unsupported sources must fail clearly rather than producing incomplete documents.
- Preserve the established document fields and canonical-URL-derived deterministic ID so existing search projections remain compatible.
- Validate the complete batch before committing anything. Collect per-source failures with lesson slug, URL, provider, and reason; any validation/fetch failure must exit non-zero and prevent writes.
- Deduplicate repeated canonical video URLs before upsert so there is one document and one mutation per unique URL.
- Keep dry-run independent of a Sanity write token. Do not log credentials or alter the dataset destructively.
- Follow existing Node/TypeScript and `node:test` patterns. No Next.js runtime changes are expected.

## Expected files

- `scripts/video-ingestion.ts`
- `scripts/video-ingestion.test.ts`
- `scripts/README.md` only if the actual command or operational behavior changes

Do not modify schema, app UI/search behavior, `videos.json`, `seed.ndjson`, dependencies, or unrelated user changes unless inspection proves a required compatibility fix. Avoid adding files unless the existing structure cannot reasonably hold the change.

## Functional requirements

1. Resolve each configured lesson slug to its seeded lesson URL and canonicalize supported YouTube URL forms.
2. Build schema-compatible documents containing provider/source ID, canonical URL, optional duration, sorted chapters, and sorted timestamped transcript chunks. Never store a whole transcript blob.
3. Validate finite, non-negative timestamps; discard unusable empty text/labels; enforce duration bounds; handle duplicate timestamps without ambiguous output.
4. Upsert exactly one deterministic Sanity document per unique canonical URL.
5. Support fixture-based and fetched source data, `--limit`, and `--dry-run`. Dry-run must not require or use a write token.
6. On any source failure, report actionable context and exit non-zero; never commit a partial batch.
7. Preserve source inputs and app/runtime boundaries.

## Security and operational requirements

- Read `SANITY_API_WRITE_TOKEN` only in the offline write path and never print it.
- Read project ID, dataset, and API version from environment variables.
- Keep fetching and Sanity writes in `scripts/`; do not import write credentials or client code into `app/`.
- Keep upserts non-destructive and idempotent.

## Acceptance criteria

- Existing and added focused tests cover canonical URL/ID behavior, normalized chapter and chunk output, duplicate-URL batching, and failure/no-partial-write behavior where practical without live Sanity credentials.
- Dry-run validates every requested source, reports the number of unique documents, and requires no write token.
- A write run sends one create-or-replace mutation per canonical URL only after the entire input batch validates.
- Output remains compatible with the registered `video` schema and the search route.
- `npm run test:ingestion`, `npm run lint`, and `npx tsc --noEmit` pass; run the dry-run command if local fixtures or network access permit.

## Manual verification

1. Run the focused ingestion tests and static checks.
2. Run a fixture-backed dry run and confirm the summary, chapter/chunk counts, and absence of Sanity writes.
3. Run a normal ingestion only against an explicitly selected non-production dataset with a write token.
4. Query Sanity for video document count, non-empty chunks, ordered timestamps, and unique URLs; repeat ingestion and confirm the count is stable.
5. Confirm an ingested document's canonical URL matches the lesson URL used by the existing search query.

## Checks to run

- `npm run test:ingestion`
- `npm run lint`
- `npx tsc --noEmit`
- a fixture-backed `npm run ingest:videos -- --dry-run ...` when a suitable fixture exists
- production build only if runtime/app/schema imports change
