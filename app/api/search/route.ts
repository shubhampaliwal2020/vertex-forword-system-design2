import { createMCPClient, type MCPClient } from '@ai-sdk/mcp'
import { openai } from '@ai-sdk/openai'
import { SeverityNumber } from '@opentelemetry/api-logs'
import { generateText, stepCountIs } from 'ai'
import { z } from 'zod'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { posthogLoggerProvider, posthogSearchLogger, posthogSpanProcessor } from '@/instrumentation'

export const runtime = 'nodejs'

const videoResultSchema = z.object({
  type: z.literal('video'),
  id: z.string(),
  lessonSlug: z.string(),
  lessonTitle: z.string(),
  courseSlug: z.string(),
  courseTitle: z.string(),
  moduleLabel: z.string(),
  description: z.string(),
  duration: z.string().optional(),
  startSeconds: z.number().int().min(0),
  timestampLabel: z.string(),
})

const lessonResultSchema = z.object({
  type: z.literal('lesson'),
  id: z.string(),
  lessonSlug: z.string(),
  lessonTitle: z.string(),
  courseSlug: z.string(),
  courseTitle: z.string(),
  moduleLabel: z.string(),
  description: z.string(),
  keyPoints: z.array(z.string()).max(6),
})

const searchResponseSchema = z.object({
  results: z.array(z.discriminatedUnion('type', [videoResultSchema, lessonResultSchema])),
})

const lessonContextQuery = `
  *[_type == "lesson" && slug.current in $lessonSlugs] {
    _id,
    title,
    "slug": slug.current,
    thumbnail,
    duration,
    "courses": *[_type == "course" && references(^._id)] {
      title,
      "slug": slug.current,
      coverImage,
      modules[] {
        title,
        "lessons": lessons[]->{_id, "slug": slug.current}
      }
    }
  }
`

const sanityKeywordSearchQuery = `
  {
    "lessons": *[_type == "lesson" && defined(slug.current) && (
      title match $patterns || pt::text(notes) match $patterns || keyPoints match $patterns || proTip match $patterns
    )] {
      title,
      "slug": slug.current,
      keyPoints,
      "notesText": pt::text(notes),
      "course": *[_type == "course" && references(^._id)][0] {
        title,
        "slug": slug.current
      }
    },
    "videos": *[_type == "video" && (
      count(chapters[label match $patterns]) > 0 || count(chunks[text match $patterns]) > 0
    )] {
      url,
      "chapters": chapters[label match $patterns][0...5] {startSeconds, label},
      "chunks": chunks[text match $patterns][0...5] {startSeconds, text},
      "lesson": *[_type == "lesson" && videoUrl == ^.url][0] {
        title,
        "slug": slug.current,
        "course": *[_type == "course" && references(^._id)][0] {
          title,
          "slug": slug.current
        }
      }
    }
  }
`

let cachedInitialContext: string | null = null
let initialContextTimestamp = 0
const initialContextTtl = 5 * 60 * 1000

function initialContextUrl(mcpUrl: string) {
  const url = new URL(mcpUrl)
  url.pathname = `${url.pathname.replace(/\/$/, '')}/initial-context`
  return url.toString()
}

async function getInitialContext(mcpUrl: string, token: string) {
  if (cachedInitialContext && Date.now() - initialContextTimestamp < initialContextTtl) return cachedInitialContext

  try {
    const response = await fetch(initialContextUrl(mcpUrl), {headers: {Authorization: `Bearer ${token}`}, cache: 'no-store'})
    if (!response.ok) return cachedInitialContext
    cachedInitialContext = await response.text()
    initialContextTimestamp = Date.now()
    return cachedInitialContext
  } catch {
    return cachedInitialContext
  }
}

function parseModelJson(text: string) {
  const cleanText = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  return searchResponseSchema.parse(JSON.parse(cleanText))
}

