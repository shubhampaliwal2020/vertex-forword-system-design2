import {createHash} from 'node:crypto'

export type KeyedArrayItem = {_key?: string; startSeconds: number}

export function ensureUniqueArrayKeys<T extends KeyedArrayItem>(
  kind: 'chapter' | 'chunk',
  items: T[],
  contentOf: (item: T) => string,
) {
  const used = new Set<string>()

  return items.map((item, index) => {
    let key = item._key?.trim()
    if (!key || used.has(key)) {
      const digest = createHash('sha256')
        .update(`${kind}\0${item.startSeconds}\0${contentOf(item)}\0${index}`)
        .digest('hex')
        .slice(0, 16)
      key = `${kind}-${digest}`
      let suffix = 1
      while (used.has(key)) key = `${kind}-${digest}-${suffix++}`
    }
    used.add(key)
    return {...item, _key: key}
  })
}