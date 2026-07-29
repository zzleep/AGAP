<template>
  <div class="space-y-3">
    <!-- Hero Weather Card (Adaptive Material 3 Expressive Hero Surface) -->
    <section
      :class="[
        'p-5 text-white shadow-m3-md border border-white/10 rounded-[2rem] transition-all duration-700 ease-in-out overflow-hidden relative space-y-3.5',
        activeTheme.bgClass
      ]"
    >
      <!-- Background Ambient Glow Effect -->
      <div class="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-white/10 blur-3xl pointer-events-none z-0"></div>

      <!-- Santa Rosa Arch Background Landmark Watermark (Seamless, Dynamic Theme Tinted) -->
      <svg
        class="absolute right-2 -bottom-1 w-20 h-auto opacity-15 pointer-events-none z-0 transition-colors duration-700"
        :class="activeTheme.archFill || 'text-white'"
        viewBox="0 0 200 230"
        fill="currentColor"
        aria-hidden="true"
      >
        <!-- Santa Rosa Arch Silhouette Path (3 Top Windows, Arch Vault & Column Bases) -->
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M 20 10 H 180 V 195 H 145 V 200 H 180 V 230 H 145 V 110 A 45 45 0 0 0 55 110 V 230 H 20 V 200 H 55 V 195 H 20 Z M 50 25 H 78 V 39 H 50 Z M 86 25 H 114 V 39 H 86 Z M 122 25 H 150 V 39 H 122 Z"
        />
      </svg>

      <!-- Top Hero Row: Icon + Temp + Condition Stack & High-Value Stat -->
      <div class="flex items-center justify-between gap-2.5 relative z-10">
        <!-- Weather Badge Icon + Temperature & Condition Stack -->
        <div class="flex items-center gap-3 min-w-0">
          <!-- M3 Organic Icon Badge (Strict 48px Container & 24px SVG) -->
          <div
            :class="[
              'w-12 h-12 p-2.5 rounded-2xl flex items-center justify-center shadow-m3-sm shrink-0 transition-all duration-500',
              activeTheme.badgeBg
            ]"
          >
            <!-- 1. Sun Icon (Clear Day) -->
            <svg v-if="activeTheme.iconType === 'sun'" class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>

            <!-- 2. Crescent Moon Icon (Calm Night) -->
            <svg v-else-if="activeTheme.iconType === 'moon'" class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>

            <!-- 3. Rain Icon (Showers / Rain) -->
            <svg v-else-if="activeTheme.iconType === 'rain'" class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M7 16a4 4 0 010-8 5.5 5.5 0 0110.5 1.5A3.5 3.5 0 1118 16H7zm2 3v2m4-2v2m4-2v2" />
            </svg>

            <!-- 4. Thunderstorm Icon (Storm / Heavy Rain) -->
            <svg v-else-if="activeTheme.iconType === 'thunderstorm'" class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>

            <!-- 5. Cool Breeze Icon (Cold Weather <= 24°C) -->
            <svg v-else-if="activeTheme.iconType === 'breeze'" class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 16c.85 0 1.574-.46 1.9-1.12" />
            </svg>

            <!-- 6. Heat Icon (Extreme Heat >= 33°C) -->
            <svg v-else-if="activeTheme.iconType === 'heat'" class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M17.657 18.364A8 8 0 016.343 7.05m11.314 11.314a8 8 0 00-11.314-11.314m11.314 11.314L6.343 7.05" />
            </svg>

            <!-- 7. Cloudy Icon (Overcast) -->
            <svg v-else class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>

          <div class="min-w-0">
            <div class="flex flex-col gap-1.5 min-w-0">
              <span :class="['font-expressive text-3xl font-black tracking-tight leading-none shrink-0', activeTheme.tempColor]">
                {{ currentTemp }}
              </span>
              <h2 class="font-expressive text-base font-black tracking-tight text-white leading-tight line-clamp-1">
                {{ weatherCondition }}
              </h2>
            </div>
            <span :class="['text-[10px] font-black uppercase tracking-widest block mt-0.5', activeTheme.subtitleColor]">
              Santa Rosa City
            </span>
          </div>
        </div>

        <!-- Top Right: High-Value Context Chip (Risk Badge if elevated; Humidity if normal) -->
        <div class="shrink-0">
          <span
            v-if="weather.riskCategory !== 'watch'"
            :class="[
              'rounded-full px-3 py-1 text-xs font-black tracking-wide shadow-m3-sm uppercase',
              weather.riskCategory === 'danger' ? 'bg-[#D14D3E] text-white animate-pulse' : 'bg-[#F7FB41] text-[#902715]'
            ]"
          >
            {{ weather.riskCategory }} Risk
          </span>
          <span v-else class="text-xs font-black text-white/90 px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-xs border border-white/10 shrink-0">
            Humidity {{ weather.currentWeather.humidity || 85 }}%
          </span>
        </div>
      </div>

      <!-- Bottom: Direct Plain-Language Citizen Guidance -->
      <p class="text-xs font-medium text-white/90 leading-snug pt-0.5 relative z-10">
        {{ citizenAdvice }}
      </p>
    </section>

    <!-- Stay Ready Header Block (Compact Tight Spacing) -->
    <div class="pt-0.5">
      <h2 class="font-expressive text-xl font-black tracking-tight text-[#0A0A0A]">{{ $t('home.stayReady') }}</h2>
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

