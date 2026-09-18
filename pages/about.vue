<template>
  <div class="bg-base-foreground min-h-full">
    <div class="px-4">
      <div class="container mx-auto pt-10 pb-6">
        <h1 class="text-3xl font-bold tracking-tight text-base-content">
          {{ $t('about.title') }}
        </h1>

        <p class="mt-2 max-w-2xl text-sm text-base-soft">
          {{ $t('about.subtitle') }}
        </p>
      </div>
    </div>

    <div class="px-4 pb-16">
      <div class="container mx-auto space-y-12">
        <section>
          <h2 class="text-2xl font-bold tracking-tight text-base-content">
            {{ $t('about.overview.title') }}
          </h2>

          <p class="mt-4 max-w-4xl leading-relaxed text-base-content">
            {{ $t('about.overview.body') }}
          </p>
        </section>

        <section v-if="authors.length">
          <h2 class="text-2xl font-bold tracking-tight text-base-content">
            {{ $t('about.authors.title') }}
          </h2>

          <PeopleList
            :people="authors"
            class="mt-6"
          />
        </section>

        <section v-if="developers.length">
          <h2 class="text-2xl font-bold tracking-tight text-base-content">
            {{ $t('about.developers.title') }}
          </h2>

          <p class="mt-4 max-w-4xl leading-relaxed text-base-content">
            {{ $t('about.developers.body') }}
          </p>

          <PeopleList
            :people="developers"
            class="mt-6"
          />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import PeopleList from './components/PeopleList.vue'
import { usePeople } from './composables/usePeople.js'

const {
  catalog_authors: catalogAuthors,
  catalog_developers: catalogDevelopers
} = __APP_ENV__

const authors = usePeople(catalogAuthors)
const developers = usePeople(catalogDevelopers)
</script>
