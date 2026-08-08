<template>
  <div class="space-y-5">
    <!-- Top Command Center Bar & Quick GIS Launcher -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#1F3A4B]/15 shadow-sm admin-card">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="font-expressive text-2xl font-black text-[#1F3A4B] tracking-tight">Live SOS Emergency Queue</h2>
          <span class="px-3 py-1 text-xs font-black rounded-full bg-[#902715] text-white flex items-center shadow-m3-xs">
            <span class="w-2 h-2 rounded-full bg-[#F7FB41] animate-ping mr-1.5"></span>
            REALTIME LIVE
          </span>
        </div>
        <p class="text-xs text-[#717171] font-bold mt-0.5">
          Realtime WebSocket Feed · Assigned Area: <span class="text-[#902715] font-black uppercase">{{ authStore.assignedArea }}</span>
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Tactical GIS Quick Access Button -->
        <router-link
          to="/admin/hotspot-map"
          class="px-4 py-2.5 rounded-full bg-[#1F3A4B] hover:bg-[#152a37] text-[#F7FB41] font-black text-xs transition-all flex items-center gap-2 shadow-sm active:scale-95 border border-[#F7FB41]/30"
        >
          <svg class="w-4 h-4 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.782V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
          </svg>
          <span>Tactical GIS Density Map →</span>
        </router-link>

        <!-- Refresh Queue Button -->
        <button
          @click="manualRefresh"
          :disabled="sosStore.isLoading"
          class="px-4 py-2.5 rounded-full bg-white border border-[#1F3A4B]/20 hover:bg-[#EEF4FB] text-[#1F3A4B] font-black text-xs transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
        >
          <svg class="w-4 h-4 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ sosStore.isLoading ? 'Refreshing...' : 'Refresh Queue' }}</span>
        </button>
      </div>
    </div>

    <!-- Cluster Alert Banner -->
    <div v-if="sosStore.activeClusters.length > 0" class="space-y-3">
      <div
        v-for="cluster in sosStore.activeClusters"
        :key="cluster.barangay"
        class="p-5 rounded-[2rem] bg-[#902715] text-white flex flex-col gap-4 shadow-[0_10px_28px_rgba(144,39,21,0.35)] border border-white/20 transition-all duration-300"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center space-x-4">
            <div class="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-white shrink-0 shadow-inner">
              <svg class="w-6 h-6 text-[#F7FB41] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 class="font-black text-sm text-white uppercase tracking-wider">
                BARANGAY INCIDENT CLUSTER ALERT — {{ cluster.barangay }}
              </h3>
              <p class="text-xs text-white/90 mt-0.5 font-medium">
                High density emergency activity detected: {{ cluster.count }} active SOS reports in the past 30 minutes. Priority dispatch recommended.
              </p>
            </div>
          </div>
          <span class="px-4 py-2 bg-[#F7FB41] text-[#0A0A0A] text-xs font-black rounded-full shrink-0 shadow-md">
            {{ cluster.count }} ALERTS
          </span>
        </div>

        <!-- Aegis Advisory — auto-triggered or operator-requested -->
        <AegisAdvisoryCard
          variant="banner"
          :suggestion="suggestionForCluster(cluster)"
          :loading="aegisStore.generating && !suggestionForCluster(cluster)"
          :error="aegisErrorForCluster(cluster)"
          @ask="askAegisForCluster(cluster)"
          @outcome="(payload) => handleAegisOutcome(cluster, payload)"
        />
      </div>
    </div>

    <!-- Conflict Warning Toast Notification -->
    <div
      v-if="toastMessage"
      class="p-4 rounded-2xl bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00] text-xs font-black flex items-center justify-between shadow-md"
    >
      <div class="flex items-center space-x-3">
        <svg class="w-5 h-5 text-[#0A0A0A] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="toastMessage = ''" class="text-[#0A0A0A] underline hover:opacity-75 text-xs font-black px-2 py-0.5">
        Dismiss
      </button>
    </div>

    <!-- Multi-Attribute SOS Filter Bar (Matching Reports Page Pattern) -->
    <div class="p-5 bg-white border border-[#1F3A4B]/15 rounded-3xl space-y-3 shadow-sm admin-card">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- 1. Search Query -->
        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1 tracking-wider">Search SOS</label>
          <input
            v-model="filters.searchQuery"
            type="text"
            placeholder="Search ID or Barangay..."
            class="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#1F3A4B]/20 text-xs text-[#1F3A4B] placeholder-[#717171] focus:outline-none focus:border-[#902715] font-bold transition-all"
          />
        </div>

        <!-- 2. Barangay Filter -->
        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1 tracking-wider">Barangay</label>
          <select
            v-model="filters.barangay"
            class="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#1F3A4B]/20 text-xs text-[#1F3A4B] font-bold focus:outline-none focus:border-[#902715] transition-all"
          >
            <option value="all">All Barangays</option>
            <option v-for="b in BARANGAY_LIST" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>

        <!-- 3. Status Filter -->
        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1 tracking-wider">Status</label>
          <select
            v-model="filters.status"
            class="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#1F3A4B]/20 text-xs text-[#1F3A4B] font-bold focus:outline-none focus:border-[#902715] transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="responding">Responding</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <!-- 4. Signal Mode Filter -->
        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1 tracking-wider">Signal Mode</label>
          <select
            v-model="filters.mode"
            class="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#1F3A4B]/20 text-xs text-[#1F3A4B] font-bold focus:outline-none focus:border-[#902715] transition-all"
          >
            <option value="all">All Modes</option>
            <option value="online">Online</option>
            <option value="degraded_signal">Degraded Signal</option>
          </select>
        </div>

        <!-- 5. Assigned Area Toggle & Reset -->
        <div class="flex items-end gap-2">
          <button
            @click="toggleAssignedAreaOnly"
            :class="[
              'flex-1 py-2 px-3 rounded-2xl text-xs font-black transition-all shadow-m3-xs whitespace-nowrap',
              filters.assignedAreaOnly
                ? 'bg-[#902715] text-[#F7FB41] border border-[#902715]'
                : 'bg-[#EEF4FB] text-[#1F3A4B] border border-[#1F3A4B]/20 hover:bg-[#1F3A4B]/10'
            ]"
          >
            {{ filters.assignedAreaOnly ? 'Area Match Only' : 'Filter My Area' }}
          </button>
          <button
            @click="resetFilters"
            class="px-3.5 py-2 rounded-2xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#717171] hover:text-[#0A0A0A] text-xs font-bold transition-all border border-[#E0E0E0]"
          >
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- 100% Full-Width High-Density Operator Data Table -->
    <div class="space-y-2 w-full">
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center space-x-2">
          <h3 class="text-xs font-black uppercase tracking-wider text-[#1F3A4B]">Incoming Emergency Alerts</h3>
          <span class="px-2.5 py-0.5 rounded-full bg-[#1F3A4B] text-white text-[11px] font-black">
            {{ paginatedQueue.length }} Showing / {{ filteredQueue.length }} Filtered / {{ sosStore.sortedQueue.length }} Total
          </span>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-[10px] uppercase font-black text-[#1F3A4B] tracking-wider">Rows</label>
          <select
            v-model.number="rowsPerPage"
            class="px-2.5 py-1 rounded-xl bg-white border border-[#1F3A4B]/20 text-xs text-[#1F3A4B] font-bold focus:outline-none focus:border-[#902715] transition-all"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
      </div>

      <!-- High-Density Operator Table Container -->
      <div class="bg-white border border-[#1F3A4B]/15 rounded-3xl shadow-sm w-full overflow-hidden">
        <div class="overflow-x-auto overflow-y-visible">
          <table class="w-full text-left border-collapse min-w-[768px]">
            <thead class="sticky top-0 z-10">
              <tr class="bg-[#1F3A4B] text-white text-[11px] uppercase font-black tracking-wider border-b border-[#1F3A4B]/20">
                <th class="py-3.5 px-5">Status</th>
                <th class="py-3.5 px-5">Alert ID</th>
                <th class="py-3.5 px-5">Barangay</th>
                <th class="py-3.5 px-5">GPS Coordinates</th>
                <th class="py-3.5 px-5">Contact Number</th>
                <th class="py-3.5 px-5">Signal Mode</th>
                <th class="py-3.5 px-5">Submitted</th>
                <th class="py-3.5 px-5 text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E0E0E0] text-xs">
              <tr v-if="paginatedQueue.length === 0">
                <td colspan="8" class="py-12 text-center text-[#717171] font-bold">
                  No matching SOS alerts found for active filters.
                </td>
              </tr>

              <tr
                v-for="item in paginatedQueue"
                :key="item.id"
                :id="`sos-row-${item.id}`"
                tabindex="-1"
                :class="[
                  'transition-colors hover:bg-[#EEF4FB]',
                  item.barangay === authStore.assignedArea ? 'bg-[#FFFBEB] font-semibold' : 'bg-white'
                ]"
              >
                <!-- Status Indicator -->
                <td class="py-3.5 px-5 whitespace-nowrap">
                  <div class="flex items-center space-x-2">
                    <span
                      :class="[
                        'w-3 h-3 rounded-full shrink-0 shadow-sm',
                        item.status === 'pending' ? 'bg-[#902715] animate-ping' :
                        item.status === 'responding' ? 'bg-[#8a7e00]' : 'bg-[#556B2F]'
                      ]"
                    ></span>
                    <span class="capitalize font-black text-xs" :class="item.status === 'pending' ? 'text-[#902715]' : item.status === 'responding' ? 'text-[#8a7e00]' : 'text-[#556B2F]'">
                      {{ item.status }}
                    </span>
                  </div>
                </td>

                <!-- Alert ID & Area Match Badge -->
                <td class="py-3.5 px-5 whitespace-nowrap font-mono font-bold text-[#1F3A4B]">
                  <div class="flex items-center space-x-2">
                    <span class="text-xs">#{{ item.id.substring(0, 8) }}</span>
                    <span v-if="item.barangay === authStore.assignedArea" class="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00]">
                      Match
                    </span>
                  </div>
                </td>

                <!-- Barangay -->
                <td class="py-3.5 px-5 whitespace-nowrap font-black text-[#1F3A4B] text-xs">
                  {{ item.barangay }}
                </td>

                <!-- GPS Coordinates with Interactive Quick Actions -->
                <td class="py-3.5 px-5 whitespace-nowrap font-mono text-xs">
                  <div class="inline-block" @click.stop>
                    <button
                      :ref="el => setGpsButtonRef(item.id, el)"
                      @click="toggleGpsDropdown(item.id)"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#902715]/10 text-[#902715] font-black border border-[#902715]/20 hover:bg-[#902715] hover:text-white transition-all shadow-xs group"
                      title="Click for GPS dispatch actions"
                    >
                      <svg class="w-3.5 h-3.5 text-[#902715] group-hover:text-white transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <span>{{ typeof item.latitude === 'number' ? item.latitude.toFixed(4) : item.latitude }}, {{ typeof item.longitude === 'number' ? item.longitude.toFixed(4) : item.longitude }}</span>
                      <svg class="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                  </div>
                </td>

                <!-- Contact Number -->
                <td class="py-3.5 px-5 whitespace-nowrap">
                  <div v-if="item.callback_number" class="inline-flex items-center gap-1.5 font-mono font-bold text-[#1F3A4B]">
                    <a
                      :href="'tel:' + item.callback_number"
                      class="inline-flex items-center gap-1.5 hover:text-[#902715] hover:underline"
                      title="Click to call"
                    >
                      <svg class="w-3.5 h-3.5 text-[#902715] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{{ formatCallbackNumber(item.callback_number) }}</span>
                    </a>
                    <button
                      @click.stop="copyToClipboard(item.callback_number)"
                      class="p-1 text-[#717171] hover:text-[#1F3A4B] rounded transition-colors"
                      title="Copy number"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                  </div>
                  <span v-else class="text-[#717171] italic font-normal">No callback number provided</span>
                </td>

                <!-- Signal Mode -->
                <td class="py-3.5 px-5 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-m3-xs',
                      item.mode === 'online' ? 'bg-[#1F3A4B] text-white' : 'bg-[#B45309] text-white'
                    ]"
                  >
                    {{ item.mode }}
                  </span>
                </td>

                <!-- Timestamp -->
                <td class="py-3.5 px-5 whitespace-nowrap">
                  <div class="flex flex-col items-start gap-1.5">
                    <span class="text-[#717171] font-semibold text-xs">
                      {{ formatTimeAgo(item.created_at) }}
                    </span>
                    <span
                      v-if="updateChipVariant(item) === 'moved-responding'"
                      class="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-[#902715] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
                    >
                      <span class="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
                        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60"></span>
                        <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-white"></span>
                      </span>
                      LOCATION CHANGED · new pin · {{ formatRelative(item.updated_at) }}
                    </span>
                    <span
                      v-else-if="updateChipVariant(item) === 'moved'"
                      class="inline-flex items-center gap-1 rounded-full bg-[#F7FB41] border border-[#8a7e00] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#0A0A0A]"
                    >
                      Victim moved · new location · {{ formatRelative(item.updated_at) }}
                    </span>
                    <span
                      v-else-if="updateChipVariant(item)"
                      class="inline-flex items-center gap-1 rounded-full bg-[#F7FB41] border border-[#8a7e00] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#0A0A0A]"
                    >
                      Victim updated · {{ formatRelative(item.updated_at) }}
                    </span>
                  </div>
                </td>

                <!-- Dispatch Action Menu -->
                <td class="py-3.5 px-5 whitespace-nowrap text-right relative">
                  <span v-if="item.status === 'resolved'" class="text-xs font-black text-[#183F07] inline-flex items-center space-x-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Resolved</span>
                  </span>

                  <div v-else class="relative inline-block text-left">
                    <button
                      @click.stop="toggleDropdown(item.id)"
                      class="px-3.5 py-1.5 rounded-full bg-[#1F3A4B] hover:bg-[#152a37] text-white font-black text-xs shadow-sm transition-all inline-flex items-center gap-1.5 active:scale-95"
                    >
                      <span>Actions</span>
                      <svg class="w-3.5 h-3.5 text-[#F7FB41] transition-transform duration-200" :class="{ 'rotate-180': activeDropdownId === item.id }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <!-- Contextual Dropdown Menu Popover -->
                    <div
                      v-if="activeDropdownId === item.id"
                      @click.stop
                      class="absolute right-0 mt-1.5 w-52 rounded-2xl bg-white border border-[#1F3A4B]/15 shadow-xl py-1.5 z-40 text-left font-sans"
                    >
                      <button
                        v-if="item.status === 'pending'"
                        @click="handleClaim(item)"
                        class="w-full px-4 py-2 text-xs font-black text-[#902715] hover:bg-[#EEF4FB] flex items-center gap-2 transition-colors"
                      >
                        <svg class="w-4 h-4 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Claim & Dispatch</span>
                      </button>

                      <button
                        v-if="item.status === 'responding'"
                        @click="handleResolve(item)"
                        class="w-full px-4 py-2 text-xs font-black text-[#183F07] hover:bg-[#EEF4FB] flex items-center gap-2 transition-colors"
                      >
                        <svg class="w-4 h-4 text-[#183F07]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Mark Resolved</span>
                      </button>

                      <div class="my-1 border-t border-[#E0E0E0]"></div>

                      <button
                        @click="openSpamModal(item)"
                        class="w-full px-4 py-2 text-xs font-black text-[#902715] hover:bg-[#FFF5F5] flex items-center gap-2 transition-colors"
                      >
                        <svg class="w-4 h-4 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Mark as Spam/Prank</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div v-if="totalPages > 1" class="flex items-center justify-between px-5 py-3.5 bg-[#F8FAFC] border-t border-[#E0E0E0]">
          <p class="text-[11px] text-[#717171] font-bold">
            Page <span class="text-[#1F3A4B] font-black">{{ currentPage }}</span> of <span class="text-[#1F3A4B] font-black">{{ totalPages }}</span>
            &middot; Showing {{ paginationStart }}–{{ paginationEnd }} of {{ filteredQueue.length }}
          </p>
          <div class="flex items-center gap-1.5">
            <button
              @click="currentPage = 1"
              :disabled="currentPage === 1"
              class="px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
              :class="currentPage === 1 ? 'bg-[#F5F5F5] text-[#717171] border-[#E0E0E0]' : 'bg-white text-[#1F3A4B] border-[#1F3A4B]/20 hover:bg-[#EEF4FB] active:scale-95'"
            >
              First
            </button>
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
              :class="currentPage === 1 ? 'bg-[#F5F5F5] text-[#717171] border-[#E0E0E0]' : 'bg-white text-[#1F3A4B] border-[#1F3A4B]/20 hover:bg-[#EEF4FB] active:scale-95'"
            >
              ← Prev
            </button>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
              :class="currentPage === totalPages ? 'bg-[#F5F5F5] text-[#717171] border-[#E0E0E0]' : 'bg-white text-[#1F3A4B] border-[#1F3A4B]/20 hover:bg-[#EEF4FB] active:scale-95'"
            >
              Next →
            </button>
            <button
              @click="currentPage = totalPages"
              :disabled="currentPage === totalPages"
              class="px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
              :class="currentPage === totalPages ? 'bg-[#F5F5F5] text-[#717171] border-[#E0E0E0]' : 'bg-white text-[#1F3A4B] border-[#1F3A4B]/20 hover:bg-[#EEF4FB] active:scale-95'"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Spam/Prank Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showSpamModal"
        class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        @click.self="closeSpamModal"
      >
        <div class="bg-white rounded-3xl p-6 max-w-md w-full border border-[#1F3A4B]/15 shadow-2xl space-y-4 text-left">
          <div class="flex items-start space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-[#902715]/10 text-[#902715] flex items-center justify-center shrink-0">
              <svg class="w-6 h-6 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 class="font-black text-lg text-[#1F3A4B] leading-tight">Mark as Spam/Prank</h3>
              <p class="text-xs font-semibold text-[#717171] mt-0.5">
                Alert #{{ selectedReportForFlag?.id ? selectedReportForFlag.id.substring(0, 8) : '' }} &middot; {{ selectedReportForFlag?.barangay }}
              </p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-[#EEF4FB] border border-[#1F3A4B]/15 text-xs text-[#1F3A4B] font-medium leading-relaxed">
            Mark this device as spam/prank? Future SOS reports from this device will be hidden from the main dispatch feed but not deleted — you can review or reverse this from the Flagged tab.
          </div>

          <div class="p-2.5 rounded-2xl bg-[#F8FAFC] border border-[#1F3A4B]/10 text-[11px] text-[#717171] font-semibold flex items-center gap-1.5">
            <svg class="w-4 h-4 text-[#1F3A4B] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Based on this device's local ID — may reset if the app is reinstalled</span>
          </div>

          <div v-if="selectedReportForFlag && !selectedReportForFlag.sos_device_hash" class="p-3 rounded-2xl bg-[#FFF5F5] border border-[#902715]/30 text-[11px] font-bold text-[#902715]">
            ⚠️ Note: This report has no device hash attached. Flagging cannot suppress future reports from this device until a device hash is present.
          </div>

          <div>
            <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1 tracking-wider">
              Reason (Optional)
            </label>
            <textarea
              v-model="spamReason"
              rows="2"
              placeholder="e.g. Nuisance call, repeated false alert, testing app..."
              class="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#1F3A4B]/20 text-xs text-[#1F3A4B] placeholder-[#717171] focus:outline-none focus:border-[#902715] font-medium transition-all"
            ></textarea>
          </div>

          <div v-if="flagError" class="p-3 rounded-2xl bg-[#902715] text-white text-xs font-bold">
            {{ flagError }}
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              @click="closeSpamModal"
              :disabled="isSubmittingFlag"
              class="px-4 py-2.5 rounded-full bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#717171] font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              @click="confirmFlagSpam"
              :disabled="isSubmittingFlag || !selectedReportForFlag?.sos_device_hash"
              class="px-5 py-2.5 rounded-full bg-[#902715] hover:bg-[#7a2012] text-white font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <span v-if="isSubmittingFlag">Flagging...</span>
              <span v-else>Confirm & Flag Device</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- GPS Dropdown Popover (Teleported to body to avoid overflow clipping) -->
    <Teleport to="body">
      <div
        v-if="activeGpsDropdownId && gpsDropdownPosition && activeGpsDropdownItem"
        ref="gpsDropdownRef"
        @click.stop
        class="fixed w-60 rounded-2xl bg-white border border-[#1F3A4B]/20 shadow-2xl py-2 z-[100] text-left font-sans text-xs space-y-1"
        :style="{
          top: gpsDropdownPosition.top + 'px',
          left: gpsDropdownPosition.left + 'px'
        }"
      >
        <div class="px-3.5 py-1 border-b border-[#E0E0E0] mb-1">
          <p class="text-[10px] font-black uppercase tracking-wider text-[#717171]">GPS Dispatch Actions</p>
          <p class="font-mono text-[11px] font-bold text-[#1F3A4B] truncate">
            {{ activeGpsDropdownItem?.latitude }}, {{ activeGpsDropdownItem?.longitude }}
          </p>
        </div>

        <!-- 1. Open in Google Maps -->
        <a
          v-if="activeGpsDropdownItem"
          :href="getGoogleMapsUrl(activeGpsDropdownItem.latitude, activeGpsDropdownItem.longitude)"
          target="_blank"
          rel="noopener noreferrer"
          @click="closeGpsDropdown"
          class="w-full px-3.5 py-2 text-xs font-bold text-[#1F3A4B] hover:bg-[#EEF4FB] hover:text-[#902715] flex items-center gap-2.5 transition-colors"
        >
          <svg class="w-4 h-4 text-[#902715] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          <div class="flex flex-col text-left">
            <span class="font-black text-xs">Open Google Maps</span>
            <span class="text-[10px] text-[#717171] font-normal">External GPS directions for drivers</span>
          </div>
        </a>

        <!-- 2. Copy Exact Coordinates -->
        <button
          v-if="activeGpsDropdownItem"
          @click="copyCoords(activeGpsDropdownItem.latitude, activeGpsDropdownItem.longitude)"
          class="w-full px-3.5 py-2 text-xs font-bold text-[#1F3A4B] hover:bg-[#EEF4FB] flex items-center gap-2.5 transition-colors text-left"
        >
          <svg class="w-4 h-4 text-[#717171] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          <div class="flex flex-col text-left">
            <span class="font-black text-xs">Copy Raw Lat/Lng</span>
            <span class="text-[10px] text-[#717171] font-normal">Copy {{ activeGpsDropdownItem.latitude }}, {{ activeGpsDropdownItem.longitude }}</span>
          </div>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSOSStore } from '@/stores/sosStore'
import { useAuthStore } from '@/stores/authStore'
import { useAegisStore } from '@/stores/aegisStore'
import { useFlowStore } from '@/stores/flowStore'
import { BARANGAY_LIST } from '@/data/barangay_coords'
import AegisAdvisoryCard from '@/components/admin/AegisAdvisoryCard.vue'

const route = useRoute()
const router = useRouter()
const sosStore = useSOSStore()
const authStore = useAuthStore()
const aegisStore = useAegisStore()
const flowStore = useFlowStore()

const toastMessage = ref('')
let staleTimer = null
let pollTimer = null

// ── Dropdown & Modal State ──
const activeDropdownId = ref(null)
const activeGpsDropdownId = ref(null)
const gpsButtonRefs = ref({})
const gpsDropdownRef = ref(null)
const gpsDropdownPosition = ref(null)
const showSpamModal = ref(false)
const selectedReportForFlag = ref(null)
const spamReason = ref('')
const isSubmittingFlag = ref(false)
const flagError = ref('')

// ── Pagination State ──
const currentPage = ref(1)
const rowsPerPage = ref(10)

// ── Multi-Attribute SOS Filters State ──
const filters = ref({
  searchQuery: '',
  barangay: 'all',
  status: 'all',
  mode: 'all',
  assignedAreaOnly: false
})

// Auto-reset to page 1 when filters or rows-per-page change
watch(filters, () => { currentPage.value = 1 }, { deep: true })
watch(rowsPerPage, () => { currentPage.value = 1 })

// Surface rule-based auto-flags as a toast (devices moved to the flagged queue)
watch(() => sosStore.lastAutoFlags, (flags) => {
  if (!flags || flags.length === 0) return
  const first = flags[0]
  const extra = flags.length > 1 ? ` (+${flags.length - 1} more)` : ''
  toastMessage.value = `Auto-flagged device: ${first.hash.substring(0, 8)} — ${first.label}. Moved to flagged queue.${extra}`
})

const activeGpsDropdownItem = computed(() => {
  if (!activeGpsDropdownId.value) return null
  return paginatedQueue.value.find(item => item.id === activeGpsDropdownId.value)
})

const filteredQueue = computed(() => {
  return sosStore.sortedQueue.filter(item => {
    // 1. Search Query (ID or Barangay). Space-separated terms OR-match
    //    so multiple IDs passed from the hotspot map group together.
    const q = filters.value.searchQuery.toLowerCase().trim()
    if (q) {
      const terms = q.split(/\s+/).filter(Boolean)
      const matchesAny = terms.some(term =>
        item.id.toLowerCase().includes(term) || item.barangay.toLowerCase().includes(term)
      )
      if (!matchesAny) return false
    }

    // 2. Barangay Filter
    if (filters.value.barangay !== 'all' && item.barangay !== filters.value.barangay) {
      return false
    }

    // 3. Status Filter
    if (filters.value.status !== 'all' && item.status !== filters.value.status) {
      return false
    }

    // 4. Mode Filter
    if (filters.value.mode !== 'all' && item.mode !== filters.value.mode) {
      return false
    }

    // 5. Assigned Area Filter
    if (filters.value.assignedAreaOnly && authStore.assignedArea && authStore.assignedArea !== 'all') {
      if (item.barangay !== authStore.assignedArea) return false
    }

    return true
  })
})

// ── Pagination Computed ──
const totalPages = computed(() => Math.max(1, Math.ceil(filteredQueue.value.length / rowsPerPage.value)))
const paginationStart = computed(() => filteredQueue.value.length === 0 ? 0 : (currentPage.value - 1) * rowsPerPage.value + 1)
const paginationEnd = computed(() => Math.min(currentPage.value * rowsPerPage.value, filteredQueue.value.length))
const paginatedQueue = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  return filteredQueue.value.slice(start, start + rowsPerPage.value)
})

