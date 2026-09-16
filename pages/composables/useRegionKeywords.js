import { ref } from 'vue'
import { makeAPIRequest } from '@/utils'

const ASSERTED_DISTRIBUTION = 'AssertedDistribution'

const PER_PAGE = 500

// Tag ids travel in the query string, so they go up in batches rather than one
// request per asserted distribution.
const CHUNK_SIZE = 200

// Worst first. The vocabulary's own ids are import order, not a scale —
// "Major pest of many crops" is id 18 and would otherwise sort last. The
// previous catalogue (biodar.unlp.edu.ar/naupactini) rendered three of these
// terms and fixes positions 1, 6 and 9; the rest fill the scale between them.
const SEVERITY_ORDER = [
  'Major pest of many crops',
  'Pest regularly of importance',
  'Pest occasionally of importance',
  'Pest occasionally of localized importance',
  'A regular minor pest',
  'An occasional minor pest',
  'Of very minor importance',
  'Few records of minimum damages',
  'No economic damages registered'
]

export const UNCATEGORIZED_KEYWORD = {
  id: 'uncategorized',
  name: null,
  color: null,
  labelKey: 'search.geographic.uncategorized'
}

// The vocabulary is project-wide, so it outlives any one region. Cached as the
// promise, not the result, so two regions picked in quick succession share a
// single request instead of racing.
let vocabularyRequest = null

function chunk(items, size) {
  const chunks = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

function normalize(term) {
  return {
    id: term.id,
    name: term.name,
    color: term.css_color || null,
    labelKey: `search.geographic.keywords.${term.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')}`
  }
}

function severityIndex(keyword) {
  const index = SEVERITY_ORDER.indexOf(keyword.name)

  // A keyword the scale doesn't know about lands after the ones it does,
  // in vocabulary order, rather than silently dropping out of the page.
  return index === -1 ? SEVERITY_ORDER.length + keyword.id : index
}

function fetchVocabulary() {
  if (!vocabularyRequest) {
    vocabularyRequest = makeAPIRequest
      .get('/controlled_vocabulary_terms', {
        params: {
          type: ['Keyword'],
          per: PER_PAGE
        }
      })
      .then(({ data }) =>
        data.filter((term) => term.type === 'Keyword').map(normalize)
      )
      .catch((e) => {
        vocabularyRequest = null
        throw e
      })
  }

  return vocabularyRequest
}

async function fetchAll(endpoint, params, { signal }) {
  const first = await makeAPIRequest.get(endpoint, {
    params: { ...params, page: 1, per: PER_PAGE },
    signal
  })

  const totalPages = Number(first.headers['pagination-total-pages']) || 1
  const records = [...first.data]

  for (let page = 2; page <= totalPages; page++) {
    const { data } = await makeAPIRequest.get(endpoint, {
      params: { ...params, page, per: PER_PAGE },
      signal
    })

    records.push(...data)
  }

  return records
}

async function fetchTags(assertedDistributionIds, { signal }) {
  const responses = await Promise.all(
    chunk(assertedDistributionIds, CHUNK_SIZE).map((ids) =>
      makeAPIRequest.get('/tags', {
        params: {
          tag_object_id: ids,
          tag_object_type: [ASSERTED_DISTRIBUTION],
          per: PER_PAGE
        },
        signal
      })
    )
  )

  return responses.flatMap(({ data }) => data)
}

/**
 * The pest-status keyword each OTU carries in one region.
 *
 * The keyword is tagged on the AssertedDistribution — the assertion that the
 * OTU is present there — so it is a property of the record in that region, not
 * of the OTU. The same OTU can read differently province by province.
 */
export function useRegionKeywords() {
  const keywordByOtuId = ref(new Map())
  const keywords = ref([])

  async function load(regionParams, { signal } = {}) {
    const [distributions, vocabulary] = await Promise.all([
      fetchAll('/asserted_distributions', regionParams, { signal }),
      fetchVocabulary()
    ])

    const otuDistributions = distributions.filter(
      (record) =>
        record.asserted_distribution_object_type === 'Otu' && !record.is_absent
    )

    const tags = otuDistributions.length
      ? await fetchTags(
          otuDistributions.map((record) => record.id),
          { signal }
        )
      : []

    const vocabularyById = new Map(vocabulary.map((term) => [term.id, term]))
    const keywordByDistributionId = new Map()

    tags.forEach(({ tag_object_id, keyword_id }) => {
      const keyword = vocabularyById.get(keyword_id)

      // A keyword only ranks an OTU when the scale places it; the vocabulary
      // also holds terms used for prose sections, which are not statuses.
      if (keyword && severityIndex(keyword) < SEVERITY_ORDER.length) {
        keywordByDistributionId.set(tag_object_id, keyword)
      }
    })

    const byOtuId = new Map()
    const used = new Map()

    otuDistributions.forEach((record) => {
      const keyword = keywordByDistributionId.get(record.id)

      if (!keyword) return

      const current = byOtuId.get(record.asserted_distribution_object_id)

      // An OTU with more than one assertion in the region keeps the most
      // severe of them, so it is listed once, under its worst status.
      if (!current || severityIndex(keyword) < severityIndex(current)) {
        byOtuId.set(record.asserted_distribution_object_id, keyword)
      }

      used.set(keyword.id, keyword)
    })

    keywordByOtuId.value = byOtuId
    keywords.value = [...used.values()].sort(
      (a, b) => severityIndex(a) - severityIndex(b)
    )
  }

  function reset() {
    keywordByOtuId.value = new Map()
    keywords.value = []
  }

  return {
    keywordByOtuId,
    keywords,
    load,
    reset
  }
}
