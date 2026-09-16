<template>
  <div class="bg-base-background flex min-h-full flex-col">
    <section class="relative shrink-0 px-6 pt-12 pb-16 sm:pt-16 lg:pt-20">
      <div
        v-if="false"
        aria-hidden="true"
        class="hero-backdrop pointer-events-none absolute inset-0"
      />

      <div
        class="relative container mx-auto grid items-center gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16"
      >
        <div>
          <h1
            class="mt-5 text-4xl font-bold tracking-wider text-balance uppercase text-base-content sm:text-5xl xl:text-6xl"
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
    <HomeAuthors />
  </div>
</template>

<script setup>
import HomeSearch from './components/HomeSearch.vue'
import HomeStats from './components/HomeStats.vue'
import HomeGallery from './components/HomeGallery.vue'
import HomeExplore from './components/HomeExplore.vue'
import HomeAuthors from './components/HomeAuthors.vue'

const { project_name: projectName, project_order: projectOrder } = __APP_ENV__
</script>

<style scoped>
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
