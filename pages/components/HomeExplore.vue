<template>
  <section
    class="flex flex-col border-t border-base-border bg-base-foreground px-6"
  >
    <div class="container mx-auto my-auto py-16">
      <h2 class="text-2xl font-bold tracking-tight text-base-content">
        {{ $t('home.sections.title') }}
      </h2>

      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <router-link
          v-for="section in SECTIONS"
          :key="section.to"
          :to="{ name: section.to }"
          class="group/card relative flex flex-col overflow-hidden rounded-2xl border border-base-border bg-base-background transition-colors hover:border-accent/50"
        >
          <span
            aria-hidden="true"
            class="absolute inset-y-0 left-0 z-10 w-1 bg-accent opacity-0 transition-opacity group-hover/card:opacity-100"
          />

          <div
            class="h-32 py-6 shrink-0 overflow-hidden border-b border-base-border bg-primary/3"
          >
            <component
              :is="ART[section.key]"
              class="h-full w-full transition-transform duration-300 group-hover/card:scale-105 motion-reduce:transition-none motion-reduce:group-hover/card:scale-100"
            />
          </div>

          <div class="flex grow flex-col p-6">
            <h3 class="font-semibold text-base-content">
              {{ $t(`home.sections.${section.key}.title`) }}
            </h3>

            <p class="mt-2 grow text-sm leading-relaxed text-base-soft">
              {{ $t(`home.sections.${section.key}.description`) }}
            </p>

            <span
              class="mt-5 inline-flex items-center gap-1 text-sm font-medium text-secondary"
            >
              {{ $t(`home.sections.${section.key}.cta`) }}
              <span
                class="transition-transform group-hover/card:translate-x-1"
                aria-hidden="true"
              >
                &rarr;
              </span>
            </span>
          </div>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import ArtNames from './explore/ArtNames.vue'
import ArtGeographic from './explore/ArtGeographic.vue'
import ArtClassification from './explore/ArtClassification.vue'
import ArtReferences from './explore/ArtReferences.vue'

const SECTIONS = [
  { key: 'alphabetically', to: '/search/alphabetically' },
  { key: 'geographic', to: '/search/geographic' },
  { key: 'classification', to: '/search/classification' },
  { key: 'references', to: 'references' }
]

const ART = {
  alphabetically: ArtNames,
  geographic: ArtGeographic,
  classification: ArtClassification,
  references: ArtReferences
}
</script>
