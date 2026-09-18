<template>
  <li>
    <ButtonExpand
      v-if="!node.leaf_node"
      :model-value="isExpanded"
      class="absolute -left-2.5"
      @update:model-value="tree.toggle(node.otu_id)"
    />

    <router-link
      class="text-secondary hover:text-accent"
      :to="`/otus/${node.otu_id}`"
    >
      <span v-html="node.name" />
    </router-link>

    <ul
      v-if="node.nomenclatural_synonyms?.length"
      class="synonyms"
    >
      <li
        v-for="synonym in node.nomenclatural_synonyms"
        :key="synonym"
      >
        <span class="mr-1 text-orange-500">=</span>
        <span v-html="synonym" />
      </li>
    </ul>

    <template v-if="isExpanded">
      <p
        v-if="branch?.isLoading"
        class="py-1 text-xs text-base-soft"
      >
        {{ $t('component.spinner.loading') }}
      </p>

      <p
        v-else-if="branch?.error"
        class="py-1 text-xs"
      >
        <span class="text-danger">
          {{ $t('classification.branch_error') }}
        </span>

        <button
          type="button"
          class="ml-2 cursor-pointer text-secondary hover:text-accent"
          @click="tree.loadBranch(node.otu_id)"
        >
          {{ $t('classification.retry') }}
        </button>
      </p>

      <p
        v-else-if="!branch?.children?.length"
        class="py-1 text-xs text-base-soft"
      >
        {{ $t('classification.empty') }}
      </p>

      <AnimationOpacity v-else>
        <ul class="tree">
          <ClassificationNode
            v-for="child in branch.children"
            :key="child.otu_id"
            :node="child"
          />
        </ul>
      </AnimationOpacity>
    </template>
  </li>
</template>

<script setup>
import { computed, inject } from 'vue'
import ClassificationNode from './ClassificationNode.vue'
import { CLASSIFICATION_TREE } from '../composables/useClassificationTree.js'

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
})

const tree = inject(CLASSIFICATION_TREE)

const isExpanded = computed(() => tree.isExpanded(props.node.otu_id))
const branch = computed(() => tree.getBranch(props.node.otu_id))
</script>

<style scoped>
.tree {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tree .tree {
  margin-left: 14px;
}

.tree > li {
  position: relative;
  margin: 0;
  padding: 0 6px;
  border-left: 1px solid var(--tp-tree-line);
}

.tree > li:last-child {
  border-left: none;
}

.tree > li::before {
  position: relative;
  top: -0.3em;
  left: -6px;
  display: inline-block;
  height: 1em;
  width: 12px;
  border-bottom: 1px solid var(--tp-tree-line);
  content: '';
}

.tree > li:last-child::before {
  border-left: 1px solid var(--tp-tree-line);
}

.synonyms {
  list-style: none;
  margin: 0;
  padding-left: 18px;
  padding-bottom: 4px;
}
</style>
