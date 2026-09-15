import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Matches scroll-mt-20 on each section: once a heading has reached this line
// it counts as the one being read. The slack absorbs sub-pixel scrolling —
// scrollIntoView lands the heading at 80.x, which a bare `> 80` would reject.
const SECTION_OFFSET = 80
const SECTION_SLACK = 8

/**
 * Drives an A–Z index over a list of `<section id="letter-X">` headings:
 * reports which one the reader is on, and scrolls to one on demand.
 *
 * @param {import('vue').Ref<string[]>} usedLetters letters that have a section
 * @returns {{ activeLetter: import('vue').Ref<string|null>, scrollToLetter: (letter: string) => void }}
 */
export function useLetterIndex(usedLetters) {
  const activeLetter = ref(null)

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
      remaining < innerHeight ? innerHeight / 2 : SECTION_OFFSET + SECTION_SLACK

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
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    window.addEventListener('wheel', releasePin, { passive: true })
    window.addEventListener('touchstart', releasePin, { passive: true })
    window.addEventListener('keydown', releasePin)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    window.removeEventListener('wheel', releasePin)
    window.removeEventListener('touchstart', releasePin)
    window.removeEventListener('keydown', releasePin)
  })

  return { activeLetter, scrollToLetter }
}
