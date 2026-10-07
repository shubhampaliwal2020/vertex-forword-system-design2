# Fix Sanity Video Array Keys

## Goal

Resolve Studio's “Missing keys” errors for the `chapters` and `chunks` arrays in Video intelligence documents. Ensure future ingestion emits stable unique Sanity `_key` values and safely backfill existing affected production records without changing their content.

## Skills and guidance read

- `sanity-best-practices`: Sanity object members in arrays need stable `_key` values for editing; use structured document mutations.
- `AGENTS.md`: use the existing offline ingestion boundary, keep write credentials private, and verify persisted data.

## Current code and data inspected

- `scripts/video-ingestion.ts` normalizes chapter and transcript array members as `{startSeconds, label}` and `{startSeconds, text}` with no `_key`.
- `sanity/schemaTypes/videoType.ts` defines `chapters` and `chunks` as arrays of objects.
- Production GROQ checks found 120 video documents with at least one chunk missing `_key` and 91 with at least one chapter missing `_key`.
- Production currently has 120 valid URL-bearing video records with chunks, plus 120 legacy records without URL/chunks. Do not mutate the legacy records unless they have affected non-empty arrays.
- The current source set has 120 entries. The Sanity token exists in `.env.local`; do not display, log, or commit it.
- No data has been changed for this task yet.

## Decisions and assumptions

- Generate deterministic, unique, Sanity-safe `_key` values for normalized chapter and chunk items. Preserve an existing valid key during backfill; repair missing or duplicate keys only.
- Add a standalone, explicit backfill mode/script that reads only video document IDs and chapter/chunk arrays, adds missing keys, and patches only those fields. Do not replace documents, refetch transcripts, rewrite unrelated fields, or delete records.
- The backfill must support dry run and require an explicit production acknowledgement flag (for example `--confirm-production`) before it can write to the `production` dataset. The dataset remains selected through the current environment/CLI configuration and must be printed in the non-secret dry-run summary.
- Process writes in bounded transactions, report target dataset, affected document count, and item counts, and fail closed if the target dataset is missing or unexpected.
- Add unit coverage for deterministic unique keys, preservation of existing keys, missing/duplicate-key repair, and both chapter/chunk shapes.
- Do not alter schemas, search projections, video content, lesson playback, or unrelated untracked files.

## Expected files

- `scripts/video-ingestion.ts`
- `scripts/video-ingestion.test.ts`
- one small backfill helper/script under `scripts/` if needed
- `package.json` only if a documented backfill command is needed
- `scripts/README.md` for the safe dry-run and write commands

## Security and data safety

- Keep `SANITY_API_WRITE_TOKEN` only in process environment and never print it.
- The approved write will target production because no other project dataset is available. It must patch only missing/duplicate `_key` fields in non-empty `chapters` and `chunks` arrays.
- Require explicit `--confirm-production` for production mutation; default is dry-run/no write.
- Use revision-aware or bounded patch operations where supported; preserve existing valid keys and all other document fields.
- Never delete documents or remove transcript/chapter content.

## Acceptance criteria

- New ingested documents always have unique `_key` values on every chapter and transcript chunk.
- Unit tests prove deterministic generation and correct preservation/repair behavior.
- Dry-run reports production as target, counts affected docs/items, and performs no writes.
- After the approved production backfill, a read-only GROQ check reports zero video documents with missing keys in non-empty chapter/chunk arrays.
- Existing array content, document count, URLs, timestamps, labels, and transcript text remain unchanged.
- `npm run test:ingestion`, `npm run lint`, and `npx tsc --noEmit` pass.

## Manual verification

1. Run focused tests, lint, and typecheck.
2. Run the backfill in dry-run mode and review the exact production target and affected counts.
3. Execute only with `--confirm-production` after approval.
4. Re-run read-only GROQ checks for missing keys, valid document count, and unchanged URL uniqueness.
5. Open Video intelligence in Studio and confirm the Chapters and Transcript chunks arrays are editable.

## Checks to run

- `npm run test:ingestion`
- `npm run lint`
- `npx tsc --noEmit`
- backfill dry run against production
- guarded production backfill after approval
- read-only post-migration GROQ validation