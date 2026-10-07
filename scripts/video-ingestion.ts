import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import {createClient} from 'next-sanity'
import {YoutubeTranscript} from 'youtube-transcript'
import {ensureUniqueArrayKeys} from './video-array-keys'

export type CaptionCue = {startSeconds: number; durationSeconds?: number; text: string}
export type Chapter = {startSeconds: number; label: string}
export type KeyedChapter = Chapter & {_key: string}
export type KeyedChunk = {startSeconds: number; text: string; _key: string}
export type VideoDocument = {
  _id: string
  _type: 'video'
  sourceId: string
  url: string
  provider: 'youtube'
  durationSeconds?: number
  chapters: KeyedChapter[]
  chunks: KeyedChunk[]
}

type VideoMetadata = {id: string; duration?: number}
type Lesson = {slug?: {current?: string}; videoUrl?: string}
export type IngestionInput = {lessonSlug: string; url: string; durationSeconds?: number}
export type VideoSource = {cues: CaptionCue[]; chapters?: Chapter[]}
export type IngestionFailure = {lessonSlug: string; url: string; provider: string; reason: string}

export function canonicalizeYouTubeUrl(value: string) {
  const url = new URL(value)
  const host = url.hostname.replace(/^www\./, '')
  let sourceId = ''

  if (host === 'youtu.be') sourceId = url.pathname.slice(1).split('/')[0]
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') sourceId = url.searchParams.get('v') || ''
    if (url.pathname.startsWith('/embed/')) sourceId = url.pathname.split('/')[2] || ''
    if (url.pathname.startsWith('/shorts/')) sourceId = url.pathname.split('/')[2] || ''
  }

  if (!/^[A-Za-z0-9_-]{6,}$/.test(sourceId)) throw new Error(`Unsupported YouTube URL: ${value}`)
  return {sourceId, url: `https://www.youtube.com/watch?v=${sourceId}`}
}

export function videoDocumentId(url: string) {
  return `video-${createHash('sha256').update(url).digest('hex').slice(0, 24)}`
}

function cleanText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export function normalizeChapters(chapters: Chapter[], durationSeconds?: number) {
  const seen = new Set<number>()
  const normalized = chapters
    .filter((chapter) => Number.isFinite(chapter.startSeconds) && chapter.startSeconds >= 0)
    .map((chapter) => ({startSeconds: Math.round(chapter.startSeconds * 100) / 100, label: cleanText(chapter.label)}))
    .filter((chapter) => chapter.label && (durationSeconds === undefined || chapter.startSeconds <= durationSeconds))
    .sort((a, b) => a.startSeconds - b.startSeconds)
    .filter((chapter) => !seen.has(chapter.startSeconds) && seen.add(chapter.startSeconds))
  return ensureUniqueArrayKeys('chapter', normalized, (chapter) => chapter.label)
}

export function normalizeTranscript(cues: CaptionCue[], durationSeconds?: number) {
  const textByTimestamp = new Map<number, string[]>()
  for (const cue of cues) {
    if (!Number.isFinite(cue.startSeconds) || cue.startSeconds < 0) continue
    if (durationSeconds !== undefined && cue.startSeconds > durationSeconds) continue
    const text = cleanText(cue.text)
    if (!text) continue
    const startSeconds = Math.round(cue.startSeconds * 100) / 100
    const texts = textByTimestamp.get(startSeconds) || []
    texts.push(text)
    textByTimestamp.set(startSeconds, texts)
  }
  const chunks = [...textByTimestamp.entries()]
    .map(([startSeconds, texts]) => ({startSeconds, text: cleanText(texts.join(' '))}))
    .sort((a, b) => a.startSeconds - b.startSeconds)
  if (!chunks.length) throw new Error('Transcript contains no usable caption text.')
  return ensureUniqueArrayKeys('chunk', chunks, (chunk) => chunk.text)
}

function providerName(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return 'unknown provider'
  }
}

