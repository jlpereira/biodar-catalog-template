<template>
  <div class="bg-base-background min-h-full">
    <div
      class="sticky top-0 z-10 bg-base-foreground border-b border-base-border"
    >
      <div
        class="container mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2"
      >
        <h1 class="text-base font-semibold text-base-content">
          {{ $t('search.alphabetically.title') }}
        </h1>
        <nav
          class="flex flex-wrap gap-1"
          :aria-label="$t('search.alphabetically.index')"
        >
          <template
            v-for="letter in navLetters"
            :key="letter"
          >
            <a
              v-if="groups[letter]"
              :href="`#letter-${letter}`"
              class="w-6 h-6 flex items-center justify-center rounded text-sm text-base-content hover:bg-primary hover:text-primary-content"
              @click.prevent="scrollToLetter(letter)"
            >
              {{ letter }}
            </a>
            <span
              v-else
              class="w-6 h-6 flex items-center justify-center rounded text-sm text-base-soft opacity-40 cursor-default"
              aria-disabled="true"
            >
              {{ letter }}
            </span>
          </template>
        </nav>
      </div>
    </div>

    <div
      class="container mx-auto py-8 bg-base-foreground border-base-border border border-t-0"
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
          {{ $t('search.alphabetically.error', { message: error }) }}
        </p>
        <VButton
          class="mt-3 py-2"
          primary
          @click="loadNames"
        >
          {{ $t('search.retry') }}
        </VButton>
      </div>

      <p
        v-else-if="!otus.length"
        class="px-12 text-base-soft text-sm"
      >
        {{ $t('search.alphabetically.empty') }}
      </p>

      <section
        v-for="letter in usedLetters"
        :key="letter"
        :id="`letter-${letter}`"
        class="scroll-mt-20 mb-10"
      >
        <div class="bg-primary text-primary-content w-min px-4 pl-8 py-0.5">
          <span class="text-sm leading-none">{{ letter }}</span>
        </div>

        <ul class="mt-6 px-12 md:columns-2 md:gap-12">
          <li
            v-for="otu in groups[letter]"
            :key="otu.id"
            class="pl-5 relative text-sm leading-relaxed break-inside-avoid"
          >
            <router-link
              :to="`/otus/${otu.id}`"
              class="text-base-content hover:text-accent"
            >
              <span v-html="otu.taxon_name.cached_html" />
              <span
                v-if="otu.taxon_name.cached_author_year"
                class="ml-1"
              >
                {{ otu.taxon_name.cached_author_year }}
              </span>
            </router-link>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { makeAPIRequest } from '@/utils'

const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']

const PER_PAGE = 500

const CONCURRENT_REQUESTS = 4

const isLoading = ref(false)
const error = ref(null)
const otus = ref([])

function fetchPage(page) {
  return makeAPIRequest.get('/otus', {
    params: {
      'extend[]': 'taxon_name',
      'taxon_name_query[rank]': 'species',
      'taxon_name_query[validity]': true,
      page,
      per: PER_PAGE
    }
  })
}

async function loadNames() {
  isLoading.value = true
  error.value = null
  otus.value = []

  try {
    const firstPage = await fetchPage(1)
    const totalPages = Number(firstPage.headers['pagination-total-pages']) || 1
    const records = [...firstPage.data]

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

      responses.forEach((response) => records.push(...response.data))
    }

    otus.value = records.filter((otu) => otu.taxon_name)
  } catch (e) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

function nameKey(otu) {
  return otu.taxon_name.cached || ''
}

function firstLetter(otu) {
  const letter = nameKey(otu)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .charAt(0)
    .toUpperCase()

  return ALPHABET.includes(letter) ? letter : '#'
}

const groups = computed(() => {
  const sorted = [...otus.value].sort((a, b) =>
    nameKey(a).localeCompare(nameKey(b), 'es')
  )

  return sorted.reduce((acc, otu) => {
    const letter = firstLetter(otu)

    acc[letter] = acc[letter] || []
    acc[letter].push(otu)

    return acc
  }, {})
})

const navLetters = computed(() =>
  groups.value['#'] ? [...ALPHABET, '#'] : ALPHABET
)

const usedLetters = computed(() =>
  navLetters.value.filter((letter) => groups.value[letter])
)

function scrollToLetter(letter) {
  document
    .getElementById(`letter-${letter}`)
    ?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(loadNames)
</script>
