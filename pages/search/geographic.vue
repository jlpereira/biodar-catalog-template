<template>
  <div class="h-full">
    <div class="sticky top-0 z-10 bg-base-foreground shadow">
      <div
        class="container mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2"
      >
        <h1 class="text-base font-semibold text-base-content">
          {{ $t('search.geographic.title') }}
        </h1>
        <p class="text-sm text-base-soft">
          {{ $t('search.geographic.subtitle') }}
        </p>
      </div>
    </div>

    <div class="container mx-auto py-8 bg-base-foreground shadow h-full">
      <div class="grid md:grid-cols-2 gap-8 pr-0">
        <div class="h-[600px]">
          <div ref="mapContainer" />
        </div>

        <div>
          <div class="bg-primary text-primary-content px-4 py-1">
            <ul class="flex flex-wrap items-center gap-x-2 text-sm">
              <li>
                {{
                  selectedRegion
                    ? selectedRegion.country
                    : $t('search.geographic.no_selection')
                }}
              </li>
              <li
                v-if="selectedRegion && selectedRegion.stateProvince"
                class="before:content-['/'] before:mr-2"
              >
                {{ selectedRegion.stateProvince }}
              </li>
            </ul>
          </div>

          <div class="mt-6">
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
                  region: selectedRegion.stateProvince || selectedRegion.country
                })
              }}
            </p>

            <ul v-else>
              <li
                v-for="otu in otus"
                :key="otu.id"
                class="pl-5 relative text-sm leading-relaxed"
              >
                <router-link
                  :to="`/otus/${otu.id}`"
                  class="text-base-content hover:text-primary"
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
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { makeAPIRequest } from '@/utils'
import 'jsvectormap/dist/jsvectormap.css'

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
  return document.documentElement.classList.contains('dark')
    ? THEME_FILLS.dark
    : THEME_FILLS.light
}

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
