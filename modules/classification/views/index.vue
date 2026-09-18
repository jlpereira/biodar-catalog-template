<template>
  <div class="bg-base-foreground flex min-h-full flex-col">
    <div class="px-4 border border-base-border">
      <div class="container mx-auto pt-10 pb-6">
        <h1 class="text-3xl font-bold tracking-tight text-base-content">
          {{ $t('classification.title') }}
        </h1>

        <p class="mt-2 max-w-2xl text-sm text-base-soft">
          {{ $t('classification.subtitle') }}
        </p>
      </div>
    </div>

    <div
      class="container mx-auto box-border grow py-8 bg-base-foreground border-base-border border border-t-0"
    >
      <VSpinner
        v-if="isLoading"
        full-screen
      />

      <div
        v-else-if="error"
        class="px-12 text-sm"
      >
        <p class="text-danger">
          {{ $t('classification.error', { message: error }) }}
        </p>

        <VButton
          class="mt-3 py-2"
          @click="load"
        >
          {{ $t('classification.retry') }}
        </VButton>
      </div>

      <ul
        v-else-if="root"
        class="tree px-12 text-sm"
      >
        <ClassificationNode :node="root" />
      </ul>
    </div>
  </div>
</template>

<script setup>
import { onMounted, provide } from 'vue'
import ClassificationNode from '../components/ClassificationNode.vue'
import {
  CLASSIFICATION_TREE,
  useClassificationTree
} from '../composables/useClassificationTree.js'

const ROOT_OTU_ID = 2

const tree = useClassificationTree(ROOT_OTU_ID)

provide(CLASSIFICATION_TREE, tree)

const { error, isLoading, load, root } = tree

onMounted(load)
</script>

<style scoped>
.tree {
  list-style: none;
}
</style>
