import {createClient} from 'next-sanity'
import {ensureUniqueArrayKeys, type KeyedArrayItem} from './video-array-keys'

type Chapter = KeyedArrayItem & {label: string}
type Chunk = KeyedArrayItem & {text: string}
type VideoDocument = {
  _id: string
  _rev: string
  chapters?: Chapter[]
  chunks?: Chunk[]
}
type VideoUpdate = VideoDocument & {
  chapters: Array<Chapter & {_key: string}>
  chunks: Array<Chunk & {_key: string}>
  chapterKeysToAdd: number
  chunkKeysToAdd: number
}

const videosNeedingKeysQuery = `
  *[_type == "video" && (
    count(chapters[!defined(_key)]) > 0 || count(chunks[!defined(_key)]) > 0
  )] {
    _id,
    _rev,
    chapters,
    chunks
  }
`

function parseOptions(argv: string[]) {
  return {
    write: argv.includes('--write'),
    confirmProduction: argv.includes('--confirm-production'),
    dataset: argv.find((argument) => argument.startsWith('--dataset='))?.slice('--dataset='.length),
  }
}

function keysToAdd(items: Array<{_key?: string}> = []) {
  const seen = new Set<string>()
  let count = 0
  for (const item of items) {
    const key = item._key?.trim()
    if (!key || seen.has(key)) count += 1
    else seen.add(key)
  }
  return count
}

function batches<T>(items: T[], size: number) {
  const result: T[][] = []
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size))
  return result
}

export async function backfillVideoKeys(argv = process.argv.slice(2)) {
  const options = parseOptions(argv)
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = options.dataset || process.env.NEXT_PUBLIC_SANITY_DATASET
  const token = process.env.SANITY_API_WRITE_TOKEN

  if (!projectId || !dataset || !token) {
    throw new Error('Set NEXT_PUBLIC_SANITY_PROJECT_ID, the target dataset, and SANITY_API_WRITE_TOKEN.')
  }
  if (options.write && dataset === 'production' && !options.confirmProduction) {
    throw new Error('Production writes require both --write and --confirm-production.')
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-02-19',
    token,
    useCdn: false,
  })
  const documents = await client.fetch<VideoDocument[]>(videosNeedingKeysQuery)
  const updates: VideoUpdate[] = documents.map((document) => {
    const chapters = document.chapters || []
    const chunks = document.chunks || []
    return {
      ...document,
      chapters: ensureUniqueArrayKeys('chapter', chapters, (chapter) => chapter.label),
      chunks: ensureUniqueArrayKeys('chunk', chunks, (chunk) => chunk.text),
      chapterKeysToAdd: keysToAdd(chapters),
      chunkKeysToAdd: keysToAdd(chunks),
    }
  }).filter((document) => document.chapterKeysToAdd + document.chunkKeysToAdd > 0)

  const chapterCount = updates.reduce((count, document) => count + document.chapterKeysToAdd, 0)
  const chunkCount = updates.reduce((count, document) => count + document.chunkKeysToAdd, 0)
  console.log(`Target dataset: ${dataset}`)
  console.log(`Documents needing keys: ${updates.length}`)
  console.log(`Chapter items: ${chapterCount}; transcript chunks: ${chunkCount}`)

  if (!options.write) return console.log('Dry run complete. No documents were written.')
  if (!updates.length) return console.log('No documents need key backfill.')

  for (const batch of batches(updates, 10)) {
    const transaction = client.transaction()
    batch.forEach((document) => {
      transaction.patch(document._id, (patch) => patch.ifRevisionId(document._rev).set({
        chapters: document.chapters,
        chunks: document.chunks,
      }))
    })
    await transaction.commit()
  }
  console.log(`Backfilled keys on ${updates.length} documents.`)
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/backfill-video-keys.ts')) {
  backfillVideoKeys().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}