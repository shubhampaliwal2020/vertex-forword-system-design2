import type { CourseSummary, LessonSummary } from '../../sanity/lib/data'

const lesson = (id: string, title: string, slug: string, duration: string): LessonSummary => ({
  _id: id,
  title,
  slug: {current: slug},
  duration,
  studentCount: 1200,
  keyPoints: [
    `Understand the core ideas behind ${title}`,
    'Apply the pattern in a practical project',
    'Choose the right approach for production work',
  ],
  proTip: 'Start with the simplest working implementation, then improve it with the techniques from this course.',
  resources: [
    { _key: `${id}-resource`, type: 'Docs', title: `${title} documentation`, description: 'Reference material for this lesson.' },
  ],
  notes: [],
})

const nextLesson = lesson('next-lesson', 'Introduction to Next.js', 'nextjs-introduction', '45m')
const dockerLesson = lesson('docker-lesson', 'Containers and Images', 'docker-containers', '52m')
const typescriptLesson = lesson('typescript-lesson', 'Type System Foundations', 'typescript-foundations', '1h 04m')

const course = (
  id: string,
  title: string,
  slug: string,
  summary: string,
  level: string,
  duration: string,
  modules: Array<{_key: string; title: string; summary: string; lessons: LessonSummary[]}>,
  learningOutcomes: Array<{_key: string; icon: string; title: string; description: string}>,
): CourseSummary => ({
  _id: id,
  title,
  slug: {current: slug},
  summary,
  level,
  duration,
  studentCount: 2100,
  modules,
  learningOutcomes,
})

export const fallbackCourses: Record<string, CourseSummary> = {
  'nextjs-for-production': course(
    'fallback-nextjs',
    'Next.js for Production',
    'nextjs-for-production',
    'Build scalable, high-performance web applications with Next.js, best practices, and production-ready deployment strategies.',
    'Intermediate',
    '18h 24m',
    [
      {_key: 'next-module-1', title: 'Introduction to Next.js', summary: 'Understand the core features of Next.js and why it is the React framework.', lessons: [nextLesson]},
      {_key: 'next-module-2', title: 'Routing & Layouts', summary: 'Learn file-based routing, layouts, and nested routes.', lessons: [lesson('next-lesson-2', 'Routing & Layouts', 'nextjs-routing', '1h 12m')]},
      {_key: 'next-module-3', title: 'Data Fetching & Caching', summary: 'Fetch data efficiently and leverage caching for better performance.', lessons: [lesson('next-lesson-3', 'Data Fetching & Caching', 'data-fetching-caching', '1h 28m')]},
    ],
    [
      {_key: 'next-outcome-1', icon: 'stack', title: 'App Router Foundations', description: 'Master the App Router, layouts, loading states, and nested routing.'},
      {_key: 'next-outcome-2', icon: 'data', title: 'Data Fetching & Caching', description: 'Fetch data efficiently and leverage caching for better performance.'},
    ],
  ),
  'docker-essentials': course(
    'fallback-docker',
    'Docker Essentials',
    'docker-essentials',
    'Containerize applications and streamline your development workflow with repeatable, portable environments.',
    'Beginner',
    '10h 12m',
    [
      {_key: 'docker-module-1', title: 'Containers and Images', summary: 'Learn how images and containers work together.', lessons: [dockerLesson]},
      {_key: 'docker-module-2', title: 'Docker Compose', summary: 'Run multi-service applications locally with Compose.', lessons: [lesson('docker-lesson-2', 'Docker Compose Workflows', 'docker-compose', '1h 08m')]},
    ],
    [
      {_key: 'docker-outcome-1', icon: 'stack', title: 'Container Fundamentals', description: 'Build and run reliable containers for local development.'},
      {_key: 'docker-outcome-2', icon: 'cloud', title: 'Compose Workflows', description: 'Coordinate multiple services with readable configuration.'},
    ],
  ),
  'typescript-deep-dive': course(
    'fallback-typescript',
    'TypeScript Deep Dive',
    'typescript-deep-dive',
    'Go beyond the basics and write safer, more expressive code with TypeScript.',
    'Intermediate',
    '14h 36m',
    [
      {_key: 'typescript-module-1', title: 'Type System Foundations', summary: 'Build a strong mental model for TypeScript types.', lessons: [typescriptLesson]},
      {_key: 'typescript-module-2', title: 'Generics & Inference', summary: 'Create flexible APIs with generics and inference.', lessons: [lesson('typescript-lesson-2', 'Generics & Inference', 'typescript-generics', '1h 20m')]},
      {_key: 'typescript-module-3', title: 'Patterns for Large Apps', summary: 'Keep large TypeScript codebases safe and maintainable.', lessons: [lesson('typescript-lesson-3', 'Patterns for Large Apps', 'typescript-large-apps', '1h 32m')]},
    ],
    [
      {_key: 'typescript-outcome-1', icon: 'data', title: 'Safer APIs', description: 'Model application data clearly and catch mistakes early.'},
      {_key: 'typescript-outcome-2', icon: 'stack', title: 'Advanced Patterns', description: 'Use generics, inference, and reusable types with confidence.'},
    ],
  ),
}

export const fallbackLessons: Record<string, LessonSummary> = {}

Object.values(fallbackCourses).forEach((currentCourse) => {
  currentCourse.modules?.forEach((module) => {
    module.lessons?.forEach((currentLesson) => {
      fallbackLessons[currentLesson.slug.current] = {
        ...currentLesson,
        course: {
          _id: currentCourse._id,
          title: currentCourse.title,
          slug: currentCourse.slug,
        },
      }
    })
  })
})
