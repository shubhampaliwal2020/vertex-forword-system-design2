# Fix Vercel Studio Environment Bundle

## Goal
Resolve the production runtime error `Missing environment variable: NEXT_PUBLIC_SANITY_DATASET` in the embedded Sanity Studio, then verify the Vertex home, search, and Studio routes on Vercel.

## Skills and guidance read
- `sanity-best-practices` and its Next.js integration reference.
- Installed Next.js environment-variable documentation at `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`.

## Code and configuration inspected
- `sanity.config.ts` imports `apiVersion`, `dataset`, and `projectId` from `sanity/env` and is a client config for `NextStudio`.
- `sanity/env.ts` reads the three `NEXT_PUBLIC_SANITY_*` values directly and throws when dataset or project ID is undefined.
- `app/studio/[[...tool]]/page.tsx` statically renders `NextStudio` with that config.
- `app/page.tsx` is the Vertex home page; `app/search/SearchResults.tsx` owns search UI.
- Vercel production env pull returned the expected public values: dataset `production`, project ID `5i69rblx`, API version `2025-02-19`. Secret values were not printed.
- A fresh production deployment still serves a Studio client error for both `/` and `/search`, despite Vercel reporting HTTP 200.

## Hypothesis and approach
The failure is in how the embedded Studio config is emitted into the client bundle, not in the stored Vercel values. First reproduce/discriminate this against the existing local production build and inspect the emitted Studio bundle. Make the smallest change that ensures only the public Sanity project ID, dataset, and API version are available to the Studio client at build time. Do not add secrets to client code, hardcode tokens, or weaken server/client boundaries. If evidence instead shows a Vercel project/build configuration issue, correct that configuration without unrelated source edits.

## Expected scope
Likely `sanity.config.ts` and/or `sanity/env.ts`; adjust another file only if the bundle check proves it is the owning surface. No visual restyling, schema changes, search behavior changes, or unrelated dependency updates.

## Security considerations
- Never expose `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`, Clerk secrets, or OpenAI keys in the browser.
- Keep Vercel Deployment Protection enabled unless separately authorized.
- Do not echo or commit secrets while validating deployment configuration.

## Acceptance criteria
- Production Studio initializes without missing-environment errors and targets the configured Sanity project and dataset.
- Production `/` renders Vertex, `/search?q=data+fetching` renders search, and `/studio` loads Studio.
- Client bundle contains no server-only token values.
- Existing server-side Sanity reads and local behavior remain intact.

## Checks
- Inspect generated client output from a production build for the Studio config values and absence of the missing-env throw.
- Run `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
- Deploy to Vercel production after validation; verify routes through a Vercel-protection-aware browser or `vercel curl` and check browser console errors.

## Manual test steps
1. Open `https://forward-mocha.vercel.app/` and confirm the Vertex home page appears.
2. Open `https://forward-mocha.vercel.app/search?q=data+fetching` and confirm results load without console errors.
3. Open `https://forward-mocha.vercel.app/studio` and confirm the Studio loads and shows Video intelligence.
4. Confirm Vercel Deployment Protection remains enabled unless the user explicitly chooses otherwise.
