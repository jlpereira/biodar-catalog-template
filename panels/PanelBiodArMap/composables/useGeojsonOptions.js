import { DISABLE_LAYER_OPTIONS } from '@/components/Map/constants'
import { computed, ref } from 'vue'
import geojsonDefaultOptions from '@/components/Map/utils/geojsonOptions'
import * as Shape from '@/components/Map/shapes'

function isAssertedDistributionStyle(style) {
  return (
    style === Shape.AssertedDistribution ||
    style?.color === Shape.AssertedDistribution.color
  )
}

export function makeGeojsonOptions({ popupElement, popupItem }) {
  return function (args) {
    const defaultOptions = geojsonDefaultOptions(args)

    return {
      onEachFeature: (feature, layer) => {
        layer.pm.setOptions(DISABLE_LAYER_OPTIONS)
        layer.pm.disable()

        if (feature.properties.base.some(({ label }) => Boolean(label))) {
          layer.on('popupopen', () => (popupItem.value = feature.properties))
          layer.on('popupclose', () => (popupItem.value = null))

          layer.bindPopup(popupElement.value, {
            minWidth: 400,
            maxWidth: 400
          })
        }
      },

      style: (feature) => {
        const defaultStyle = defaultOptions.style(feature)
        const [keyword] = feature.properties.keywords || []

        if (!keyword?.color || !isAssertedDistributionStyle(defaultStyle)) {
          return defaultStyle
        }

        return {
          ...defaultStyle,
          color: keyword.color,
          fillColor: keyword.color
        }
      }
    }
  }
}

export function useGeojsonOptions({ popupElement }) {
  const popupItem = ref(null)

  const geojsonOptions = computed(() =>
    makeGeojsonOptions({ popupElement, popupItem })
  )

  return {
    geojsonOptions,
    popupItem
  }
}
