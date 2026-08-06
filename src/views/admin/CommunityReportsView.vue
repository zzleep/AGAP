<template>
  <div class="space-y-6">
    <!-- Header Title & Chime Toggle -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="font-expressive text-3xl font-black text-[#1F3A4B] tracking-tight">Community Incident Reports</h2>
        <p class="text-xs text-[#902715] font-extrabold uppercase tracking-wider mt-0.5">AI Triage Classification, Plausibility Verification & Dispatch Triage</p>
      </div>

      <div class="flex items-center space-x-3">
        <button
          @click="toggleMute"
          :class="[
            'px-4 py-2.5 rounded-full text-xs font-black flex items-center space-x-2 transition-all active:scale-95 shadow-md',
            isMuted
              ? 'bg-[#1F3A4B] text-white'
              : 'bg-[#902715] text-white shadow-[0_4px_14px_rgba(144,39,21,0.3)]'
          ]"
        >
          <svg v-if="isMuted" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
          <svg v-else class="w-4 h-4 text-[#F7FB41] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span>{{ isMuted ? 'Audio Chime Muted' : 'Emergency Audio Chime Active' }}</span>
        </button>
      </div>
    </div>

    <!-- Toast Notification -->
    <div
      v-if="toastMessage"
      class="p-4 rounded-2xl bg-[#EEF4FB] text-[#1F3A4B] border border-[#1F3A4B]/20 text-xs font-black flex items-center justify-between shadow-md"
    >
      <div class="flex items-center space-x-3">
        <svg class="w-5 h-5 text-[#902715] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="toastMessage = ''" class="text-[#902715] underline hover:opacity-75 text-xs font-black px-2 py-0.5">
        Dismiss
      </button>
    </div>

    <!-- High Priority Unread Alert Banner -->
    <div v-if="reportStore.unreadHighPriorityCount > 0" class="p-6 rounded-3xl bg-[#902715] text-white flex items-center justify-between shadow-[0_10px_28px_rgba(144,39,21,0.3)] border border-white/20 transition-all">
      <div class="flex items-center space-x-4">
        <div class="w-12 h-12 rounded-2xl bg-white text-[#902715] flex items-center justify-center font-bold shrink-0 shadow-md">
          <svg class="w-6 h-6 text-[#902715] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h4 class="font-black text-base text-white uppercase tracking-wider">
            High Priority Triage Notice ({{ reportStore.unreadHighPriorityCount }} Unhandled Alert{{ reportStore.unreadHighPriorityCount > 1 ? 's' : '' }})
          </h4>
          <p class="text-xs text-white/90 font-medium mt-0.5">
            One or more community reports are flagged as High/Critical urgency. Please review immediately.
          </p>
        </div>
      </div>
      <button
        @click="filterHighPriority"
        class="px-5 py-2.5 bg-[#F7FB41] hover:bg-[#eae035] text-[#0A0A0A] font-black text-xs rounded-full shadow-md active:scale-95 transition-all shrink-0 uppercase tracking-wider"
      >
        View High Priority
      </button>
    </div>

    <!-- Stat Metric Cards (M3 Expressive Smooth Solid Saturated Blocks) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
      <!-- 1. Total Submissions: Earthy Slate Blue Solid Card -->
      <div class="p-6 admin-stat admin-stat--slate">
        <span class="text-[10px] text-white/80 uppercase font-black block tracking-wider">Total Submissions</span>
        <span class="text-4xl font-black text-white mt-1 block">{{ reportStore.reports.length }}</span>
      </div>

      <!-- 2. Open Triage: Solid Brandy Red Card -->
      <div class="p-6 admin-stat admin-stat--brandy">
        <span class="text-[10px] text-[#F7FB41] uppercase font-black block tracking-wider">Open Triage</span>
        <span class="text-4xl font-black text-white mt-1 block">
          {{ reportStore.reports.filter(r => r.status === 'open').length }}
        </span>
      </div>

      <!-- 3. In Review: Solid Canary Yellow Card -->
      <div class="p-6 admin-stat admin-stat--canary">
        <span class="text-[10px] text-[#0A0A0A]/80 uppercase font-black block tracking-wider">In Review</span>
        <span class="text-4xl font-black text-[#0A0A0A] mt-1 block">
          {{ reportStore.reports.filter(r => r.status === 'in_review').length }}
        </span>
      </div>

      <!-- 4. Suspected Spam: Solid Rosy Copper Card -->
      <div class="p-6 admin-stat admin-stat--copper">
        <span class="text-[10px] text-white/80 uppercase font-black block tracking-wider">Suspected Spam</span>
        <span class="text-4xl font-black text-white mt-1 block">
          {{ reportStore.reports.filter(r => r.ai_plausibility === 'suspected_spam').length }}
        </span>
      </div>
    </div>

    <!-- Multi-Attribute Filter Bar -->
    <div class="p-6 bg-white border border-[#1F3A4B]/15 rounded-3xl space-y-4 shadow-sm admin-card">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1.5 tracking-wider">Search</label>
          <input
            v-model="reportStore.filters.searchQuery"
            type="text"
            placeholder="Search description..."
            class="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#1F3A4B]/20 text-xs text-[#1F3A4B] placeholder-[#717171] focus:outline-none focus:border-[#902715] font-black transition-all"
          />
        </div>

        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1.5 tracking-wider">Category</label>
          <select
            v-model="reportStore.filters.category"
            class="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#1F3A4B]/20 text-xs text-[#1F3A4B] focus:outline-none focus:border-[#902715] capitalize font-black transition-all"
          >
            <option value="all">All Categories</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="environment">Environment</option>
            <option value="bullying">Bullying / Safety</option>
            <option value="mental_health">Mental Health</option>
            <option value="flood">Flood Hazard</option>
            <option value="fire">Fire Hazard</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1.5 tracking-wider">Priority</label>
          <select
            v-model="reportStore.filters.priority"
            class="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#1F3A4B]/20 text-xs text-[#1F3A4B] focus:outline-none focus:border-[#902715] capitalize font-black transition-all"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1.5 tracking-wider">Status</label>
          <select
            v-model="reportStore.filters.status"
            class="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#1F3A4B]/20 text-xs text-[#1F3A4B] focus:outline-none focus:border-[#902715] capitalize font-black transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1.5 tracking-wider">Plausibility</label>
          <select
            v-model="reportStore.filters.plausibility"
            class="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#1F3A4B]/20 text-xs text-[#1F3A4B] focus:outline-none focus:border-[#902715] capitalize font-black transition-all"
          >
            <option value="all">All Plausibility</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="suspected_spam">Suspected Spam</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1.5 tracking-wider">Barangay</label>
          <select
            v-model="reportStore.filters.barangay"
            class="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#1F3A4B]/20 text-xs text-[#1F3A4B] focus:outline-none focus:border-[#902715] font-black transition-all"
          >
            <option value="all">All Barangays</option>
            <option v-for="bgy in santaRosaBarangays" :key="bgy" :value="bgy">{{ bgy }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Community Reports Table with Solid Earthy Slate Blue Header (NO PALE HEADER!) -->
    <div class="overflow-x-auto rounded-[2.5rem] border-2 border-[#1F3A4B]/20 bg-white shadow-sm">
      <table class="w-full text-left text-xs text-[#0A0A0A]">
        <thead class="bg-[#1F3A4B] text-[#F7FB41] uppercase font-black text-[10px] tracking-wider border-b-2 border-[#1F3A4B]">
          <tr>
            <th class="p-4 pl-6 text-white">ID / Time</th>
            <th class="p-4 text-white">Barangay</th>
            <th class="p-4 text-[#F7FB41]">Photo</th>
            <th class="p-4 text-[#F7FB41]">Description</th>
            <th class="p-4 text-[#F7FB41]">AI Triage / Dept</th>
            <th class="p-4 text-white">Priority</th>
            <th class="p-4 text-white">Plausibility</th>
            <th class="p-4 text-white">Status</th>
            <th class="p-4 pr-6 text-right text-white">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#1F3A4B]/15">
          <tr v-if="reportStore.filteredReports.length === 0">
            <td colspan="9" class="p-12 text-center text-[#717171] font-bold">
              No incident reports match the current filter criteria.
            </td>
          </tr>

          <template v-for="item in reportStore.filteredReports" :key="item.id">
          <tr
            :class="[
              'transition-colors hover:bg-[#1F3A4B]/10',
              (item.ai_priority === 'high' || item.ai_priority === 'critical') && item.status === 'open'
                ? 'bg-[#902715]/10 border-l-4 border-l-[#902715]' : ''
            ]"
          >
            <td class="p-4 pl-6 font-mono text-[11px] text-[#717171] whitespace-nowrap">
              <div class="font-black text-[#1F3A4B]">{{ item.id.substring(0, 10) }}</div>
              <div class="text-[10px] text-[#717171] font-bold">{{ formatTimeAgo(item.created_at) }}</div>
            </td>

            <td class="p-4 font-black text-[#1F3A4B] whitespace-nowrap text-sm">{{ item.barangay }}</td>

            <td class="p-4 whitespace-nowrap">
              <div v-if="item.image_url" class="flex items-center space-x-2 cursor-pointer group" @click="enlargedPhoto = item.image_url">
                <div class="relative">
                  <img :src="item.image_url" alt="Incident photo" class="w-10 h-10 object-cover rounded-xl border-2 border-[#556B2F] shadow-sm group-hover:scale-105 transition-transform" />
                  <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#556B2F] border border-white rounded-full flex items-center justify-center text-[8px] text-white font-bold">✓</span>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-[#EEF2E6] text-[#556B2F] border border-[#D8E2C7] text-[10px] font-extrabold hidden lg:inline-block">Photo Verified</span>
              </div>
              <span v-else class="text-[10px] text-[#717171] font-bold italic">No photo</span>
            </td>

            <td class="p-4 max-w-xs truncate text-[#0A0A0A] font-bold" :title="item.raw_description">
              {{ item.raw_description }}
            </td>

            <td class="p-4 whitespace-nowrap">
              <span class="px-3.5 py-1 rounded-full bg-[#1F3A4B] text-white uppercase text-[10px] font-black block w-fit mb-1 shadow-sm">
                {{ item.ai_category || 'general' }}
              </span>
              <span class="text-[10px] text-[#902715] font-black block uppercase tracking-wider">{{ item.ai_department || 'CDRRMO' }}</span>
            </td>

            <td class="p-4 whitespace-nowrap">
              <span
                :class="[
                  'px-3.5 py-1 rounded-full text-[10px] uppercase font-black shadow-sm',
                  item.ai_priority === 'critical' ? 'bg-[#902715] text-white' :
                  item.ai_priority === 'high' ? 'bg-[#D14D3E] text-white' :
                  item.ai_priority === 'medium' ? 'bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00]' :
                  'bg-[#556B2F] text-white'
                ]"
              >
                {{ item.ai_priority || 'medium' }}
              </span>
            </td>

            <!-- Plausibility Badge & Toggle -->
            <td class="p-4 whitespace-nowrap">
              <select
                :value="reportStore.normalizePlausibility(item.ai_plausibility)"
                @change="onPlausibilityChange(item.id, $event.target.value)"
                :class="[
                  'px-3.5 py-1 rounded-full text-[10px] font-black border-none focus:outline-none cursor-pointer shadow-sm',
                  reportStore.normalizePlausibility(item.ai_plausibility) === 'verified' ? 'bg-[#556B2F] text-white' :
                  reportStore.normalizePlausibility(item.ai_plausibility) === 'suspected_spam' ? 'bg-[#902715] text-white' :
                  'bg-[#F7FB41] text-[#0A0A0A]'
                ]"
              >
                <option value="verified">✓ Verified</option>
                <option value="unverified">? Unverified</option>
                <option value="suspected_spam">! Spam</option>
              </select>
            </td>

            <!-- Status Lifecycle Badge & Transition -->
            <td class="p-4 whitespace-nowrap">
              <select
                :value="item.status || 'open'"
                @change="onStatusChange(item.id, $event.target.value)"
                :class="[
                  'px-3.5 py-1 rounded-full text-[10px] font-black uppercase border-none focus:outline-none cursor-pointer shadow-sm',
                  item.status === 'open' ? 'bg-[#902715] text-white' :
                  item.status === 'in_review' ? 'bg-[#F7FB41] text-[#0A0A0A]' :
                  item.status === 'resolved' ? 'bg-[#556B2F] text-white' :
                  'bg-[#1F3A4B] text-white'
                ]"
              >
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </td>

            <td class="p-4 pr-6 text-right whitespace-nowrap">
              <div class="flex items-center justify-end space-x-2">
                <button
                  @click="toggleAskAegis(item)"
                  class="px-4 py-2 rounded-full bg-[#556B2F] hover:bg-[#435525] text-white font-black text-[11px] transition-all shadow-md active:scale-95"
                >
                  {{ suggestionForReport(item) ? 'Advisory' : 'Ask Aegis' }}
                </button>
                <button
                  @click="selectedReport = item"
                  class="px-4 py-2 rounded-full bg-[#1F3A4B] hover:bg-[#902715] text-white font-black text-[11px] transition-all shadow-md active:scale-95"
                >
                  Inspect AI
                </button>
              </div>
            </td>
          </tr>

          <!-- Per-row Aegis Advisory -->
          <tr v-if="showAdvisoryFor(item)" class="bg-[#EEF4FB]/50 border-l-4 border-l-[#1F3A4B]/30">
            <td colspan="9" class="p-4 pl-6 pr-6">
              <AegisAdvisoryCard
                variant="card"
                :suggestion="suggestionForReport(item)"
                :loading="aegisStore.generating && !suggestionForReport(item)"
                :error="(aegisStore.lastError && !suggestionForReport(item)) ? aegisStore.lastError : null"
                @ask="askAegisForReport(item)"
                @outcome="onAdvisoryOutcome(suggestionForReport(item), $event)"
              />
            </td>
          </tr>
          </template>
        </tbody>
      </table>
    </div>
    <!-- AI Reasoning Detail Modal -->
    <Teleport to="body">
      <div
        v-if="selectedReport"
        class="fixed inset-0 z-[9998] bg-[#1F3A4B]/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in max-h-screen overflow-y-auto"
      >
        <div class="w-full max-w-lg bg-white border border-[#1F3A4B]/20 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl my-8">
          <div class="flex items-center justify-between border-b border-[#1F3A4B]/15 pb-3.5">
            <div>
              <h3 class="font-expressive text-xl font-black text-[#1F3A4B]">AI Incident Inspection</h3>
              <p class="text-xs text-[#902715] font-mono font-black">Report ID: {{ selectedReport.id }}</p>
            </div>
            <button
              @click="selectedReport = null"
              class="w-10 h-10 rounded-full bg-[#902715] text-white flex items-center justify-center font-black transition-all hover:scale-105 shadow-md"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4 text-xs">
            <div>
              <span class="text-[#717171] font-black block text-[10px] uppercase tracking-wider">Barangay</span>
              <span class="text-[#1F3A4B] font-black text-xl">{{ selectedReport.barangay }}</span>
            </div>

            <!-- Captured Camera Photo Display in Operator Modal -->
            <div v-if="selectedReport.image_url" class="p-4 rounded-2xl bg-[#EEF2E6] border border-[#D8E2C7] space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[#556B2F] font-black block text-[10px] uppercase tracking-wider">Citizen Camera Photo Attachment</span>
                <span class="text-[10px] font-extrabold text-[#556B2F] bg-white px-2 py-0.5 rounded-full border border-[#D8E2C7]">Camera Capture</span>
              </div>
              <div class="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-[#556B2F]" @click="enlargedPhoto = selectedReport.image_url">
                <img :src="selectedReport.image_url" alt="Citizen camera photo" class="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span class="px-3 py-1.5 rounded-full bg-white/90 text-[#0A0A0A] font-extrabold text-xs shadow-md">Click to Enlarge</span>
                </div>
              </div>
            </div>

            <!-- Solid Earthy Slate Blue Description Box -->
            <div>
              <span class="text-[#1F3A4B] font-black block text-[10px] uppercase tracking-wider mb-1.5">Citizen Description</span>
              <p class="p-4 rounded-2xl bg-[#1F3A4B] text-white border border-[#1F3A4B] text-xs font-bold leading-relaxed shadow-sm">
                "{{ selectedReport.raw_description }}"
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="text-[#717171] font-black block text-[10px] uppercase tracking-wider mb-1.5">AI Category</span>
                <span class="px-4 py-1.5 rounded-full bg-[#902715] text-white font-black uppercase inline-block shadow-sm">
                  {{ selectedReport.ai_category || 'general' }}
                </span>
              </div>
              <div>
                <span class="text-[#717171] font-black block text-[10px] uppercase tracking-wider mb-1.5">Assigned Department</span>
                <span class="text-[#902715] font-black text-base">{{ selectedReport.ai_department || 'CDRRMO' }}</span>
              </div>
            </div>

            <!-- Solid Canary Yellow Reasoning Box (NO PALE WASH!) -->
            <div>
              <span class="text-[#1F3A4B] font-black block text-[10px] uppercase tracking-wider mb-1.5">AI Reasoning & Logic</span>
              <p class="p-4 rounded-2xl bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00] font-black leading-relaxed shadow-sm">
                {{ selectedReport.ai_reasoning || 'No AI reasoning metadata available for this report.' }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-2">
              <div>
                <span class="text-[#717171] font-black block text-[10px] uppercase tracking-wider mb-2">Set Status</span>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="st in ['open', 'in_review', 'resolved', 'dismissed']"
                    :key="st"
                    @click="onStatusChange(selectedReport.id, st); selectedReport.status = st"
                    :class="[
                      'px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all',
                      selectedReport.status === st ? 'bg-[#902715] text-white shadow-md' : 'bg-white border border-[#1F3A4B]/20 text-[#1F3A4B] hover:bg-[#EEF4FB]'
                    ]"
                  >
                    {{ st }}
                  </button>
                </div>
              </div>

              <div>
                <span class="text-[#717171] font-black block text-[10px] uppercase tracking-wider mb-2">Set Plausibility</span>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="pl in ['verified', 'unverified', 'suspected_spam']"
                    :key="pl"
                    @click="onPlausibilityChange(selectedReport.id, pl); selectedReport.ai_plausibility = pl"
                    :class="[
                      'px-3 py-1.5 rounded-full text-[10px] font-black transition-all capitalize',
                      selectedReport.ai_plausibility === pl ? 'bg-[#1F3A4B] text-white shadow-md' : 'bg-white border border-[#1F3A4B]/20 text-[#1F3A4B] hover:bg-[#EEF4FB]'
                    ]"
                  >
                    {{ pl }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t-2 border-[#1F3A4B]/20 flex justify-end">
            <button
              @click="selectedReport = null"
              class="px-6 py-3 rounded-full bg-[#902715] hover:bg-[#a82e1a] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all"
            >
              Close Detail
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Lightbox Modal for Enlarged Incident Photo Viewing -->
    <Teleport to="body">
      <div
        v-if="enlargedPhoto"
        class="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 w-screen h-screen"
        @click.self="enlargedPhoto = null"
      >
        <div class="relative max-w-4xl w-full flex flex-col items-center space-y-3">
          <button
            @click="enlargedPhoto = null"
            class="absolute -top-12 right-0 p-2 text-white/80 hover:text-white font-black text-sm flex items-center space-x-1"
          >
            <span>Close</span>
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <img :src="enlargedPhoto" alt="Enlarged incident photo" class="max-h-[85vh] w-auto max-w-full object-contain rounded-2xl border-2 border-white/20 shadow-2xl" />
          <span class="text-xs font-bold text-white/70">Citizen Camera Attachment Inspection</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useReportStore } from '@/stores/reportStore'
import { useAegisStore } from '@/stores/aegisStore'
import AegisAdvisoryCard from '@/components/admin/AegisAdvisoryCard.vue'

const route = useRoute()
const reportStore = useReportStore()
const aegisStore = useAegisStore()

const isMuted = ref(localStorage.getItem('agap_chime_muted') === 'true')
const selectedReport = ref(null)
const enlargedPhoto = ref(null)
const expandedReports = ref(new Set())
const toastMessage = ref('')
let toastTimer = null

function showToast(message) {
  toastMessage.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 4000)
}

