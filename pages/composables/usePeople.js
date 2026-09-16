import { computed, unref } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Normalizes one of the people lists in config/authors.yml. A half-filled
 * entry (a bullet left in the file with no `name`) must not reach the page as
 * an empty row, and a missing key must read as an empty list so callers can
 * hide their section with `v-if`.
 *
 * @param {unknown} source list from __APP_ENV__, plain or reactive
 * @returns {import('vue').ComputedRef<object[]>}
 */
export function usePeople(source) {
  return computed(() => (unref(source) || []).filter((person) => person?.name))
}

/**
 * Reads a field that config/authors.yml allows in either form: a plain string,
 * or a map with one value per locale.
 *
 * @returns {(value: unknown) => string} reader bound to the active locale
 */
export function useLocalizedField() {
  const { locale } = useI18n()
  const { i18n } = __APP_ENV__

  return (value) => {
    if (!value || typeof value === 'string') {
      return value
    }

    return value[locale.value] || value[i18n?.fallback || 'en'] || ''
  }
}
