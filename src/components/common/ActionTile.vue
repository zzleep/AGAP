<template>
  <router-link
    :to="to"
    :class="[
      'expressive-tile group relative flex flex-col justify-between space-y-4 p-5 overflow-hidden rounded-[2rem] shadow-m3-md transition-all duration-300 ease-out hover:scale-[1.02]',
      config.bgClass
    ]"
  >
    <!-- Background Watermark SVG (Function-Matched Design, styled like Santa Rosa Arch in Weather Card) -->
    <svg
      class="absolute -right-3 -bottom-3 w-28 h-28 pointer-events-none z-0 transition-opacity duration-300 group-hover:opacity-25"
      :class="config.watermarkClass"
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      <!-- 1. Emergency SOS Watermark: SOS Beacon Shield with Exclamation -->
      <g v-if="variant === 'emergency'">
        <path d="M50 5 L85 20 V50 C85 72 50 95 50 95 C50 95 15 72 15 50 V20 Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round" />
        <path d="M50 28 V56" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
        <circle cx="50" cy="72" r="5" fill="currentColor" />
      </g>

      <!-- 2. Evacuation Routes Watermark: Map Compass Waypoint Grid -->
      <g v-else-if="variant === 'map'">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="6" />
        <path d="M50 10 V90 M10 50 H90" stroke="currentColor" stroke-width="4" stroke-dasharray="6 6" />
        <polygon points="50,22 62,50 50,42 38,50" fill="currentColor" />
        <polygon points="50,78 62,50 50,58 38,50" opacity="0.6" fill="currentColor" />
      </g>

      <!-- 3. Disaster Guides Watermark: Open Survival Manual & Bookmark -->
      <g v-else-if="variant === 'guides'">
        <path d="M15 20 C30 15 45 22 50 25 C55 22 70 15 85 20 V80 C70 75 55 82 50 85 C45 82 30 75 15 80 Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round" />
        <path d="M50 25 V85" stroke="currentColor" stroke-width="5" />
        <path d="M62 18 V50 L70 42 L78 50 V18 Z" fill="currentColor" opacity="0.8" />
      </g>

      <!-- 4. Report Issue Watermark: Megaphone Broadcast & Alert Badge -->
      <g v-else-if="variant === 'report'">
        <path d="M20 40 L55 25 V75 L20 60 Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round" />
        <path d="M55 35 L85 20 V80 L55 65" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round" />
        <path d="M30 60 V80 C30 85 40 85 40 80 V65" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
        <path d="M88 40 C93 46 93 54 88 60" stroke="currentColor" stroke-width="6" stroke-linecap="round" fill="none" />
      </g>
    </svg>

    <!-- Top Row: M3 Organic Badge Icon (Foreground Action Cue) -->
    <div class="relative z-10 flex items-center justify-between">
      <div
        :class="[
          'expressive-icon flex h-11 w-11 items-center justify-center rounded-2xl shadow-m3-sm shrink-0',
          config.badgeClass
        ]"
      >
        <!-- SOS Badge Icon -->
        <svg v-if="variant === 'emergency'" class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>

        <!-- Map Badge Icon -->
        <svg v-else-if="variant === 'map'" class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.782V8.018a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>

        <!-- Guides Badge Icon -->
        <svg v-else-if="variant === 'guides'" class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>

        <!-- Report Badge Icon -->
        <svg v-else-if="variant === 'report'" class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
    </div>

    <!-- Bottom Row: Action Label + Arrow -->
    <div class="relative z-10 flex items-center justify-between gap-2">
      <span :class="['font-expressive text-sm font-black leading-tight', config.textClass]">{{ label }}</span>
      <svg :class="['h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1', config.arrowClass]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  to: { type: String, required: true },
  label: { type: String, required: true },
  variant: { type: String, default: 'emergency' }
})

// Variant Configuration mapping solid surface colors, badges, and watermark opacity styles
const CONFIGS = {
  emergency: {
    bgClass: 'bg-[#902715] hover:bg-[#7a2012]',
    badgeClass: 'bg-[#F7FB41] text-[#902715]',
    textClass: 'text-white',
    arrowClass: 'text-white/80',
    watermarkClass: 'opacity-15 text-white'
  },
  map: {
    bgClass: 'bg-[#1F3A4B] hover:bg-[#182e3b]',
    badgeClass: 'bg-[#E3EBF0] text-[#1F3A4B]',
    textClass: 'text-white',
    arrowClass: 'text-white/80',
    watermarkClass: 'opacity-15 text-white'
  },
  guides: {
    bgClass: 'bg-[#EAE4D9] border border-[#E2DDD3] hover:bg-[#dfd8cc]',
    badgeClass: 'bg-[#902715] text-white',
    textClass: 'text-[#0A0A0A]',
    arrowClass: 'text-[#902715]',
    watermarkClass: 'opacity-15 text-[#902715]'
  },
  report: {
    bgClass: 'bg-[#D14D3E] hover:bg-[#b83f32]',
    badgeClass: 'bg-[#FDF6E2] text-[#D14D3E]',
    textClass: 'text-white',
    arrowClass: 'text-white/80',
    watermarkClass: 'opacity-15 text-white'
  }
}

const config = computed(() => CONFIGS[props.variant] || CONFIGS.emergency)
</script>
