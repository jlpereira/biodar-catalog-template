<template>
  <div class="bg-base-background flex min-h-full flex-col">
    <!-- Editorial split: copy + search on the left, autoplaying gallery on the right -->
    <section class="relative shrink-0 px-6 pt-12 pb-16 sm:pt-16 lg:pt-20">
      <div
        aria-hidden="true"
        class="hero-backdrop pointer-events-none absolute inset-0"
      />

      <div
        class="relative container mx-auto grid items-center gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16"
      >
        <div>
          <span
            class="inline-flex items-center gap-2 rounded-full border border-base-border bg-base-foreground px-3 py-1 text-xs font-medium uppercase tracking-wider text-base-soft"
          >
            <span
              class="h-1.5 w-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            {{ projectOrder }}
          </span>

          <h1
            class="mt-5 text-4xl font-bold tracking-tight text-balance text-base-content sm:text-5xl xl:text-6xl"
          >
            {{ projectName }}
          </h1>

          <p
            class="mt-4 max-w-2xl text-lg leading-relaxed text-pretty text-base-soft"
          >
            {{ $t('home.tagline', { order: projectOrder }) }}
          </p>

          <HomeSearch class="mt-8 max-w-2xl" />

          <HomeStats class="mt-10" />
        </div>

        <HomeGallery />
      </div>
    </section>

    <HomeExplore class="grow" />
  </div>
</template>

<script setup>
import HomeSearch from './components/HomeSearch.vue'
import HomeStats from './components/HomeStats.vue'
import HomeGallery from './components/HomeGallery.vue'
import HomeExplore from './components/HomeExplore.vue'

const { project_name: projectName, project_order: projectOrder } = __APP_ENV__
</script>

<style scoped>
/*
 * Two stacked background layers, both painted inside the section's own box so
 * nothing can bleed out and reintroduce horizontal overflow:
 *
 *   1. a soft lift, sitting behind the gallery card, so the card rests on a
 *      surface instead of floating in flat colour;
 *   2. a fine dot grid that gives the whole hero field some material.
 *
 * Both layers read theme variables, so they follow light and dark on their own.
 * The mask fades the grid out before the explore band so the two do not fight.
 */
.hero-backdrop {
  background-image:
    radial-gradient(
      22rem 18rem at 50% 34%,
      var(--tp-base-foreground),
      transparent 70%
    ),
    radial-gradient(
      color-mix(in srgb, var(--tp-base-border) 65%, transparent) 1px,
      transparent 1px
    );
  background-repeat: no-repeat, repeat;
  background-size:
    100% 100%,
    22px 22px;
  -webkit-mask-image: linear-gradient(to bottom, #000 55%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 55%, transparent 100%);
}

@media (min-width: 64rem) {
  .hero-backdrop {
    background-image:
      radial-gradient(
        30rem 24rem at 74% 46%,
        var(--tp-base-foreground),
        transparent 70%
      ),
      radial-gradient(
        color-mix(in srgb, var(--tp-base-border) 65%, transparent) 1px,
        transparent 1px
      );
  }
}
</style>
