# Implement the Vertex Sanity content model and Studio

## Goal

Add the content schema and server-side Sanity data access for Vertex: course, module, lesson, instructor, and category; plus the Studio structure and a typed read-only data layer for fetching content from the project dataset.

## Instructions and sources reviewed

- `AGENTS.md` — requires a saved implementation prompt and approval before code changes.
- Existing project files in the workspace: `sanity.config.ts`, `sanity/schemaTypes/index.ts`, `sanity/structure.ts`, `sanity/lib/client.ts`, `sanity/lib/image.ts`, and the current schema files in `sanity/schemaTypes/`.
- Current app state: this repo has a minimal blog-like Sanity schema (`post`, `category`, `author`) and a server-side Sanity client already set up with `next-sanity`.

## Current state

- The project has the Sanity Studio configured and the env values populated.
- The schema includes only blog-style content and does not reflect the Vertex domain model.
- The app has no content model for courses, modules, lessons, or instructors, and no typed fetch layer for those document types.

## Decisions and assumptions

- Build the content model around the Vertex domain as described in `AGENTS.md`: `course`, `module` as an embedded object, `lesson`, `instructor`, and `category`.
- Keep the schema read-only and Studio-first; no write flows or progress storage are required in this task.
- Use Sanity document types and embedded objects rather than inventing custom data stores.
- Keep data access server side only. Client components should not directly access the dataset; the web app will consume a typed server helper.
- Preserve the existing Studio configuration and add only the necessary structure and schema types.
- Maintain compatibility with the current `sanity` v5 stack and `next-sanity` usage.

## Files expected to change

- `sanity/schemaTypes/courseType.ts` — new document type for courses
- `sanity/schemaTypes/lessonType.ts` — new document type for lessons
- `sanity/schemaTypes/instructorType.ts` — new document type for instructors
- `sanity/schemaTypes/moduleType.ts` — embedded object type for course modules
- `sanity/schemaTypes/index.ts` — add schema types to the exported list
- `sanity/structure.ts` — update Studio document navigation for the Vertex content model
- `sanity/lib/client.ts` — ensure a server-safe read client is exported
- `sanity/lib/data.ts` — new typed data access helpers for fetches (courses, lesson, instructor, category, course by slug, etc.)
- optional: `sanity/schemaTypes/blockContentType.ts` — keep or revise for lesson notes if needed

## Requirements

- Course document fields must include:
  - title, slug, summary, cover image, level, price, category reference, instructor reference, learning outcomes list, optional popular flag, student count, and ordered modules.
- Module object fields must include:
  - title, summary, and ordered lesson references.
- Lesson document fields must include:
  - title, slug, video URL, thumbnail/poster, duration, free preview flag, student count, notes as Portable Text, key points, optional pro tip, and resources list.
- Instructor document fields must include:
  - name, slug, photo, expertise, and bio.
- Category document fields must include:
  - title, slug, and description.
- The schema should use `defineField`, `defineType`, and `defineArrayMember` in Sanity v5 style.
- The Studio structure should expose course, lesson, instructor, and category documents in a logical order.
- The server-side read client should be isolated to server-only usage and should include a read helper that can be imported anywhere in the app.
- Data layer helpers should query the correct fields using GROQ and return typed objects with minimal data required by the Next.js app.

## Security considerations

- No secrets or write tokens are introduced here.
- Only read-only access is configured for the data layer.
- Keep all production dataset access on the server and never expose tokens or project-sensitive values to the client.

## Acceptance criteria

- The Studio exposes the Vertex content types and allows editing them in a sane, structured way.
- The schema reflects the app’s content model and relationships.
- The data layer successfully fetches course and lesson data using server-side Sanity queries.
- The project still builds successfully with the new schema and data layer.

## Checks to run

1. `npm run lint`
2. `npm run build`
3. Start the dev server and confirm the Studio loads the new document types without errors.

## Manual test steps

1. Open the Studio route and confirm the new document types are visible in the sidebar.
2. Create a category and instructor, then a course with a module containing lesson references.
3. Confirm the lesson can be saved with notes, key points, and resources.
4. Verify the data layer can fetch a course and a lesson by slug without runtime issues.
