<template>
  <div
    class="sticky top-0 z-10 border-y border-base-border bg-base-foreground px-4"
  >
    <div class="container mx-auto py-2">
      <nav
        class="flex flex-wrap gap-0.5"
        :aria-label="label"
      >
        <template
          v-for="letter in letters"
          :key="letter"
        >
          <a
            v-if="available.includes(letter)"
            :href="`#letter-${letter}`"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors"
            :class="
              letter === active
                ? 'bg-accent/20 font-semibold text-base-content'
                : 'text-base-content hover:bg-base-muted'
            "
            :aria-current="letter === active ? 'true' : undefined"
            @click.prevent="$emit('select', letter)"
          >
            {{ letter }}
          </a>

          <!-- Letters with nothing behind them read as gaps in the alphabet,
               not as disabled buttons, so they get no box and no a11y noise. -->
          <span
            v-else
            aria-hidden="true"
            class="flex h-9 w-6 items-center justify-center text-sm text-base-soft/30"
          >
            {{ letter }}
          </span>
        </template>
      </nav>
    </div>
  </div>
</template>

<script setup>
defineProps({
  // Every letter to render, gaps included.
  letters: {
    type: Array,
    required: true
  },

  // The subset that actually has a section to jump to.
  available: {
    type: Array,
    required: true
  },

  active: {
    type: String,
    default: null
  },

  label: {
    type: String,
    required: true
  }
})

defineEmits(['select'])
</script>
