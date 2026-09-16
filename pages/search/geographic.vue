<template>
  <div class="bg-base-foreground min-h-full">
    <div class="px-4 border border-base-border border">
      <div class="container mx-auto pt-10 pb-6">
        <h1 class="text-3xl font-bold tracking-tight text-base-content">
          {{ $t('search.geographic.title') }}
        </h1>

        <p class="mt-2 max-w-2xl text-sm text-base-soft">
          {{ $t('search.geographic.subtitle') }}
        </p>
      </div>
    </div>

    <div class="px-4">
      <div class="container mx-auto">
        <!-- One panel, split down the middle: the map and the inventory it
             produces are one tool, not two widgets. From lg it takes exactly
             the room left between the header and the footer, so its borders run
             from one to the other and the page itself never scrolls; below lg
             it stacks and the page scrolls as usual. -->
        <div class="border border-base-border border-t-0 bg-base-foreground">
          <!-- What the header, the title and the footer take is measured rather
               than hard-coded: all three change with the locale, the logo and
               any wrapping of the header menu. -->
          <div
            ref="panel"
            :style="{ '--panel-chrome': `${panelChrome}px` }"
            class="grid lg:h-[calc(100vh_-_var(--panel-chrome,0px))] lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
          >
            <div
              class="min-w-0 border-b border-base-border p-3 lg:min-h-0 lg:border-b-0 lg:border-r py-8"
            >
              <!-- jsvectormap sizes itself from this wrapper; giving the
                   height to the ref'd element instead makes it collapse. The
                   map keeps its own size — only the panel stretches — but it
                   gives way when the panel is shorter than it is. -->
              <div
                class="h-[380px] overflow-hidden sm:h-[460px] lg:h-[760px] lg:max-h-full"
              >
                <div ref="mapContainer" />
              </div>
            </div>

            <div class="flex min-w-0 flex-col lg:min-h-0">
              <div class="shrink-0 border-b border-base-border px-6 py-4">
                <!-- Only a subdivision needs its country above it. Uruguay is
                     picked as a country, so the eyebrow would just repeat the
                     heading. -->
                <p
                  v-if="selectedRegion?.stateProvince"
                  class="text-xs font-medium uppercase tracking-wider text-base-soft"
                >
                  {{ selectedRegion.country }}
                </p>

                <h2 class="text-lg font-semibold text-base-content">
                  {{ regionLabel }}
                </h2>

                <p
                  v-if="selectedRegion && !isLoading && !error && otus.length"
                  class="mt-0.5 text-sm text-base-soft"
                >
                  {{ $t('search.geographic.count', { total: otus.length }) }}
                </p>
              </div>

              <!-- The list is what scrolls, not the page: the map keeps its
                   place beside it however long the inventory runs. -->
              <div class="px-6 py-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                <div
                  v-if="isLoading"
                  class="h-64"
                >
                  <VSpinner />
                </div>

                <div
                  v-else-if="error"
                  class="text-sm"
                >
                  <p class="text-danger">
                    {{ $t('search.geographic.error', { message: error }) }}
                  </p>
                  <VButton
                    class="mt-3 py-2"
                    primary
                    @click="loadInventory"
                  >
                    {{ $t('search.retry') }}
                  </VButton>
                </div>

                <p
                  v-else-if="!selectedRegion"
                  class="text-base-soft text-sm"
                >
                  {{ $t('search.geographic.prompt') }}
                </p>

                <p
                  v-else-if="!otus.length"
                  class="text-base-soft text-sm"
                >
                  {{
                    $t('search.geographic.no_records', {
                      region:
                        selectedRegion.stateProvince || selectedRegion.country
                    })
                  }}
                </p>

                <!-- One section per pest-status keyword, worst first, every
                     one expanded in a single column: the point of the page is
                     to read the whole region at a glance. -->
                <div
                  v-else
                  class="space-y-6"
                >
                  <section
                    v-for="group in groups"
                    :key="group.keyword.id"
                  >
                    <h3
                      class="flex items-center gap-2 text-sm font-medium text-base-content"
                    >
                      <!-- The swatch carries the same colour the map paints the
                           region with, so the two readings line up. A keyword
                           with no colour of its own gets an outline instead. -->
                      <span
                        class="size-3 shrink-0 rounded-sm"
                        :class="
                          group.keyword.color
                            ? null
                            : 'border border-base-border'
                        "
                        :style="
                          group.keyword.color
                            ? { backgroundColor: group.keyword.color }
                            : null
                        "
                      />
                      {{ keywordLabel(group.keyword) }}
                    </h3>

                    <ul class="mt-2 space-y-1">
                      <li
                        v-for="otu in group.otus"
                        :key="otu.id"
                        class="text-sm leading-relaxed"
                      >
                        <RouterLink
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
                        </RouterLink>
                      </li>
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { makeAPIRequest } from '@/utils'
import {
  UNCATEGORIZED_KEYWORD,
  useRegionKeywords
} from '../composables/useRegionKeywords'
import 'jsvectormap/dist/jsvectormap.css'

