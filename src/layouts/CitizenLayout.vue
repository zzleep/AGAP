<template>
  <div class="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-blue-600 selection:text-white">
    <!-- Top Global Connectivity Banner -->
    <ConnectivityBanner />

    <!-- Citizen Header -->
    <header class="bg-slate-800/90 backdrop-blur-md border-b border-slate-700/80 sticky top-0 z-40 px-4 py-3 shadow-md">
      <div class="max-w-md mx-auto flex items-center justify-between">
        <router-link to="/app" class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
            A
          </div>
          <div>
            <h1 class="font-bold text-base leading-tight tracking-wide text-white">AGAP</h1>
            <p class="text-[10px] text-slate-400 leading-tight">{{ $t('citizenHeader.subtitle') }}</p>
          </div>
        </router-link>

        <div class="flex items-center space-x-2">
          <router-link
            to="/admin/login"
            class="text-xs px-2.5 py-1 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-300 border border-slate-600/50 transition-colors"
          >
            {{ $t('citizenHeader.operatorPortal') }}
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-md mx-auto w-full pb-20 p-4">
      <router-view />
    </main>

    <!-- Citizen Bottom Navigation Bar -->
    <nav class="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-md border-t border-slate-700/80 z-40 px-2 py-2">
      <div class="max-w-md mx-auto flex items-center justify-around">
        <router-link
          to="/app"
          exact-active-class="text-blue-400 font-semibold"
          class="flex flex-col items-center text-slate-400 text-xs hover:text-slate-200 transition-colors py-1 px-2"
        >
          <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 00-1 1m-6 0h6"/></svg>
          <span>{{ $t('nav.home') }}</span>
        </router-link>

        <router-link
          to="/app/sos"
          exact-active-class="text-red-500 font-bold"
          class="flex flex-col items-center text-red-400 text-xs hover:text-red-300 transition-colors py-1 px-2 relative"
        >
          <span class="absolute -top-1 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <span>{{ $t('nav.sos') }}</span>
        </router-link>

        <router-link
          to="/app/map"
          exact-active-class="text-blue-400 font-semibold"
          class="flex flex-col items-center text-slate-400 text-xs hover:text-slate-200 transition-colors py-1 px-2"
        >
          <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.782V8.018a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
          <span>{{ $t('nav.evacMap') }}</span>
        </router-link>

        <router-link
          to="/app/guides"
          exact-active-class="text-blue-400 font-semibold"
          class="flex flex-col items-center text-slate-400 text-xs hover:text-slate-200 transition-colors py-1 px-2"
        >
          <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          <span>{{ $t('nav.guides') }}</span>
        </router-link>

        <router-link
          to="/app/report"
          exact-active-class="text-blue-400 font-semibold"
          class="flex flex-col items-center text-slate-400 text-xs hover:text-slate-200 transition-colors py-1 px-2"
        >
          <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          <span>{{ $t('nav.report') }}</span>
        </router-link>

        <button
          @click="toggleLanguage"
          class="flex flex-col items-center text-slate-400 hover:text-slate-200 transition-colors py-1 px-2 text-xs"
          :title="$t('nav.language')"
        >
          <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span class="font-bold">{{ locale === 'fil' ? 'FIL' : 'EN' }}</span>
        </button>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ConnectivityBanner from '@/components/common/ConnectivityBanner.vue'
import { useSOS } from '@/composables/useSOS'
import { useGPS } from '@/composables/useGPS'
import { useLocaleStore } from '@/stores/localeStore'

const { locale } = useI18n()
const localeStore = useLocaleStore()
const { warmConnection } = useSOS()
const { initGPS, startBackgroundRefresh } = useGPS()

function toggleLanguage() {
  const next = locale.value === 'fil' ? 'en' : 'fil'
  localeStore.setLocale(next)
}

onMounted(() => {
  localeStore.initLocale()
  warmConnection()
  initGPS()
  startBackgroundRefresh()
})
</script>
