import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// The citations arrive as rendered HTML (scientific names come wrapped in
// <i>), so the tags have to go before anything is matched against them —
// otherwise typing "i" hits every italicised name in the project.
function stripTags(value) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ')
}

// Accent- and case-insensitive: someone typing "peron" should still find
// "Perón", the same way the A–Z index folds accents to pick a letter.
function normalize(value) {
  return stripTags(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function terms(value) {
  return normalize(value).split(/\s+/).filter(Boolean)
}

function toYear(value) {
  const year = Number(value)

  return Number.isInteger(year) ? year : null
}

/**
 * Filter state for the references list.
 *
 * Everything runs over the list already in memory — the page loads the whole
 * bibliography up front, so a filter is a computed property, not a request.
 *
 * @param {import('vue').Ref<object[]>} references every source in the project
 */
export function useReferenceFilters(references) {
  const route = useRoute()
  const router = useRouter()

  const citation = ref(route.query.query_term ?? '')
  const author = ref(route.query.author ?? '')

  // null until someone moves the range: the slider spans whatever years the
  // project actually has, and those are only known once the list has loaded.
  const yearRange = ref(
    toYear(route.query.year_start) || toYear(route.query.year_end)
      ? {
          start: toYear(route.query.year_start),
          end: toYear(route.query.year_end)
        }
      : null
  )

  // Normalizing 566 citations on every keystroke is wasteful; this recomputes
  // only when the list itself changes.
  const indexed = computed(() =>
    references.value.map((source) => ({
      source,
      citation: normalize(source.cached),
      author: normalize(source.cached_author_string || source.author),
      year: toYear(source.year)
    }))
  )

  const bounds = computed(() => {
    const years = indexed.value.map((entry) => entry.year).filter(Boolean)

    return years.length
      ? { min: Math.min(...years), max: Math.max(...years) }
      : null
  })

  const yearStart = computed({
    get: () => yearRange.value?.start ?? bounds.value?.min ?? 0,
    set: (value) => setYearRange({ start: value })
  })

  const yearEnd = computed({
    get: () => yearRange.value?.end ?? bounds.value?.max ?? 0,
    set: (value) => setYearRange({ end: value })
  })

  function setYearRange({ start, end }) {
    yearRange.value = {
      start: start ?? yearStart.value,
      end: end ?? yearEnd.value
    }
  }

  // A range that still spans every year filters nothing, so it does not count
  // as active and never hides the undated sources (see below).
  const isYearActive = computed(
    () =>
      !!yearRange.value &&
      !!bounds.value &&
      (yearStart.value > bounds.value.min || yearEnd.value < bounds.value.max)
  )

  const filtered = computed(() => {
    const citationTerms = terms(citation.value)
    const authorTerms = terms(author.value)
    const byYear = isYearActive.value

    if (!citationTerms.length && !authorTerms.length && !byYear) {
      return references.value
    }

    return indexed.value
      .filter((entry) => {
        // Every word has to appear somewhere in the citation, in any order,
        // so "darwin 1859" narrows instead of returning nothing.
        if (!citationTerms.every((term) => entry.citation.includes(term))) {
          return false
        }

        if (!authorTerms.every((term) => entry.author.includes(term))) {
          return false
        }

        // An undated source cannot satisfy a year range. Dropping it is the
        // honest answer, and it is why the range only bites once narrowed.
        if (byYear) {
          return (
            entry.year !== null &&
            entry.year >= yearStart.value &&
            entry.year <= yearEnd.value
          )
        }

        return true
      })
      .map((entry) => entry.source)
  })

  const activeCount = computed(
    () =>
      [
        terms(citation.value).length > 0,
        terms(author.value).length > 0,
        isYearActive.value
      ].filter(Boolean).length
  )

  function reset() {
    citation.value = ''
    author.value = ''
    yearRange.value = null
  }

  // Keep the address bar in step so a filtered view can be linked or reloaded.
  // Written straight to history rather than through the router: a router
  // navigation runs scrollBehavior, which would throw the reader back to the
  // top of the page on every keystroke.
  watch([citation, author, yearRange, isYearActive], () => {
    if (import.meta.env.SSR) return

    const query = {
      ...(citation.value ? { query_term: citation.value } : {}),
      ...(author.value ? { author: author.value } : {}),
      ...(isYearActive.value
        ? { year_start: yearStart.value, year_end: yearEnd.value }
        : {})
    }

    window.history.replaceState(
      window.history.state,
      '',
      router.resolve({ query }).href
    )
  })

  return {
    citation,
    author,
    yearStart,
    yearEnd,
    bounds,
    filtered,
    activeCount,
    reset
  }
}