function suggestionForReport(item) {
  return aegisStore.pendingSuggestions.find(s => (s.related_sos_ids || []).includes(item.id)) || null
}

function showAdvisoryFor(item) {
  return !!suggestionForReport(item) || expandedReports.value.has(item.id)
}

function toggleAskAegis(item) {
  const next = new Set(expandedReports.value)
  if (next.has(item.id)) {
    next.delete(item.id)
  } else {
    next.add(item.id)
  }
  expandedReports.value = next
}

async function askAegisForReport(item) {
  const next = new Set(expandedReports.value)
  next.add(item.id)
  expandedReports.value = next
  await aegisStore.generateSuggestion({
    sos_ids: [item.id],
    cluster_barangay: item.barangay ?? null,
    cluster_count: null,
    scenario_type: 'report',
    community_report: {
      id: item.id,
      description: item.raw_description ?? null,
      category: item.ai_category ?? null,
      priority: item.ai_priority ?? null,
      plausibility: item.ai_plausibility ?? null,
      reasoning: item.ai_reasoning ?? null
    }
  })
}

async function onAdvisoryOutcome(suggestion, payload) {
  if (!suggestion) return
  try {
    await aegisStore.setOutcome(suggestion.id, {
      outcome: payload.outcome,
      modifiedAction: payload.modifiedAction || null
    })
    showToast(`Aegis advisory logged as ${payload.outcome}`)
  } catch (err) {
    console.warn('Failed to record Aegis advisory outcome:', err)
    showToast(`Failed to record advisory outcome: ${err.message || 'unknown error'}`)
  }
}

