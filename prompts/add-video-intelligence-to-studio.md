# Add Video Intelligence to Studio

## Goal

Expose the registered Sanity `video` document type in the Studio navigation as “Video intelligence” and verify that offline video ingestion persists valid documents to a specifically named non-production dataset. Do not write to the currently configured `production` dataset.

## Skills and guidance read

- `sanity-best-practices`: use the registered structured document schema and keep Sanity writes in the offline ingestion process.
- `AGENTS.md`: preserve the offline ingestion boundary, keep write tokens private, deploy the Studio application before relying on Context MCP, and verify persisted data.

## Current code inspected

- `sanity/schemaTypes/videoType.ts` defines the `video` document with URL, provider, chapter markers, and timestamped transcript chunks.
- `sanity/schemaTypes/index.ts` already registers `videoType`.
- `sanity/structure.ts` uses a custom desk structure but omits `video`, which explains why “Video intelligence” is not visible in its navigation.
- `sanity.config.ts` mounts this Studio at `/studio` and uses the custom `structure` resolver.
- `scripts/video-ingestion.ts` is the existing offline ingestion command; it validates the whole batch before writing and upserts deterministic document IDs.
- `.env.local` targets dataset `production` and contains a configured write-token variable. The secret value was not inspected or logged.
- `prompts/fix-lesson-video-access.md` is an existing untracked user file and is unrelated; leave it unchanged.

## Decisions and assumptions

- Add one `video` document type item titled “Video intelligence” to the existing Studio navigation. Do not create another schema or change document fields.
- Keep all existing structure items and order intact; position the new item with the other learning content types.
- Do not run the write pipeline against `production`. Wait for the user to name a non-production dataset, then explicitly target it for ingestion and verification.
- Keep the write token in `.env.local`/process environment only. Never print it, commit it, or add it to client-visible configuration.
- Do not modify video search, lesson playback, seeded source data, or the unrelated untracked prompt.

## Expected files

- `sanity/structure.ts`
- `prompts/add-video-intelligence-to-studio.md`

No other source changes are expected unless a focused check reveals a necessary issue.

## Security considerations

- Never show or log Sanity tokens.
- Never write to the configured `production` dataset during verification.
- Do not expose the write token to Studio browser code or import the ingestion writer into the app.
- Use deterministic upserts and verify the resulting count/shape before considering the data check complete.

## Acceptance criteria

- The custom Studio navigation includes “Video intelligence” and opens the `video` document list.
- Existing navigation entries remain unchanged.
- Typecheck, lint, and a production build pass for the touched Studio integration.
- The ingestion dry run passes without a write token.
- A named non-production dataset is explicitly selected before any write; successful persistence is verified by querying video count, unique URLs, non-empty chunks, and chapter/chunk timestamp order.
- No data is written to production as part of this task.

## Manual verification

1. Open the local app at `/studio` and confirm “Video intelligence” appears in the desk navigation.
2. Open that list and confirm existing `video` documents are visible after selecting the target dataset.
3. Run the ingestion dry run and confirm it does not write.
4. After a non-production dataset is named, run ingestion with that dataset explicitly selected and the existing token loaded privately from `.env.local`.
5. Query the same dataset to verify document count, unique canonical URLs, non-empty `chunks`, and ordered non-negative timestamps.

## Checks to run

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run ingest:videos -- --dry-run --limit=1`
- Studio UI check at `/studio`
- Non-production Sanity query after the user supplies the target dataset