function formatCallbackNumber(num) {
  if (!num) return ''
  const str = String(num).trim()
  if (/^09\d{9}$/.test(str)) {
    return `${str.slice(0, 4)} ${str.slice(4, 7)} ${str.slice(7)}`
  }
  return str
}

async function copyToClipboard(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    toastMessage.value = `Copied ${text} to clipboard`
  } catch (err) {
    console.warn('Clipboard copy failed:', err)
  }
}

function toggleDropdown(id) {
  closeGpsDropdown()
  activeDropdownId.value = activeDropdownId.value === id ? null : id
}

function setGpsButtonRef(id, el) {
  if (el) {
    gpsButtonRefs.value[id] = el
  }
}

function toggleGpsDropdown(id) {
  activeDropdownId.value = null
  
  if (activeGpsDropdownId.value === id) {
    activeGpsDropdownId.value = null
    gpsDropdownPosition.value = null
    return
  }
  
  activeGpsDropdownId.value = id
  
  // Calculate dropdown position based on button position
  const buttonEl = gpsButtonRefs.value[id]
  if (buttonEl) {
    const rect = buttonEl.getBoundingClientRect()
    const dropdownWidth = 240 // 60 * 4 (w-60 in Tailwind)
    
    let top = rect.bottom + 6 // mt-1.5
    let left = rect.left
    
    // Initial positioning
    gpsDropdownPosition.value = { top, left }
    
    // Wait for dropdown to render, then recalculate with actual dimensions
    import('vue').then(({ nextTick }) => {
      nextTick(() => {
        // Verify the dropdown ID hasn't changed before updating position
        if (gpsDropdownRef.value && activeGpsDropdownId.value === id) {
          const dropdownHeight = gpsDropdownRef.value.offsetHeight
          
          // Adjust if dropdown would go off-screen to the right
          if (left + dropdownWidth > window.innerWidth) {
            left = window.innerWidth - dropdownWidth - 16
          }
          
          // Adjust if dropdown would go off-screen at the bottom
          if (top + dropdownHeight > window.innerHeight) {
            top = rect.top - dropdownHeight - 6
          }
          
          gpsDropdownPosition.value = { top, left }
        }
      })
    })
  }
}

