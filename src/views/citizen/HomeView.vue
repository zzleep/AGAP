<template>
  <div class="space-y-4">
    <!-- Toast Notification Banner -->
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
      <div v-if="toastMessage" class="p-3 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-lg flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span>{{ toastMessage }}</span>
        </div>
      </div>
    </transition>

    <!-- Weather & Alert Banner -->
    <div class="p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-md">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs uppercase font-bold tracking-wider text-slate-400">{{ $t('home.currentWeather') }}</span>
        <span :class="['px-2.5 py-0.5 text-xs font-bold rounded-full border uppercase', weather.riskBadgeClass]">
          {{ $t('common.' + weather.riskCategory) }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-black text-white">{{ weather.currentWeather.temp }}°C</h2>
          <p class="text-xs text-slate-300 font-medium">{{ weather.currentWeather.condition }}</p>
        </div>
        <div class="text-right">
          <p class="text-sm font-bold text-amber-400">{{ weather.rainfallRate }} mm/hr</p>
          <p class="text-[11px] text-slate-400">{{ $t('home.rainfallRate') }}</p>
        </div>
      </div>
    </div>

    <!-- GPS Location Card with Refresh Control -->
    <div class="p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-md space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div>
            <h3 class="font-bold text-sm text-white">{{ $t('home.currentLocation') }}</h3>
            <p class="text-[11px] text-slate-400">{{ $t('home.cachedGps') }}</p>
          </div>
        </div>

        <button
          @click="handleRefreshLocation"
          :disabled="isLocating"
          class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow disabled:opacity-50 flex items-center space-x-1"
        >
          <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': isLocating }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          <span>{{ isLocating ? $t('home.locating') : $t('home.refreshLocation') }}</span>
        </button>
      </div>

      <div v-if="cachedLocation" class="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-900/60 text-xs border border-slate-700/50">
        <div>
          <span class="text-slate-500 text-[10px] block">{{ $t('home.barangay') }}</span>
          <span class="font-semibold text-slate-200">{{ cachedLocation.barangay || 'Tagapo' }}</span>
        </div>
        <div>
          <span class="text-slate-500 text-[10px] block">{{ $t('home.coordinates') }}</span>
          <span class="font-mono text-slate-200">{{ cachedLocation.latitude.toFixed(4) }}, {{ cachedLocation.longitude.toFixed(4) }}</span>
        </div>
      </div>
      <div v-else class="text-xs text-slate-400 p-2 text-center">
        {{ $t('home.noCachedLocation') }}
      </div>
    </div>

    <!-- Quick SOS Trigger Card -->
    <div class="p-5 rounded-xl bg-gradient-to-br from-red-950/80 to-slate-900 border border-red-800/60 shadow-lg text-center space-y-3">
      <h3 class="text-lg font-extrabold text-white">{{ $t('home.emergencyAssistance') }}</h3>
      <p class="text-xs text-slate-300">
        {{ $t('home.emergencyDescription') }}
      </p>
      <router-link
        to="/app/sos"
        class="inline-flex items-center justify-center w-full py-3.5 px-6 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-base tracking-wide shadow-red-900/50 shadow-lg transition-transform active:scale-95"
      >
        <svg class="w-6 h-6 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        {{ $t('home.triggerSos') }}
      </router-link>
    </div>

    <!-- Features Grid -->
    <div class="grid grid-cols-2 gap-3">
      <router-link
        to="/app/map"
        class="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors flex flex-col justify-between"
      >
        <div class="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.782V8.018a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
        </div>
        <div>
          <h4 class="font-bold text-sm text-white">{{ $t('home.evacuationRoutes') }}</h4>
          <p class="text-[11px] text-slate-400 mt-0.5">{{ $t('home.flowEnginePaths') }}</p>
        </div>
      </router-link>

      <router-link
        to="/app/guides"
        class="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors flex flex-col justify-between"
      >
        <div class="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
        </div>
        <div>
          <h4 class="font-bold text-sm text-white">{{ $t('home.disasterGuides') }}</h4>
          <p class="text-[11px] text-slate-400 mt-0.5">{{ $t('home.offlineSops') }}</p>
        </div>
      </router-link>

      <router-link
        to="/app/flow"
        class="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors flex flex-col justify-between"
      >
        <div class="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center mb-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15c3-3 6-3 9 0s6 3 9 0M3 9c3-3 6-3 9 0s6 3 9 0"/></svg>
        </div>
        <div>
          <h4 class="font-bold text-sm text-white">{{ $t('home.flowEngine') }}</h4>
          <p class="text-[11px] text-slate-400 mt-0.5">{{ $t('home.rainfallRisk') }}</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useWeatherStore } from '@/stores/weatherStore'
import { useGPS } from '@/composables/useGPS'

const weather = useWeatherStore()
const { cachedLocation, isLocating, toastMessage, refreshLocation } = useGPS()

onMounted(() => {
  weather.fetchWeather()
})

async function handleRefreshLocation() {
  await refreshLocation(true)
}
</script>
