import { reactive, ref, shallowRef } from 'vue'
import { makeAPIRequest } from '@/utils'

export const CLASSIFICATION_TREE = Symbol('classificationTree')

const DEPTH = 1

function fetchTaxonomy(otuId) {
  return makeAPIRequest.get(`/otus/${otuId}/inventory/taxonomy.json`, {
    params: { max_descendants_depth: DEPTH }
  })
}

export function useClassificationTree(rootOtuId) {
  const root = shallowRef(null)
  const isLoading = ref(false)
  const error = ref(null)
  const branches = reactive(new Map())
  const expanded = reactive(new Set())

  function branchFor(otuId) {
    if (!branches.has(otuId)) {
      branches.set(otuId, { children: null, isLoading: false, error: null })
    }

    return branches.get(otuId)
  }

  function getBranch(otuId) {
    return branches.get(otuId)
  }

  function isExpanded(otuId) {
    return expanded.has(otuId)
  }

  async function loadBranch(otuId) {
    const branch = branchFor(otuId)

    if (branch.isLoading) return

    branch.isLoading = true
    branch.error = null

    try {
      const { data } = await fetchTaxonomy(otuId)

      branch.children = data.descendants
    } catch (e) {
      branch.error = e.message
    } finally {
      branch.isLoading = false
    }
  }

  function toggle(otuId) {
    if (expanded.has(otuId)) {
      expanded.delete(otuId)

      return
    }

    expanded.add(otuId)

    if (!branchFor(otuId).children) {
      loadBranch(otuId)
    }
  }

  async function load() {
    isLoading.value = true
    error.value = null
    root.value = null
    branches.clear()
    expanded.clear()

    try {
      const { data } = await fetchTaxonomy(rootOtuId)

      root.value = data
      branchFor(data.otu_id).children = data.descendants
      expanded.add(data.otu_id)
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  return {
    error,
    getBranch,
    isExpanded,
    isLoading,
    load,
    loadBranch,
    root,
    toggle
  }
}