function closeGpsDropdown() {
  activeGpsDropdownId.value = null
  gpsDropdownPosition.value = null
}

function handleDocumentClick() {
  activeDropdownId.value = null
  closeGpsDropdown()
}

function handleScrollOrResize() {
  // Close GPS dropdown when scrolling or resizing to prevent stale positioning
  if (activeGpsDropdownId.value) {
    closeGpsDropdown()
  }
}

function getGoogleMapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

function copyCoords(lat, lng) {
  closeGpsDropdown()
  copyToClipboard(`${lat}, ${lng}`)
}

function handleClaim(item) {
  activeDropdownId.value = null
  claimAlert(item.id)
}

function handleResolve(item) {
  activeDropdownId.value = null
  markResolved(item.id)
}

function openSpamModal(item) {
  activeDropdownId.value = null
  selectedReportForFlag.value = item
  spamReason.value = ''
  flagError.value = ''
  showSpamModal.value = true
}

function closeSpamModal() {
  showSpamModal.value = false
  selectedReportForFlag.value = null
  spamReason.value = ''
  flagError.value = ''
  isSubmittingFlag.value = false
}

async function confirmFlagSpam() {
  if (!selectedReportForFlag.value) return
  const report = selectedReportForFlag.value
  const deviceHash = report.sos_device_hash

  if (!deviceHash) {
    flagError.value = 'Cannot flag device: Report missing device hash.'
    return
  }

  isSubmittingFlag.value = true
  flagError.value = ''

  try {
    const operatorId = authStore.profile?.id || authStore.user?.email || authStore.user?.id || 'operator'

    const res = await sosStore.flagDevice({
      device_hash: deviceHash,
      flagged_by: operatorId,
      reason: spamReason.value.trim()
    })

    if (!res.success) {
      flagError.value = `Failed to flag device: ${res.error?.message || res.reason || 'Unknown error'}`
      return
    }

    toastMessage.value = `Device marked as spam/prank.`
    closeSpamModal()

    if (sosStore.fetchActiveReports) {
      await sosStore.fetchActiveReports()
    }
  } catch (err) {
    console.error('Exception during device flag:', err)
    flagError.value = 'An unexpected error occurred while flagging device.'
  } finally {
    isSubmittingFlag.value = false
  }
}

