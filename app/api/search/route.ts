import { createMCPClient, type MCPClient } from '@ai-sdk/mcp'
import { openai } from '@ai-sdk/openai'
import { generateText, stepCountIs } from 'ai'
import { z } from 'zod'

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
  results: z.array(z.discriminatedUnion('type', [videoResultSchema, lessonResultSchema])).max(100),
})

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

function formatCourseCount(results: Array<z.infer<typeof videoResultSchema> | z.infer<typeof lessonResultSchema>>) {
  return new Set(results.map((result) => result.courseSlug)).size
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

  if (!mcpUrl || !token || !openAiKey) {
    return Response.json({error: 'Search is not configured. Add the Sanity Context and OpenAI server environment variables.'}, {status: 503})
  }

  let mcpClient: MCPClient | null = null

  try {
    const [client, initialContext] = await Promise.all([
      createMCPClient({transport: {type: 'http', url: mcpUrl, headers: {Authorization: `Bearer ${token}`}}}),
      getInitialContext(mcpUrl, token),
    ])
    mcpClient = client
    const allTools = await mcpClient.tools()
    const tools = Object.fromEntries(Object.entries(allTools).filter(([name]) => name !== 'initial_context'))

    const result = await generateText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
      system: `${systemPrompt}\n\nSchema context:\n${initialContext || 'Use the available MCP schema tools to inspect the content model.'}`,
      prompt: `Find all relevant Vertex learning results for: ${query.data.query}`,
      tools,
      stopWhen: stepCountIs(6),
    })

    const parsed = parseModelJson(result.text)
    const courses = formatCourseCount(parsed.results)
    return Response.json({query: query.data.query, total: parsed.results.length, courseCount: courses, results: parsed.results})
  } catch (error) {
  const message = error instanceof Error ? error.message : 'Search failed.'
  console.error('SEARCH API ERROR:', error)

  return Response.json(
    { error: message },
    { status: 502 }
  )
  } finally {
    await mcpClient?.close()
  }
}