<template>
  <!-- The scientists who compile the catalog's data. Hidden when
       config/authors.yml lists nobody. -->
  <section
    v-if="authors.length"
    class="border-t border-base-border bg-base-background px-6"
  >
    <div class="container mx-auto py-16">
      <h2 class="text-2xl font-bold tracking-tight text-base-content">
        {{ $t('home.authors.title') }}
      </h2>

      <p class="mt-2 max-w-2xl text-sm leading-relaxed text-base-soft">
        {{ $t('home.authors.subtitle') }}
      </p>

      <PeopleList
        :people="authors"
        class="mt-8"
      />
    </div>
  </section>
</template>

<script setup>
import PeopleList from './PeopleList.vue'
import { usePeople } from '../composables/usePeople.js'

const { catalog_authors: catalogAuthors } = __APP_ENV__

const authors = usePeople(catalogAuthors)
</script>
