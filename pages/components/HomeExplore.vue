<template>
  <!-- Explore: horizontal rows with a leading index, not icon tiles -->
  <section
    class="flex flex-col border-t border-base-border bg-base-foreground px-6"
  >
    <div class="container mx-auto my-auto py-16">
      <h2 class="text-2xl font-bold tracking-tight text-base-content">
        {{ $t('home.sections.title') }}
      </h2>

      <div class="mt-8 grid gap-4 md:grid-cols-3">
        <router-link
          v-for="(section, index) in SECTIONS"
          :key="section.to"
          :to="section.to"
          class="group/card relative flex flex-col overflow-hidden rounded-2xl border border-base-border bg-base-background p-6 transition-colors hover:border-accent/50"
        >
          <span
            aria-hidden="true"
            class="absolute inset-y-0 left-0 w-1 bg-accent opacity-0 transition-opacity group-hover/card:opacity-100"
          />

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
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
// Each key must have a matching entry under `home.sections` in every locale
// (title, description, cta).
const SECTIONS = [
  { key: 'alphabetically', to: '/search/alphabetically' },
  { key: 'geographic', to: '/search/geographic' },
  { key: 'references', to: '/references' }
]
</script>
