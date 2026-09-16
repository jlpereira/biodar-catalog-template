<template>
  <!-- The same country the geographic page is browsed on, with one province
       and Uruguay picked out the way a selection reads there. -->
  <div
    aria-hidden="true"
    class="flex h-full w-full items-center justify-center"
  >
    <svg
      :viewBox="AR_VIEW_BOX"
      class="h-full w-auto"
      fill="none"
      stroke-linejoin="round"
    >
      <path
        :d="AR_PROVINCES"
        class="fill-base-soft/20 stroke-base-soft/40"
        stroke-width="2.5"
      />
      <path
        :d="AR_CORDOBA"
        class="fill-accent/70 stroke-accent"
        stroke-width="2.5"
      />
      <path
        :d="AR_URUGUAY"
        class="fill-accent/70 stroke-accent"
        stroke-width="2.5"
      />
    </svg>
  </div>
</template>

<script setup>
import {
  AR_VIEW_BOX,
  AR_PROVINCES,
  AR_CORDOBA,
  AR_URUGUAY
} from './argentinaOutline.js'
</script>
