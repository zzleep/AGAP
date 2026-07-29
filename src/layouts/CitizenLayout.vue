<template>
  <div class="min-h-screen flex flex-col bg-[#F5F5F5] text-[#0A0A0A] font-sans selection:bg-[#902715] selection:text-white">
    <!-- Top Global Connectivity Banner -->
    <ConnectivityBanner />

    <!-- Citizen Header (Standard M3 Light Surface Header with Safe Area Inset) -->
    <header class="bg-white/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-40 px-4 pb-3 shadow-m3-sm" style="padding-top: calc(0.75rem + env(safe-area-inset-top, 0px));">
      <div class="max-w-md mx-auto flex items-center justify-between">
        <router-link to="/app" class="flex items-center group">
          <img src="/agap icon.svg" alt="AGAP" class="h-10 w-auto object-contain flex-shrink-0 transition-transform group-hover:scale-105" />
        </router-link>

        <div class="flex items-center space-x-2">
          <router-link
            to="/app/settings"
            v-slot="{ isActive }"
            class="group flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#902715]/20"
            :title="$t('nav.settings')"
            aria-label="Settings"
          >
            <div
              :class="[
                'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200',
                isActive
                  ? 'bg-[#902715]/15 text-[#902715] scale-105 shadow-m3-sm'
                  : 'bg-[#EBEBEB] text-[#717171] hover:bg-[#E0E0E0] hover:text-[#0A0A0A]'
              ]"
            >
              <svg class="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main :class="['flex-1 max-w-md mx-auto w-full p-4', isSetupRoute ? 'pb-6' : 'pb-16']">
      <router-view />
    </main>

    <!-- Citizen Bottom Navigation Floating Glass Dock -->
    <div v-if="!isSetupRoute" class="fixed left-0 right-0 z-50 px-4 pointer-events-none" style="bottom: calc(0.25rem + env(safe-area-inset-bottom, 0px));">
      <nav class="max-w-md mx-auto glass-dock rounded-full p-2 flex items-center justify-around pointer-events-auto shadow-m3-lg">
        <router-link
          to="/app"
          v-slot="{ isExactActive }"
          class="relative flex flex-col items-center py-1.5 px-1 sm:px-2.5 rounded-full transition-all duration-200"
        >
          <div :class="[
            'flex flex-col items-center justify-center transition-all',
            isExactActive ? 'text-[#902715]' : 'text-[#717171] hover:text-[#0A0A0A]'
          ]">
            <div :class="[
              'w-10 h-7 rounded-full flex items-center justify-center mb-0.5 transition-all',
              isExactActive ? 'bg-[#902715]/15 scale-105' : 'bg-transparent'
            ]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 00-1 1m-6 0h6"/></svg>
            </div>
            <span class="text-[10px] font-bold tracking-tight whitespace-nowrap">{{ $t('nav.home') }}</span>
          </div>
        </router-link>

        <router-link
          to="/app/sos"
          v-slot="{ isActive }"
          class="relative flex flex-col items-center py-1.5 px-1 sm:px-2.5 rounded-full transition-all duration-200"
        >
          <div :class="[
            'flex flex-col items-center justify-center transition-all',
            isActive ? 'text-[#902715]' : 'text-[#717171] hover:text-[#902715]'
          ]">
            <div :class="[
              'w-10 h-7 rounded-full flex items-center justify-center mb-0.5 transition-all relative',
              isActive ? 'bg-[#902715] text-[#F7FB41] shadow-m3-sm scale-105' : 'bg-transparent text-[#902715]'
            ]">
              <span v-if="isActive" class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#902715] animate-ping"></span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <span :class="[
              'text-[10px] font-bold tracking-tight whitespace-nowrap',
              isActive ? 'text-[#902715]' : 'text-[#717171]'
            ]">{{ $t('nav.sos') }}</span>
          </div>
        </router-link>

        <router-link
          to="/app/map"
          v-slot="{ isActive }"
          class="relative flex flex-col items-center py-1.5 px-1 sm:px-2.5 rounded-full transition-all duration-200"
        >
          <div :class="[
            'flex flex-col items-center justify-center transition-all',
            isActive ? 'text-[#902715]' : 'text-[#717171] hover:text-[#0A0A0A]'
          ]">
            <div :class="[
              'w-10 h-7 rounded-full flex items-center justify-center mb-0.5 transition-all',
              isActive ? 'bg-[#902715]/15 scale-105' : 'bg-transparent'
            ]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.782V8.018a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
            </div>
            <span class="text-[10px] font-bold tracking-tight whitespace-nowrap">{{ $t('nav.evacMap') }}</span>
          </div>
        </router-link>

        <router-link
          to="/app/guides"
          v-slot="{ isActive }"
          class="relative flex flex-col items-center py-1.5 px-1 sm:px-2.5 rounded-full transition-all duration-200"
        >
          <div :class="[
            'flex flex-col items-center justify-center transition-all',
            isActive ? 'text-[#902715]' : 'text-[#717171] hover:text-[#0A0A0A]'
          ]">
            <div :class="[
              'w-10 h-7 rounded-full flex items-center justify-center mb-0.5 transition-all',
              isActive ? 'bg-[#902715]/15 scale-105' : 'bg-transparent'
            ]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
            <span class="text-[10px] font-bold tracking-tight whitespace-nowrap">{{ $t('nav.guides') }}</span>
          </div>
        </router-link>

        <router-link
          to="/app/report"
          v-slot="{ isActive }"
          class="relative flex flex-col items-center py-1.5 px-1 sm:px-2.5 rounded-full transition-all duration-200"
        >
          <div :class="[
            'flex flex-col items-center justify-center transition-all',
            isActive ? 'text-[#902715]' : 'text-[#717171] hover:text-[#0A0A0A]'
          ]">
            <div :class="[
              'w-10 h-7 rounded-full flex items-center justify-center mb-0.5 transition-all',
              isActive ? 'bg-[#902715]/15 scale-105' : 'bg-transparent'
            ]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </div>
            <span class="text-[10px] font-bold tracking-tight whitespace-nowrap">{{ $t('nav.report') }}</span>
          </div>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ConnectivityBanner from '@/components/common/ConnectivityBanner.vue'
import { useSOS } from '@/composables/useSOS'
import { useGPS } from '@/composables/useGPS'
import { useLocaleStore } from '@/stores/localeStore'

const route = useRoute()
const isSetupRoute = computed(() => route.path === '/app/setup' || route.name === 'citizen-setup')

const localeStore = useLocaleStore()
const { warmConnection } = useSOS()
const { initGPS, startBackgroundRefresh } = useGPS()

onMounted(() => {
  localeStore.initLocale()
  warmConnection()
  initGPS()
  startBackgroundRefresh()
})
</script>
