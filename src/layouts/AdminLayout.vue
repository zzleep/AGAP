<template>
  <div class="min-h-screen flex flex-col bg-[#EEF4FB] text-[#0A0A0A] selection:bg-[#1F3A4B] selection:text-white">
    <!-- Top Global Connectivity Banner -->
    <ConnectivityBanner v-if="route.name !== 'admin-login'" />

    <!-- Admin Header (Light Glass M3 Expressive Shell) -->
    <header
      v-if="route.name !== 'admin-login'"
      class="bg-white/85 backdrop-blur-xl border-b border-[#1F3A4B]/10 sticky top-0 z-40 shadow-[0_4px_20px_rgba(31,58,75,0.06)]"
    >
      <div class="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <!-- AGAP Logo + Branding -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#902715] flex items-center justify-center p-2 shadow-md shrink-0">
            <img src="/agap icon.svg" alt="AGAP" class="h-full w-auto object-contain filter brightness-200" />
          </div>
          <div class="hidden sm:block">
            <h2 class="font-expressive text-base font-black text-[#1F3A4B] leading-none tracking-tight">CDRRMO Dispatch</h2>
            <p class="text-[11px] text-[#902715] font-extrabold tracking-wide uppercase mt-0.5">Santa Rosa City</p>
          </div>
        </div>

        <!-- Operator Info + Logout -->
        <div class="flex items-center gap-3">
          <div class="hidden md:block text-right">
            <p class="text-xs font-black text-[#1F3A4B] truncate max-w-[140px]">
              {{ auth.profile?.display_name || auth.user?.email || 'Operator' }}
            </p>
            <p class="text-[10px] text-[#717171] font-bold capitalize">
              {{ auth.assignedArea }} · {{ auth.userRole }}
            </p>
          </div>
          <span class="px-3.5 py-1 text-[10px] uppercase font-black rounded-full bg-[#1F3A4B] text-white tracking-wider shadow-sm">
            Operator
          </span>
          <button
            @click="handleLogout"
            class="p-2 rounded-full hover:bg-[#902715]/15 text-[#902715] transition-colors"
            title="Logout"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- M3 Expressive Horizontal Nav Rail with High-Contrast Active Tabs -->
      <nav class="w-full px-4 sm:px-6 lg:px-8 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        <router-link
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="admin-nav-pill flex items-center gap-2 px-4 py-2.5 text-xs font-black whitespace-nowrap transition-all duration-200"
          :class="isActive(tab.to)
            ? 'bg-[#902715] text-white shadow-[0_6px_18px_rgba(144,39,21,0.35)] scale-[1.02]'
            : 'text-[#1F3A4B] bg-white hover:bg-[#EEF4FB] hover:text-[#902715] border border-[#1F3A4B]/15'"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          <span>{{ tab.label }}</span>
        </router-link>
      </nav>
    </header>

    <!-- Main Admin Content Area (Expanded Edge-to-Edge Full Width) -->
    <main
      :class="[
        'flex-1 w-full',
        route.name === 'admin-login' ? '' : 'px-4 sm:px-6 lg:px-8 py-6'
      ]"
    >
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import ConnectivityBanner from '@/components/common/ConnectivityBanner.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

function isActive(path) {
  return route.path.startsWith(path)
}

// SVG Icon Components (matching citizen-side pattern — no emojis)
const LightningIcon = {
  render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', class: 'w-4 h-4' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2.2', d: 'M13 10V3L4 14h7v7l9-11h-7z' })
  ])
}
const DocumentIcon = {
  render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', class: 'w-4 h-4' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2.2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
  ])
}
const MapIcon = {
  render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', class: 'w-4 h-4' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2.2', d: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.782V8.018a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' })
  ])
}
const ShieldIcon = {
  render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', class: 'w-4 h-4' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2.2', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' })
  ])
}
const ChartIcon = {
  render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', class: 'w-4 h-4' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2.2', d: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' })
  ])
}

const tabs = [
  { to: '/admin/sos-feed', label: 'Live SOS', icon: LightningIcon },
  { to: '/admin/community-reports', label: 'Reports', icon: DocumentIcon },
  { to: '/admin/hotspot-map', label: 'Hotspot Map', icon: MapIcon },
  { to: '/admin/aegis', label: 'Aegis AI', icon: ShieldIcon },
  { to: '/admin/insights', label: 'Insights', icon: ChartIcon }
]

async function handleLogout() {
  await auth.logout()
  router.push('/admin/login')
}
</script>