<template>
  <div class="bg-base-background min-h-full">
    <div class="px-4">
      <div class="container mx-auto pt-10 pb-6">
        <h1 class="text-3xl font-bold tracking-tight text-base-content">
          {{ $t('search.geographic.title') }}
        </h1>

        <p class="mt-2 max-w-2xl text-sm text-base-soft">
          {{ $t('search.geographic.subtitle') }}
        </p>
      </div>
    </div>

    <div class="px-4 pb-14">
      <div class="container mx-auto">
        <!-- One panel, split down the middle: the map and the inventory it
             produces are one tool, not two widgets. No overflow-hidden on the
             wrapper — it would turn into a scroll container and kill the
             sticky map; the SVG is clipped inside the sticky element instead. -->
        <div class="rounded-2xl border border-base-border bg-base-foreground">
          <div class="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div
              class="min-w-0 border-b border-base-border lg:border-b-0 lg:border-r"
            >
              <div class="p-3 lg:sticky lg:top-4">
                <!-- jsvectormap sizes itself from this wrapper; giving the
                     height to the ref'd element instead makes it collapse. -->
                <div
                  class="h-[380px] overflow-hidden sm:h-[460px] lg:h-[560px]"
                >
                  <div ref="mapContainer" />
                </div>
              </div>
            </div>

            <div class="min-w-0">
              <div class="border-b border-base-border px-6 py-4">
                <p
                  v-if="selectedRegion"
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

              <div class="px-6 py-5">
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

                <ul
                  v-else
                  class="space-y-1"
                >
                  <li
                    v-for="otu in otus"
                    :key="otu.id"
                    class="text-sm leading-relaxed"
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
import 'jsvectormap/dist/jsvectormap.css'

const { t } = useI18n()

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
const selectedRegion = ref(null)
const selectedCode = ref(null)
const otus = ref([])
const isLoading = ref(false)
const error = ref(null)

let map = null
let themeObserver = null
let resizeObserver = null

function currentPalette() {
  const base = document.documentElement.classList.contains('dark')
    ? THEME_FILLS.dark
    : THEME_FILLS.light

  // Read the accent straight from the theme so the selected province matches
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

function fetchPage(page) {
  return makeAPIRequest.get('/otus/inventory/alphabetical', {
    params: {
      'extend[]': 'taxon_name',
      ...regionParams(selectedRegion.value),
      page,
      per: PER_PAGE
    }
  })
}

async function loadInventory() {
  if (!selectedRegion.value) return

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
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  map?.destroy()
})
</script>
