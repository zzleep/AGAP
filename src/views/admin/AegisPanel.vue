<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-expressive text-3xl font-black text-[#1F3A4B] tracking-tight">Aegis AI Advisory Command Panel</h2>
        <p class="text-xs text-[#902715] font-extrabold uppercase tracking-wider mt-0.5">Gemini 2.0 Flash operational recommendations — advisory only, human-gated</p>
      </div>
      <div class="flex items-center space-x-3">
        <div class="relative">
          <button
            @click="showScenarioSelector = !showScenarioSelector"
            :disabled="isLoading"
            class="px-4 py-2 rounded-full bg-[#1F3A4B]/10 hover:bg-[#1F3A4B]/20 text-[#1F3A4B] text-xs font-black transition-all border border-[#1F3A4B]/20 disabled:opacity-50 flex items-center space-x-2 active:scale-95"
          >
            <svg class="w-4 h-4 text-[#1F3A4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Simulate Scenario</span>
          </button>
          <!-- Scenario Selector Dropdown -->
          <div
            v-if="showScenarioSelector"
            class="absolute right-0 mt-2 w-80 p-3 rounded-2xl bg-white border border-[#1F3A4B]/20 shadow-2xl z-50 space-y-2"
          >
            <div class="text-[10px] uppercase font-black text-[#1F3A4B] tracking-wider mb-2">Select Scenario</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="(s, key) in scenarios"
                :key="key"
                @click="simulateScenario(key)"
                class="p-2.5 rounded-xl bg-[#1F3A4B]/5 border border-[#1F3A4B]/15 hover:border-[#902715] hover:bg-[#902715]/5 cursor-pointer transition-all"
              >
                <div class="text-xs font-black text-[#1F3A4B]">{{ s.icon }} {{ s.label }}</div>
                <div class="text-[10px] text-[#717171] mt-0.5 leading-tight font-bold">{{ s.description }}</div>
              </div>
            </div>
          </div>
        </div>
        <button
          @click="openReportSelector"
          class="px-5 py-2.5 rounded-full bg-[#1F3A4B] hover:bg-[#152733] text-white text-xs font-black transition-all shadow-md active:scale-95 flex items-center space-x-2 uppercase tracking-wider"
        >
          <svg class="w-4 h-4 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>Ask Aegis</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-10 rounded-[2.5rem] bg-white border border-[#1F3A4B]/10 text-center space-y-4 shadow-sm">
      <div class="w-10 h-10 mx-auto border-3 border-[#1F3A4B] border-t-transparent rounded-full animate-spin"></div>
      <p class="text-base text-[#1F3A4B] font-black">Aegis is analyzing the situation...</p>
      <p class="text-xs text-[#902715] font-extrabold uppercase tracking-wider">Consulting Gemini 2.0 Flash for operational recommendation</p>
    </div>

    <div v-if="outcomeError" class="p-4 rounded-2xl bg-[#FDE8E5] border border-[#D14D3E]/30 text-xs text-[#D14D3E] font-black">
      {{ outcomeError }} The advisory remains uncommitted; restore connectivity and retry.
    </div>

    <div v-if="aegisStore.lastError" class="p-4 rounded-2xl bg-[#FDE8E5] border border-[#D14D3E]/30 text-xs text-[#D14D3E] font-black">
      {{ aegisStore.lastError }}
    </div>

    <!-- Active Recommendation Panel -->
    <div v-if="activeRecommendation && !isLoading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-5">
        <!-- Recommendation Card -->
        <div class="p-7 rounded-[2.25rem_1.25rem_2.25rem_1.25rem] bg-white border border-[#1F3A4B]/15 space-y-5 shadow-md admin-card">
          <div class="flex items-center justify-between">
            <span class="text-xs uppercase font-black tracking-wider text-[#1F3A4B]">Active AI Recommendation</span>
            <div class="flex items-center space-x-2">
              <span
                v-if="activeRecommendation.fallback"
                class="px-3.5 py-1.5 text-[10px] uppercase font-black rounded-full bg-[#D14D3E] text-white shadow-sm"
              >
                Fallback
              </span>
              <span
                :class="[
                  'px-3.5 py-1.5 text-[10px] uppercase font-black rounded-full shadow-sm',
                  activeRecommendation.confidence === 'high' ? 'bg-[#556B2F] text-white' :
                  activeRecommendation.confidence === 'medium' ? 'bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00]' :
                  'bg-[#D14D3E] text-white'
                ]"
              >
                {{ activeRecommendation.confidence || 'unknown' }} Confidence
              </span>
              <span v-if="activeRecommendation.scenario_type" class="px-2 py-0.5 text-[10px] uppercase font-bold rounded"
                :class="scenarioBadgeClass(activeRecommendation.scenario_type)">
                {{ scenarioIcon(activeRecommendation.scenario_type) }} {{ activeRecommendation.scenario_type }}
              </span>
            </div>
          </div>

          <!-- Fallback Advisory Warning -->
          <div
            v-if="activeRecommendation.fallback"
            class="p-3 rounded-2xl bg-[#FDE8E5] border border-[#D14D3E]/30 flex items-start space-x-2.5"
          >
            <svg class="w-4 h-4 text-[#D14D3E] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <span class="text-[10px] uppercase font-black text-[#D14D3E] tracking-wider">AI Service Unavailable</span>
              <p class="text-[10px] text-[#D14D3E] font-bold mt-0.5 leading-relaxed">
                Gemini AI could not be reached. Showing standard dispatch fallback recommendation.
                <span v-if="activeRecommendation._debug" class="block mt-1 font-black opacity-70">{{ activeRecommendation._debug }}</span>
              </p>
            </div>
          </div>

          <h3 class="font-black text-[#1F3A4B] text-2xl leading-snug">{{ activeRecommendation.recommended_action }}</h3>
          <div class="text-xs font-bold text-[#717171]">
            <span class="font-black text-[#902715] uppercase tracking-wider">Target Barangay:</span>
            <span class="text-[#1F3A4B] font-black text-sm ml-1">Barangay {{ activeRecommendation.target_barangay }}</span>
          </div>

          <!-- Solid Canary Yellow Reasoning Box -->
          <div class="p-5 rounded-2xl bg-[#F7FB41] border border-[#8a7e00] space-y-2 shadow-sm">
            <span class="text-[10px] uppercase font-black text-[#0A0A0A] tracking-wider">Step-by-Step Reasoning</span>
            <div class="text-xs text-[#0A0A0A] leading-relaxed whitespace-pre-line font-black">{{ activeRecommendation.reasoning }}</div>
          </div>

          <!-- Expandable Raw Inputs -->
          <details class="group">
            <summary class="text-[10px] uppercase font-black text-[#717171] tracking-wider cursor-pointer hover:text-[#902715] transition-colors">
              Raw Inputs (click to expand)
            </summary>
            <div class="mt-2 p-4 rounded-2xl bg-[#1F3A4B] border border-[#1F3A4B]">
              <pre class="text-[10px] text-[#F7FB41] font-mono overflow-x-auto font-bold">{{ JSON.stringify(activeRecommendation.raw_inputs, null, 2) }}</pre>
            </div>
          </details>

          <!-- Action Buttons — NO DEFAULT SELECTION -->
          <div class="flex items-center space-x-3 pt-4 border-t border-[#1F3A4B]/15">
            <span class="text-[10px] font-black text-[#717171] uppercase tracking-wider mr-1">Operator Action:</span>
            <button
              @click="submitOutcome('approved')"
              :disabled="outcomeSubmitting"
              :class="[
                'px-5 py-2.5 rounded-full font-black text-xs shadow-md transition-all active:scale-95',
                selectedOutcome === 'approved'
                  ? 'bg-[#556B2F] text-white ring-2 ring-[#556B2F]/40'
                  : 'bg-[#556B2F] hover:bg-[#435525] text-white'
              ]"
            >
              ✓ Approve Advisory
            </button>
            <button
              @click="submitOutcome('modified')"
              :disabled="outcomeSubmitting"
              :class="[
                'px-5 py-2.5 rounded-full font-black text-xs transition-all active:scale-95',
                selectedOutcome === 'modified'
                  ? 'bg-[#1F3A4B] text-white ring-2 ring-[#1F3A4B]/40'
                  : 'bg-[#1F3A4B] hover:bg-[#152733] text-white'
              ]"
            >
              ✎ Modify Action
            </button>
            <button
              @click="submitOutcome('rejected')"
              :disabled="outcomeSubmitting"
              :class="[
                'px-5 py-2.5 rounded-full font-black text-xs transition-all active:scale-95',
                selectedOutcome === 'rejected'
                  ? 'bg-[#902715] text-white ring-2 ring-[#902715]/40'
                  : 'bg-[#902715] hover:bg-[#a82e1a] text-white'
              ]"
            >
              ✕ Reject
            </button>
          </div>

          <!-- Modify Action Editor -->
          <div v-if="showModifyEditor" class="p-4 rounded-2xl bg-[#1F3A4B]/5 border border-[#1F3A4B]/20 space-y-2">
            <label class="text-[10px] uppercase font-black text-[#1F3A4B] tracking-wider block">Modified Action</label>
            <textarea
              v-model="modifyDraft"
              rows="3"
              class="w-full p-3 rounded-xl bg-white border border-[#1F3A4B]/20 text-xs font-bold text-[#1F3A4B] focus:outline-none focus:ring-2 focus:ring-[#1F3A4B]/30"
            ></textarea>
            <div class="flex items-center space-x-2">
              <button
                @click="submitModifiedFromEditor"
                :disabled="outcomeSubmitting"
                class="px-4 py-2 rounded-full bg-[#1F3A4B] hover:bg-[#152733] text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
              >
                Submit Modified Action
              </button>
              <button
                @click="cancelModifyEditor"
                :disabled="outcomeSubmitting"
                class="px-4 py-2 rounded-full bg-white border border-[#1F3A4B]/20 text-[#1F3A4B] text-[10px] font-black transition-all hover:bg-[#1F3A4B]/5"
              >
                Cancel
              </button>
            </div>
          </div>

          <!-- Outcome confirmation -->
          <div v-if="selectedOutcome" class="p-4 rounded-2xl bg-[#556B2F] text-white text-xs font-black shadow-sm">
            ✓ Logged as <span class="font-black uppercase text-[#F7FB41]">{{ selectedOutcome }}</span> to aegis_suggestions table.
            <button @click="resetPanel" class="ml-2 underline hover:text-[#F7FB41] font-black">Dismiss & request new advisory</button>
          </div>
        </div>
      </div>

      <!-- Raw Inputs Sidebar with Solid Color Cards -->
      <div class="p-6 rounded-[2.25rem_1.25rem_2.25rem_1.25rem] bg-white border border-[#1F3A4B]/15 space-y-4 shadow-sm admin-card">
        <h3 class="text-xs font-black uppercase tracking-wider text-[#1F3A4B]">Situational Inputs</h3>
        <div class="space-y-3 text-xs">
          <!-- Solid Brandy Red SOS Cluster Card -->
          <div class="p-4 rounded-2xl bg-[#902715] text-white shadow-sm">
            <span class="text-[10px] text-white/80 font-black uppercase block tracking-wider">SOS Cluster</span>
            <span class="text-white font-black text-lg block">{{ activeRecommendation.raw_inputs?.sos_cluster?.count || 0 }} reports</span>
            <span class="text-[#F7FB41] font-black block text-xs">Barangay {{ activeRecommendation.raw_inputs?.sos_cluster?.barangay }}</span>
          </div>

          <!-- Solid Earthy Slate Blue Flood Zone Card -->
          <div class="p-4 rounded-2xl bg-[#1F3A4B] text-white shadow-sm">
            <span class="text-[10px] text-white/80 font-black uppercase block tracking-wider">Flood Zone Severity</span>
            <span :class="[
              'font-black capitalize text-base block',
              activeRecommendation.raw_inputs?.flood_zone?.severity === 'danger' ? 'text-[#F7FB41]' :
              activeRecommendation.raw_inputs?.flood_zone?.severity === 'warning' ? 'text-[#F7FB41]' :
              'text-white'
            ]">
              {{ activeRecommendation.raw_inputs?.flood_zone?.severity || 'None' }}
            </span>
          </div>

          <!-- Solid Canary Yellow Weather Card -->
          <div class="p-4 rounded-2xl bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00] shadow-sm">
            <span class="text-[10px] text-[#0A0A0A]/80 font-black uppercase block tracking-wider">Weather Alert</span>
            <span class="text-[#0A0A0A] font-black text-sm block">{{ activeRecommendation.raw_inputs?.weather?.alert || 'None' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- No Active Recommendation Standby Banner -->
    <div v-if="!activeRecommendation && !isLoading" class="p-12 rounded-3xl bg-white border border-[#1F3A4B]/15 text-center space-y-4 shadow-sm admin-card">
      <div class="w-16 h-16 mx-auto rounded-3xl bg-[#1F3A4B] text-[#F7FB41] flex items-center justify-center shadow-md">
        <svg class="w-8 h-8 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <h4 class="text-xl font-black text-[#1F3A4B]">Aegis Advisory Engine Standby</h4>
      <p class="text-xs text-[#717171] max-w-md mx-auto font-bold leading-relaxed">
        Aegis auto-surfaces when an incident cluster forms (3+ SOS in same barangay within 30 min).
        For single SOS incidents, use the "Ask Aegis" button above.
      </p>
    </div>

    <!-- Advisory History Log Card -->
    <div class="p-7 rounded-[1rem_3.5rem_1rem_3.5rem] bg-white border-2 border-[#1F3A4B]/20 space-y-5 shadow-sm admin-card">
      <div class="flex items-center justify-between border-b-2 border-[#1F3A4B]/15 pb-3">
        <div class="flex items-center space-x-3">
          <button
            @click="toggleHistorySelectAll"
            class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
            :class="historySelectedCount === 0 ? 'border-[#1F3A4B]/30' : isHistoryAllSelected ? 'bg-[#902715] border-[#902715]' : 'bg-[#902715]/20 border-[#902715]'"
            :title="isHistoryAllSelected ? 'Deselect all' : 'Select all'"
          >
            <svg v-if="isHistoryAllSelected" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else-if="historySelectedCount > 0" class="w-3 h-3 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M20 12H4" />
            </svg>
          </button>
          <h3 class="text-xs font-black uppercase tracking-wider text-[#1F3A4B]">Advisory History Log</h3>
        </div>
        <div class="flex items-center space-x-3">
          <button @click="fetchHistory" class="text-xs text-[#902715] hover:underline font-black uppercase tracking-wider">
            Refresh Log
          </button>
        </div>
      </div>
      <!-- Pending (Awaiting Review) Section -->
      <div v-if="pendingSuggestions.length > 0" class="mb-5 space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-black uppercase tracking-wider text-[#902715]">Awaiting Review ({{ pendingSuggestions.length }})</h4>
          <span v-if="rowOutcomeMsg" class="text-[10px] font-black text-[#556B2F] uppercase tracking-wider">{{ rowOutcomeMsg }}</span>
        </div>
        <div
          v-for="s in pendingSuggestions"
          :key="s.id"
          class="p-4 rounded-2xl bg-white border-2 border-[#8a7e00]/40 border-l-4 border-l-[#F7FB41] shadow-sm space-y-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p class="font-black text-[#1F3A4B] text-xs leading-snug">{{ s.recommended_action }}</p>
              <p class="text-[10px] text-[#717171] font-bold mt-0.5">Barangay {{ s.target_barangay }} · {{ formatTimeAgo(s.created_at) }}</p>
            </div>
            <div class="flex items-center space-x-1.5 shrink-0">
              <span v-if="s.fallback" class="px-2 py-1 text-[9px] uppercase font-black rounded-full bg-[#D14D3E] text-white">Fallback</span>
              <span :class="['px-2.5 py-1 text-[10px] font-black rounded-full uppercase shadow-sm', confidenceBadgeClass(s.confidence)]">
                {{ s.confidence || 'n/a' }}
              </span>
              <span v-if="s.scenario_type" class="px-2 py-0.5 text-[10px] uppercase font-bold rounded" :class="scenarioBadgeClass(s.scenario_type)">
                {{ scenarioIcon(s.scenario_type) }} {{ s.scenario_type }}
              </span>
            </div>
          </div>

          <!-- Inline Modify Editor -->
          <div v-if="rowModifyId === s.id" class="p-3 rounded-xl bg-[#1F3A4B]/5 border border-[#1F3A4B]/15 space-y-2">
            <label class="text-[10px] uppercase font-black text-[#1F3A4B] tracking-wider block">Modified Action</label>
            <textarea
              v-model="rowModifyDraft"
              rows="2"
              class="w-full p-2.5 rounded-lg bg-white border border-[#1F3A4B]/20 text-xs font-bold text-[#1F3A4B] focus:outline-none focus:ring-2 focus:ring-[#1F3A4B]/30"
            ></textarea>
            <div class="flex items-center space-x-2">
              <button
                @click="submitPendingOutcome(s, 'modified')"
                :disabled="rowOutcomeBusy === s.id"
                class="px-3 py-1.5 rounded-full bg-[#1F3A4B] text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
              >
                Submit
              </button>
              <button
                @click="cancelRowModify"
                class="px-3 py-1.5 rounded-full bg-white border border-[#1F3A4B]/20 text-[#1F3A4B] text-[10px] font-black transition-all hover:bg-[#1F3A4B]/5"
              >
                Cancel
              </button>
            </div>
          </div>

          <div class="flex items-center space-x-2 pt-2.5 border-t border-[#1F3A4B]/10">
            <button
              @click="submitPendingOutcome(s, 'approved')"
              :disabled="rowOutcomeBusy === s.id"
              class="px-3.5 py-1.5 rounded-full bg-[#556B2F] hover:bg-[#435525] text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              Approve
            </button>
            <button
              @click="startRowModify(s)"
              :disabled="rowOutcomeBusy === s.id"
              class="px-3.5 py-1.5 rounded-full bg-[#1F3A4B] hover:bg-[#152733] text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              Modify
            </button>
            <button
              @click="submitPendingOutcome(s, 'rejected')"
              :disabled="rowOutcomeBusy === s.id"
              class="px-3.5 py-1.5 rounded-full bg-[#902715] hover:bg-[#a82e1a] text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
      <!-- Bulk Action Bar -->
      <div v-if="historySelectedCount > 0" class="flex items-center justify-between py-2.5 px-4 rounded-2xl bg-[#1F3A4B]/5 border border-[#1F3A4B]/15">
        <div class="flex items-center space-x-2.5">
          <span class="text-xs font-black text-[#1F3A4B]">{{ historySelectedCount }} selected</span>
          <button @click="clearHistorySelection" class="text-[10px] text-[#717171] hover:text-[#902715] font-black uppercase tracking-wider underline transition-colors">
            Clear
          </button>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="bulkExportSelected"
            class="px-3 py-1.5 rounded-full bg-[#1F3A4B] hover:bg-[#152733] text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
          >
            Export JSON
          </button>
          <button
            @click="showBulkDeleteConfirm = true"
            class="px-3 py-1.5 rounded-full bg-[#902715] hover:bg-[#a82e1a] text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>

      <!-- Bulk Delete Confirmation -->
      <div v-if="showBulkDeleteConfirm" class="p-4 rounded-2xl bg-[#FDE8E5] border border-[#D14D3E]/30 flex items-center justify-between">
        <span class="text-xs font-black text-[#D14D3E]">
          ⚠ Delete {{ historySelectedCount }} advisory {{ historySelectedCount === 1 ? 'entry' : 'entries' }}? This cannot be undone.
        </span>
        <div class="flex items-center space-x-2 shrink-0 ml-3">
          <button
            @click="showBulkDeleteConfirm = false"
            class="px-3 py-1.5 rounded-full bg-white border border-[#1F3A4B]/20 text-[#1F3A4B] text-[10px] font-black transition-all active:scale-95 hover:bg-[#1F3A4B]/5"
            :disabled="bulkDeleting"
          >
            Cancel
          </button>
          <button
            @click="bulkDeleteSelected"
            :disabled="bulkDeleting"
            class="px-4 py-1.5 rounded-full bg-[#902715] hover:bg-[#a82e1a] text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
          >
            <span v-if="bulkDeleting" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ bulkDeleting ? 'Deleting...' : 'Confirm Delete' }}</span>
          </button>
        </div>
      </div>

      <div v-if="historyLog.length === 0" class="text-xs text-[#717171] p-6 text-center font-bold">
        No advisory history yet. Aegis suggestions will appear here after operator action.
      </div>
      <div v-else class="space-y-3 max-h-64 overflow-y-auto pr-1">
        <div
          v-for="entry in historyLog"
          :key="entry.id"
          @click="toggleHistorySelect(entry.id)"
          class="p-4 rounded-2xl bg-white border-2 flex items-center space-x-3 transition-all hover:bg-[#1F3A4B]/5 shadow-sm cursor-pointer select-none"
          :class="selectedHistoryIds.includes(entry.id) ? 'border-[#902715]' : 'border-[#1F3A4B]/15 border-l-4 border-l-[#902715]'"
        >
          <!-- Custom checkbox -->
          <div
            @click.stop="toggleHistorySelect(entry.id)"
            class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
            :class="selectedHistoryIds.includes(entry.id) ? 'bg-[#902715] border-[#902715]' : 'border-[#1F3A4B]/30 hover:border-[#902715]'"
          >
            <svg v-if="selectedHistoryIds.includes(entry.id)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-black text-[#1F3A4B] text-xs leading-snug">{{ entry.recommended_action }}</p>
            <p class="text-[10px] text-[#717171] font-bold mt-0.5">Barangay {{ entry.target_barangay }} · {{ formatTimeAgo(entry.created_at) }} · {{ entry.status || 'reviewed' }}</p>
          </div>
          <span class="flex items-center space-x-1.5 shrink-0 ml-2">
            <span
              :class="['px-2.5 py-1 text-[10px] font-black rounded-full uppercase shadow-sm', confidenceBadgeClass(entry.confidence)]"
            >
              {{ entry.confidence || 'n/a' }}
            </span>
            <span
              :class="[
                'px-3.5 py-1.5 text-[10px] font-black rounded-full uppercase shadow-sm',
                entry.outcome === 'approved' ? 'bg-[#556B2F] text-white' :
                entry.outcome === 'modified' ? 'bg-[#1F3A4B] text-white' :
                'bg-[#902715] text-white'
              ]"
            >
              {{ entry.outcome }}
            </span>
          </span>
        </div>
      </div>
    </div>
  </div>

    <!-- Report Selector Modal -->
    <div
      v-if="showReportSelector"
      class="fixed inset-0 z-50 bg-[#1F3A4B]/50 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      @click.self="closeReportSelector"
    >
      <div class="w-full max-w-lg bg-white border border-[#1F3A4B]/20 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl max-h-[85vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-[#1F3A4B]/15 pb-3.5 shrink-0">
          <h3 class="font-expressive text-xl font-black text-[#1F3A4B]">Select Report Source for Aegis Advisory</h3>
          <div class="flex items-center space-x-2">
            <button
              @click="toggleBulkMode"
              class="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 border shrink-0"
              :class="bulkMode ? 'bg-[#902715] text-white border-[#902715]' : 'bg-white text-[#1F3A4B] border-[#1F3A4B]/30 hover:bg-[#1F3A4B]/10'"
            >
              {{ bulkMode ? 'Single Mode' : 'Bulk Select' }}
            </button>
            <button
              @click="closeReportSelector"
              class="w-10 h-10 rounded-full bg-[#902715] text-white flex items-center justify-center font-black transition-all hover:scale-105 shadow-md shrink-0"
            >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

        <!-- Scrollable Body -->
        <div class="space-y-4 overflow-y-auto pr-1 flex-1">
          <!-- Section 1: SOS Clusters -->
          <div v-if="sosStore.activeClusters.length > 0">
            <h4 class="text-[10px] uppercase font-black text-[#902715] tracking-wider mb-2 flex items-center space-x-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>SOS Clusters ({{ sosStore.activeClusters.length }})</span>
            </h4>
            <div class="space-y-2">
              <div
                v-for="cluster in sosStore.activeClusters"
                :key="cluster.barangay"
                @click="bulkMode ? toggleReportSelection(cluster, 'cluster') : selectCluster(cluster)"
                class="p-3.5 rounded-2xl bg-[#1F3A4B] text-white border cursor-pointer transition-all active:scale-[0.98] flex items-center space-x-3"
                :class="bulkMode && isReportSelected(cluster, 'cluster') ? 'border-[#F7FB41]' : 'border-[#1F3A4B] hover:border-[#F7FB41]/60'"
              >
                <!-- Bulk checkbox -->
                <div
                  v-if="bulkMode"
                  @click.stop="toggleReportSelection(cluster, 'cluster')"
                  class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                  :class="isReportSelected(cluster, 'cluster') ? 'bg-[#F7FB41] border-[#F7FB41]' : 'border-white/50 hover:border-[#F7FB41]'"
                >
                  <svg v-if="isReportSelected(cluster, 'cluster')" class="w-3 h-3 text-[#1F3A4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-black">Barangay {{ cluster.barangay }}</span>
                    <span class="px-2.5 py-0.5 rounded-full bg-[#902715] text-[10px] font-black uppercase tracking-wider text-white shadow-sm shrink-0 ml-2">
                      {{ cluster.count }} reports
                    </span>
                  </div>
                  <p class="text-[10px] text-[#F7FB41] font-bold mt-1.5 flex items-center space-x-1">
                    <span>{{ oldestReportTime(cluster.reports) }}</span>
                    <span class="mx-1">·</span>
                    <span>Cluster (3+ in 30min)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Individual SOS Reports -->
          <div v-if="pendingSOSReports.length > 0">
            <h4 class="text-[10px] uppercase font-black text-[#902715] tracking-wider mb-2 flex items-center space-x-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Individual SOS Reports ({{ pendingSOSReports.length }})</span>
            </h4>
            <div class="space-y-2">
              <div
                v-for="report in pendingSOSReports"
                :key="report.id"
                @click="bulkMode ? toggleReportSelection(report, 'sos') : selectSOS(report)"
                class="p-3.5 rounded-2xl bg-white border cursor-pointer transition-all active:scale-[0.98] shadow-sm flex items-center space-x-3"
                :class="bulkMode && isReportSelected(report, 'sos') ? 'border-[#902715] bg-[#902715]/5' : 'border-[#1F3A4B]/15 hover:border-[#1F3A4B]/40 hover:bg-[#EEF4FB]'"
              >
                <!-- Bulk checkbox -->
                <div
                  v-if="bulkMode"
                  @click.stop="toggleReportSelection(report, 'sos')"
                  class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                  :class="isReportSelected(report, 'sos') ? 'bg-[#902715] border-[#902715]' : 'border-[#1F3A4B]/30 hover:border-[#902715]'"
                >
                  <svg v-if="isReportSelected(report, 'sos')" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-black text-[#1F3A4B]">Barangay {{ report.barangay }}</span>
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-sm shrink-0 ml-2"
                      :class="report.status === 'pending' ? 'bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00]' : 'bg-[#1F3A4B] text-white'"
                    >
                      {{ report.status }}
                    </span>
                  </div>
                  <p class="text-[10px] text-[#717171] font-bold mt-1">{{ formatTimeAgo(report.created_at) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Community Reports -->
          <div v-if="openCommunityReports.length > 0">
            <h4 class="text-[10px] uppercase font-black text-[#902715] tracking-wider mb-2 flex items-center space-x-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Community Reports ({{ openCommunityReports.length }})</span>
            </h4>
            <div class="space-y-2">
              <div
                v-for="report in openCommunityReports"
                :key="report.id"
                @click="bulkMode ? toggleReportSelection(report, 'community') : selectCommunityReport(report)"
                class="p-3.5 rounded-2xl bg-white border cursor-pointer transition-all active:scale-[0.98] shadow-sm flex items-center space-x-3"
                :class="bulkMode && isReportSelected(report, 'community') ? 'border-[#902715] bg-[#902715]/5' : 'border-[#1F3A4B]/15 hover:border-[#1F3A4B]/40 hover:bg-[#EEF4FB]'"
              >
                <!-- Bulk checkbox -->
                <div
                  v-if="bulkMode"
                  @click.stop="toggleReportSelection(report, 'community')"
                  class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                  :class="isReportSelected(report, 'community') ? 'bg-[#902715] border-[#902715]' : 'border-[#1F3A4B]/30 hover:border-[#902715]'"
                >
                  <svg v-if="isReportSelected(report, 'community')" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-black text-[#1F3A4B]">Barangay {{ report.barangay }}</span>
                    <span class="px-2.5 py-0.5 rounded-full bg-[#902715] text-white text-[10px] font-black uppercase shadow-sm shrink-0 ml-2">
                      {{ report.ai_category || 'general' }}
                    </span>
                  </div>
                  <p class="text-[10px] text-[#717171] font-bold mt-1 leading-relaxed line-clamp-2">
                    {{ report.raw_description ? report.raw_description.slice(0, 80) + (report.raw_description.length > 80 ? '...' : '') : 'No description' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="!hasAnyReports" class="text-center py-8">
            <div class="w-12 h-12 mx-auto rounded-2xl bg-[#1F3A4B]/10 flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-[#1F3A4B]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p class="text-xs text-[#717171] font-black">No active reports or clusters available.</p>
            <p class="text-[10px] text-[#717171] font-bold mt-1">Use the option below to ask without a specific report.</p>
          </div>

          <!-- Bottom: Ask without specific report -->
          <div class="pt-2" :class="{ 'border-t border-[#1F3A4B]/15': hasAnyReports }">
            <button
              @click="askAegisDefault"
              class="w-full p-3.5 rounded-2xl border-2 border-dashed border-[#1F3A4B]/20 hover:border-[#1F3A4B]/40 hover:bg-[#EEF4FB] transition-all text-left group"
            >
              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-[#1F3A4B]/40 group-hover:text-[#1F3A4B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span class="text-xs font-black text-[#1F3A4B]">Ask without specific report</span>
              </div>
              <p class="text-[10px] text-[#717171] font-bold mt-0.5 ml-6">Use default context (Tagapo, watch severity) — same as original Ask Aegis</p>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-4 border-t-2 border-[#1F3A4B]/20 flex items-center justify-between shrink-0">
          <span v-if="bulkMode && selectedReportsCount > 0" class="text-xs font-black text-[#1F3A4B]">
            {{ selectedReportsCount }} selected
          </span>
          <div class="flex items-center space-x-2 ml-auto">
            <button
              @click="closeReportSelector"
              class="px-6 py-3 rounded-full bg-[#902715] hover:bg-[#a82e1a] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              v-if="bulkMode"
              @click="submitBulkSelection"
              :disabled="selectedReportsCount === 0"
              class="px-6 py-3 rounded-full bg-[#1F3A4B] hover:bg-[#152733] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Ask Aegis ({{ selectedReportsCount }})
            </button>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSOSStore } from '@/stores/sosStore'
import { useReportStore } from '@/stores/reportStore'
import { useFlowStore } from '@/stores/flowStore'
import { useAegisStore } from '@/stores/aegisStore'
import { supabase } from '@/lib/supabase'

const sosStore = useSOSStore()
const reportStore = useReportStore()
const flowStore = useFlowStore()
const aegisStore = useAegisStore()

const isLoading = computed(() => aegisStore.generating)
const activeRecommendation = ref(null)
const selectedOutcome = ref(null)
const outcomeSubmitting = ref(false)
const outcomeError = ref('')
const historyLog = computed(() => aegisStore.history)
const pendingSuggestions = computed(() => aegisStore.pendingSuggestions)
const showScenarioSelector = ref(false)
const showReportSelector = ref(false)
const bulkMode = ref(false)
const showModifyEditor = ref(false)
const modifyDraft = ref('')
const rowModifyId = ref(null)
const rowModifyDraft = ref('')
const rowOutcomeBusy = ref(null)
const rowOutcomeMsg = ref('')
let outcomeClearTimer = null
let rowMsgTimer = null

function toggleBulkMode() {
  bulkMode.value = !bulkMode.value
  if (!bulkMode.value) clearReportSelection()
}

// Bulk selection for report selector modal
const selectedReports = ref([])

const selectedReportsCount = computed(() => selectedReports.value.length)

function reportSelectionId(item, type) {
  return type === 'cluster' ? `cluster:${item.barangay}` : `${type}:${item.id}`
}

function toggleReportSelection(item, type) {
  const id = reportSelectionId(item, type)
  const idx = selectedReports.value.findIndex(s => s.id === id)
  if (idx >= 0) {
    selectedReports.value = selectedReports.value.filter(s => s.id !== id)
  } else {
    selectedReports.value = [...selectedReports.value, { id, type, data: item }]
  }
}

function isReportSelected(item, type) {
  return selectedReports.value.some(s => s.id === reportSelectionId(item, type))
}

function clearReportSelection() {
  selectedReports.value = []
}

function submitBulkSelection() {
  const sel = selectedReports.value
  if (sel.length === 0) return
  showReportSelector.value = false

  // Collect all SOS IDs from clusters + individual SOS reports
  const sosIds = []
  const barangays = []
  let totalCount = 0
  let weatherAlert = null

  for (const s of sel) {
    if (s.type === 'cluster') {
      const c = s.data
      sosIds.push(...(c.reports?.map(r => r.id) || []))
      barangays.push(c.barangay)
      totalCount += c.count || c.reports?.length || 0
    } else if (s.type === 'sos') {
      sosIds.push(s.data.id)
      barangays.push(s.data.barangay)
      totalCount += 1
    } else if (s.type === 'community') {
      barangays.push(s.data.barangay)
      if (!weatherAlert) weatherAlert = s.data.raw_description
    }
  }

  // Most common barangay
  const modeBarangay = barangays.sort((a, b) =>
    barangays.filter(v => v === a).length - barangays.filter(v => v === b).length
  ).pop() || 'Tagapo'

  clearReportSelection()
  invokeAegis(
    [...new Set(sosIds)], // deduplicate
    modeBarangay,
    totalCount || sel.length,
    flowStore.zoneSeverity,
    weatherAlert,
    'flood'
  )
}

// Bulk selection for history log
const selectedHistoryIds = ref([])
const showBulkDeleteConfirm = ref(false)
const bulkDeleting = ref(false)

const historySelectedCount = computed(() => selectedHistoryIds.value.length)

const isHistoryAllSelected = computed(() =>
  historyLog.value.length > 0 && selectedHistoryIds.value.length === historyLog.value.length
)

const pendingSOSReports = computed(() =>
  sosStore.activeReports.filter(r => r.status === 'pending' || r.status === 'responding')
)

const openCommunityReports = computed(() =>
  reportStore.reports.filter(r => r.status === 'open' || r.status === 'in_review')
)

const hasAnyReports = computed(() =>
  sosStore.activeClusters.length > 0 ||
  pendingSOSReports.value.length > 0 ||
  openCommunityReports.value.length > 0
)

const scenarios = {
  flood: {
    label: 'Flood',
    icon: '🌊',
    sos_ids: ['sim_flood_001', 'sim_flood_002', 'sim_flood_003'],
    barangay: 'Tagapo',
    count: 3,
    floodSeverity: 'danger',
    weatherAlert: 'Heavy rainfall warning: 18.5mm/hr sustained. Typhoon signal #2 raised over Santa Rosa City.',
    description: 'Rising flood waters, water rescue needed'
  },
  earthquake: {
    label: 'Earthquake',
    icon: '🏚️',
    sos_ids: ['sim_eq_001', 'sim_eq_002', 'sim_eq_003', 'sim_eq_004', 'sim_eq_005'],
    barangay: 'Malitlit',
    count: 5,
    floodSeverity: 'none',
    weatherAlert: 'Aftershock warning: M5.2 earthquake detected 15km east of Santa Rosa. Possible structural damage.',
    description: 'Building collapse, search & rescue needed'
  },
  typhoon: {
    label: 'Typhoon',
    icon: '🌀',
    sos_ids: ['sim_ty_001', 'sim_ty_002', 'sim_ty_003', 'sim_ty_004'],
    barangay: 'Dila',
    count: 4,
    floodSeverity: 'warning',
    weatherAlert: 'Typhoon Signal #3. Maximum sustained winds 120km/h. Coastal storm surge expected. Widespread power outages.',
    description: 'Pre-emptive evacuation, shelter management'
  },
  fire: {
    label: 'Fire',
    icon: '🔥',
    sos_ids: ['sim_fire_001', 'sim_fire_002'],
    barangay: 'Market Area',
    count: 2,
    floodSeverity: 'none',
    weatherAlert: 'Structural fire reported in commercial district. Fire spreading risk due to nearby buildings. Dense urban area.',
    description: 'Fire suppression, perimeter evacuation'
  },
  landslide: {
    label: 'Landslide',
    icon: '⛰️',
    sos_ids: ['sim_ls_001', 'sim_ls_002', 'sim_ls_003'],
    barangay: 'Sinalhan',
    count: 3,
    floodSeverity: 'watch',
    weatherAlert: 'Continuous heavy rain for 48 hours. Soil saturation critical. Tension cracks reported on hillside slope.',
    description: 'Geohazard assessment, route closure'
  }
}

onMounted(async () => {
  aegisStore.init()
  // Ensure SOS data is loaded if navigated here directly
  if (sosStore.activeReports.length === 0) {
    await sosStore.fetchActiveReports()
    sosStore.subscribeToRealtimeSOS()
  }
  // Load community reports for selector
  if (reportStore.reports.length === 0) {
    await reportStore.fetchReports()
    reportStore.subscribeRealtimeReports()
  }
})

onUnmounted(() => {
  // Keep SOS subscription alive for other admin pages — don't unsubscribe here
})

function openReportSelector() {
  showReportSelector.value = true
}

function closeReportSelector() {
  showReportSelector.value = false
}

async function selectCluster(cluster) {
  showReportSelector.value = false
  clearReportSelection()
  await invokeAegis(
    cluster.reports.map(r => r.id),
    cluster.barangay,
    cluster.count,
    flowStore.zoneSeverity,
    null,
    'flood'
  )
}

async function selectSOS(report) {
  showReportSelector.value = false
  clearReportSelection()
  await invokeAegis(
    [report.id],
    report.barangay,
    1,
    flowStore.zoneSeverity,
    null,
    'flood'
  )
}

async function selectCommunityReport(report) {
  showReportSelector.value = false
  clearReportSelection()
  await invokeAegis(
    [report.id],
    report.barangay,
    1,
    flowStore.zoneSeverity,
    report.raw_description || 'Community report context',
    'flood'
  )
}

function oldestReportTime(reports) {
  if (!reports || reports.length === 0) return ''
  const oldest = reports.reduce((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0
    const bTime = b.created_at ? Date.parse(b.created_at) : 0
    return aTime < bTime ? a : b
  })
  return `Earliest: ${formatTimeAgo(oldest.created_at)}`
}

async function askAegisDefault() {
  showReportSelector.value = false
  // Use current cluster if available, otherwise use first pending SOS
  const clusters = sosStore.activeClusters
  if (clusters.length > 0) {
    const cluster = clusters[0]
    await invokeAegis(
      cluster.reports.map(r => r.id),
      cluster.barangay,
      cluster.count,
      flowStore.zoneSeverity,
      null,
      'flood'
    )
  } else {
    const pending = sosStore.activeReports.filter(r => r.status === 'pending')
    if (pending.length > 0) {
      const first = pending[0]
      await invokeAegis(
        [first.id],
        first.barangay,
        1,
        flowStore.zoneSeverity,
        null,
        'flood'
      )
    } else {
      await invokeAegis([], 'Tagapo', 0, 'watch', 'No active alerts', 'flood')
    }
  }
}

async function simulateScenario(key) {
  const s = scenarios[key]
  if (!s) return
  showScenarioSelector.value = false
  await invokeAegis(s.sos_ids, s.barangay, s.count, s.floodSeverity, s.weatherAlert, key)
}

async function invokeAegis(sosIds, barangay, count, floodSeverity, weatherAlert, scenarioType = 'flood') {
  activeRecommendation.value = null
  selectedOutcome.value = null
  outcomeError.value = ''
  showModifyEditor.value = false
  modifyDraft.value = ''

  const row = await aegisStore.generateSuggestion({
    sos_ids: sosIds,
    cluster_barangay: barangay,
    cluster_count: count,
    flood_zone_severity: floodSeverity,
    weather_alert: weatherAlert,
    scenario_type: scenarioType
  })
  if (row) {
    activeRecommendation.value = row
  }
}

async function submitOutcome(outcome) {
  if (!activeRecommendation.value || outcomeSubmitting.value) return

  // First click on 'modified' reveals the inline editor — do not submit yet
  if (outcome === 'modified' && !showModifyEditor.value) {
    showModifyEditor.value = true
    modifyDraft.value = activeRecommendation.value.recommended_action || ''
    return
  }

  if (outcome === 'modified' && (!modifyDraft.value || !modifyDraft.value.trim())) {
    outcomeError.value = 'Please provide a modified action before submitting.'
    return
  }

  outcomeSubmitting.value = true
  outcomeError.value = ''

  try {
    const id = activeRecommendation.value.id
    if (!id) throw new Error('Active advisory has no persisted id to update.')

    await aegisStore.setOutcome(id, {
      outcome,
      modifiedAction: outcome === 'modified' ? modifyDraft.value.trim() : null
    })

    // Confirmation banner — auto-dismiss after ~4s
    selectedOutcome.value = outcome
    showModifyEditor.value = false
    modifyDraft.value = ''
    clearTimeout(outcomeClearTimer)
    outcomeClearTimer = setTimeout(() => {
      resetPanel()
    }, 4000)
  } catch (err) {
    console.warn('Failed to log Aegis outcome:', err)
    outcomeError.value = err.message || 'Unable to log operator outcome.'
  } finally {
    outcomeSubmitting.value = false
  }
}

function cancelModifyEditor() {
  showModifyEditor.value = false
  modifyDraft.value = ''
}

async function submitModifiedFromEditor() {
  if (!modifyDraft.value || !modifyDraft.value.trim()) {
    outcomeError.value = 'Please provide a modified action before submitting.'
    return
  }
  await submitOutcome('modified')
}

function startRowModify(s) {
  if (rowModifyId.value === s.id) return
  rowModifyId.value = s.id
  rowModifyDraft.value = s.recommended_action || ''
}

function cancelRowModify() {
  rowModifyId.value = null
  rowModifyDraft.value = ''
}

async function submitPendingOutcome(s, outcome) {
  if (rowOutcomeBusy.value) return
  let modifiedAction = null
  if (outcome === 'modified') {
    if (!rowModifyDraft.value || !rowModifyDraft.value.trim()) {
      outcomeError.value = 'Please provide a modified action before submitting.'
      return
    }
    modifiedAction = rowModifyDraft.value.trim()
  }
  rowOutcomeBusy.value = s.id
  outcomeError.value = ''
  try {
    await aegisStore.setOutcome(s.id, { outcome, modifiedAction })
    rowModifyId.value = null
    rowModifyDraft.value = ''
    rowOutcomeMsg.value = `Logged as ${outcome}`
    clearTimeout(rowMsgTimer)
    rowMsgTimer = setTimeout(() => {
      rowOutcomeMsg.value = ''
    }, 4000)
  } catch (err) {
    console.warn('Failed to log Aegis outcome:', err)
    outcomeError.value = err.message || 'Unable to log operator outcome.'
  } finally {
    rowOutcomeBusy.value = null
  }
}

function resetPanel() {
  activeRecommendation.value = null
  selectedOutcome.value = null
  outcomeError.value = ''
  outcomeSubmitting.value = false
  showModifyEditor.value = false
  modifyDraft.value = ''
}

async function fetchHistory() {
  await aegisStore.fetchHistory()
}

function confidenceBadgeClass(conf) {
  if (conf === 'high') return 'bg-[#556B2F] text-white'
  if (conf === 'medium') return 'bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00]'
  return 'bg-[#D14D3E] text-white'
}

function scenarioBadgeClass(type) {
  const map = {
    flood: 'bg-blue-900 text-blue-200',
    earthquake: 'bg-orange-900 text-orange-200',
    typhoon: 'bg-cyan-900 text-cyan-200',
    fire: 'bg-red-900 text-red-200',
    landslide: 'bg-amber-900 text-amber-200'
  }
  return map[type] || 'bg-slate-800 text-slate-300'
}

function scenarioIcon(type) {
  const map = {
    flood: '🌊', earthquake: '🏚️', typhoon: '🌀', fire: '🔥', landslide: '⛰️'
  }
  return map[type] || '🤖'
}

// ── Bulk selection ──
function toggleHistorySelect(id) {
  if (selectedHistoryIds.value.includes(id)) {
    selectedHistoryIds.value = selectedHistoryIds.value.filter(v => v !== id)
  } else {
    selectedHistoryIds.value = [...selectedHistoryIds.value, id]
  }
}

function toggleHistorySelectAll() {
  if (isHistoryAllSelected.value) {
    selectedHistoryIds.value = []
  } else {
    selectedHistoryIds.value = historyLog.value.map(e => e.id)
  }
}

function clearHistorySelection() {
  selectedHistoryIds.value = []
  showBulkDeleteConfirm.value = false
}

async function bulkDeleteSelected() {
  bulkDeleting.value = true
  try {
    const ids = [...selectedHistoryIds.value]
    const { error } = await supabase
      .from('aegis_suggestions')
      .delete()
      .in('id', ids)
    if (error) throw error
    clearHistorySelection()
    await fetchHistory()
  } catch (err) {
    console.warn('Bulk delete failed:', err)
  } finally {
    bulkDeleting.value = false
    showBulkDeleteConfirm.value = false
  }
}

function bulkExportSelected() {
  const selected = historyLog.value.filter(e => selectedHistoryIds.value.includes(e.id))
  const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `aegis-advisories-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  clearHistorySelection()
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Just now'
  const ts = new Date(dateStr).getTime()
  if (!Number.isFinite(ts)) return 'Just now'
  const diffMs = Date.now() - ts
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}
</script>
