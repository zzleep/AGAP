<template>
  <router-link
    :to="to"
    :class="[
      'expressive-tile group relative flex min-h-40 flex-col justify-end overflow-hidden rounded-[2rem] shadow-m3-md transition-all duration-300 ease-out hover:scale-[1.02] hover:brightness-105',
      variantClass
    ]"
  >
    <img :src="imgSrc" :alt="alt" class="absolute inset-0 h-full w-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent"></div>
    <div class="relative z-10 flex items-center justify-between gap-2 p-5">
      <span class="font-expressive text-sm font-black leading-tight text-white">{{ label }}</span>
      <svg class="h-4 w-4 shrink-0 text-white/80 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  to: { type: String, required: true },
  imgSrc: { type: String, required: true },
  alt: { type: String, required: true },
  label: { type: String, required: true },
  variant: { type: String, default: 'emergency' }
})

// Per-variant expressive tile modifier classes (organic corner treatments)
const VARIANT_CLASS = {
  emergency: 'expressive-tile--emergency',
  map: 'expressive-tile--map',
  guides: 'expressive-tile--guides',
  report: 'expressive-tile--report'
}

const variantClass = computed(() => VARIANT_CLASS[props.variant] || '')
</script>
