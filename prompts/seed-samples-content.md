# Seed Vertex sample course content

## Goal

Populate Sanity with realistic sample content for the Vertex learning catalog and cross-course search. The dataset should include categories, instructors, at least 10 programming and development courses, and lessons connected through embedded course modules and lesson references.

## Content included

The supplied `seed.ndjson` contains 141 Sanity documents:

- 6 categories covering Web Development, AI Engineering, Backend & Infrastructure, Data, Languages, and Security.
- 5 instructors with names, photos, expertise, and Portable Text bios.
- 10 courses covering Next.js, React performance, TypeScript, AI applications, retrieval-augmented generation, Python/data work, Docker/Kubernetes, backend architecture, SQL/Postgres, and web security.
- 120 lessons with titles, slugs, YouTube URLs, durations, thumbnails, notes, key points, pro tips, and resources.

The supplied `videos.json` contains 120 video metadata records keyed by lesson slug. These are imported as `video` documents with their YouTube ID, title, channel, duration, search query, and lesson-slug key.

## Relationship rules

- Each course owns an ordered `modules` array.
- Each module contains an ordered `lessons` array of references.
- Every lesson reference resolves to an imported lesson document.
- The total lesson references across all course modules is 120, matching the 120 lesson documents.
- Lesson references are unique across the course catalog.
- A lesson does not store its parent course; course membership is represented by the module references.

## Existing implementation files

### Sanity schema and data access

- `sanity/schemaTypes/courseType.ts` - course document schema with metadata, outcomes, instructor/category references, and embedded modules.
- `sanity/schemaTypes/moduleType.ts` - embedded module object with title, summary, and lesson references.
- `sanity/schemaTypes/lessonType.ts` - lesson schema with video, notes, key points, resources, and display metadata.
- `sanity/schemaTypes/instructorType.ts` - instructor profile schema.
- `sanity/schemaTypes/categoryType.ts` - category schema.
- `sanity/schemaTypes/index.ts` - registered schema types.
- `sanity/lib/data.ts` - server-side GROQ queries for courses, lessons, instructors, and categories.

### Course and lesson routes

- `app/page.tsx` - catalog page that lists courses from Sanity.
- `app/course/[slug]/page.tsx` - course detail route with outcomes, metadata, modules, and Continue Learning navigation.
- `app/course/[slug]/CourseContent.tsx` - expandable module and lesson list.
- `app/course/fallbackData.ts` - local fallback course and lesson data when Sanity content is unavailable.
- `app/lesson/[slug]/page.tsx` - lesson detail route with course context, lesson metadata, notes, resources, and navigation.

## Import procedure

1. Import the provided seed export with the Sanity CLI and replacement semantics:

   `npx sanity datasets import seed.ndjson --dataset production --replace`

2. Convert only the existing records in `videos.json` to temporary CLI-compatible NDJSON input and import them as `video` documents. Do not edit either source file.

3. Verify the document counts with Sanity CLI queries:

   - Categories: 6
   - Instructors: 5
   - Courses: 10
   - Lessons: 120
   - Videos: 120

4. Verify relationship integrity by comparing all lesson `_ref` values inside course modules with lesson `_id` values.

## Acceptance criteria

- Sanity contains at least 10 usable courses for the catalog.
- Courses cover programming, web development, AI, data, backend, infrastructure, and security topics.
- Every course has one or more modules and lessons.
- Every module lesson reference resolves to an existing lesson.
- No lesson reference is missing or duplicated across courses.
- The home catalog, course pages, lesson pages, and cross-course search can read the seeded content through the existing server-side data layer.
- `seed.ndjson` and `videos.json` remain unchanged.

## Checks

- Run the Sanity CLI import commands.
- Query each document type count after import.
- Compare module lesson references with lesson document IDs.
- Open the catalog, representative course routes, and representative lesson routes.
- Run `npm run lint` and `npm run build` after application changes.
