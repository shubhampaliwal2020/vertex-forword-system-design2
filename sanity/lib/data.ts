import { client } from './client'

export type CategorySummary = {
  _id: string
  title: string
  slug: { current: string }
  description?: string
}

export type InstructorSummary = {
  _id: string
  name: string
  slug: { current: string }
  expertise?: string[]
  bio?: unknown[]
  photo?: unknown
}

export type LessonSummary = {
  _id: string
  title: string
  slug: { current: string }
  videoUrl?: string
  thumbnail?: unknown
  duration?: string | number
  freePreview?: boolean
  studentCount?: number
  keyPoints?: string[]
  notes?: unknown[]
  proTip?: string
  course?: {
    _id: string
    title: string
    slug: { current: string }
    category?: CategorySummary | null
    instructor?: InstructorSummary | null
    modules?: ModuleSummary[]
  } | null
  resources?: Array<{
    _key: string
    type?: string
    title?: string
    description?: string
    url?: string
  }>
}

export type ModuleSummary = {
  _key: string
  title: string
  summary?: string
  lessons?: LessonSummary[]
}

export type CourseSummary = {
  _id: string
  title: string
  slug: { current: string }
  summary?: string
  duration?: string | number
  coverImage?: unknown
  level?: string
  price?: string
  popular?: boolean
  studentCount?: number
  category?: CategorySummary | null
  instructor?: InstructorSummary | null
  modules?: ModuleSummary[]
  learningOutcomes?: Array<{
    _key: string
    icon?: string
    title?: string
    description?: string
  }>
}

const courseListQuery = `
  *[_type == "course"] | order(title asc) {
    _id,
    title,
    slug,
    summary,
    duration,
    coverImage,
    level,
    price,
    popular,
    studentCount,
    category->{_id, title, slug, description},
    instructor->{_id, name, slug, expertise, bio, photo},
    learningOutcomes,
    modules[]{
      _key,
      title,
      summary,
      lessons[]->{
        _id,
        title,
        slug,
        videoUrl,
        thumbnail,
        duration,
        freePreview,
        studentCount,
        keyPoints,
        notes,
        proTip,
        resources
      }
    }
  }
`

const courseBySlugQuery = `
  *[_type == "course" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    summary,
    duration,
    coverImage,
    level,
    price,
    popular,
    studentCount,
    category->{_id, title, slug, description},
    instructor->{_id, name, slug, expertise, bio, photo},
    learningOutcomes,
    modules[]{
      _key,
      title,
      summary,
      lessons[]->{
        _id,
        title,
        slug,
        videoUrl,
        thumbnail,
        duration,
        freePreview,
        studentCount,
        keyPoints,
        notes,
        proTip,
        resources
      }
    }
  }
`

const lessonBySlugQuery = `
  *[_type == "lesson" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    videoUrl,
    thumbnail,
    duration,
    freePreview,
    studentCount,
    notes,
    keyPoints,
    proTip,
    resources,
    "course": *[_type == "course" && references(^._id)][0] {
      _id,
      title,
      slug,
      category->{_id, title, slug},
      instructor->{_id, name, slug, photo, expertise, bio},
      modules[]{
        _key,
        title,
        summary,
        lessons[]->{_id, title, slug, duration}
      }
    }
  }
`

const instructorBySlugQuery = `
  *[_type == "instructor" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    expertise,
    bio,
    photo
  }
`

const categoryListQuery = `
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    slug,
    description
  }
`

export async function getCourses(): Promise<CourseSummary[]> {
  return client.fetch(courseListQuery)
}

export async function getCourseBySlug(slug: string): Promise<CourseSummary | null> {
  return client.fetch(courseBySlugQuery, {slug})
}

export async function getLessonBySlug(slug: string): Promise<LessonSummary | null> {
  return client.fetch(lessonBySlugQuery, {slug})
}

export async function getInstructorBySlug(slug: string): Promise<InstructorSummary | null> {
  return client.fetch(instructorBySlugQuery, {slug})
}

export async function getCategories(): Promise<CategorySummary[]> {
  return client.fetch(categoryListQuery)
}
