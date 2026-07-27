<template>
  <div class="space-y-4">
    <div class="p-5 rounded-3xl bg-white border border-[#E0E0E0] shadow-m3-sm space-y-1">
      <h2 class="font-expressive font-black text-2xl text-[#0A0A0A] tracking-tight">{{ $t('guideList.title') }}</h2>
      <p class="text-xs font-medium text-[#717171]">{{ $t('guideList.subtitle') }}</p>
    </div>

    <div class="space-y-3">
      <router-link
        v-for="guide in guides.guides"
        :key="guide.id"
        :to="`/app/guides/${guide.id}`"
        class="group block p-5 rounded-3xl bg-white hover:bg-[#f9ebe8] border border-[#E0E0E0] hover:border-[#f3d3cd] shadow-m3-sm transition-all active:scale-98"
      >
        <div class="flex items-start justify-between">
          <div class="space-y-1.5">
            <span class="inline-block px-3 py-1 text-[10px] uppercase font-extrabold rounded-full bg-[#902715]/10 text-[#902715] tracking-wider">
              {{ guide.category }}
            </span>
            <h3 class="font-expressive font-extrabold text-base text-[#0A0A0A] group-hover:text-[#902715] leading-snug transition-colors">{{ guide.title }}</h3>
            <p class="text-xs font-medium text-[#717171] line-clamp-2 leading-relaxed">{{ guide.summary }}</p>
          </div>
          <div class="w-8 h-8 rounded-full bg-[#EBEBEB] group-hover:bg-[#902715] text-[#717171] group-hover:text-[#F7FB41] flex items-center justify-center shrink-0 ml-3 transition-colors shadow-m3-sm">
            <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useGuidesStore } from '@/stores/guidesStore'
const guides = useGuidesStore()
</script>
