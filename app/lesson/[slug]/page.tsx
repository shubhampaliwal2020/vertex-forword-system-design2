import Link from 'next/link'
import { ArrowLeft, ArrowRight, Bell, BookOpenText, CheckCircle2, Clock3, Gauge, Lightbulb, Sparkles, Users } from 'lucide-react'
import { PortableText } from 'next-sanity'
import { getLessonBySlug } from '../../../sanity/lib/data'
import { fallbackCourses, fallbackLessons } from '../../course/fallbackData'
import { LessonPlayer, LessonTabs, ResourceLink } from './LessonPlayer'

function VertexMark() {
  return <Sparkles className="vertex-mark" aria-hidden="true" strokeWidth={2.4} />
}

export default async function LessonPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ start?: string }> }) {
  const { slug } = await params
  const { start } = await searchParams
  const startSeconds = start && /^\d+$/.test(start) ? Number(start) : 0
  const lesson = (await getLessonBySlug(slug)) ?? fallbackLessons[slug] ?? fallbackLessons['data-fetching-caching']
  const studentText = lesson.studentCount ? `${lesson.studentCount.toLocaleString()} students` : '3,426 students'
  const keyPoints = lesson.keyPoints ?? []
  const resources = lesson.resources ?? []
  const courseSlug = lesson.course?.slug?.current ?? 'nextjs-for-production'
  const courseTitle = lesson.course?.title ?? 'Next.js for Production'
  const fallbackCourse = fallbackCourses[courseSlug]
  const courseModules = lesson.course?.modules ?? fallbackCourse?.modules
  const lessonList = courseModules?.flatMap((module, moduleIndex) =>
    (module.lessons ?? []).map((courseLesson, lessonIndex) => ({
      number: moduleIndex + 1,
      title: courseLesson.title,
      duration: courseLesson.duration ?? 'Lesson',
      active: courseLesson.slug.current === lesson.slug.current,
      label: `${moduleIndex + 1}.${lessonIndex + 1}`,
      slug: courseLesson.slug.current,
    })),
  ) ?? [{number: 1, title: lesson.title, duration: lesson.duration ?? 'Lesson', active: true, label: '1.1', slug: lesson.slug.current}]
  const activeModuleIndex = courseModules?.findIndex((module) => module.lessons?.some((courseLesson) => courseLesson.slug.current === lesson.slug.current)) ?? 0
  const moduleCount = courseModules?.length ?? 1
  const activeLessonIndex = courseModules?.[activeModuleIndex]?.lessons?.findIndex((courseLesson) => courseLesson.slug.current === lesson.slug.current) ?? 0
  const activeListIndex = lessonList.findIndex((item) => item.active)
  const lessonSummary = `Learn the practical concepts behind ${lesson.title} and apply them in a production-ready project.`
  const courseMark = courseSlug === 'docker-essentials' ? 'D' : courseSlug === 'typescript-deep-dive' ? 'TS' : 'N'

  return (
    <main className="lesson-shell">
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

      <div className="lesson-page-shell">
        <nav className="detail-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">All Courses</Link>
          <span className="crumb-separator">›</span>
          <Link href={`/course/${courseSlug}`}>{courseTitle}</Link>
          <span className="crumb-separator">›</span>
          <span>{lesson.title}</span>
        </nav>

        <div className="lesson-layout">
          <aside className="lesson-sidebar">
            <div className="sidebar-course-card">
              <div className={`sidebar-brand-mark sidebar-mark-${courseSlug}`}>{courseMark}</div>
              <div className="sidebar-course-meta">
                <strong>{courseTitle}</strong>
                <span>35% complete</span>
              </div>
            </div>

            <div className="module-group">
              <div className="module-picker">
                <span>Module {activeModuleIndex + 1} of {moduleCount}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>

              {lessonList.map((item) => (
                <Link href={`/lesson/${item.slug}`} key={item.slug} className={`lesson-item ${item.active ? 'active' : ''}`}>
                  <div className="lesson-item-main">
                    <span className="lesson-number">{item.label}</span>
                    <span className="lesson-label">{item.title}</span>
                  </div>
                  <div className="lesson-item-meta">
                    <span>{item.duration}</span>
                    {item.active ? <span className="now-playing">Now playing</span> : null}
                  </div>
                </Link>
              ))}
            </div>
          </aside>

          <section className="lesson-main">
            <div className="lesson-header-row">
              <span className="lesson-tag">LESSON {activeModuleIndex + 1}.{activeLessonIndex + 1}</span>
              <button className="square-button" type="button" aria-label="Open lesson in fullscreen">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>

            <h1>{lesson.title}</h1>
            <p className="lesson-summary">{lessonSummary}</p>

            <div className="meta-row">
              <span><Clock3 className="meta-icon" aria-hidden="true" />{lesson.duration}</span>
              <span><Gauge className="meta-icon" aria-hidden="true" />Intermediate</span>
              <span><Users className="meta-icon" aria-hidden="true" />{studentText}</span>
            </div>

            <div className="video-panel" aria-label="Video player">
              <LessonPlayer videoUrl={lesson.videoUrl} title={lesson.title} startSeconds={startSeconds} />
            </div>

            <LessonTabs
              content={<>
                <h2>Overview</h2>
                <p>{lessonSummary}</p>

              <div className="key-points">
                <h3>In this lesson you will:</h3>
                <ul>
                  {keyPoints.map((point) => (
                    <li key={point}><CheckCircle2 aria-hidden="true" />{point}</li>
                  ))}
                </ul>
              </div>

              <div className="pro-tip-box">
                <div className="tip-badge"><Lightbulb aria-hidden="true" /></div>
                <div>
                  <h3>Pro Tip</h3>
                  <p>{lesson.proTip ?? 'Use the patterns from this lesson to keep your implementation clear, reliable, and easy to maintain.'}</p>
                </div>
              </div>

              <div className="resources-panel">
                <h3>Resources</h3>
                <div className="resource-grid">
                  {resources.map((resource) => (
                    <ResourceLink key={resource.title} url={resource.url}>
                      <div className="resource-icon"><BookOpenText size={18} /></div>
                      <div className="resource-copy">
                        <span className="resource-type">{resource.type}</span>
                        <strong>{resource.title}</strong>
                        <p>{resource.description}</p>
                      </div>
                    </ResourceLink>
                  ))}
                </div>
              </div>
              </>}
              notes={<div className="portable-notes"><h2>Notes</h2>{lesson.notes?.length ? <PortableText value={lesson.notes as never} /> : <p>No notes have been added for this lesson yet.</p>}</div>}
            />

            <div className="lesson-nav-row">
              <Link href={lessonList[activeListIndex - 1] ? `/lesson/${lessonList[activeListIndex - 1].slug}` : `/course/${courseSlug}`} className="nav-button prev-btn">
                <ArrowLeft aria-hidden="true" /> Previous Lesson
              </Link>

              <div className="mini-course-info">
                <span>{lessonList[activeListIndex + 1]?.title ?? lesson.title}</span>
                <small>{lessonList[activeListIndex + 1]?.duration ?? lesson.duration ?? 'Lesson'}</small>
              </div>

              <Link href={lessonList[activeListIndex + 1] ? `/lesson/${lessonList[activeListIndex + 1].slug}` : `/course/${courseSlug}`} className="nav-button next-btn">
                Next Lesson <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