function toggleAssignedAreaOnly() {
  filters.value.assignedAreaOnly = !filters.value.assignedAreaOnly
}

function resetFilters() {
  filters.value = {
    searchQuery: '',
    barangay: 'all',
    status: 'all',
    mode: 'all',
    assignedAreaOnly: false
  }
  currentPage.value = 1
}

async function manualRefresh() {
  if (sosStore.fetchActiveReports) {
    await sosStore.fetchActiveReports()
  }
}

// ── Aegis Advisory Integration ──
const AEGIS_OUTCOME_TOAST = {
  approved: 'Advisory approved',
  modified: 'Advisory modified',
  rejected: 'Advisory rejected'
}

function suggestionForCluster(cluster) {
  const bgy = (cluster.barangay || '').toLowerCase()
  return aegisStore.pendingSuggestions.find(s => (s.target_barangay || '').toLowerCase() === bgy) || null
}

function aegisErrorForCluster(cluster) {
  // Store-level error only surfaces while no suggestion exists for this
  // cluster yet, so a displayed suggestion is never masked by stale errors.
  return aegisStore.lastError && !suggestionForCluster(cluster) ? aegisStore.lastError : null
}

async function askAegisForCluster(cluster) {
  await aegisStore.generateSuggestion({
    sos_ids: (cluster.reports || []).map(r => r.id),
    cluster_barangay: cluster.barangay,
    cluster_count: cluster.count,
    scenario_type: 'flood',
    flood_zone_severity: flowStore.zoneSeverity ?? null
  })
}