const { t, te } = useI18n()

const URUGUAY_CODE = 'uruguay'

const THEME_FILLS = {
  light: {
    region: '#D3D3D3',
    uruguay: '#B7B7B7',
    selected: '#5B5B5B',
    stroke: '#FFFFFF'
  },
  dark: {
    region: '#3B4E62',
    uruguay: '#2A3A4B',
    selected: '#94A8B8',
    stroke: '#0E1C2E'
  }
}

const PER_PAGE = 500

const CONCURRENT_REQUESTS = 4

const mapContainer = ref(null)
const panel = ref(null)
const panelChrome = ref(0)
const selectedRegion = ref(null)
const selectedCode = ref(null)
const otus = ref([])
const isLoading = ref(false)
const error = ref(null)

const {
  keywordByOtuId,
  keywords,
  load: loadKeywords,
  reset: resetKeywords
} = useRegionKeywords()

let map = null
let themeObserver = null
let resizeObserver = null
let panelObserver = null

// Clicking a second region while the first is still in flight must not let the
// slower answer land on top of the newer one.
let controller = null

// Everything the panel has to share the viewport with: the site header and the
// page title above it, the footer below. Taking the top from the document
// rather than the viewport keeps it right when the page is already scrolled.
function measurePanel() {
  if (!panel.value) return

  const top = panel.value.getBoundingClientRect().top + window.scrollY
  const footer = document.querySelector('footer')?.offsetHeight || 0

  panelChrome.value = Math.round(top + footer)
}

function currentPalette() {
  const base = document.documentElement.classList.contains('dark')
    ? THEME_FILLS.dark
    : THEME_FILLS.light

  // Read the accent straight from the theme so the selected region matches
  // the rest of the site, in both light and dark.
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--tp-accent')
    .trim()

  return accent ? { ...base, selected: accent } : base
}

const regionLabel = computed(() => {
  const region = selectedRegion.value

  if (!region) return t('search.geographic.no_selection')

  return region.stateProvince || region.country
})

function paintRegions() {
  const palette = currentPalette()

  Object.entries(map.regions).forEach(([code, region]) => {
    const fill =
      code === selectedCode.value
        ? palette.selected
        : code === URUGUAY_CODE
          ? palette.uruguay
          : palette.region

    region.element.setStyle('fill', fill)
    region.element.setStyle('stroke', palette.stroke)
  })
}

function regionParams(region) {
  return region.stateProvince
    ? { 'dwc_occurrence_query[stateProvince]': region.stateProvince }
    : { 'dwc_occurrence_query[country]': region.country }
}

function fetchPage(params, page, signal) {
  return makeAPIRequest.get('/otus/inventory/alphabetical', {
    params: {
      'extend[]': 'taxon_name',
      ...params,
      page,
      per: PER_PAGE
    },
    signal
  })
}

