<template>
  <div class="bg-base-background min-h-full">
    <div class="sticky top-0 z-10 bg-base-foreground shadow">
      <div
        class="container mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2"
      >
        <h1 class="text-base font-semibold text-base-content">References</h1>
        <nav
          class="flex flex-wrap gap-1"
          aria-label="Alphabetical Index"
        >
          <template
            v-for="letter in navLetters"
            :key="letter"
          >
            <a
              v-if="groups[letter]"
              :href="`#letter-${letter}`"
              class="w-7 h-7 flex items-center justify-center rounded text-sm font-semibold text-base-content hover:bg-primary hover:text-primary-content"
              @click.prevent="scrollToLetter(letter)"
            >
              {{ letter }}
            </a>
            <span
              v-else
              class="w-7 h-7 flex items-center justify-center rounded text-sm font-semibold text-base-soft opacity-40 cursor-default"
              aria-disabled="true"
            >
              {{ letter }}
            </span>
          </template>
        </nav>
      </div>
    </div>

    <div class="container mx-auto py-8 bg-base-foreground shadow">
      <VSpinner
        v-if="isLoading"
        full-screen
      />

      <div
        v-else-if="error"
        class="px-12 text-sm"
      >
        <p class="text-danger">
          No se pudieron cargar las referencias: {{ error }}
        </p>
        <VButton
          class="mt-3 py-2"
          primary
          @click="loadReferences"
        >
          Reintentar
        </VButton>
      </div>

      <p
        v-else-if="!references.length"
        class="px-12 text-base-soft text-sm"
      >
        No hay referencias para mostrar.
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

        <ul class="mt-6 space-y-3 px-16">
          <li
            v-for="source in groups[letter]"
            :key="source.id"
            class="pl-5 relative text-base-content leading-relaxed text-sm"
          >
            <span
              class="absolute left-0 top-[0.55em] w-2 h-2 bg-primary rounded-full"
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
import { computed, onMounted, ref } from 'vue'
import { makeAPIRequest } from '@/utils'

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
  const sorted = [...references.value].sort(
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

onMounted(loadReferences)

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
</script>
