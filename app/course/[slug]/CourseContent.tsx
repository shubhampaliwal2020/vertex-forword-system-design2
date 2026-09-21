'use client'

import Link from 'next/link'
import { ChevronDown, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import type { ModuleSummary } from '../../../sanity/lib/data'

type CourseContentProps = {
  modules: ModuleSummary[]
  courseId: string
}

export default function CourseContent({modules, courseId}: CourseContentProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  function toggleModule(moduleKey: string) {
    setExpandedModules((current) => {
      const next = new Set(current)
      if (next.has(moduleKey)) next.delete(moduleKey)
      else next.add(moduleKey)
      return next
    })
  }

  function toggleAll() {
    setExpandedModules((current) =>
      current.size === modules.length
        ? new Set()
        : new Set(modules.map((module, index) => module._key ?? `${courseId}-${index}`)),
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

          return (
            <div className={`module-item ${isExpanded ? 'expanded' : ''}`} key={moduleKey} role="listitem">
              <div className="module-row">
                <div className="module-number">{index + 1}</div>
                <button
                  type="button"
                  className="module-toggle"
                  aria-expanded={isExpanded}
                  aria-controls={`module-lessons-${moduleKey}`}
                  onClick={() => toggleModule(moduleKey)}
                >
                  <span className="module-copy">
                    <span className="module-title">{module.title}</span>
                    <span className="module-description">{module.summary}</span>
                  </span>
                  <span className="module-duration">{lessons.length ? `${lessons.length} lessons` : '1 lesson'}</span>
                  <ChevronDown className="toggle-icon" aria-hidden="true" />
                </button>
              </div>

              {isExpanded && (
                <div className="module-lessons" id={`module-lessons-${moduleKey}`}>
                  {lessons.length ? lessons.map((lesson, lessonIndex) => (
                    <Link className="module-lesson" href={`/lesson/${lesson.slug.current}`} key={lesson._id}>
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
