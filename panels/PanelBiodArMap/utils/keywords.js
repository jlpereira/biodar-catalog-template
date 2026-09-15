import { makeAPIRequest } from '@/utils'
import { ASSERTED_DISTRIBUTION } from '@/constants/objectTypes'
import { MOCK_KEYWORD_TRANSLATIONS } from './keywordTranslations.mock'

const CHUNK_SIZE = 200
const PER_PAGE = 500

export const UNCATEGORIZED_KEYWORD = {
  id: 'uncategorized',
  labelKey: 'panel.map.legend.no_keyword',
  color: null,
  translations: {}
}

function chunk(items, size) {
  const chunks = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

function byVocabularyOrder(a, b) {
  return a.id - b.id
}

function assertedBases(feature) {
  const base = feature.properties?.base || []

  return base.filter(
    (item) => item.type === ASSERTED_DISTRIBUTION && !item.is_absent
  )
}

function translationsFor(term) {
  const translations = Object.fromEntries(
    (term.alternate_values || [])
      .filter(
        (value) =>
          value.alternate_value_object_attribute === 'name' &&
          value.language?.alpha_2
      )
      .map((value) => [value.language.alpha_2, value.value])
  )

  return Object.keys(translations).length
    ? translations
    : MOCK_KEYWORD_TRANSLATIONS[term.name] || {}
}

function normalize(term) {
  return {
    id: term.id,
    name: term.name,
    color: term.css_color || null,
    translations: translationsFor(term)
  }
}

async function fetchTags(ids, { signal }) {
  const responses = await Promise.all(
    chunk(ids, CHUNK_SIZE).map((tagObjectIds) =>
      makeAPIRequest.get('/tags', {
        params: {
          tag_object_id: tagObjectIds,
          tag_object_type: [ASSERTED_DISTRIBUTION],
          per: PER_PAGE
        },
        signal
      })
    )
  )

  return responses.flatMap(({ data }) => data)
}

async function fetchKeywords({ signal }) {
  const { data } = await makeAPIRequest.get('/controlled_vocabulary_terms', {
    params: {
      type: ['Keyword'],
      per: PER_PAGE,
      extend: ['alternate_values']
    },
    signal
  })

  return data.filter((term) => term.type === 'Keyword').map(normalize)
}

export function keywordLabel(keyword, locale) {
  return keyword.translations?.[locale] || keyword.name
}

export async function attachKeywords(features, { signal } = {}) {
  const baseIds = new Set()

  features.forEach((feature) => {
    assertedBases(feature).forEach((base) => baseIds.add(base.id))
  })

  if (!baseIds.size) return []

  let tags = []
  let keywords = []

  try {
    tags = await fetchTags([...baseIds], { signal })
    keywords = await fetchKeywords({ signal })
  } catch (e) {
    return []
  }

  const keywordsById = new Map(keywords.map((keyword) => [keyword.id, keyword]))
  const keywordIdsByBaseId = new Map()

  tags.forEach(({ tag_object_id, keyword_id }) => {
    if (!keywordsById.has(keyword_id)) return

    const current = keywordIdsByBaseId.get(tag_object_id) || []

    if (!current.includes(keyword_id)) {
      current.push(keyword_id)
    }

    keywordIdsByBaseId.set(tag_object_id, current)
  })

  const used = new Map()
  let hasUncategorized = false

  features.forEach((feature) => {
    const ids = new Set()

    assertedBases(feature).forEach((base) => {
      const keywordIds = keywordIdsByBaseId.get(base.id)

      if (keywordIds?.length) {
        keywordIds.forEach((id) => ids.add(id))
      } else {
        hasUncategorized = true
      }
    })

    if (!ids.size) return

    const featureKeywords = [...ids]
      .map((id) => keywordsById.get(id))
      .sort(byVocabularyOrder)

    feature.properties.keywords = featureKeywords
    featureKeywords.forEach((keyword) => used.set(keyword.id, keyword))
  })

  if (!used.size) return []

  const legend = [...used.values()].sort(byVocabularyOrder)

  return hasUncategorized ? [...legend, UNCATEGORIZED_KEYWORD] : legend
}