export async function buildVideoDocuments(
  inputs: IngestionInput[],
  loadSource: (input: IngestionInput, sourceId: string) => Promise<VideoSource>,
) {
  const documents = new Map<string, VideoDocument>()
  const failures: IngestionFailure[] = []

  for (const input of inputs) {
    try {
      const youtube = canonicalizeYouTubeUrl(input.url)
      if (documents.has(youtube.url)) continue
      if (input.durationSeconds !== undefined && (!Number.isFinite(input.durationSeconds) || input.durationSeconds < 0)) {
        throw new Error('Duration must be a finite, non-negative number.')
      }
      const source = await loadSource(input, youtube.sourceId)
      const document: VideoDocument = {
        _id: videoDocumentId(youtube.url),
        _type: 'video',
        sourceId: youtube.sourceId,
        url: youtube.url,
        provider: 'youtube',
        durationSeconds: input.durationSeconds,
        chapters: normalizeChapters(source.chapters || [], input.durationSeconds),
        chunks: normalizeTranscript(source.cues, input.durationSeconds),
      }
      documents.set(youtube.url, document)
    } catch (error) {
      failures.push({
        lessonSlug: input.lessonSlug,
        url: input.url,
        provider: providerName(input.url),
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {documents: [...documents.values()], failures}
}

function decodeXml(value: string) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
}

export function parseYouTubeCaptionXml(xml: string): CaptionCue[] {
  return [...xml.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)].map((match) => {
    const start = /\bstart="([\d.]+)"/.exec(match[1])?.[1]
    const duration = /\bdur="([\d.]+)"/.exec(match[1])?.[1]
    return {startSeconds: Number(start), durationSeconds: duration ? Number(duration) : undefined, text: decodeXml(match[2].replace(/<br\s*\/?\s*>/g, ' '))}
  })
}

export function parseYouTubeChapters(html: string): Chapter[] {
  return [...html.matchAll(/chapterRenderer"\s*:\s*\{[\s\S]*?"title"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"[\s\S]*?"timeRangeStartMillis"\s*:\s*([\d.]+)/g)]
    .map((match) => ({label: decodeXml(match[1]), startSeconds: Number(match[2]) / 1000}))
}

export async function fetchYouTubeSource(sourceId: string) {
  const pageResponse = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(sourceId)}`)
  if (!pageResponse.ok) throw new Error(`YouTube page request failed with ${pageResponse.status}.`)
  const page = await pageResponse.text()
  const trackMatch = /"captionTracks":(\[[\s\S]*?\]),"audioTracks"/.exec(page)
  if (trackMatch) {
    try {
      const tracks = JSON.parse(trackMatch[1]) as Array<{baseUrl?: string; languageCode?: string}>
      const track = tracks.find((candidate) => candidate.languageCode === 'en') || tracks[0]
      if (track?.baseUrl) {
        const captionsUrl = new URL(track.baseUrl)
        captionsUrl.searchParams.set('fmt', 'srv3')
        const captionsResponse = await fetch(captionsUrl)
        const xml = await captionsResponse.text()
        if (captionsResponse.ok && xml.trim()) return {cues: parseYouTubeCaptionXml(xml), chapters: parseYouTubeChapters(page)}
      }
    } catch {
    }
  }

  const transcript = await YoutubeTranscript.fetchTranscript(sourceId)
  if (!transcript.length) throw new Error('YouTube returned no transcript cues.')
  return {
    cues: transcript.map((cue) => ({startSeconds: cue.offset / 1000, durationSeconds: cue.duration / 1000, text: cue.text})),
    chapters: parseYouTubeChapters(page),
  }
}

function parseArgs(argv: string[]) {
  return {
    dryRun: argv.includes('--dry-run'),
    limit: Number(argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || 0),
    captionsDir: argv.find((arg) => arg.startsWith('--captions-dir='))?.split('=').slice(1).join('='),
  }
}

async function readCaptionFixture(captionsDir: string | undefined, lessonSlug: string, sourceId: string) {
  if (!captionsDir) return null
  for (const name of [`${lessonSlug}.json`, `${sourceId}.json`]) {
    try {
      return JSON.parse(await readFile(`${captionsDir}/${name}`, 'utf8')) as {cues: CaptionCue[]; chapters?: Chapter[]}
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
  return null
}

async function loadInputs() {
  const metadata = JSON.parse(await readFile('videos.json', 'utf8')) as Record<string, VideoMetadata>
  const lessons = (await readFile('seed.ndjson', 'utf8')).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as Lesson).filter((lesson) => lesson.slug?.current && lesson.videoUrl)
  const lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug!.current!, lesson]))
  return Object.entries(metadata).map(([lessonSlug, item]) => {
    const lesson = lessonBySlug.get(lessonSlug)
    if (!lesson?.videoUrl) throw new Error(`No seeded lesson URL found for ${lessonSlug}.`)
    return {lessonSlug, url: lesson.videoUrl, durationSeconds: item.duration}
  })
}

export async function main() {
  const {dryRun, limit, captionsDir} = parseArgs(process.argv.slice(2))
  const inputs = (await loadInputs()).slice(0, limit || undefined)
  const fixtureSlugs = new Set<string>()
  const {documents, failures} = await buildVideoDocuments(inputs, async (input, sourceId) => {
    const fixture = await readCaptionFixture(captionsDir, input.lessonSlug, sourceId)
    if (fixture) fixtureSlugs.add(input.lessonSlug)
    return fixture || fetchYouTubeSource(sourceId)
  })
  for (const failure of failures) {
    console.error(`${failure.lessonSlug} (${failure.url}; provider ${failure.provider}): ${failure.reason}`)
  }
  if (failures.length) throw new Error(`${failures.length} source(s) failed; no video documents were written.`)
  for (const document of documents) {
    const input = inputs.find((candidate) => canonicalizeYouTubeUrl(candidate.url).url === document.url)
    const fixtureLabel = input && fixtureSlugs.has(input.lessonSlug) ? ' (fixture)' : ''
    console.log(`${input?.lessonSlug || document.sourceId}: ${document.chunks.length} chunks, ${document.chapters.length} chapters${fixtureLabel}`)
  }
  if (dryRun) return console.log(`Dry run complete: ${documents.length} video documents validated.`)

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!projectId || !dataset || !token) throw new Error('Set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, and SANITY_API_WRITE_TOKEN.')
  const client = createClient({projectId, dataset, apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-02-19', token, useCdn: false})
  const transaction = client.transaction()
  documents.forEach((document) => transaction.createOrReplace(document))
  await transaction.commit()
  console.log(`Upserted ${documents.length} video documents.`)
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/video-ingestion.ts')) main().catch((error) => {console.error(error instanceof Error ? error.message : error); process.exitCode = 1})