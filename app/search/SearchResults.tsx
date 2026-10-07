'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Show, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import { ArrowRight, Bell, CheckCircle2, ExternalLink, FileText, Play, Search } from 'lucide-react'
import posthog from 'posthog-js'
import { useEffect, useRef, useState, type FormEvent } from 'react'

export function PostHogIdentity() {
  const { isLoaded, isSignedIn, user } = useUser()
  const identifiedUserId = useRef<string | null>(null)
  const hadSignedInUser = useRef(false)

  useEffect(() => {
    if (!isLoaded || !process.env.NEXT_PUBLIC_POSTHOG_KEY || !process.env.NEXT_PUBLIC_POSTHOG_HOST) return

    if (isSignedIn && user) {
      if (identifiedUserId.current && identifiedUserId.current !== user.id) posthog.reset()

      if (identifiedUserId.current !== user.id) {
        const email = user.primaryEmailAddress?.emailAddress
        const name = user.fullName
        posthog.identify(user.id, {
          ...(email ? { email } : {}),
          ...(name ? { name } : {}),
        })
        identifiedUserId.current = user.id
      }

      hadSignedInUser.current = true
      return
    }

    if (hadSignedInUser.current) posthog.reset()
    identifiedUserId.current = null
    hadSignedInUser.current = false
  }, [isLoaded, isSignedIn, user])

  return null
}

type ResultBase = {
  id: string
  lessonSlug: string
  lessonTitle: string
  courseSlug: string
  courseTitle: string
  moduleLabel: string
  moduleTitle?: string
  lessonNumber?: string
  description: string
  thumbnailUrl?: string
}

type VideoResult = ResultBase & {
  type: 'video'
  duration?: string
  startSeconds: number
  timestampLabel: string
}

type LessonResult = ResultBase & {
  type: 'lesson'
  keyPoints: string[]
}

type SearchResponse = {
  query: string
  total: number
  courseCount: number
  results: Array<VideoResult | LessonResult>
}

function VertexMark() {
  return <svg className="search-brand-mark" viewBox="0 0 34 34" aria-hidden="true"><path d="M2 3h8l7 15 7-15h8L17 32 2 3Z" fill="currentColor"/><path d="M10 3h8l-1 2-4 8-4-8 1-2Z" fill="#fff"/></svg>
}

function CourseMark({slug}: {slug: string}) {
  const isReact = slug.toLowerCase().includes('react')
  const isNode = slug.toLowerCase().includes('node')
  const isJs = slug.toLowerCase().includes('javascript')
  const label = isReact ? '⚛' : isNode ? '⬡' : isJs ? 'JS' : slug.toLowerCase().includes('typescript') ? 'TS' : slug.slice(0, 1).toUpperCase()
  return <span className={`search-course-mark${isReact ? ' mark-react' : ''}${isNode ? ' mark-node' : ''}${isJs ? ' mark-js' : ''}`} aria-hidden="true">{label}</span>
}

function SearchBox({value, onSubmit, onChange}: {value: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onChange: (value: string) => void}) {
  return <form className="search-results-box" role="search" onSubmit={onSubmit}>
    <Search className="search-icon" aria-hidden="true" />
    <input aria-label="Search your learning" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Ask anything about your learning..." />
    <kbd><span aria-hidden="true">⌘</span> K</kbd>
  </form>
}

function ResultMetadata({result, type}: {result: ResultBase; type: 'video' | 'lesson'}) {
  if (type === 'lesson') {
    const moduleNumber = result.lessonNumber?.split('.')[0]
    return <div className="result-card-meta"><span>{moduleNumber ? `Module ${moduleNumber}` : result.moduleTitle || result.moduleLabel}</span></div>
  }
  return <div className="result-card-meta"><span><FileText size={15} aria-hidden="true" />{result.lessonNumber ? `Lesson ${result.lessonNumber}` : 'Lesson'}</span><i aria-hidden="true">·</i><span>{result.moduleTitle || result.moduleLabel}</span></div>
}

function captureSearchResultOpened(result: ResultBase, resultType: 'video' | 'lesson', startSeconds?: number) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || !process.env.NEXT_PUBLIC_POSTHOG_HOST) return
  posthog.capture('search_result_opened', {
    result_type: resultType,
    course_slug: result.courseSlug,
    lesson_slug: result.lessonSlug,
    ...(startSeconds === undefined ? {} : { start_seconds: startSeconds }),
  })
}

function VideoCard({result}: {result: VideoResult}) {
  const start = Math.max(0, Math.floor(result.startSeconds))
  const captureOpen = () => captureSearchResultOpened(result, 'video', start)
  return <article className="search-result-card video-result-card">
    <div className={`result-thumbnail video-thumbnail${result.thumbnailUrl ? ' has-thumbnail' : ''}`} style={result.thumbnailUrl ? {backgroundImage: `linear-gradient(#0506071c,#0506071c),url("${result.thumbnailUrl}")`} : undefined}>
      <Link className="thumbnail-play" href={`/lesson/${result.lessonSlug}?start=${start}`} aria-label={`Watch ${result.lessonTitle} from ${result.timestampLabel}`} onClick={captureOpen}><Play fill="currentColor" aria-hidden="true" /></Link>
      <span className="thumbnail-time">{result.timestampLabel}</span>
    </div>
    <div className="result-card-copy">
      <div className="result-course"><CourseMark slug={result.courseSlug} /><span>{result.courseTitle}</span></div>
      <div className="result-card-heading"><h2>{result.lessonTitle}</h2><span className="result-type video-type">VIDEO</span></div>
      <p>{result.description}</p>
      <div className="result-card-bottom"><ResultMetadata result={result} type="video" /><Link className="result-action" href={`/lesson/${result.lessonSlug}?start=${start}`} onClick={captureOpen}><Play size={16} fill="currentColor" aria-hidden="true" />Watch from {result.timestampLabel}<span className="action-chevron">›</span></Link></div>
    </div>
  </article>
}

