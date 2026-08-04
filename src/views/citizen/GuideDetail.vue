<template>
  <div class="space-y-3">
    <!-- Back Link Button -->
    <router-link
      to="/app/guides"
      class="inline-flex items-center px-3.5 py-1.5 rounded-full bg-white text-xs font-bold text-[#902715] border border-[#E0E0E0] shadow-m3-xs hover:bg-[#FDFBF7] active:scale-95 transition-all"
    >
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
      </svg>
      {{ $t('guideDetail.backToGuides') }}
    </router-link>

    <div v-if="guide" class="space-y-3">
      <!-- Standard Compact M3 Header Card with Solid Saturated Category Color & Light Icon Badge -->
      <div :class="['p-4 rounded-2xl shadow-m3-md text-white space-y-2', getTheme(guide.category).cardBg]">
        <div class="flex items-center justify-between gap-2">
          <span :class="['px-2.5 py-0.5 text-[9px] uppercase font-black tracking-widest rounded shadow-m3-xs', getTheme(guide.category).tagStyle]">
            {{ guide.category }}
          </span>
          <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0 p-2 shadow-m3-sm', getTheme(guide.category).iconBadgeBg]">
            <!-- Flood Icon -->
            <svg v-if="guide.category === 'flood'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
            </svg>

            <!-- Typhoon Icon -->
            <svg v-else-if="guide.category === 'typhoon'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/>
            </svg>

            <!-- Earthquake Icon -->
            <svg v-else-if="guide.category === 'earthquake'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>

            <!-- Coastal Icon -->
            <svg v-else-if="guide.category === 'coastal'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"/>
            </svg>

            <!-- Volcanic Icon -->
            <svg v-else-if="guide.category === 'volcanic'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"/>
            </svg>

            <!-- Industrial Icon -->
            <svg v-else class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
        </div>

        <h2 class="font-expressive text-lg font-black text-white tracking-tight leading-snug">
          {{ cleanTitle(guide.title) }}
        </h2>
        <p class="text-xs font-medium text-white/90 leading-relaxed">
          {{ guide.summary }}
        </p>
      </div>

      <!-- Main Content Card Surface -->
      <div class="p-4 rounded-2xl bg-white border border-[#E0E0E0] shadow-m3-sm space-y-2">
        <div v-html="renderedMarkdown" class="prose max-w-none text-[#0A0A0A] space-y-2"></div>
      </div>
    </div>

    <div v-else class="p-6 text-center rounded-2xl bg-white text-[#717171] text-xs font-medium border border-[#E0E0E0] shadow-m3-sm">
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

const THEMES = {
  flood: {
    cardBg: 'bg-[#1F3A4B]',
    iconBadgeBg: 'bg-[#E3EBF0] text-[#1F3A4B]',
    tagStyle: 'bg-[#E3EBF0] text-[#1F3A4B]'
  },
  typhoon: {
    cardBg: 'bg-[#902715]',
    iconBadgeBg: 'bg-[#F7FB41] text-[#902715]',
    tagStyle: 'bg-[#F7FB41] text-[#902715]'
  },
  earthquake: {
    cardBg: 'bg-[#D14D3E]',
    iconBadgeBg: 'bg-[#FDF6E2] text-[#D14D3E]',
    tagStyle: 'bg-[#FDF6E2] text-[#D14D3E]'
  },
  coastal: {
    cardBg: 'bg-[#0284C7]',
    iconBadgeBg: 'bg-[#E0F2FE] text-[#0284C7]',
    tagStyle: 'bg-[#E0F2FE] text-[#0284C7]'
  },
  volcanic: {
    cardBg: 'bg-[#183F07]',
    iconBadgeBg: 'bg-[#F7FB41] text-[#183F07]',
    tagStyle: 'bg-[#F7FB41] text-[#183F07]'
  },
  industrial: {
    cardBg: 'bg-[#B45309]',
    iconBadgeBg: 'bg-[#FEF3C7] text-[#B45309]',
    tagStyle: 'bg-[#FEF3C7] text-[#B45309]'
  }
}

function getTheme(cat) {
  return THEMES[cat] || THEMES.typhoon
}

function cleanTitle(title) {
  return (title || '').replace(/\s*SOP\s*/gi, '').trim()
}

const renderedMarkdown = computed(() => {
  if (!guide.value?.content) return ''
  return renderSimpleMarkdown(guide.value.content)
})

function renderSimpleMarkdown(md) {
  return md
    .replace(/\r/g, '')
    .replace(/\s*SOP\s*/gi, ' ')
    .replace(/^# (.*$)/gim, '<h1 class="font-expressive text-base font-black text-[#0A0A0A] mt-3 mb-1.5 tracking-tight">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="font-expressive text-sm font-black text-[#0A0A0A] mt-3.5 mb-1 tracking-tight flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] inline-block"></span>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="font-expressive text-xs font-bold text-[#0A0A0A] mt-2 mb-1">$1</h3>')
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-3 border-[#902715] p-2.5 bg-[#FDFBF7] text-[#902715] text-[11px] font-bold rounded-r-xl my-2 shadow-m3-xs border-r border-t border-b border-[#E0E0E0]">$1</blockquote>')
    .replace(/^\- (.*$)/gim, '<li class="ml-3.5 list-disc text-[#0A0A0A] mb-1 text-xs font-medium leading-relaxed">$1</li>')
    .replace(/`([^`]+)`/gim, '<code class="px-1.5 py-0.5 rounded bg-[#F5F5F5] text-[#902715] font-mono text-[11px] font-bold border border-[#E0E0E0]">$1</code>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-black text-[#0A0A0A]">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<span class="font-bold text-[#0A0A0A]">$1</span>')
    .replace(/\n\n/g, '<div class="h-1.5"></div>')
}
</script>
