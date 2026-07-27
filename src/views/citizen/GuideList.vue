<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-xl font-bold text-white">{{ $t('guideList.title') }}</h2>
      <p class="text-xs text-slate-400">{{ $t('guideList.subtitle') }}</p>
    </div>

    <div class="space-y-3">
      <router-link
        v-for="guide in guides.guides"
        :key="guide.id"
        :to="`/app/guides/${guide.id}`"
        class="block p-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 transition-all hover:border-slate-600"
      >
        <div class="flex items-start justify-between">
          <div>
            <span class="inline-block px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-slate-700 text-blue-300 mb-1">
              {{ guide.category }}
            </span>
            <h3 class="font-bold text-sm text-white group-hover:text-blue-400">{{ guide.title }}</h3>
            <p class="text-xs text-slate-400 mt-1 line-clamp-2">{{ guide.summary }}</p>
          </div>
          <svg class="w-5 h-5 text-slate-500 shrink-0 ml-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useGuidesStore } from '@/stores/guidesStore'
const guides = useGuidesStore()
</script>