const santaRosaBarangays = [
  'Aplaya', 'Balibago', 'Caingins', 'Dila', 'Dita', 'Don Jose',
  'Ibaba', 'Kanluran (Poblacion Ward 1)', 'Labas', 'Macabling',
  'Malitlit', 'Malusak (Poblacion Ward 2)', 'Market Area (Poblacion Ward 8)',
  'Pooc', 'Pulong Santa Cruz', 'Santo Domingo', 'Sinalhan', 'Tagapo'
]

let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

function playEmergencyChime() {
  if (isMuted.value) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sine'
    osc2.type = 'triangle'

    osc1.frequency.setValueAtTime(880, now) // A5
    osc1.frequency.setValueAtTime(587.33, now + 0.25) // D5

    osc2.frequency.setValueAtTime(440, now)
    osc2.frequency.setValueAtTime(293.66, now + 0.25)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.6)
    osc2.stop(now + 0.6)
  } catch (e) {
    console.warn('Audio chime synthesize error:', e)
  }
}

function toggleMute() {
  isMuted.value = !isMuted.value
  localStorage.setItem('agap_chime_muted', isMuted.value)
  if (!isMuted.value) {
    playEmergencyChime()
  }
}

function filterHighPriority() {
  reportStore.filters.priority = 'high'
  reportStore.filters.status = 'open'
}