function formatTimestamp(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`
}

function imageUrl(source: unknown) {
  if (!source) return undefined
  try {
    return urlFor(source as Parameters<typeof urlFor>[0]).width(640).height(360).fit('crop').url()
  } catch {
    return undefined
  }
}

async function hydrateResults(results: Array<z.infer<typeof videoResultSchema> | z.infer<typeof lessonResultSchema>>) {
  const lessonSlugs = [...new Set(results.map((result) => result.lessonSlug))]
  if (!lessonSlugs.length) return []

  const lessons = await client.fetch<Array<{
    _id: string
    title: string
    slug: string
    thumbnail?: unknown
    duration?: string
    courses?: Array<{
      title: string
      slug: string
      coverImage?: unknown
      modules?: Array<{title?: string; lessons?: Array<{_id: string; slug: string} | null>}>
    }>
  }>>(lessonContextQuery, {lessonSlugs})
  const lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]))

  return results.flatMap((result) => {
    const lesson = lessonBySlug.get(result.lessonSlug)
    const course = lesson?.courses?.find((item) => item.slug === result.courseSlug)
    if (!lesson || !course) return []

    const moduleIndex = course.modules?.findIndex((module) => module.lessons?.some((item) => item?._id === lesson._id)) ?? -1
    const matchedModule = moduleIndex >= 0 ? course.modules?.[moduleIndex] : undefined
    const lessonIndex = matchedModule?.lessons?.findIndex((item) => item?._id === lesson._id) ?? -1
    if (!matchedModule || moduleIndex < 0 || lessonIndex < 0) return []

    const moduleTitle = matchedModule.title || result.moduleLabel
    const lessonNumber = `${moduleIndex + 1}.${lessonIndex + 1}`
    const thumbnailUrl = imageUrl(lesson.thumbnail) || imageUrl(course.coverImage)
    const canonical = {
      ...result,
      id: `${result.type}:${lesson.slug}:${result.type === 'video' ? result.startSeconds : 'lesson'}`,
      lessonTitle: lesson.title,
      courseTitle: course.title,
      moduleLabel: moduleTitle,
      moduleTitle,
      lessonNumber,
      ...(thumbnailUrl ? {thumbnailUrl} : {}),
    }

    if (result.type === 'video') {
      return [{...canonical, duration: lesson.duration || result.duration, timestampLabel: formatTimestamp(result.startSeconds)}]
    }
    return [canonical]
  })
}

function keywordScore(queryTerms: string[], values: Array<string | undefined>) {
  const title = (values[0] || '').toLowerCase()
  const searchable = values.filter(Boolean).join(' ').toLowerCase()
  const exactTitle = queryTerms.length > 1 && title.includes(queryTerms.join(' '))
  return queryTerms.reduce((score, term) => {
    if (title.split(/[^a-z0-9]+/).includes(term)) return score + 8
    if (title.includes(term)) return score + 5
    return searchable.includes(term) ? score + 1 : score
  }, exactTitle ? 12 : 0)
}

async function searchSanityKeywords(query: string) {
  const queryTerms = [...new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 1))]
  if (!queryTerms.length) return []

  const patterns = queryTerms.map((term) => `${term}*`)
  const content = await client.fetch<{
    lessons: Array<{
      title: string
      slug: string
      keyPoints?: string[]
      notesText?: string
      course?: {title: string; slug: string}
    }>
    videos: Array<{
      url: string
      chapters?: Array<{startSeconds: number; label: string}>
      chunks?: Array<{startSeconds: number; text: string}>
      lesson?: {title: string; slug: string; course?: {title: string; slug: string}}
    }>
  }>(sanityKeywordSearchQuery, {patterns})

  const results: Array<{
    rank: number
    result: z.infer<typeof videoResultSchema> | z.infer<typeof lessonResultSchema>
  }> = []

  for (const lesson of content.lessons || []) {
    if (!lesson.course?.slug || !lesson.slug) continue
    const keyPoints = (lesson.keyPoints || []).slice(0, 6)
    results.push({
      rank: keywordScore(queryTerms, [lesson.title, ...keyPoints, lesson.notesText]),
      result: {
        type: 'lesson',
        id: `lesson:${lesson.slug}`,
        lessonSlug: lesson.slug,
        lessonTitle: lesson.title,
        courseSlug: lesson.course.slug,
        courseTitle: lesson.course.title,
        moduleLabel: lesson.course.title,
        description: (keyPoints[0] || lesson.notesText || lesson.title).slice(0, 220),
        keyPoints,
      },
    })
  }

  for (const video of content.videos || []) {
    const lesson = video.lesson
    if (!lesson?.slug || !lesson.course?.slug) continue
    // Chapter labels are the table of contents. Transcript chunks are used only
    // when this video has no matching chapter.
    const moments = video.chapters?.length
      ? video.chapters.map((chapter) => ({startSeconds: chapter.startSeconds, text: chapter.label}))
      : (video.chunks || []).map((chunk) => ({startSeconds: chunk.startSeconds, text: chunk.text}))

    for (const moment of moments) {
      const startSeconds = Math.max(0, Math.floor(moment.startSeconds))
      results.push({
        rank: keywordScore(queryTerms, [lesson.title, moment.text]) + 2,
        result: {
          type: 'video',
          id: `video:${lesson.slug}:${startSeconds}`,
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
          courseSlug: lesson.course.slug,
          courseTitle: lesson.course.title,
          moduleLabel: lesson.course.title,
          description: moment.text.slice(0, 220),
          startSeconds,
          timestampLabel: formatTimestamp(startSeconds),
        },
      })
    }
  }

  results.sort((left, right) => right.rank - left.rank)
  return results.map(({result}) => result)
}

const systemPrompt = `You are Vertex Search, a grounded learning-content search agent.

Use the Sanity Context MCP tools to search real course and lesson documents. Return ONLY valid JSON matching:
{"results":[{"type":"video" or "lesson", ...}]}

Search lesson titles, notes plain-text projections, keyPoints, proTip, module titles/summaries, and course summaries. Return both lesson-topic matches and video-moment matches when supported by the data. Rank exact title/concept matches above broad keyword matches.

For video results, resolve the match back to the lesson and course. Prefer a matching chapter before a transcript chunk. Use the real startSeconds and timestampLabel from a video document when available; otherwise use startSeconds 0 and timestampLabel "Start". Never invent a timestamp, course, lesson, description, or count.

For lesson results, include only real key points returned by Sanity. Use an empty array when none exist. Do not return video documents by themselves, whole transcript arrays, or prose outside the JSON object. If nothing matches, return {"results":[]}.

Every result must include stable real-looking identifiers from the queried documents, accurate lessonSlug and courseSlug values, and a concise description grounded in returned content.`

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({error: 'Invalid JSON request.'}, {status: 400})
  }

  const query = z.object({query: z.string().trim().min(2).max(200)}).safeParse(body)
  if (!query.success) return Response.json({error: 'Enter a search with at least 2 characters.'}, {status: 400})

  const mcpUrl = process.env.SANITY_CONTEXT_MCP_URL
  const token = process.env.SANITY_API_READ_TOKEN
  const openAiKey = process.env.OPENAI_API_KEY

  if (!token) {
    return Response.json({error: 'Search is not configured. Add the server-side Sanity read token.'}, {status: 503})
  }

  let mcpClient: MCPClient | null = null

  try {
    let candidateResults: Array<z.infer<typeof videoResultSchema> | z.infer<typeof lessonResultSchema>>
    let searchMethod = 'sanity_keyword'

    if (mcpUrl && openAiKey) {
      try {
        const [connectedClient, initialContext] = await Promise.all([
          createMCPClient({transport: {type: 'http', url: mcpUrl, headers: {Authorization: `Bearer ${token}`}}}),
          getInitialContext(mcpUrl, token),
        ])
        mcpClient = connectedClient
        const allTools = await mcpClient.tools()
        const tools = Object.fromEntries(Object.entries(allTools).filter(([name]) => name !== 'initial_context'))
        const result = await generateText({
          model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
          system: `${systemPrompt}\n\nSchema context:\n${initialContext || 'Use the available MCP schema tools to inspect the content model.'}`,
          prompt: `Find all relevant Vertex learning results for: ${query.data.query}`,
          tools,
          stopWhen: stepCountIs(6),
          runtimeContext: {
            sessionId: `search-agent-${process.pid}`,
            traceName: 'learning_content_search',
            properties: {environment: process.env.NODE_ENV},
          },
          telemetry: {
            functionId: 'learning_content_search',
            includeRuntimeContext: {sessionId: true, traceName: true, properties: true},
            recordInputs: true,
            recordOutputs: true,
          },
        })
        candidateResults = parseModelJson(result.text).results
        searchMethod = 'ai_mcp'
      } catch (error) {
        console.warn('Context search unavailable; using Sanity keyword search:', error instanceof Error ? error.message : 'Unknown search error')
        searchMethod = 'sanity_keyword_fallback'
        posthogSearchLogger?.emit({
          body: 'search_ai_fallback_used',
          severityNumber: SeverityNumber.WARN,
          attributes: {search_method: searchMethod, error_type: error instanceof Error ? error.name : 'unknown_error'},
        })
        candidateResults = await searchSanityKeywords(query.data.query)
      }
    } else {
      candidateResults = await searchSanityKeywords(query.data.query)
    }

    const hydratedResults = await hydrateResults(candidateResults)
    const courses = new Set(hydratedResults.map((item) => item.courseSlug)).size
    posthogSearchLogger?.emit({
      body: 'search_request_completed',
      severityNumber: SeverityNumber.INFO,
      attributes: {search_method: searchMethod, result_count: hydratedResults.length, course_count: courses},
    })
    return Response.json({query: query.data.query, total: hydratedResults.length, courseCount: courses, results: hydratedResults})
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed.'
    console.error('SEARCH API ERROR:', error instanceof Error ? `${error.name}: ${message}` : 'Unknown search error')
    posthogSearchLogger?.emit({
      body: 'search_request_failed',
      severityNumber: SeverityNumber.ERROR,
      attributes: {error_type: error instanceof Error ? error.name : 'unknown_error'},
    })
    return Response.json({error: message}, {status: 502})
  } finally {
    await mcpClient?.close()
    await posthogSpanProcessor?.forceFlush()
    await posthogLoggerProvider?.forceFlush()
  }
}
