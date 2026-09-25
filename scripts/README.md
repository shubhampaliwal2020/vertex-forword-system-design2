# Video ingestion

The offline pipeline reads the lesson URLs from `seed.ndjson`, matches them to the keys in `videos.json`, and creates deterministic Sanity `video` documents with chapters and timestamped transcript chunks. YouTube captions are fetched automatically through `youtube-transcript`; the local fixture option is a fallback for videos that block automated caption access.

Use a local caption fixture when a provider blocks automated caption requests. The fixture filename may be the lesson slug or provider ID and must have this shape:

```json
{
  "chapters": [{"startSeconds": 0, "label": "Introduction"}],
  "cues": [{"startSeconds": 0, "text": "Welcome to the lesson."}]
}
```

Run `npm run ingest:videos -- --dry-run --limit=1 --captions-dir=./captions` to validate one source without writing. Omit `--dry-run` to upsert documents; that requires `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `SANITY_API_WRITE_TOKEN`.