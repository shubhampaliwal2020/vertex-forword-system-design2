'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, FileText, Folder, Play, Search, Video } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'

type VideoResult = {
  type: 'video'
  id: string
  lessonSlug: string
  lessonTitle: string
  courseSlug: string
  courseTitle: string
  moduleLabel: string
  description: string
  duration?: string
  startSeconds: number
  timestampLabel: string
}

type LessonResult = {
  type: 'lesson'
  id: string
  lessonSlug: string
  lessonTitle: string
  courseSlug: string
  courseTitle: string
  moduleLabel: string
  description: string
  keyPoints: string[]
}

type SearchResponse = {
  query: string
  total: number
  courseCount: number
  results: Array<VideoResult | LessonResult>
}

function CourseMark({slug}: {slug: string}) {
  const label = slug.includes('typescript') ? 'TS' : slug.includes('react') ? 'R' : slug.includes('node') ? 'JS' : 'N'
  return <span className={`search-course-mark mark-${slug}`} aria-hidden="true">{label}</span>
}

function SearchBox({value, onSubmit, onChange}: {value: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onChange: (value: string) => void}) {
  return <form className="search-results-box" role="search" onSubmit={onSubmit}>
    <Search className="search-icon" aria-hidden="true" />
    <input aria-label="Search your learning" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Ask anything about your learning..." />
    <kbd><span aria-hidden="true">&#8984;</span> K</kbd>
  </form>
}

function VideoCard({result}: {result: VideoResult}) {
  const start = Math.max(0, Math.floor(result.startSeconds))
  return <article className="search-result-card video-result-card">
    <div className="result-thumbnail video-thumbnail"><Video aria-hidden="true" /><button type="button" aria-label={`Play ${result.lessonTitle}`}><Play fill="currentColor" aria-hidden="true" /></button><span className="thumbnail-time">{result.timestampLabel}</span></div>
    <div className="result-card-copy">
      <div className="result-course"><CourseMark slug={result.courseSlug} />{result.courseTitle}</div>
      <div className="result-card-heading"><h2>{result.lessonTitle}</h2><span className="result-type video-type">VIDEO</span></div>
      <p>{result.description}</p>
      <div className="result-card-meta"><span><FileText size={15} aria-hidden="true" />{result.moduleLabel}</span><span><Folder size={15} aria-hidden="true" />{result.courseTitle}</span></div>
      <Link className="result-action" href={`/lesson/${result.lessonSlug}?start=${start}`}> <Play size={16} fill="currentColor" aria-hidden="true" />Watch from {result.timestampLabel}<ArrowRight size={17} aria-hidden="true" /></Link>
    </div>
  </article>
}

function LessonCard({result}: {result: LessonResult}) {
  return <article className="search-result-card lesson-result-card">
    <div className="lesson-preview"><FileText size={25} aria-hidden="true" />{result.keyPoints.slice(0, 3).map((point) => <span key={point}>• {point}</span>)}<CheckCircle2 className="preview-check" size={19} aria-hidden="true" /></div>
    <div className="result-card-copy">
      <div className="result-course"><CourseMark slug={result.courseSlug} />{result.courseTitle}</div>
      <div className="result-card-heading"><h2>{result.lessonTitle}</h2><span className="result-type lesson-type">LESSON</span></div>
      <p>{result.description}</p>
      <div className="result-card-meta"><span>{result.moduleLabel}</span></div>
      <Link className="result-action" href={`/lesson/${result.lessonSlug}`}>View lesson <ArrowRight size={17} aria-hidden="true" /></Link>
    </div>
  </article>
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

    const controller = new AbortController()
    fetch('/api/search', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({query: initialQuery}), signal: controller.signal})
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Search failed.')
        return payload as SearchResponse
      })
      .then(setData)
      .catch((reason: unknown) => { if (reason instanceof DOMException && reason.name === 'AbortError') return; setError(reason instanceof Error ? reason.message : 'Search failed.') })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [initialQuery])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = input.trim()
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const results = data?.results ? [...data.results].sort((left, right) => sort === 'type' ? left.type.localeCompare(right.type) : 0) : []

  return <main className="search-shell">
    <header className="site-header search-header"><Link className="brand" href="/" aria-label="Vertex home"><span className="search-brand-mark">V</span><strong>Vertex</strong></Link><nav className="main-nav" aria-label="Main navigation"><Link className="active-nav" href="/">Courses</Link><Link href="/">My Learning</Link></nav><div className="header-actions"><span className="search-header-avatar" aria-hidden="true" /></div></header>
    <section className="search-page" aria-labelledby="search-title">
      <span className="search-eyebrow">SEARCH RESULTS</span>
      <h1 id="search-title">{initialQuery ? <>Results for <em>“{initialQuery}”</em></> : 'Search your learning'}</h1>
      <p className="search-count">{loading ? 'Searching across your courses...' : data ? `Found ${data.total} results across ${data.courseCount} courses` : 'Search across all your courses and lessons'}</p>
      <SearchBox value={input} onChange={setInput} onSubmit={submitSearch} />

      {loading ? <div className="search-state">Finding the most relevant lessons and video moments...</div> : error ? <div className="search-state search-error"><strong>{error}</strong><span>Check your search configuration or try again.</span></div> : !initialQuery ? <div className="search-state"><Search size={30} aria-hidden="true" /><strong>What do you want to learn?</strong><span>Try a concept, technology, or question.</span></div> : <>
        <div className="results-toolbar"><strong>{data?.total ?? 0} results</strong><label>Sort by <select value={sort} onChange={(event) => setSort(event.target.value as 'relevance' | 'type')}><option value="relevance">Most Relevant</option><option value="type">Result Type</option></select></label></div>
        <div className="results-list">{results.map((result) => result.type === 'video' ? <VideoCard key={result.id} result={result} /> : <LessonCard key={result.id} result={result} />)}</div>
        {!results.length && <div className="empty-search"><Search size={30} aria-hidden="true" /><div><strong>Can’t find what you’re looking for?</strong><span>Try different keywords or browse our full course catalog.</span></div><Link href="/">Browse all courses <ArrowRight size={17} aria-hidden="true" /></Link></div>}
      </>}
    </section>
  </main>
}