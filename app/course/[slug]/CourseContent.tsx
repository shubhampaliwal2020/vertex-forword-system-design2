'use client'

import Link from 'next/link'
import { ChevronDown, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import posthog from 'posthog-js'
import type { ModuleSummary } from '../../../sanity/lib/data'

function durationInMinutes(duration?: string | number) {
  if (typeof duration === 'number') return Math.round(duration / 60)
  if (!duration) return 0

  const hours = duration.match(/(\d+)h/)?.[1]
  const minutes = duration.match(/(\d+)m/)?.[1]
  return (hours ? Number(hours) * 60 : 0) + (minutes ? Number(minutes) : 0)
}

function formatDuration(minutes: number) {
  if (!minutes) return 'Lesson'
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`
}

type CourseContentProps = {
  modules: ModuleSummary[]
  courseId: string
}

export default function CourseContent({modules, courseId}: CourseContentProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  function toggleModule(moduleKey: string, moduleIndex: number) {
    const expanded = !expandedModules.has(moduleKey)
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
      posthog.capture('course_module_toggled', {
        course_id: courseId,
        module_index: moduleIndex,
        expanded,
      })
    }
    setExpandedModules((current) => {
      const next = new Set(current)
      if (next.has(moduleKey)) next.delete(moduleKey)
      else next.add(moduleKey)
      return next
    })
  }

  function toggleAll() {
    const expanded = !allExpanded
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
      posthog.capture('course_content_toggled', { course_id: courseId, expanded })
    }
    setExpandedModules(() =>
      expanded ? new Set(modules.map((module, index) => module._key ?? `${courseId}-${index}`)) : new Set(),
    )
  }

  const allExpanded = modules.length > 0 && expandedModules.size === modules.length

  return (
    <>
      <div className="module-list" role="list">
        {modules.map((module, index) => {
          const moduleKey = module._key ?? `${courseId}-${index}`
          const isExpanded = expandedModules.has(moduleKey)
          const lessons = module.lessons ?? []
          const moduleDuration = formatDuration(lessons.reduce((total, lesson) => total + durationInMinutes(lesson.duration), 0))

          return (
            <div className={`module-item ${isExpanded ? 'expanded' : ''}`} key={moduleKey} role="listitem">
              <div className="module-row">
                <div className="module-number">{index + 1}</div>
                <button
                  type="button"
                  className="module-toggle"
                  aria-expanded={isExpanded}
                  aria-controls={`module-lessons-${moduleKey}`}
                  onClick={() => toggleModule(moduleKey, index + 1)}
                >
                  <span className="module-copy">
                    <span className="module-title">{module.title}</span>
                    <span className="module-description">{module.summary}</span>
                  </span>
                  <span className="module-duration">{moduleDuration}</span>
                  <ChevronDown className="toggle-icon" aria-hidden="true" />
                </button>
              </div>

              {isExpanded && (
                <div className="module-lessons" id={`module-lessons-${moduleKey}`}>
                  {lessons.length ? lessons.map((lesson, lessonIndex) => (
                    <Link className="module-lesson" href={`/lesson/${lesson.slug.current}`} key={lesson._id} onClick={() => { if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST) posthog.capture('course_lesson_opened', { course_id: courseId, module_index: index + 1, lesson_index: lessonIndex + 1, lesson_slug: lesson.slug.current }) }}>
                      <span className="lesson-index">{index + 1}.{lessonIndex + 1}</span>
                      <span className="lesson-title">{lesson.title}</span>
                      <span className="lesson-duration">{lesson.duration ?? 'Lesson'}</span>
                      <PlayCircle className="lesson-play" aria-hidden="true" />
                    </Link>
                  )) : (
                    <p className="module-empty">Lessons will appear here when they are added.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button type="button" className="show-more-button" onClick={toggleAll} aria-expanded={allExpanded}>
        {allExpanded ? 'Collapse all modules' : `Show all ${modules.length} modules`}
        <ChevronDown className={`arrow ${allExpanded ? 'rotated' : ''}`} aria-hidden="true" />
      </button>
    </>
  )
}
