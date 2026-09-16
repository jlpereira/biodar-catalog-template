import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Fallback for the height of the sticky bar, used until it has been measured.
const DEFAULT_OFFSET = 80

// Absorbs sub-pixel scrolling — scrollIntoView lands the heading at 80.x,
// which a bare `> 80` would reject.
const SECTION_SLACK = 8

/**
 * Drives an A–Z index over a list of `<section id="letter-X">` headings:
 * reports which one the reader is on, and scrolls to one on demand.
 *
 * The bar is sticky, so the line at which a heading counts as "the one being
 * read" is its own bottom edge. That height is not a constant — the filter
 * panel lives inside the bar — so it is measured rather than assumed, and
 * published as `offset` for the sections to use as their scroll margin.
 *
 * @param {import('vue').Ref<string[]>} usedLetters letters that have a section
 * @param {import('vue').Ref<object|null>} [header] the sticky bar, as a ref to
 *   its component or element; omit it to keep the default offset
 * @returns {{ activeLetter: import('vue').Ref<string|null>, offset: import('vue').Ref<number>, scrollToLetter: (letter: string) => void }}
 */
export function useLetterIndex(usedLetters, header = ref(null)) {
  const activeLetter = ref(null)
  const offset = ref(DEFAULT_OFFSET)

  let resizeObserver = null

  function headerElement() {
    const target = header.value

    return target?.$el ?? target ?? null
  }

  function measureHeader() {
    const element = headerElement()

    if (element) offset.value = element.getBoundingClientRect().height
  }

  function observeHeader() {
    const element = headerElement()

    if (!element || typeof ResizeObserver === 'undefined') return

    resizeObserver?.disconnect()
    resizeObserver = new ResizeObserver(() => {
      measureHeader()
      updateActiveLetter()
    })
    resizeObserver.observe(element)
  }

  let sections = []
  let ticking = false
  let pinnedLetter = null

  // Any scroll the reader starts themselves hands control back to the spy.
  function releasePin() {
    if (!pinnedLetter) return

    pinnedLetter = null
    updateActiveLetter()
  }

  function refreshSections() {
    sections = usedLetters.value
      .map((letter) => document.getElementById(`letter-${letter}`))
      .filter(Boolean)

    updateActiveLetter()
  }

  function updateActiveLetter() {
    if (pinnedLetter || !sections.length) return

    const { innerHeight, scrollY } = window
    const { scrollHeight } = document.documentElement
    const remaining = scrollHeight - (innerHeight + scrollY)

    // The page runs out of scroll before the last headings can reach the line,
    // so the tail needs help: the very end always belongs to the last section...
    if (remaining <= 2) {
      activeLetter.value = sections.at(-1).id.replace('letter-', '')

      return
    }

    // ...and within the final screenful the line drops to the middle of the
    // viewport, so the tail still advances one letter at a time instead of
    // jumping straight to the last.
    const limit =
      remaining < innerHeight ? innerHeight / 2 : offset.value + SECTION_SLACK

    let current = sections[0]

    for (const section of sections) {
      if (section.getBoundingClientRect().top > limit) break

      current = section
    }

    activeLetter.value = current.id.replace('letter-', '')
  }

  function onScroll() {
    if (ticking) return

    ticking = true
    requestAnimationFrame(() => {
      updateActiveLetter()
      ticking = false
    })
  }

  function scrollToLetter(letter) {
    // Mark it right away; the scroll handler would otherwise only catch up
    // partway through the smooth scroll. Near the foot of the page the target
    // cannot reach the line at all, and the pin keeps the end-of-page fallback
    // from stealing the mark.
    activeLetter.value = letter
    pinnedLetter = letter

    document
      .getElementById(`letter-${letter}`)
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  watch(usedLetters, async () => {
    await nextTick()
    refreshSections()
  })

  onMounted(() => {
    measureHeader()
    observeHeader()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    window.addEventListener('wheel', releasePin, { passive: true })
    window.addEventListener('touchstart', releasePin, { passive: true })
    window.addEventListener('keydown', releasePin)
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()

    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    window.removeEventListener('wheel', releasePin)
    window.removeEventListener('touchstart', releasePin)
    window.removeEventListener('keydown', releasePin)
  })

  return { activeLetter, offset, scrollToLetter }
}
