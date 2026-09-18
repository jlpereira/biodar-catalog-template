<template>
  <!-- The tree the classification page draws, three ranks of it: a root, the
       branch opened below it, and the name reached at the end. -->
  <div
    aria-hidden="true"
    class="flex h-full w-full items-center justify-center"
  >
    <svg
      viewBox="0 0 84 64"
      class="h-full w-auto"
      fill="none"
    >
      <rect
        x="6"
        y="4"
        width="44"
        height="6"
        rx="3"
        class="fill-base-soft/50"
      />

      <!-- The trunk stops at the last child, the way the tree's connectors do. -->
      <path
        d="M9 12V56"
        class="stroke-base-soft/40"
        stroke-width="1.5"
      />

      <path
        d="M9 24H19"
        class="stroke-base-soft/40"
        stroke-width="1.5"
      />
      <rect
        x="21"
        y="21"
        width="38"
        height="6"
        rx="3"
        class="fill-base-soft/40"
      />

      <path
        d="M24 29V42H34"
        class="stroke-base-soft/40"
        stroke-width="1.5"
      />
      <rect
        x="36"
        y="39"
        width="42"
        height="6"
        rx="3"
        class="fill-accent/70"
      />

      <path
        d="M9 56H19"
        class="stroke-base-soft/40"
        stroke-width="1.5"
      />
      <rect
        x="21"
        y="53"
        width="34"
        height="6"
        rx="3"
        class="fill-base-soft/40"
      />
    </svg>
  </div>
</template>
