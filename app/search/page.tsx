import SearchResults from './SearchResults'

export default async function SearchPage({searchParams}: {searchParams: Promise<{q?: string | string[]}>}) {
  const params = await searchParams
  const rawQuery = params.q
  const query = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery
  const normalizedQuery = query?.trim() ?? ''
  return <SearchResults key={normalizedQuery} initialQuery={normalizedQuery} />
}