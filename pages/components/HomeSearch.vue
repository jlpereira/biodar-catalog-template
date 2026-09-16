<template>
  <div>
    <div
      class="autocomplete-shell rounded-2xl border border-base-border bg-base-foreground/80 p-2 shadow-lg backdrop-blur-sm transition-shadow focus-within:shadow-xl"
    >
      <AutocompleteOtu :placeholder="$t('home.search.placeholder')" />
    </div>
  </div>
</template>

<style scoped>
.autocomplete-shell :deep(.tp-autocomplete) {
  width: 100%;
}
</style>