// ── Plain-Language Citizen Safety Guidance ──
const citizenAdvice = computed(() => {
  const rate = weather.rainfallRate || 0
  const risk = weather.riskCategory
  if (risk === 'danger' || rate >= 15) {
    return 'Possible flooding in low-lying barangays. Avoid submerged roads & stay on high ground.'
  }
  if (risk === 'warning' || rate > 0) {
    return 'Expect light to moderate rain showers. Drive carefully on wet streets.'
  }
  if (weatherThemeKey.value === 'heat') {
    return 'High heat index today. Stay hydrated and avoid prolonged direct sun exposure.'
  }
  if (weatherThemeKey.value === 'cold') {
    return 'Cool & breezy weather across Santa Rosa. Pleasant outdoor conditions.'
  }
  if (isNight.value) {
    return 'Calm night skies. City emergency response teams remain on 24/7 standby.'
  }
  return 'Roads & evacuation routes are clear. Safe conditions across Santa Rosa City.'
})

// ── Adaptive Weather Theme Logic (Time of Day + Weather Condition + Temp) ──
const isNight = computed(() => {
  const icon = weather.currentWeather.icon || ''
  if (icon.endsWith('n')) return true
  const hour = new Date().getHours()
  return hour < 6 || hour >= 18
})

const weatherThemeKey = computed(() => {
  const cond = (weather.currentWeather.condition || '').toLowerCase()
  const temp = weather.currentWeather.temp ?? 28
  const rainfall = weather.rainfallRate || 0

  if (cond.includes('thunder') || cond.includes('storm') || rainfall >= 15) {
    return 'thunderstorm'
  }
  if (cond.includes('rain') || cond.includes('drizzle') || rainfall > 0) {
    return 'rain'
  }
  if (temp <= 24) {
    return 'cold'
  }
  if (temp >= 33) {
    return 'heat'
  }
  if (isNight.value) {
    return 'clear_night'
  }
  if (cond.includes('cloud')) {
    return 'cloudy'
  }
  return 'clear_day'
})

const THEMES = {
  thunderstorm: {
    bgClass: 'bg-gradient-to-br from-[#3D0C1A] via-[#902715] to-[#1F3A4B]',
    badgeBg: 'bg-[#F7FB41] text-[#902715]',
    tempColor: 'text-[#F7FB41]',
    subtitleColor: 'text-white/80',
    iconType: 'thunderstorm',
    archFill: 'text-[#F7FB41]'
  },
  rain: {
    bgClass: 'bg-gradient-to-br from-[#122B38] via-[#1F3A4B] to-[#2A4D64]',
    badgeBg: 'bg-[#E3EBF0] text-[#1F3A4B]',
    tempColor: 'text-[#F7FB41]',
    subtitleColor: 'text-white/80',
    iconType: 'rain',
    archFill: 'text-[#E3EBF0]'
  },
  cold: {
    bgClass: 'bg-gradient-to-br from-[#0F232E] via-[#1A3848] to-[#2D546B]',
    badgeBg: 'bg-[#70D6FF] text-[#0F232E]',
    tempColor: 'text-[#70D6FF]',
    subtitleColor: 'text-white/80',
    iconType: 'breeze',
    archFill: 'text-[#70D6FF]'
  },
  heat: {
    bgClass: 'bg-gradient-to-br from-[#7A1D0B] via-[#902715] to-[#D14D3E]',
    badgeBg: 'bg-[#F7FB41] text-[#902715]',
    tempColor: 'text-[#F7FB41]',
    subtitleColor: 'text-white/90',
    iconType: 'heat',
    archFill: 'text-[#F7FB41]'
  },
  clear_night: {
    bgClass: 'bg-gradient-to-br from-[#0A1118] via-[#142332] to-[#1F3A4B]',
    badgeBg: 'bg-[#F7FB41] text-[#0A1118]',
    tempColor: 'text-[#F7FB41]',
    subtitleColor: 'text-white/80',
    iconType: 'moon',
    archFill: 'text-[#F7FB41]'
  },
  cloudy: {
    bgClass: 'bg-gradient-to-br from-[#2C3E50] via-[#1F3A4B] to-[#4A6572]',
    badgeBg: 'bg-[#E3EBF0] text-[#1F3A4B]',
    tempColor: 'text-white',
    subtitleColor: 'text-white/80',
    iconType: 'cloud',
    archFill: 'text-[#E3EBF0]'
  },
  clear_day: {
    bgClass: 'bg-gradient-to-br from-[#902715] via-[#A8321A] to-[#D14D3E]',
    badgeBg: 'bg-[#F7FB41] text-[#902715]',
    tempColor: 'text-[#F7FB41]',
    subtitleColor: 'text-white/90',
    iconType: 'sun',
    archFill: 'text-[#F7FB41]'
  }
}

const activeTheme = computed(() => THEMES[weatherThemeKey.value] || THEMES.clear_day)

onMounted(() => {
  weather.fetchWeather()
})
</script>
