<template>
  <ProjectStats
    tag="dl"
    class="flex flex-wrap gap-x-10 gap-y-6 border-t border-base-border pt-8"
    :data="STAT_KEYS"
  >
    <template #default="{ type, value }">
      <div>
        <dd class="text-2xl font-bold text-base-content sm:text-3xl">
          {{ value }}
        </dd>
        <dt
          class="mt-0.5 text-xs font-medium uppercase tracking-wider text-base-soft"
        >
          {{ statLabel(type) }}
        </dt>
      </div>
    </template>
  </ProjectStats>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// What to request from /stats, and the order the tiles are rendered in.
const STAT_KEYS = ['Taxon names', 'Project sources', 'Citations', 'Images']

// ProjectStats hands back the API's lowercased key; map it to a locale key.
const STAT_LABELS = {
  otus: 'otus',
  'taxon names': 'taxon_names',
  'project sources': 'project_sources',
  citations: 'citations',
  images: 'images'
}

function statLabel(type) {
  const key = STAT_LABELS[type]

  return key ? t(`home.stats.${key}`) : type
}
</script>
