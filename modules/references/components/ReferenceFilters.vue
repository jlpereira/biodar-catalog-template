<template>
  <div class="border-t border-base-border px-4">
    <div
      class="container mx-auto flex flex-col gap-4 py-4 text-sm md:flex-row md:items-end"
    >
      <label class="flex grow flex-col gap-1">
        <span class="text-xs tracking-wide text-base-soft uppercase">
          {{ $t('references.filters.in_citation') }}
        </span>

        <InputText
          v-model="citation"
          class="w-full"
          :placeholder="$t('references.filters.in_citation_placeholder')"
        />
      </label>

      <label class="flex flex-col gap-1 md:w-72">
        <span class="text-xs tracking-wide text-base-soft uppercase">
          {{ $t('references.filters.author') }}
        </span>

        <InputText
          v-model="author"
          class="w-full"
          :placeholder="$t('references.filters.author_placeholder')"
        />
      </label>

      <!-- Nothing to drag until the list has loaded and the real span of the
           project's years is known. -->
      <div
        v-if="bounds"
        class="flex flex-col gap-1"
      >
        <span class="text-xs tracking-wide text-base-soft uppercase">
          {{ $t('references.filters.published_between') }}
        </span>

        <div class="flex flex-row items-center gap-2">
          <YearPicker
            v-model="yearStart"
            :min="bounds.min"
            :max="bounds.max"
          />

          <VSlider
            v-model:start="yearStart"
            v-model:end="yearEnd"
            class="w-full md:w-56"
            :min="bounds.min"
            :max="bounds.max"
          />

          <YearPicker
            v-model="yearEnd"
            :min="bounds.min"
            :max="bounds.max"
          />
        </div>
      </div>

      <VButton
        class="shrink-0 md:self-end"
        :disabled="!activeCount"
        outline
        @click="$emit('reset')"
      >
        {{ $t('references.filters.reset') }}
      </VButton>
    </div>
  </div>
</template>

<script setup>
import VSlider from './VSlider.vue'
import YearPicker from './YearPicker.vue'

defineProps({
  // The span of years the project's sources actually cover, or null while the
  // list is still loading.
  bounds: {
    type: Object,
    default: null
  },

  // How many filters are narrowing the list right now.
  activeCount: {
    type: Number,
    required: true
  }
})

defineEmits(['reset'])

const citation = defineModel('citation', { type: String, required: true })
const author = defineModel('author', { type: String, required: true })
const yearStart = defineModel('yearStart', { type: Number, required: true })
const yearEnd = defineModel('yearEnd', { type: Number, required: true })
</script>