async function onStatusChange(id, newStatus) {
  await reportStore.updateReportStatus(id, newStatus)
}

async function onPlausibilityChange(id, newPlausibility) {
  await reportStore.updatePlausibility(id, newPlausibility)
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'just now'
  const diffSec = Math.floor((Date.now() - Date.parse(dateStr)) / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

watch(() => reportStore.unreadHighPriorityCount, (newCount, oldCount) => {
  if (newCount > (oldCount || 0)) {
    playEmergencyChime()
  }
})

onMounted(async () => {
  aegisStore.init()
  // Read URL query params for hotspot map navigation
  const barangayParam = route.query.barangay
  const reportIdParam = route.query.report_id
  if (barangayParam) {
    reportStore.filters.barangay = barangayParam
  }
  if (reportIdParam) {
    // Comma-separated IDs or single — drop into searchQuery like SOS feed does
    const ids = String(reportIdParam).split(',').filter(Boolean)
    reportStore.filters.searchQuery = ids.join(' ')
  }

  if (reportStore.fetchReports) {
    await reportStore.fetchReports()
  }
  reportStore.subscribeRealtimeReports()
  if (reportStore.unreadHighPriorityCount > 0) {
    playEmergencyChime()
  }
})

onUnmounted(() => {
  reportStore.unsubscribeRealtimeReports()
})
</script>

