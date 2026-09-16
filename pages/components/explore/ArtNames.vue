<template>
  <div
    aria-hidden="true"
    class="flex h-full w-full items-center justify-center"
  >
    <div class="grid grid-cols-6 gap-1">
      <span
        v-for="letter in LETTERS"
        :key="letter"
        class="flex h-6 w-6 items-center justify-center rounded-md text-[11px] leading-none"
        :class="
          letter === ACTIVE
            ? 'bg-accent/25 font-semibold text-base-content'
            : 'text-base-soft/70'
        "
      >
        {{ letter }}
      </span>
    </div>
  </div>
</template>

<script setup>
const LETTERS = 'ABCDEFGHIJKL'.split('')
const ACTIVE = 'C'
</script>
