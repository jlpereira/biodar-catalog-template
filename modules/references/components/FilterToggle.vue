<template>
  <button
    type="button"
    class="flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition-colors"
    :class="
      expanded
        ? 'border-accent/40 bg-accent/20 font-semibold text-base-content'
        : 'border-base-border text-base-content hover:bg-base-muted'
    "
    :aria-expanded="expanded"
    @click="$emit('toggle')"
  >
    <svg
      aria-hidden="true"
      class="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 5h18l-7 8v6l-4 2v-8z" />
    </svg>

    <span>{{ label }}</span>

    <!-- The panel is closed by default, so without this a filtered list just
         looks like a bibliography with entries missing. -->
    <span
      v-if="count"
      class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-content"
    >
      {{ count }}
    </span>
  </button>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },

  expanded: {
    type: Boolean,
    required: true
  },

  // Number of filters currently narrowing the list; 0 renders no badge.
  count: {
    type: Number,
    required: true
  }
})

defineEmits(['toggle'])
</script>
