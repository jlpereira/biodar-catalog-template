<template>
  <div class="bg-base-foreground min-h-full">
    <div class="px-4">
      <div class="container mx-auto pt-10 pb-6">
        <h1 class="text-3xl font-bold tracking-tight text-base-content">
          {{ $t('references.title') }}
        </h1>

        <p
          v-if="!isLoading && references.length"
          class="mt-2 text-sm text-base-soft"
        >
          {{
            activeCount
              ? $t('references.summary_filtered', {
                  shown: filtered.length,
                  total: references.length
                })
              : $t('references.summary', { total: references.length })
          }}
        </p>
      </div>
    </div>

    <LetterIndex
      ref="letterIndex"
      :letters="navLetters"
      :available="usedLetters"
      :active="activeLetter"
      :label="$t('references.index')"
      @select="scrollToLetter"
    >
      <template #actions>
        <FilterToggle
          :label="$t('references.filters.title')"
          :expanded="showFilters"
          :count="activeCount"
          @toggle="showFilters = !showFilters"
        />
      </template>

      <template #panel>
        <ReferenceFilters
          v-show="showFilters"
          v-model:citation="citation"
          v-model:author="author"
          v-model:year-start="yearStart"
          v-model:year-end="yearEnd"
          :bounds="bounds"
          :active-count="activeCount"
          @reset="reset"
        />
      </template>
    </LetterIndex>

    <div
      class="container mx-auto box-border py-8 bg-base-foreground border-base-border border border-t-0"
    >
      <VSpinner
        v-if="isLoading"
        full-screen
      />

      <div
        v-else-if="error"
        class="px-12 text-sm"
      >
        <p class="text-danger">
          {{ $t('references.error', { message: error }) }}
        </p>
        <VButton
          class="mt-3 py-2"
          primary
          @click="loadReferences"
        >
          {{ $t('references.retry') }}
        </VButton>
      </div>

      <p
        v-else-if="!references.length"
        class="px-12 text-base-soft text-sm"
      >
        {{ $t('references.empty') }}
      </p>

      <div
        v-else-if="!filtered.length"
        class="px-12 text-sm"
      >
        <p class="text-base-soft">
          {{ $t('references.filters.no_matches') }}
        </p>

        <VButton
          class="mt-3"
          outline
          @click="reset"
        >
          {{ $t('references.filters.reset') }}
        </VButton>
      </div>

      <section
        v-for="letter in usedLetters"
        :key="letter"
        :id="`letter-${letter}`"
        class="mb-10"
        :style="{ scrollMarginTop: `${indexOffset}px` }"
      >
        <div class="bg-primary text-primary-content w-min px-4 pl-8 py-0.5">
          <span class="text-sm leading-none">{{ letter }}</span>
        </div>

        <ul class="mt-6 space-y-3 px-16">
          <li
            v-for="source in groups[letter]"
            :key="source.id"
            class="pl-5 relative text-base-content leading-relaxed text-sm"
          >
            <span
              class="absolute left-0 top-[0.55em] w-2 h-2 bg-accent rounded-full"
            />
            <template v-if="source.author">
              <span class="font-medium mr-1 uppercase">
                {{ source.author }}{{ source.year ? `. ${source.year}` : '' }}.
              </span>
              <span v-html="source.title" />
            </template>
            <span
              v-else
              v-html="source.cached"
            />
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { makeAPIRequest } from '@/utils'
import LetterIndex from '../components/LetterIndex.vue'
import FilterToggle from '../components/FilterToggle.vue'
import ReferenceFilters from '../components/ReferenceFilters.vue'
import { useLetterIndex } from '../composables/useLetterIndex.js'
import { useReferenceFilters } from '../composables/useReferenceFilters.js'

const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']

const PER_PAGE = 500

const CONCURRENT_REQUESTS = 4

const isLoading = ref(false)
const error = ref(null)
const references = ref([])

function fetchPage(page) {
  return makeAPIRequest.get('/sources', {
    params: {
      in_project: true,
      page,
      per: PER_PAGE
    }
  })
}

async function loadReferences() {
  isLoading.value = true
  error.value = null
  references.value = []

  try {
    const firstPage = await fetchPage(1)
    const totalPages = Number(firstPage.headers['pagination-total-pages']) || 1
    const sources = [...firstPage.data]

    for (let page = 2; page <= totalPages; page += CONCURRENT_REQUESTS) {
      const batch = []

      for (
        let offset = 0;
        offset < CONCURRENT_REQUESTS && page + offset <= totalPages;
        offset++
      ) {
        batch.push(fetchPage(page + offset))
      }

      const responses = await Promise.all(batch)

      responses.forEach((response) => sources.push(...response.data))
    }

    references.value = sources
  } catch (e) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

// Closed by default: the alphabet is the primary way into this page, and the
// filters are there for the reader who already knows what they are after.
const showFilters = ref(false)

const {
  citation,
  author,
  yearStart,
  yearEnd,
  bounds,
  filtered,
  activeCount,
  reset
} = useReferenceFilters(references)

function authorKey(source) {
  return source.cached_author_string || source.author || source.cached || ''
}

function firstLetter(source) {
  const letter = authorKey(source)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .charAt(0)
    .toUpperCase()

  return ALPHABET.includes(letter) ? letter : '#'
}

const groups = computed(() => {
  const sorted = [...filtered.value].sort(
    (a, b) =>
      authorKey(a).localeCompare(authorKey(b), 'es') ||
      String(a.year ?? '').localeCompare(String(b.year ?? ''))
  )

  return sorted.reduce((acc, source) => {
    const letter = firstLetter(source)

    acc[letter] = acc[letter] || []
    acc[letter].push(source)

    return acc
  }, {})
})

const navLetters = computed(() =>
  groups.value['#'] ? [...ALPHABET, '#'] : ALPHABET
)

const usedLetters = computed(() =>
  navLetters.value.filter((letter) => groups.value[letter])
)

const letterIndex = useTemplateRef('letterIndex')

const {
  activeLetter,
  offset: indexOffset,
  scrollToLetter
} = useLetterIndex(usedLetters, letterIndex)

onMounted(loadReferences)
</script>
