<template>
  <div class="bg-base-background flex min-h-full flex-col">
    <!-- Editorial split: copy + search on the left, autoplaying gallery on the right -->
    <section
      class="shrink-0 px-6 pt-12 pb-16 sm:pt-16 lg:pt-20"
    >
      <div
        class="container mx-auto grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16"
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
            class="mt-4 max-w-xl text-lg leading-relaxed text-pretty text-base-soft"
          >
            {{ $t('home.tagline', { order: projectOrder }) }}
          </p>

          <HomeSearch class="mt-8 max-w-xl" />

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
