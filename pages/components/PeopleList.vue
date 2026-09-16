<template>
  <!-- Plain credits in one column: the name, and the place it belongs to
       under it. No card and no rule — the grouping is the spacing alone. -->
  <ul class="flex flex-col gap-6">
    <li
      v-for="person in people"
      :key="person.name"
      class="relative pl-5"
    >
      <!-- Squared off, unlike the round bullet on /references. Centred on
           the first line of the name. -->
      <span
        aria-hidden="true"
        class="absolute left-0 top-[0.5em] h-2 w-2 bg-accent"
      />

      <p class="font-semibold text-base-content">
        <a
          v-if="person.url"
          :href="person.url"
          target="_blank"
          rel="noopener noreferrer"
          class="underline-offset-2 hover:text-secondary hover:underline"
        >
          {{ person.name }}
        </a>
        <template v-else>{{ person.name }}</template>
      </p>

      <p
        v-if="localized(person.affiliation)"
        class="mt-1 text-sm leading-relaxed text-base-soft"
      >
        {{ localized(person.affiliation) }}
      </p>
    </li>
  </ul>
</template>

<script setup>
import { useLocalizedField } from '../composables/usePeople.js'

defineProps({
  people: {
    type: Array,
    required: true
  }
})

const localized = useLocalizedField()
</script>
