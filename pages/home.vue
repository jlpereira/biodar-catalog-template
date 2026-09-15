<template>
  <div class="bg-base-background">
    <section class="relative overflow-hidden">
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-linear-to-br from-base-foreground via-base-background to-base-muted/50"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -bottom-48 -left-40 h-[26rem] w-[26rem] rounded-full bg-secondary/10 blur-3xl"
      />

      <div
        class="relative container mx-auto px-6 py-20 sm:py-28 flex flex-col items-center text-center"
      >
        <h1
          class="mt-4 max-w-3xl text-4xl sm:text-6xl font-bold tracking-tight text-base-content text-balance"
        >
          {{ projectName }}
        </h1>

        <p
          class="mt-5 max-w-2xl text-lg sm:text-xl leading-relaxed text-base-soft text-pretty"
        >
          {{ $t('home.tagline', { order: projectOrder }) }}
        </p>

        <div class="mt-10 w-full max-w-xl">
          <div
            class="autocomplete-shell rounded-2xl border border-base-border bg-base-foreground/80 p-2 shadow-lg backdrop-blur-sm transition-shadow focus-within:shadow-xl text-left"
          >
            <AutocompleteOtu :placeholder="$t('home.search.placeholder')" />
          </div>

          <p class="mt-3 text-sm text-base-soft">
            {{ $t('home.search.hint') }}
          </p>
        </div>

        <ProjectStats
          tag="dl"
          class="mt-14 grid w-full max-w-3xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4"
          :data="STAT_KEYS"
        >
          <template #default="{ type, value }">
            <div class="text-center">
              <dt
                class="order-2 mt-1 text-xs font-medium uppercase tracking-wider text-base-soft"
              >
                {{ statLabel(type) }}
              </dt>
              <dd class="order-1 text-3xl font-bold text-base-content">
                {{ value }}
              </dd>
            </div>
          </template>
        </ProjectStats>
      </div>
    </section>

    <section class="container mx-auto px-6 py-16">
      <h2 class="text-2xl font-bold tracking-tight text-base-content">
        {{ $t('home.sections.title') }}
      </h2>

      <div class="mt-8 grid gap-6 md:grid-cols-3">
        <router-link
          v-for="section in SECTIONS"
          :key="section.to"
          :to="section.to"
          class="group relative flex flex-col rounded-2xl border border-base-border bg-base-foreground p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-secondary/40 hover:shadow-lg"
        >
          <span
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-colors group-hover:bg-secondary/20"
          >
            <span
              class="h-5 w-5"
              v-html="section.icon"
            />
          </span>

          <h3 class="mt-5 font-semibold text-base-content">
            {{ $t(`home.sections.${section.key}.title`) }}
          </h3>

          <p class="mt-2 grow text-sm leading-relaxed text-base-soft">
            {{ $t(`home.sections.${section.key}.description`) }}
          </p>

          <span
            class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-secondary"
          >
            {{ $t(`home.sections.${section.key}.cta`) }}
            <span
              class="transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            >
              &rarr;
            </span>
          </span>
        </router-link>
      </div>
    </section>

    <section class="border-t border-base-border bg-base-foreground">
      <div class="container mx-auto grid gap-12 px-6 py-16 md:grid-cols-2">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-base-content">
            {{ $t('home.announcements.title') }}
          </h2>

          <ol class="mt-8 space-y-6">
            <li
              v-for="item in ANNOUNCEMENTS"
              :key="item.date"
              class="relative border-l border-base-border pl-6 pb-1 last:pb-0"
            >
              <span
                class="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-secondary"
                aria-hidden="true"
              />
              <time
                :datetime="item.date"
                class="text-xs font-medium uppercase tracking-wider text-base-soft"
              >
                {{ $d(toDate(item.date), 'long') }}
              </time>
              <p class="mt-1 text-base-content">
                {{ $t(`home.announcements.${item.key}`) }}
              </p>
            </li>
          </ol>
        </div>

        <div class="md:pl-8">
          <h2 class="text-2xl font-bold tracking-tight text-base-content">
            {{ $t('home.about.title') }}
          </h2>

          <p class="mt-6 leading-relaxed text-base-soft">
            {{ $t('home.about.body') }}
          </p>

          <router-link
            to="/about"
            class="mt-8 inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-content transition-opacity hover:opacity-90"
          >
            {{ $t('home.about.cta') }}
            <span aria-hidden="true">&rarr;</span>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { project_name: projectName, project_order: projectOrder } = __APP_ENV__

const STAT_KEYS = ['Otus', 'Taxon names', 'Project sources', 'Images']

const STAT_LABELS = {
  otus: 'otus',
  'taxon names': 'taxon_names',
  'project sources': 'project_sources',
  images: 'images'
}

const ANNOUNCEMENTS = [
  { date: '2022-05-01', key: 'grown' },
  { date: '2022-01-01', key: 'live' }
]

const SECTIONS = [
  {
    key: 'alphabetically',
    to: '/search/alphabetically',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5 7.5 7.5l4.5 9m-7.65-2.7h6.3M15 16.5h4.5m0 0L17.25 12m2.25 4.5L21.75 12" /></svg>`
  },
  {
    key: 'geographic',
    to: '/search/geographic',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0a8.949 8.949 0 0 0 4.951-1.488A3.987 3.987 0 0 0 13 16v-1a2 2 0 0 0-2-2 2 2 0 0 1-2-2 2 2 0 0 1 2-2h.5a2 2 0 0 0 2-2V6.2m5.5 3.3a4 4 0 0 1-3 1.5h-1" /></svg>`
  },
  {
    key: 'references',
    to: '/references',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>`
  }
]

function statLabel(type) {
  const key = STAT_LABELS[type]

  return key ? t(`home.stats.${key}`) : type
}

function toDate(date) {
  return new Date(`${date}T12:00:00`)
}
</script>

<style scoped>
.autocomplete-shell :deep(.tp-autocomplete) {
  width: 100%;
}
</style>
