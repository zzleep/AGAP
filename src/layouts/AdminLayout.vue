<template>
  <div class="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
    <!-- Top Global Connectivity Banner -->
    <ConnectivityBanner />

    <div class="flex-1 flex flex-col md:flex-row">
      <!-- Admin Sidebar / Header Navigation -->
      <aside class="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        <div class="p-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-xl shadow-lg">
              A
            </div>
            <div>
              <h2 class="font-bold text-sm text-white tracking-wide">AGAP DISPATCH</h2>
              <p class="text-[10px] text-slate-400">Santa Rosa CDRRMO Portal</p>
            </div>
          </div>
          <span class="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-red-950 text-red-400 border border-red-800/50">
            Operator
          </span>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
          <router-link
            to="/admin/sos-feed"
            active-class="bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 font-semibold"
            class="flex items-center space-x-3 px-3 py-2.5 rounded text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <span>Live SOS Feed</span>
          </router-link>

          <router-link
            to="/admin/community-reports"
            active-class="bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 font-semibold"
            class="flex items-center space-x-3 px-3 py-2.5 rounded text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span>Community Reports</span>
          </router-link>

          <router-link
            to="/admin/hotspot-map"
            active-class="bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 font-semibold"
            class="flex items-center space-x-3 px-3 py-2.5 rounded text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.782V8.018a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
            <span>Hotspot Density Map</span>
          </router-link>

          <router-link
            to="/admin/aegis"
            active-class="bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 font-semibold"
            class="flex items-center space-x-3 px-3 py-2.5 rounded text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            <span>Aegis AI Advisory</span>
          </router-link>

          <router-link
            to="/admin/insights"
            active-class="bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 font-semibold"
            class="flex items-center space-x-3 px-3 py-2.5 rounded text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span>Insight Dashboard</span>
          </router-link>
        </nav>

        <!-- User Profile & Logout -->
        <div class="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div class="truncate">
            <p class="text-xs font-semibold text-white truncate">{{ auth.profile?.display_name || auth.user?.email || 'Operator' }}</p>
            <p class="text-[10px] text-slate-400 capitalize">Area: <span class="text-slate-200 font-medium">{{ auth.assignedArea }}</span> • <span class="text-slate-400">{{ auth.userRole }}</span></p>
          </div>
          <button
            @click="handleLogout"
            class="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-2 shrink-0"
            title="Logout"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>
      </aside>

      <!-- Main Admin Content Area -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import ConnectivityBanner from '@/components/common/ConnectivityBanner.vue'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  router.push('/admin/login')
}
</script>
