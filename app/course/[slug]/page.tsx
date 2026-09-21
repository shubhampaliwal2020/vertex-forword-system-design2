import Link from 'next/link'
import { ArrowRight, Bell, Bookmark, Clock3, Gauge, Layers3, Sparkles } from 'lucide-react'
import { getCourseBySlug } from '../../../sanity/lib/data'
import CourseContent from './CourseContent'
import { fallbackCourses } from '../fallbackData'

function VertexMark() {
  return <Sparkles className="vertex-mark" aria-hidden="true" strokeWidth={2.4} />
}

function OutcomeIcon({ type }: { type: string }) {
  const common = 'outcome-icon'

  if (type === 'stack') {
    return <span className={`${common} stack`} aria-hidden="true"><span /><span /><span /></span>
  }

  if (type === 'data') {
    return <span className={`${common} barrel`} aria-hidden="true"><span className="barrel-top" /></span>
  }

  if (type === 'clock') {
    return <span className={`${common} clock`} aria-hidden="true" />
  }

  return <span className={`${common} cloud`} aria-hidden="true" />
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = (await getCourseBySlug(slug)) ?? fallbackCourses[slug] ?? fallbackCourses['nextjs-for-production']
  const fallbackCourse = fallbackCourses[slug] ?? fallbackCourses['nextjs-for-production']
  const courseDuration = course.duration ?? fallbackCourse.duration ?? 'Course duration unavailable'
  const moduleCount = Array.isArray(course.modules) ? course.modules.length : 0
  const studentText = course.studentCount ? `${course.studentCount.toLocaleString()} students` : '2.1k students'
  const outcomes = course.learningOutcomes ?? []
  const lessons = Array.isArray(course.modules) && course.modules.length ? course.modules[0]?.lessons ?? [] : []
  const firstLessonSlug = lessons[0]?.slug?.current ?? fallbackCourse.modules?.[0]?.lessons?.[0]?.slug.current ?? 'data-fetching-caching'
  const courseMark = slug === 'docker-essentials' ? 'D' : slug === 'typescript-deep-dive' ? 'TS' : 'N'

  return (
    <main className="course-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Vertex home">
          <VertexMark />
          <strong>Vertex</strong>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/">Courses</Link>
          <Link href="/">My Learning</Link>
        </nav>

        <div className="header-actions">
          <button className="icon-button" type="button" aria-label="Notifications">
            <Bell size={20} strokeWidth={1.8} />
          </button>
          <button className="avatar" type="button" aria-label="Profile" />
        </div>
      </header>

      <div className="course-page-shell">
        <nav className="detail-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">All Courses</Link>
          <span className="crumb-separator">›</span>
          <span>{course.title}</span>
        </nav>

        <section className="course-hero">
          <div className="course-hero-media">
            <div className={`course-hero-mark course-mark-${slug}`}>{courseMark}</div>
          </div>

          <div className="course-hero-copy">
            <span className="popular-badge">POPULAR</span>
            <h1>{course.title}</h1>
            <p>{course.summary}</p>

            <div className="course-meta-row">
              <span><Gauge className="meta-icon" aria-hidden="true" />{course.level}</span>
              <span><Clock3 className="meta-icon" aria-hidden="true" />{courseDuration}</span>
              <span><Layers3 className="meta-icon" aria-hidden="true" />{moduleCount} modules</span>
              <span><svg viewBox="0 0 24 24" className="meta-icon" aria-hidden="true"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 8a7 7 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="17" cy="8" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>{studentText}</span>
            </div>

            <div className="course-action-row">
              <Link href={`/lesson/${firstLessonSlug}`} className="primary-button compact">
                Continue Learning <ArrowRight className="arrow" aria-hidden="true" />
              </Link>
              <button type="button" className="secondary-button">
                <Bookmark size={18} aria-hidden="true" /> Bookmarks
              </button>
            </div>
          </div>
        </section>

        <section className="learning-section" aria-labelledby="learning-title">
          <h2 id="learning-title">What you&apos;ll learn</h2>

          <div className="outcomes-grid">
            {outcomes.map((outcome) => (
              <article key={outcome._key} className="outcome-card">
                <div className="outcome-icon-wrap">
                  <OutcomeIcon type={outcome.icon ?? 'stack'} />
                </div>
                <div>
                  <h3>{outcome.title}</h3>
                  <p>{outcome.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" aria-labelledby="content-title">
          <div className="content-header">
            <h2 id="content-title">Course Content</h2>
            <span>{moduleCount} modules <span className="dot">•</span> {courseDuration}</span>
          </div>

          <CourseContent modules={course.modules ?? []} courseId={course._id} />
        </section>

        <div className="course-progress-bar-wrap">
          <div className="progress-copy">
            <span className="progress-label">Your Progress</span>
            <strong>35%</strong>
            <div className="progress-track"><span style={{ width: '35%' }} /></div>
          </div>
          <Link href={`/lesson/${firstLessonSlug}`} className="primary-button compact">Continue Learning <ArrowRight className="arrow" aria-hidden="true" /></Link>
        </div>
      </div>
    </main>
  )
}
