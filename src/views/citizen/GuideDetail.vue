<template>
  <div class="space-y-4">
    <router-link to="/app/guides" class="inline-flex items-center text-xs text-blue-400 font-medium hover:underline">
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      Back to All Guides
    </router-link>

    <div v-if="guide" class="p-5 rounded-xl bg-slate-800 border border-slate-700 space-y-4">
      <div>
        <span class="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
          {{ guide.category }}
        </span>
        <h2 class="text-xl font-bold text-white mt-2">{{ guide.title }}</h2>
        <p class="text-xs text-slate-400 mt-1">{{ guide.summary }}</p>
      </div>

      <div class="border-t border-slate-700 pt-4 text-xs text-slate-300 space-y-3 leading-relaxed">
        <div v-html="renderedMarkdown" class="prose prose-invert max-w-none text-slate-300 space-y-2"></div>
      </div>
    </div>

    <div v-else class="p-8 text-center text-slate-400 text-sm">
      Guide not found.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGuidesStore } from '@/stores/guidesStore'

const route = useRoute()
const guidesStore = useGuidesStore()

const guide = computed(() => guidesStore.getGuideById(route.params.id))

const renderedMarkdown = computed(() => {
  if (!guide.value?.content) return ''
  return renderSimpleMarkdown(guide.value.content)
})

function renderSimpleMarkdown(md) {
  return md
    .replace(/\r/g, '')
    .replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-white mt-3 mb-1">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-sm font-bold text-blue-400 mt-3 mb-1">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xs font-semibold text-slate-200 mt-2 mb-1">$1</h3>')
    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-slate-300">$1</li>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\n\n/g, '<br/>')
}
</script>