async function handleAegisOutcome(cluster, { outcome, modifiedAction }) {
  const suggestion = suggestionForCluster(cluster)
  if (!suggestion) return
  try {
    await aegisStore.setOutcome(suggestion.id, { outcome, modifiedAction })
    toastMessage.value = AEGIS_OUTCOME_TOAST[outcome] || 'Advisory outcome recorded'
  } catch (err) {
    console.error('Aegis outcome failed:', err)
    toastMessage.value = 'Failed to record advisory outcome.'
  }
}

onMounted(async () => {
  document.addEventListener('click', handleDocumentClick)
  window.addEventListener('scroll', handleScrollOrResize, true)
  window.addEventListener('resize', handleScrollOrResize)
  
  if (sosStore.fetchActiveReports) {
    await sosStore.fetchActiveReports()
  }
  sosStore.subscribeToRealtimeSOS()
  aegisStore.init()
  await sosStore.checkStaleClaims()

  // If navigated from hotspot map with SOS ID(s), set the search filter
  // to those IDs so they group together as the only visible results.
  const sosParam = route.query.sos_id
  if (sosParam) {
    const ids = sosParam.split(',').filter(Boolean)
    filters.value.searchQuery = ids.join(' ')
  }

  staleTimer = setInterval(() => {
    sosStore.checkStaleClaims()
  }, 30000)

  pollTimer = setInterval(() => {
    sosStore.fetchActiveReports()
  }, 10000)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('scroll', handleScrollOrResize, true)
  window.removeEventListener('resize', handleScrollOrResize)
  sosStore.unsubscribeRealtimeSOS()
  if (staleTimer) {
    clearInterval(staleTimer)
  }
  if (pollTimer) {
    clearInterval(pollTimer)
  }
})

async function claimAlert(id) {
  toastMessage.value = ''
  const operatorId = authStore.profile?.id || authStore.user?.id
  const result = await sosStore.claimReport(id, operatorId)

  if (!result.success && result.reason === 'already_claimed') {
    toastMessage.value = 'Already claimed by another operator! Queue state updated.'
  } else if (!result.success) {
    toastMessage.value = 'Failed to claim report. Please try again.'
  }
}

async function markResolved(id) {
  await sosStore.resolveReport(id)
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Just now'

  const date = new Date(dateStr)

  return date.toLocaleDateString('en-PH', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila'
  })
}

function victimUpdatedAt(item) {
  return Boolean(item.updated_at && item.created_at && Date.parse(item.updated_at) - Date.parse(item.created_at) > 60000)
}

function updateChipVariant(item) {
  if (!victimUpdatedAt(item)) return null
  const note = (item.note || '').toLowerCase()
  if (item.status === 'responding' && note === 'moved') return 'moved-responding'
  if (note === 'moved') return 'moved'
  return 'ping'
}

function formatRelative(dateStr) {
  if (!dateStr) return 'just now'
  const diffSec = Math.floor((Date.now() - Date.parse(dateStr)) / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}
</script>
