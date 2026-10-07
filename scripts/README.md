# Video ingestion

The offline pipeline reads the lesson URLs from `seed.ndjson`, matches them to the keys in `videos.json`, and creates deterministic Sanity `video` documents with chapters and timestamped transcript chunks. YouTube captions are fetched automatically through `youtube-transcript`; the local fixture option is a fallback for videos that block automated caption access. Repeated canonical video URLs produce one document. The script validates the full batch before writing and does not write any documents if a source fails.

Use a local caption fixture when a provider blocks automated caption requests. The fixture filename may be the lesson slug or provider ID and must have this shape:

```json
{
  "chapters": [{"startSeconds": 0, "label": "Introduction"}],
  "cues": [{"startSeconds": 0, "text": "Welcome to the lesson."}]
}
```

Run `npm run ingest:videos -- --dry-run --limit=1 --captions-dir=./captions` to validate one source without writing. Omit `--dry-run` to upsert documents; that requires `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `SANITY_API_WRITE_TOKEN`.

Chapter and transcript array items receive deterministic Sanity `_key` values during ingestion. To add keys to existing video documents, run `npm run backfill:video-keys` for a read-only dry run. To write, pass `-- --write`; when targeting `production`, also pass `-- --write --confirm-production`. The backfill patches only `chapters` and `chunks`, in batches of 10 documents, and preserves existing keys and content.