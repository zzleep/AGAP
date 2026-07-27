<template>
  <div class="space-y-4">
    <router-link to="/app/guides" class="inline-flex items-center px-4 py-2 rounded-full bg-white text-xs text-[#902715] font-bold border border-[#E0E0E0] shadow-m3-sm hover:bg-[#f9ebe8] transition-colors">
      <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
      {{ $t('guideDetail.backToGuides') }}
    </router-link>

    <div v-if="guide" class="p-6 rounded-3xl bg-white border border-[#E0E0E0] shadow-m3-sm space-y-4">
      <div class="space-y-2">
        <span class="inline-block px-3 py-1 text-[10px] uppercase font-extrabold rounded-full bg-[#902715]/10 text-[#902715] tracking-wider">
          {{ guide.category }}
        </span>
        <h2 class="font-expressive text-2xl font-black text-[#0A0A0A] tracking-tight leading-snug">{{ guide.title }}</h2>
        <p class="text-xs font-medium text-[#717171] leading-relaxed">{{ guide.summary }}</p>
      </div>

      <div class="border-t border-[#E0E0E0] pt-4 text-xs text-[#0A0A0A] space-y-3 leading-relaxed font-medium">
        <div v-html="renderedMarkdown" class="prose max-w-none text-[#0A0A0A] space-y-2"></div>
      </div>
    </div>

    <div v-else class="p-8 text-center rounded-3xl bg-white text-[#717171] text-sm font-medium border border-[#E0E0E0] shadow-m3-sm">
      {{ $t('guideDetail.notFound') }}
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