function LessonCard({result}: {result: LessonResult}) {
  const captureOpen = () => captureSearchResultOpened(result, 'lesson')
  return <article className="search-result-card lesson-result-card">
    <div className="lesson-preview"><div className="lesson-preview-points">{result.keyPoints.slice(0, 3).map((point) => <span key={point}><i aria-hidden="true">•</i>{point}</span>)}</div><CheckCircle2 className="preview-check" size={19} aria-hidden="true" /></div>
    <div className="result-card-copy">
      <div className="result-course"><CourseMark slug={result.courseSlug} /><span>{result.courseTitle}</span></div>
      <div className="result-card-heading"><h2>{result.lessonTitle}</h2><span className="result-type lesson-type">LESSON</span></div>
      <p>{result.description}</p>
      <div className="result-card-bottom"><ResultMetadata result={result} type="lesson" /><Link className="result-action" href={`/lesson/${result.lessonSlug}`} onClick={captureOpen}>View lesson <ExternalLink size={15} aria-hidden="true" /><span className="action-chevron">›</span></Link></div>
    </div>
  </article>
}

function BrowseCatalog() {
  return <aside className="empty-search browse-catalog"><span className="browse-search-icon"><Search size={28} aria-hidden="true" /></span><div><strong>Can’t find what you’re looking for?</strong><span>Try different keywords or browse our full course catalog.</span></div><Link href="/#courses">Browse all courses <ArrowRight size={17} aria-hidden="true" /></Link></aside>
}

export default function SearchResults({initialQuery}: {initialQuery: string}) {
  const router = useRouter()
  const [input, setInput] = useState(initialQuery)
  const [data, setData] = useState<SearchResponse | null>(null)
  const [sort, setSort] = useState<'relevance' | 'type'>('relevance')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(initialQuery))

  useEffect(() => {
    if (!initialQuery) return

    let active = true
    fetch('/api/search', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({query: initialQuery})})
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Search failed.')
        return payload as SearchResponse
      })
      .then((payload) => { if (active) setData(payload) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Search failed.') })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [initialQuery])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = input.trim()
    if (query) {
      if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST) posthog.capture('search_submitted')
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const results = data?.results ? [...data.results].sort((left, right) => sort === 'type' ? left.type.localeCompare(right.type) : 0) : []

  return <main className="search-shell">
    <header className="site-header search-header">
      <Link className="brand" href="/" aria-label="Vertex home"><VertexMark /><strong>Vertex</strong></Link>
      <nav className="main-nav" aria-label="Main navigation"><Link className="active-nav" href="/#courses">Courses</Link><Link href="/#learning">My Learning</Link></nav>
      <div className="header-actions"><button className="icon-button" type="button" aria-label="Notifications"><Bell size={20} strokeWidth={1.8} /></button><Show when="signed-out"><SignInButton mode="modal"><button className="auth-link" type="button">Sign in</button></SignInButton><SignUpButton mode="modal"><button className="auth-button" type="button">Get started</button></SignUpButton></Show><Show when="signed-in"><UserButton /></Show></div>
    </header>
    <section className="search-page" aria-labelledby="search-title">
      <span className="search-eyebrow">SEARCH RESULTS</span>
      <h1 id="search-title">{initialQuery ? <>Results for <em>“{initialQuery}”</em></> : 'Search your learning'}</h1>
      <p className="search-count">{loading ? 'Searching across your courses...' : data ? `Found ${data.total} results across ${data.courseCount} courses` : 'Search across all your courses and lessons'}</p>
      <SearchBox value={input} onChange={setInput} onSubmit={submitSearch} />

      {loading ? <div className="search-state" role="status">Finding the most relevant lessons and video moments...</div> : error ? <div className="search-state search-error" role="alert"><strong>{error}</strong><span>Check your search configuration or try again.</span></div> : !initialQuery ? <div className="search-state"><Search size={30} aria-hidden="true" /><strong>What do you want to learn?</strong><span>Try a concept, technology, or question.</span></div> : <>
        <div className="results-toolbar"><strong>{data?.total ?? 0} results</strong><label><span>Sort by</span><select value={sort} onChange={(event) => { const nextSort = event.target.value as 'relevance' | 'type'; setSort(nextSort); if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST) posthog.capture('search_sort_changed', { sort: nextSort }) }} aria-label="Sort search results"><option value="relevance">Most Relevant</option><option value="type">Result Type</option></select></label></div>
        <div className="results-list">{results.map((result) => result.type === 'video' ? <VideoCard key={result.id} result={result} /> : <LessonCard key={result.id} result={result} />)}</div>
        {!results.length && <div className="search-empty-message"><Search size={26} aria-hidden="true" /><strong>No matching lessons found</strong><span>Try different keywords or browse the course catalog below.</span></div>}
        <BrowseCatalog />
      </>}
    </section>
  </main>
}
