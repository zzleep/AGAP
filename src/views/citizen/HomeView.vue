<template>
  <div class="space-y-5">
    <!-- Hero Weather Warning Card (Material 3 Expressive Bento Hero Layout) -->
    <section class="rain-alert p-5 text-white shadow-m3-md border border-white/10 bg-[#902715]">
      <div class="flex items-start justify-between gap-3">
        <!-- Weather Badge Icon + Temperature & Condition Stack -->
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-12 h-12 rounded-2xl bg-[#F7FB41] text-[#902715] flex items-center justify-center shadow-m3-sm shrink-0">
            <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M7 16a4 4 0 010-8 5.5 5.5 0 0110.5 1.5A3.5 3.5 0 1118 16H7zm2 3v1m4-1v1m4-1v1" />
            </svg>
          </div>
          <div class="min-w-0">
            <div class="flex flex-col gap-1">
              <span class="font-expressive text-3xl font-black text-[#F7FB41] tracking-tight leading-none">{{ currentTemp }}</span>
              <h2 class="font-expressive truncate text-lg font-black tracking-tight text-white mt-1 leading-none">{{ weatherCondition }}</h2>
            </div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-white/70">Santa Rosa</span>
          </div>
        </div>

        <!-- Expressive Status Pill Chip -->
        <span :class="['shrink-0 rounded-full px-3.5 py-1.5 text-xs font-black tracking-tight text-center shadow-m3-sm', alertTone]">
          {{ alertCue }}
        </span>
      </div>
    </section>

    <div class="pt-2">
      <h2 class="font-expressive text-2xl font-black tracking-tight text-[#0A0A0A]">{{ $t('home.stayReady') }}</h2>
      <p class="mt-0.5 text-xs font-medium text-[#717171]">{{ $t('home.quickActions') }}</p>
    </div>

    <!-- 2x2 Expressive Action Grid with Earthy Slate Blue Integration -->
    <div class="grid grid-cols-2 gap-3.5">
      <!-- 1. Emergency SOS Tile (Primary High Urgency - Deep Brandy Red + Canary Accent Badge) -->
      <router-link
        to="/app/sos"
        class="expressive-tile expressive-tile--emergency group flex flex-col justify-between space-y-4 bg-[#902715] p-5 shadow-m3-md hover:bg-[#7a2012] transition-colors"
      >
        <div class="expressive-icon expressive-icon--alert flex h-11 w-11 items-center justify-center bg-[#F7FB41] text-[#902715] shadow-m3-sm">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="font-expressive text-sm font-black leading-tight text-white">{{ $t('home.triggerSos') }}</span>
          <svg class="h-4 w-4 shrink-0 text-white/80 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
        </div>
      </router-link>

      <!-- 2. Evacuation Routes Tile (Navigation & Safe Passage - Earthy Slate Blue #1F3A4B + Soft Slate Badge) -->
      <router-link
        to="/app/map"
        class="expressive-tile expressive-tile--map group flex flex-col justify-between space-y-4 bg-[#1F3A4B] p-5 shadow-m3-md hover:bg-[#182e3b] transition-colors"
      >
        <div class="expressive-icon expressive-icon--map flex h-11 w-11 items-center justify-center bg-[#E3EBF0] text-[#1F3A4B] shadow-m3-sm">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.782V8.018a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="font-expressive text-sm font-black leading-tight text-white">{{ $t('home.evacuationRoutes') }}</span>
          <svg class="h-4 w-4 shrink-0 text-white/80 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
        </div>
      </router-link>

      <!-- 3. Disaster Guides Tile (Knowledge & Guidance - Warm Sand Surface + Brandy Red Badge) -->
      <router-link
        to="/app/guides"
        class="expressive-tile expressive-tile--guides group flex flex-col justify-between space-y-4 border border-[#E2DDD3] bg-[#EAE4D9] p-5 shadow-m3-md hover:bg-[#dfd8cc] transition-colors"
      >
        <div class="expressive-icon expressive-icon--book flex h-11 w-11 items-center justify-center bg-[#902715] text-white shadow-m3-sm">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="font-expressive text-sm font-black leading-tight text-[#0A0A0A]">{{ $t('home.disasterGuides') }}</span>
          <svg class="h-4 w-4 shrink-0 text-[#902715] transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
        </div>
      </router-link>

      <!-- 4. Report Issue Tile (Citizen Intake - Rosy Copper Surface + Cream Badge) -->
      <router-link
        to="/app/report"
        class="expressive-tile expressive-tile--report group flex flex-col justify-between space-y-4 bg-[#D14D3E] p-5 shadow-m3-md hover:bg-[#b83f32] transition-colors"
      >
        <div class="expressive-icon expressive-icon--report flex h-11 w-11 items-center justify-center bg-[#FDF6E2] text-[#D14D3E] shadow-m3-sm">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="font-expressive text-sm font-black leading-tight text-white">{{ $t('home.reportIssue') }}</span>
          <svg class="h-4 w-4 shrink-0 text-white/80 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWeatherStore } from '@/stores/weatherStore'

const weather = useWeatherStore()
const { t } = useI18n()

const currentTemp = computed(() => weather.currentWeather.temp ? `${Math.round(weather.currentWeather.temp)}°C` : '28°C')
const weatherCondition = computed(() => weather.currentWeather.condition || t('home.rain'))
const alertCue = computed(() => t(`home.rainCues.${weather.riskCategory}`))
const alertTone = computed(() => ({
  watch: 'bg-white/15 text-white',
  warning: 'bg-[#F7FB41] text-[#902715]',
  danger: 'bg-[#D14D3E] text-white'
}[weather.riskCategory] || 'bg-white/15 text-white'))

onMounted(() => {
  weather.fetchWeather()
})
</script>