async function fetchOtus(params, { signal }) {
  const firstPage = await fetchPage(params, 1, signal)
  const totalPages = Number(firstPage.headers['pagination-total-pages']) || 1
  const records = [...firstPage.data]

  for (let page = 2; page <= totalPages; page += CONCURRENT_REQUESTS) {
    const batch = []

    for (
      let offset = 0;
      offset < CONCURRENT_REQUESTS && page + offset <= totalPages;
      offset++
    ) {
      batch.push(fetchPage(params, page + offset, signal))
    }

    const responses = await Promise.all(batch)

    responses.forEach((response) => records.push(...response.data))
  }

  return records.filter((otu) => otu.taxon_name)
}

// The inventory stays the source of the list — it is the only endpoint that
// carries the formatted name — while the assertions behind it supply the
// keyword each OTU is filed under.
async function loadInventory() {
  if (!selectedRegion.value) return

  controller?.abort()
  controller = new AbortController()

  const { signal } = controller
  const params = regionParams(selectedRegion.value)

  isLoading.value = true
  error.value = null
  otus.value = []
  resetKeywords()

  try {
    const [records] = await Promise.all([
      fetchOtus(params, { signal }),
      loadKeywords(params, { signal })
    ])

    otus.value = records
  } catch (e) {
    if (signal.aborted) return

    error.value = e.message
  } finally {
    if (!signal.aborted) {
      isLoading.value = false
    }
  }
}

const groups = computed(() => {
  const byKeywordId = new Map()

  otus.value.forEach((otu) => {
    const keyword = keywordByOtuId.value.get(otu.id) || UNCATEGORIZED_KEYWORD
    const group = byKeywordId.get(keyword.id)

    if (group) {
      group.otus.push(otu)
    } else {
      byKeywordId.set(keyword.id, { keyword, otus: [otu] })
    }
  })

  // `keywords` is already in severity order, and the inventory arrives
  // alphabetical, so each group keeps that order without sorting again.
  const ordered = keywords.value
    .map((keyword) => byKeywordId.get(keyword.id))
    .filter(Boolean)

  const uncategorized = byKeywordId.get(UNCATEGORIZED_KEYWORD.id)

  return uncategorized ? [...ordered, uncategorized] : ordered
})

// A keyword the scale knows but the locales have not been given a name for
// falls back to the vocabulary's own English term rather than a raw key.
function keywordLabel(keyword) {
  return te(keyword.labelKey) ? t(keyword.labelKey) : keyword.name
}

function selectRegion(code) {
  const name = map.regions[code]?.config?.name || code

  selectedRegion.value =
    code === URUGUAY_CODE
      ? { country: name, stateProvince: null }
      : { country: 'Argentina', stateProvince: name }

  selectedCode.value = code

  paintRegions()
  loadInventory()
}

onMounted(async () => {
  const { default: jsVectorMap } = await import('jsvectormap')

  await import('./maps/ar.js')

  map = new jsVectorMap({
    selector: mapContainer.value,
    map: 'ar_merc',
    backgroundColor: 'transparent',
    zoomOnScroll: false,
    zoomButtons: false,
    draggable: false,
    regionStyle: {
      initial: {
        strokeWidth: 0.5
      },
      hover: {
        fillOpacity: 0.7,
        cursor: 'pointer'
      }
    },
    onRegionClick(event, code) {
      selectRegion(code)
    },
    onRegionTooltipShow(event, tooltip) {
      tooltip.css({ backgroundColor: '#444444' })
    }
  })

  paintRegions()

  themeObserver = new MutationObserver(paintRegions)
  themeObserver.observe(document.documentElement, {
    attributeFilter: ['class']
  })

  resizeObserver = new ResizeObserver(() => map.updateSize())
  resizeObserver.observe(mapContainer.value)

  // The chrome only moves when the header, the title or the footer reflows,
  // and that always comes with a body resize.
  panelObserver = new ResizeObserver(measurePanel)
  panelObserver.observe(document.body)

  measurePanel()
})

onBeforeUnmount(() => {
  controller?.abort()
  panelObserver?.disconnect()
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  try {
    map?.destroy()
  } catch (e) {}
})
</script>
