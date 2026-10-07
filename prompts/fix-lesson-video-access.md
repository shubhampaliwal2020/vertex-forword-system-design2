# Restore Lesson Video Playback

## Goal
Diagnose and fix why lesson videos no longer appear, while keeping public course and lesson pages accessible and preserving the Clerk and Sanity security boundaries.

## Skills and guidance read
- `clerk` skill router: route to the installed Clerk SDK patterns if any auth code needs changing.
- `sanity-best-practices`: keep video playback on the streaming provider and Sanity reads on the server.
- Installed Next.js 16 Proxy and authentication guides.
- Root `AGENTS.md`: lesson pages are public unless explicitly gated; video playback uses the provider embed.

## Existing code inspected
- `proxy.ts` calls `clerkMiddleware()` without route protection rules; lessons are currently public.
- `app/layout.tsx` wraps the app with `ClerkProvider`.
- `app/lesson/[slug]/page.tsx` passes Sanity `lesson.videoUrl` to `LessonPlayer`.
- `app/lesson/[slug]/LessonPlayer.tsx` builds a validated YouTube embed URL and shows an unavailable state when the URL is missing or unsupported.
- `sanity/lib/data.ts` catches Sanity read errors and returns `null` for lesson reads.
- `app/course/fallbackData.ts` defines local lessons without video URLs.
- The last observed runtime failure was `connect EACCES` to the Sanity API; this is an outbound network failure, not a Clerk authorization response.
- `.env.local` has the expected Clerk and Sanity variable names; secret values were not inspected or logged.

## Decisions and assumptions
- Do not gate public lesson pages or weaken authentication.
- Treat Sanity connectivity and provider URL resolution as separate causes; retain the specific missing/unsupported-video UI when content has no playable URL.
- Do not fabricate or attach an unrelated video URL to fallback lessons.
- Preserve the existing YouTube URL allowlist and start-time behavior unless a concrete regression is found.
- If implementation cannot restore playback because the configured machine cannot reach Sanity, report the exact network or credential check the project owner must resolve rather than masking the failure as an auth bug.

## Expected files
- `sanity/lib/data.ts` only if a concrete error-handling defect is found.
- `app/lesson/[slug]/LessonPlayer.tsx` only if an actual valid URL format is rejected.
- `proxy.ts` or Clerk configuration only if a real redirect/protection failure is reproduced.
- `prompts/fix-lesson-video-access.md`.

## Security considerations
- Never print or commit `.env.local`, Clerk keys, Sanity tokens, or request headers.
- Keep lesson video URLs parsed and restricted to supported provider hosts before creating an iframe.
- Keep Sanity reads on the server and preserve public access to catalog and lesson routes.

## Acceptance criteria
- Public lesson routes do not redirect to Clerk sign-in.
- A lesson with a valid Sanity YouTube URL renders its inline provider iframe.
- A Sanity network failure is identified separately from auth failure and does not fabricate a video.
- Missing or unsupported URLs show the existing graceful player state.

## Checks
- Run TypeScript and targeted lint checks for changed files.
- Run the production build if route, proxy, config, or server modules change.
- Manually open a seeded lesson route; verify its iframe, then open it signed out to confirm public access.
- Verify Sanity API reachability from the same environment if live lesson data still cannot load.
