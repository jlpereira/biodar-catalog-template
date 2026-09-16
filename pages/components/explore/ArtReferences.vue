<template>
  <div
    aria-hidden="true"
    class="flex h-full w-full items-center justify-center"
  >
    <div class="relative h-20 w-28">
      <div
        class="absolute inset-0 -rotate-6 rounded-lg border border-base-border bg-base-foreground"
      />
      <div
        class="absolute inset-0 -rotate-3 rounded-lg border border-base-border bg-base-foreground"
      />

      <div
        class="absolute inset-0 flex flex-col gap-2 rounded-lg border border-base-border bg-base-foreground p-3.5"
      >
        <div class="h-1.5 w-3/5 rounded-full bg-base-soft/50" />
        <div class="h-1.5 w-full rounded-full bg-base-soft/25" />
        <div class="h-1.5 w-2/3 rounded-full bg-accent/60" />
        <div class="h-1.5 w-5/6 rounded-full bg-base-soft/25" />
      </div>
    </div>
  </div>
</template>
