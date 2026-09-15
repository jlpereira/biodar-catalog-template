<template>
  <div
    class="group relative"
    role="region"
    aria-roledescription="carousel"
    :aria-label="$t('home.gallery.label')"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="resume"
  >
    <div
      class="relative aspect-4/3 overflow-hidden rounded-2xl border border-base-border bg-base-muted shadow-md sm:aspect-16/9"
    >
      <div
        class="flex h-full w-full transition-transform duration-700 ease-out motion-reduce:transition-none"
        :style="{ transform: `translateX(-${current * 100}%)` }"
      >
        <figure
          v-for="(slide, index) in SLIDES"
          :key="slide.key"
          class="relative h-full w-full shrink-0"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${index + 1} / ${SLIDES.length}`"
          :aria-hidden="index !== current"
        >
          <img
            :src="`${slide.src}&w=1200`"
            :srcset="`${slide.src}&w=800 800w, ${slide.src}&w=1200 1200w, ${slide.src}&w=1800 1800w`"
            sizes="(min-width: 1024px) 45vw, 100vw"
            :alt="$t(`home.gallery.slides.${slide.key}.alt`)"
            class="h-full w-full object-cover"
            :loading="index === 0 ? 'eager' : 'lazy'"
            :fetchpriority="index === 0 ? 'high' : 'low'"
            decoding="async"
            draggable="false"
          />

          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/85 via-black/45 to-transparent"
          />

          <figcaption class="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white">
            <p class="text-base font-semibold sm:text-lg">
              {{ $t(`home.gallery.slides.${slide.key}.title`) }}
            </p>
            <p class="mt-1 text-sm text-white/80">
              {{ $t(`home.gallery.slides.${slide.key}.caption`) }}
            </p>
          </figcaption>
        </figure>
      </div>

      <!-- Auto-advance progress -->
      <div
        aria-hidden="true"
        class="absolute inset-x-0 top-0 h-1 bg-white/20"
      >
        <div
          class="h-full bg-primary transition-[width] ease-linear motion-reduce:transition-none"
          :style="{
            width: `${progress}%`,
            transitionDuration: progress === 0 ? '0ms' : `${TICK_MS}ms`
          }"
        />
      </div>

      <button
        type="button"
        class="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/55 focus-visible:opacity-100 group-hover:opacity-100"
        :aria-label="$t('home.gallery.previous')"
        @click="go(current - 1)"
      >
        <span
          aria-hidden="true"
          class="text-lg leading-none"
          >&#8249;</span
        >
      </button>

      <button
        type="button"
        class="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/55 focus-visible:opacity-100 group-hover:opacity-100"
        :aria-label="$t('home.gallery.next')"
        @click="go(current + 1)"
      >
        <span
          aria-hidden="true"
          class="text-lg leading-none"
          >&#8250;</span
        >
      </button>
    </div>

    <div
      class="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
    >
      <div class="flex items-center gap-2">
        <button
          v-for="(slide, index) in SLIDES"
          :key="slide.key"
          type="button"
          class="h-2 rounded-full transition-all"
          :class="
            index === current
              ? 'w-6 bg-primary'
              : 'w-2 bg-base-border hover:bg-base-soft'
          "
          :aria-label="$t('home.gallery.go_to', { index: index + 1 })"
          :aria-current="index === current"
          @click="go(index)"
        />
      </div>

      <p class="text-xs text-base-soft">
        {{ $t('home.gallery.credit') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// Gallery images are pinned here on purpose: they are editorial, not data from
// the API. Swap the `id` values to change the gallery. Photos: Unsplash.
// Each slide's key must have a matching entry under `home.gallery.slides` in
// every locale (title, caption, alt).
const UNSPLASH = 'https://images.unsplash.com'
const PARAMS = 'auto=format&fit=crop&q=70'

const SLIDES = [
  { key: 'branch', id: 'photo-1509967733342-437077d8e41a' },
  { key: 'lubber', id: 'photo-1533679442218-b5a78d88175b' },
  { key: 'profile', id: 'photo-1620191309281-ef74ff4d6ede' },
  { key: 'ground', id: 'photo-1578997215402-b755ef2c374a' },
  { key: 'crimson', id: 'photo-1546032571-e11bc2607b92' },
  { key: 'macro', id: 'photo-1473730872529-4fca9cf3528f' }
].map((slide) => ({ ...slide, src: `${UNSPLASH}/${slide.id}?${PARAMS}` }))

const TICK_MS = 5000

const current = ref(0)
const progress = ref(0)

let timer = null
let paused = false

function go(index) {
  const total = SLIDES.length

  current.value = (index + total) % total
  restart()
}

function restart() {
  stop()

  if (paused || prefersReducedMotion()) return

  // Drive the progress bar from 0 to 100 across one interval: reset it, then
  // let the next frame animate the width so the CSS transition actually runs.
  progress.value = 0
  requestAnimationFrame(() => {
    if (timer) progress.value = 100
  })

  timer = setInterval(() => {
    current.value = (current.value + 1) % SLIDES.length
    progress.value = 0
    requestAnimationFrame(() => {
      if (timer) progress.value = 100
    })
  }, TICK_MS)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function pause() {
  paused = true
  stop()
  progress.value = 0
}

function resume() {
  paused = false
  restart()
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

onMounted(restart)
onBeforeUnmount(stop)
</script>
