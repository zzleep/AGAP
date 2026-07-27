<template>
  <div class="space-y-3.5">
    <!-- Header Title Surface -->
    <div class="p-4 rounded-2xl bg-white border border-[#E0E0E0] shadow-m3-sm space-y-1">
      <h2 class="font-expressive font-black text-xl text-[#0A0A0A] tracking-tight">
        {{ $t('guideList.title') }}
      </h2>
      <p class="text-xs font-medium text-[#717171]">
        {{ $t('guideList.subtitle') }}
      </p>
    </div>

    <!-- Real-Time Search Input -->
    <div class="relative">
      <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#717171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search guides (e.g. flood, typhoon, hotline)..."
        class="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white border border-[#E0E0E0] text-xs font-semibold text-[#0A0A0A] placeholder-[#9E9E9E] focus:outline-none focus:border-[#902715] shadow-m3-xs transition-colors"
      />
      <button
        v-if="searchQuery"
        @click="searchQuery = ''"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#0A0A0A] text-xs font-bold"
      >
        ✕
      </button>
    </div>

    <!-- Guides List (Solid Saturated Cards with Punchy Short Titles) -->
    <div v-if="filteredGuides.length > 0" class="space-y-3">
      <router-link
        v-for="guide in filteredGuides"
        :key="guide.id"
        :to="`/app/guides/${guide.id}`"
        :class="[
          'group block p-4 rounded-2xl shadow-m3-md transition-all duration-200 active:scale-98 text-white',
          getTheme(guide.category).cardBg
        ]"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3.5 min-w-0">
            <!-- Light Icon Badge Container -->
            <div :class="['w-11 h-11 rounded-xl flex items-center justify-center shrink-0 p-2.5 shadow-m3-sm transition-transform group-hover:scale-105', getTheme(guide.category).iconBadgeBg]">
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

            <!-- Content -->
            <div class="space-y-0.5 min-w-0">
              <div class="flex items-center gap-1.5">
                <span :class="['inline-block px-2.5 py-0.5 text-[9px] uppercase font-black tracking-widest rounded shadow-m3-xs', getTheme(guide.category).tagStyle]">
                  {{ guide.category }}
                </span>
              </div>
              <h3 class="font-expressive font-extrabold text-xs text-white group-hover:text-[#F7FB41] leading-snug transition-colors">
                {{ cleanTitle(guide.title) }}
              </h3>
              <p class="text-[11px] font-medium text-white/85 leading-normal">
                {{ guide.summary }}
              </p>
            </div>
          </div>

          <!-- Chevron Button -->
          <div class="w-8 h-8 rounded-full bg-white/20 group-hover:bg-[#F7FB41] text-white group-hover:text-[#0A0A0A] flex items-center justify-center shrink-0 transition-all shadow-m3-xs">
            <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </router-link>
    </div>

    <!-- Empty State -->
    <div v-else class="p-6 text-center rounded-2xl bg-white text-[#717171] text-xs font-medium border border-[#E0E0E0] shadow-m3-sm space-y-2">
      <p class="font-expressive text-sm font-bold text-[#0A0A0A]">No matching guides found</p>
      <button @click="searchQuery = ''" class="px-4 py-1.5 rounded-full bg-[#902715] text-[#F7FB41] text-xs font-bold shadow-m3-xs mt-1">
        Clear Search
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGuidesStore } from '@/stores/guidesStore'

const guidesStore = useGuidesStore()
const searchQuery = ref('')

const THEMES = {
  flood: {
    cardBg: 'bg-[#1F3A4B] hover:bg-[#182e3b]',
    iconBadgeBg: 'bg-[#E3EBF0] text-[#1F3A4B]',
    tagStyle: 'bg-[#E3EBF0] text-[#1F3A4B]'
  },
  typhoon: {
    cardBg: 'bg-[#902715] hover:bg-[#7a2012]',
    iconBadgeBg: 'bg-[#F7FB41] text-[#902715]',
    tagStyle: 'bg-[#F7FB41] text-[#902715]'
  },
  earthquake: {
    cardBg: 'bg-[#D14D3E] hover:bg-[#b83f32]',
    iconBadgeBg: 'bg-[#FDF6E2] text-[#D14D3E]',
    tagStyle: 'bg-[#FDF6E2] text-[#D14D3E]'
  },
  coastal: {
    cardBg: 'bg-[#0284C7] hover:bg-[#0369A1]',
    iconBadgeBg: 'bg-[#E0F2FE] text-[#0284C7]',
    tagStyle: 'bg-[#E0F2FE] text-[#0284C7]'
  },
  volcanic: {
    cardBg: 'bg-[#183F07] hover:bg-[#122E06]',
    iconBadgeBg: 'bg-[#F7FB41] text-[#183F07]',
    tagStyle: 'bg-[#F7FB41] text-[#183F07]'
  },
  industrial: {
    cardBg: 'bg-[#B45309] hover:bg-[#92400E]',
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

const filteredGuides = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return guidesStore.guides
  return guidesStore.guides.filter(g =>
    g.title.toLowerCase().includes(q) ||
    g.summary.toLowerCase().includes(q) ||
    g.content.toLowerCase().includes(q) ||
    g.category.toLowerCase().includes(q)
  )
})
</script>
