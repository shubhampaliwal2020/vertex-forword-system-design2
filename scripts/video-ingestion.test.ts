import {strict as assert} from 'node:assert'
import test from 'node:test'
import {buildVideoDocuments, canonicalizeYouTubeUrl, normalizeChapters, normalizeTranscript, parseYouTubeCaptionXml, videoDocumentId} from './video-ingestion'
import {ensureUniqueArrayKeys} from './video-array-keys'

test('canonicalizes supported YouTube URL forms to one stable URL', () => {
  const urls = ['https://youtu.be/9602Yzvd7ik', 'https://www.youtube.com/watch?v=9602Yzvd7ik&t=20', 'https://youtube.com/embed/9602Yzvd7ik']
  assert.deepEqual(urls.map((url) => canonicalizeYouTubeUrl(url).url), urls.map(() => 'https://www.youtube.com/watch?v=9602Yzvd7ik'))
})

test('creates stable Sanity-safe IDs', () => {
  const id = videoDocumentId('https://www.youtube.com/watch?v=9602Yzvd7ik')
  assert.match(id, /^video-[a-f0-9]{24}$/)
  assert.equal(id, videoDocumentId('https://www.youtube.com/watch?v=9602Yzvd7ik'))
})

test('parses caption XML and normalizes transcript cues', () => {
  const cues = parseYouTubeCaptionXml('<transcript><text start="2.5" dur="1">Hello &amp; welcome</text><text start="4" dur="1">to Vertex</text></transcript>')
  const chunks = normalizeTranscript(cues)
  assert.deepEqual(chunks.map(({startSeconds, text}) => ({startSeconds, text})), [{startSeconds: 2.5, text: 'Hello & welcome'}, {startSeconds: 4, text: 'to Vertex'}])
  assert.equal(new Set(chunks.map((chunk) => chunk._key)).size, chunks.length)
})

test('sorts transcript cues and merges all text at the same timestamp', () => {
  const chunks = normalizeTranscript([
    {startSeconds: 4, text: 'later'},
    {startSeconds: 2, text: 'first'},
    {startSeconds: 4.001, text: 'same moment'},
  ])
  assert.deepEqual(chunks.map(({startSeconds, text}) => ({startSeconds, text})), [
    {startSeconds: 2, text: 'first'},
    {startSeconds: 4, text: 'later same moment'},
  ])
  assert.equal(new Set(chunks.map((chunk) => chunk._key)).size, chunks.length)
})

test('sorts, filters, and deduplicates chapters', () => {
  const chapters = normalizeChapters([{startSeconds: 20, label: ' Later '}, {startSeconds: -1, label: 'bad'}, {startSeconds: 5, label: 'Start'}, {startSeconds: 5, label: 'duplicate'}])
  assert.deepEqual(chapters.map(({startSeconds, label}) => ({startSeconds, label})), [{startSeconds: 5, label: 'Start'}, {startSeconds: 20, label: 'Later'}])
  assert.equal(new Set(chapters.map((chapter) => chapter._key)).size, chapters.length)
})

test('builds one document per canonical URL and collects source failures', async () => {
  let loadCount = 0
  const result = await buildVideoDocuments([
    {lessonSlug: 'first', url: 'https://youtu.be/9602Yzvd7ik'},
    {lessonSlug: 'duplicate', url: 'https://youtube.com/watch?v=9602Yzvd7ik&t=20'},
    {lessonSlug: 'unsupported', url: 'https://vimeo.com/123456'},
    {lessonSlug: 'failed', url: 'https://youtu.be/abcdef12345'},
  ], async (input) => {
    loadCount += 1
    if (input.lessonSlug === 'failed') throw new Error('captions unavailable')
    return {cues: [{startSeconds: 0, text: 'A timestamped cue.'}]}
  })

  assert.equal(loadCount, 2)
  assert.equal(result.documents.length, 1)
  assert.equal(result.documents[0].chunks.every((chunk) => Boolean(chunk._key)), true)
  assert.equal(result.failures.length, 2)
  assert.deepEqual(result.failures.map(({lessonSlug}) => lessonSlug), ['unsupported', 'failed'])
  assert.match(result.failures[0].reason, /Unsupported YouTube URL/)
  assert.equal(result.failures[1].provider, 'youtu.be')
})

test('generates deterministic unique keys and preserves existing keys', () => {
  const items = [
    {startSeconds: 1, text: 'same'},
    {startSeconds: 1, text: 'same'},
    {_key: 'existing-key', startSeconds: 2, text: 'preserved'},
    {_key: 'existing-key', startSeconds: 3, text: 'duplicate repaired'},
  ]
  const keyed = ensureUniqueArrayKeys('chunk', items, (item) => item.text)
  const rerun = ensureUniqueArrayKeys('chunk', items, (item) => item.text)

  assert.equal(keyed[2]._key, 'existing-key')
  assert.notEqual(keyed[3]._key, 'existing-key')
  assert.equal(new Set(keyed.map((item) => item._key)).size, keyed.length)
  assert.deepEqual(keyed.map((item) => item._key), rerun.map((item) => item._key))
})