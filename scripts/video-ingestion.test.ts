import {strict as assert} from 'node:assert'
import test from 'node:test'
import {canonicalizeYouTubeUrl, normalizeChapters, normalizeTranscript, parseYouTubeCaptionXml, videoDocumentId} from './video-ingestion'

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
  assert.deepEqual(normalizeTranscript(cues), [{startSeconds: 2.5, text: 'Hello & welcome'}, {startSeconds: 4, text: 'to Vertex'}])
})

test('sorts, filters, and deduplicates chapters', () => {
  assert.deepEqual(normalizeChapters([{startSeconds: 20, label: ' Later '}, {startSeconds: -1, label: 'bad'}, {startSeconds: 5, label: 'Start'}, {startSeconds: 5, label: 'duplicate'}]), [{startSeconds: 5, label: 'Start'}, {startSeconds: 20, label: 'Later'}])
})