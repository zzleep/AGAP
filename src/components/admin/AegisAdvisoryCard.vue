<template>
  <!-- ─────────────────────────── LOADING ─────────────────────────── -->
  <div v-if="loading" :class="wrapperClass" role="status" aria-live="polite">
    <!-- compact -->
    <template v-if="isCompact">
      <span class="w-2 h-2 rounded-full bg-[#F7FB41] border border-[#8a7e00] animate-pulse shrink-0"></span>
      <span class="text-[10px] font-black uppercase tracking-wider text-[#1F3A4B]">Aegis analyzing&hellip;</span>
    </template>
    <!-- banner / card -->
    <template v-else>
      <div class="flex flex-wrap items-center gap-3">
        <div
          :class="[
            'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm',
            isBanner ? 'bg-white/15 text-[#F7FB41]' : 'bg-[#1F3A4B] text-[#F7FB41]'
          ]"
        >
          <ShieldIcon class="w-5 h-5 animate-pulse" />
        </div>
        <div class="min-w-0">
          <span
            :class="['block text-[10px] uppercase font-black tracking-wider', isBanner ? 'text-[#F7FB41]' : 'text-[#1F3A4B]']"
          >Aegis Advisory</span>
          <p :class="['text-xs font-bold mt-0.5', isBanner ? 'text-white/85' : 'text-[#717171]']">
            Generating recommendation&hellip;
          </p>
        </div>
      </div>
    </template>
  </div>

  <!-- ─────────────────────────── ERROR ─────────────────────────── -->
  <div v-else-if="error" :class="wrapperClass" role="alert">
    <!-- compact -->
    <template v-if="isCompact">
      <svg class="w-3.5 h-3.5 text-[#D14D3E] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span class="text-[10px] font-bold text-[#D14D3E] truncate min-w-0">Aegis unavailable</span>
      <button
        type="button"
        class="text-[10px] font-black uppercase tracking-wider text-[#902715] hover:underline shrink-0"
        @click="requestAdvisory"
      >Retry</button>
    </template>
    <!-- banner / card -->
    <template v-else>
      <div class="flex flex-wrap items-center gap-3">
        <div
          :class="[
            'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-sm',
            isBanner ? 'bg-[#D14D3E]/80' : 'bg-[#D14D3E]'
          ]"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="min-w-0 flex-1">
          <span
            :class="['block text-[10px] uppercase font-black tracking-wider', isBanner ? 'text-[#F7FB41]' : 'text-[#D14D3E]']"
          >Aegis unavailable</span>
          <p :class="['text-xs font-bold mt-0.5 break-words', isBanner ? 'text-white/85' : 'text-[#D14D3E]']">{{ error }}</p>
        </div>
        <button
          type="button"
          @click="requestAdvisory"
          :class="[
            'px-3.5 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95 shrink-0',
            isBanner ? 'bg-[#F7FB41] text-[#0A0A0A] hover:bg-[#E8EC2E]' : 'bg-[#902715] text-white hover:bg-[#a82e1a]'
          ]"
        >Retry</button>
      </div>
    </template>
  </div>

  <!-- ─────────────────────────── EMPTY / ASK AEGIS ─────────────────────────── -->
  <div v-else-if="!suggestion" :class="wrapperClass">
    <!-- compact -->
    <template v-if="isCompact">
      <ShieldIcon class="w-3.5 h-3.5 text-[#1F3A4B] shrink-0" />
      <button
        type="button"
        class="text-[10px] font-black uppercase tracking-wider text-[#902715] hover:underline shrink-0"
        @click="requestAdvisory"
      >Ask Aegis</button>
    </template>
    <!-- banner / card -->
    <template v-else>
      <div class="flex flex-wrap items-center gap-3">
        <div
          :class="[
            'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm',
            isBanner ? 'bg-white/15 text-[#F7FB41]' : 'bg-[#1F3A4B] text-[#F7FB41]'
          ]"
        >
          <ShieldIcon class="w-5 h-5" />
        </div>
        <div class="min-w-0 flex-1">
          <span
            :class="['block text-[10px] uppercase font-black tracking-wider', isBanner ? 'text-[#F7FB41]' : 'text-[#1F3A4B]']"
          >Aegis Advisory</span>
          <p :class="['text-xs font-bold mt-0.5', isBanner ? 'text-white/85' : 'text-[#717171]']">
            No advisory yet. Ask Aegis for a recommended response.
          </p>
        </div>
        <button
          type="button"
          @click="requestAdvisory"
          :class="[
            'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-black text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95 shrink-0',
            isBanner ? 'bg-[#F7FB41] text-[#0A0A0A] hover:bg-[#E8EC2E]' : 'bg-[#1F3A4B] text-[#F7FB41] hover:bg-[#152733]'
          ]"
        >
          <ShieldIcon class="w-3.5 h-3.5" />
          Ask Aegis
        </button>
      </div>
    </template>
  </div>

  <!-- ─────────────────────────── SUGGESTION PRESENT ─────────────────────────── -->
  <div v-else :class="wrapperClass">
    <!-- ══ COMPACT: single dense row ══ -->
    <template v-if="isCompact">
      <template v-if="modifying">
        <input
          v-model="draft"
          type="text"
          class="w-32 min-w-0 text-xs font-bold bg-white border border-[#1F3A4B]/25 rounded-md px-1.5 py-0.5 text-[#1F3A4B] focus:outline-none focus:border-[#902715] transition-all"
          aria-label="Modified recommended action"
        />
        <button
          type="button"
          class="w-6 h-6 rounded-full bg-[#556B2F] hover:bg-[#435525] text-white flex items-center justify-center transition-all active:scale-90 shrink-0"
          title="Apply modified action"
          aria-label="Apply modified action"
          @click="submitModified"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button
          type="button"
          class="w-6 h-6 rounded-full bg-[#1F3A4B]/10 hover:bg-[#1F3A4B]/20 text-[#1F3A4B] flex items-center justify-center transition-all active:scale-90 shrink-0"
          title="Cancel"
          aria-label="Cancel modification"
          @click="cancelModify"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </template>

      <template v-else>
        <!-- confidence dot -->
        <span
          :class="['w-2 h-2 rounded-full shrink-0', confidence.dot]"
          :title="confidence.label"
          :aria-label="confidence.label"
        ></span>

        <!-- one-line action snippet -->
        <span
          class="text-xs font-bold text-[#1F3A4B] truncate min-w-0 max-w-[180px]"
          :title="suggestion.recommended_action"
        >{{ suggestion.recommended_action }}</span>

        <!-- fallback hint -->
        <svg
          v-if="suggestion.fallback"
          class="w-3 h-3 text-[#D14D3E] shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          title="Fallback advisory"
          aria-label="Fallback advisory"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>

        <!-- resolved: outcome chip instead of buttons -->
        <span
          v-if="isResolved"
          :class="['shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white', resolvedChipClass]"
          :title="'Advisory ' + outcomeMeta.label.toLowerCase()"
        >{{ outcomeMeta.label }}</span>

        <!-- pending: quiet pulsing dot -->
        <span
          v-else-if="isPending"
          class="shrink-0 w-2 h-2 rounded-full bg-[#F7FB41] border border-[#8a7e00] animate-pulse"
          title="Awaiting operator review"
          aria-label="Awaiting operator review"
        ></span>

        <!-- inline outcome buttons -->
        <template v-else>
          <div class="flex items-center gap-1 shrink-0 ml-0.5">
            <button
              type="button"
              class="w-6 h-6 rounded-full bg-[#556B2F] hover:bg-[#435525] text-white flex items-center justify-center transition-all active:scale-90"
              title="Approve"
              aria-label="Approve advisory"
              @click="choose('approved')"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              type="button"
              class="w-6 h-6 rounded-full bg-[#1F3A4B] hover:bg-[#152733] text-white flex items-center justify-center transition-all active:scale-90"
              title="Modify"
              aria-label="Modify advisory"
              @click="openModify"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              type="button"
              class="w-6 h-6 rounded-full bg-[#D14D3E] hover:bg-[#b83f32] text-white flex items-center justify-center transition-all active:scale-90"
              title="Reject"
              aria-label="Reject advisory"
              @click="choose('rejected')"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </template>
      </template>
    </template>

    <!-- ══ BANNER: horizontal strip for dark cluster alert ══ -->
    <div v-else-if="isBanner" class="space-y-3">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <!-- left: label + chips + headline + reasoning -->
        <div class="min-w-0 flex-1 space-y-1.5">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="inline-flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-[#F7FB41]">
              <ShieldIcon class="w-3.5 h-3.5" />
              Aegis recommendation
            </span>
            <span :class="[chipBase, chipBarangay]">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Barangay {{ suggestion.target_barangay }}
            </span>
            <span :class="[chipBase, chipConfidence]">{{ confidence.label }}</span>
            <span
              v-if="suggestion.fallback"
              :class="[chipBase, chipFallback]"
              title="Gemini could not be reached; standard fallback shown"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Fallback advisory
            </span>
            <span v-if="isPending" :class="[chipBase, chipPending]">
              <span class="w-1.5 h-1.5 rounded-full bg-[#F7FB41] animate-pulse"></span>
              Awaiting review
            </span>
          </div>

          <h4 class="font-expressive text-sm md:text-base font-black text-white leading-snug">{{ suggestion.recommended_action }}</h4>

          <p v-if="suggestion.reasoning" class="text-xs text-white/80 leading-relaxed line-clamp-2 font-medium">
            {{ suggestion.reasoning }}
          </p>
        </div>

        <!-- right: resolved chip or outcome buttons -->
        <div v-if="isResolved" class="shrink-0 flex items-center gap-2">
          <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white', resolvedChipClass]">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" :d="outcomeMeta.icon" />
            </svg>
            {{ outcomeMeta.label }}
          </span>
          <span class="hidden sm:inline text-[10px] font-bold text-white/70 uppercase tracking-wider">Closed</span>
        </div>
        <div v-else class="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            @click="choose('approved')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#556B2F] hover:bg-[#435525] text-white text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            Approve
          </button>
          <button
            type="button"
            @click="openModify"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/25 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modify
          </button>
          <button
            type="button"
            @click="choose('rejected')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D14D3E] hover:bg-[#b83f32] text-white text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reject
          </button>
        </div>
      </div>

      <!-- modify textarea (dark) -->
      <div v-if="modifying" class="rounded-2xl bg-white/10 border border-white/15 p-3.5 space-y-2.5">
        <label :for="'aegis-modify-' + suggestion.id" class="block text-[10px] uppercase font-black tracking-wider text-[#F7FB41]">
          Modified recommended action
        </label>
        <textarea
          :id="'aegis-modify-' + suggestion.id"
          v-model="draft"
          rows="3"
          class="w-full px-3.5 py-2.5 rounded-2xl bg-white/10 border border-white/25 text-white text-xs font-bold placeholder-white/50 focus:outline-none focus:border-[#F7FB41] transition-all resize-y"
        ></textarea>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            @click="cancelModify"
            class="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
          >Cancel</button>
          <button
            type="button"
            @click="submitModified"
            class="px-3.5 py-1.5 rounded-full bg-[#556B2F] hover:bg-[#435525] text-white text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
          >Apply modified action</button>
        </div>
      </div>
    </div>

    <!-- ══ CARD: standalone block on #EEF4FB ══ -->
    <div v-else class="space-y-4">
      <!-- header -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-[#1F3A4B] text-[#F7FB41] flex items-center justify-center shrink-0 shadow-sm">
            <ShieldIcon class="w-4 h-4" />
          </div>
          <div>
            <span class="block text-[10px] uppercase font-black tracking-wider text-[#1F3A4B]">Aegis Advisory</span>
            <span class="block text-[10px] text-[#717171] font-bold mt-0.5">Recommended action</span>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <span :class="[chipBase, chipConfidence]">{{ confidence.label }}</span>
          <span
            v-if="suggestion.fallback"
            :class="[chipBase, chipFallback]"
            title="Gemini could not be reached; standard fallback shown"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Fallback advisory
          </span>
          <span v-if="isPending" :class="[chipBase, chipPending]">
            <span class="w-1.5 h-1.5 rounded-full bg-[#F7FB41] border border-[#8a7e00] animate-pulse"></span>
            Awaiting review
          </span>
        </div>
      </div>

      <!-- recommendation headline -->
      <h4 class="font-expressive text-xl md:text-2xl font-black text-[#1F3A4B] leading-snug">{{ suggestion.recommended_action }}</h4>

      <!-- context chips -->
      <div class="flex flex-wrap items-center gap-1.5">
        <span :class="[chipBase, chipBarangay]">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Barangay {{ suggestion.target_barangay }}
        </span>
        <span v-if="suggestion.scenario_type" :class="[chipBase, chipScenario]">{{ suggestion.scenario_type }}</span>
      </div>

      <!-- reasoning -->
      <div v-if="suggestion.reasoning" class="rounded-2xl bg-[#F7FB41] border border-[#8a7e00] p-4 space-y-1.5 shadow-sm">
        <span class="block text-[10px] uppercase font-black tracking-wider text-[#0A0A0A]">Reasoning</span>
        <p class="text-xs text-[#0A0A0A] leading-relaxed whitespace-pre-line font-bold">{{ suggestion.reasoning }}</p>
      </div>

      <!-- modify textarea -->
      <div v-if="modifying" class="rounded-2xl bg-[#EEF4FB] border border-[#1F3A4B]/15 p-3.5 space-y-2.5">
        <label :for="'aegis-modify-' + suggestion.id" class="block text-[10px] uppercase font-black tracking-wider text-[#1F3A4B]">
          Modified recommended action
        </label>
        <textarea
          :id="'aegis-modify-' + suggestion.id"
          v-model="draft"
          rows="3"
          class="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#1F3A4B]/20 text-[#1F3A4B] text-xs font-bold placeholder-[#717171] focus:outline-none focus:border-[#902715] focus:ring-2 focus:ring-[#902715]/20 transition-all resize-y"
        ></textarea>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            @click="cancelModify"
            class="px-3.5 py-1.5 rounded-full bg-[#1F3A4B]/5 hover:bg-[#1F3A4B]/10 text-[#1F3A4B] text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
          >Cancel</button>
          <button
            type="button"
            @click="submitModified"
            class="px-3.5 py-1.5 rounded-full bg-[#556B2F] hover:bg-[#435525] text-white text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
          >Apply modified action</button>
        </div>
      </div>

      <!-- resolved: quiet, no buttons -->
      <div
        v-else-if="isResolved"
        class="flex flex-wrap items-center gap-2.5 rounded-2xl bg-[#EEF4FB] border border-[#1F3A4B]/10 px-4 py-3"
      >
        <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white', resolvedChipClass]">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" :d="outcomeMeta.icon" />
          </svg>
          {{ outcomeMeta.label }}
        </span>
        <span class="text-xs font-bold text-[#717171]">Operator decision recorded &mdash; advisory closed.</span>
      </div>

      <!-- outcome buttons -->
      <div v-else class="flex flex-wrap items-center gap-2.5 pt-4 border-t border-[#1F3A4B]/15">
        <span class="text-[10px] font-black text-[#717171] uppercase tracking-wider mr-1">Operator action:</span>
        <button
          type="button"
          @click="choose('approved')"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#556B2F] hover:bg-[#435525] text-white text-xs font-black shadow-md transition-all active:scale-95"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          Approve
        </button>
        <button
          type="button"
          @click="openModify"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1F3A4B] hover:bg-[#152733] text-white text-xs font-black shadow-md transition-all active:scale-95"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Modify
        </button>
        <button
          type="button"
          @click="choose('rejected')"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#902715] hover:bg-[#a82e1a] text-white text-xs font-black shadow-md transition-all active:scale-95"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reject
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, h } from 'vue'
import { confidenceChipClass, confidenceDotClass, confidenceLabel } from '@/utils/confidence'

/* ────────────────────────────────────────────────────────────────
   AegisAdvisoryCard — purely presentational Aegis recommendation
   surface. Receives data via props, never touches stores/DB.
   ──────────────────────────────────────────────────────────────── */
const props = defineProps({
  suggestion: {
    type: Object,
    default: null
    // shape: { id, recommended_action, target_barangay, reasoning,
    //          confidence: 'high'|'medium'|'low'|null, fallback: Boolean,
    //          scenario_type: String|null, related_sos_ids: Array,
    //          created_at, status: 'pending'|'reviewed', outcome: String|null }
  },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  variant: {
    type: String,
    default: 'card',
    validator: (v) => ['banner', 'card', 'compact'].includes(v)
  }
})

const emit = defineEmits(['outcome', 'ask'])

/* ── Variant helpers ───────────────────────────────────────────── */
const isBanner = computed(() => props.variant === 'banner')
const isCompact = computed(() => props.variant === 'compact')

/* ── Local Modify-flow state ───────────────────────────────────── */
const modifying = ref(false)
const draft = ref('')

function openModify() {
  draft.value = props.suggestion?.recommended_action || ''
  modifying.value = true
}

function cancelModify() {
  modifying.value = false
  draft.value = ''
}

function submitModified() {
  const original = (props.suggestion?.recommended_action || '').trim()
  const next = draft.value.trim()
  emit('outcome', {
    outcome: 'modified',
    modifiedAction: next && next !== original ? next : null
  })
  modifying.value = false
  draft.value = ''
}

function choose(outcome) {
  emit('outcome', { outcome, modifiedAction: null })
}

function requestAdvisory() {
  emit('ask')
}

/* ── Suggestion-derived state ──────────────────────────────────── */
const isResolved = computed(
  () => props.suggestion?.status === 'reviewed' && !!props.suggestion?.outcome
)
const isPending = computed(() => props.suggestion?.status === 'pending')

const confidence = computed(() => {
  const conf = props.suggestion?.confidence
  const variant = isBanner.value ? 'banner' : 'panel'
  return {
    label: confidenceLabel(conf),
    chip: confidenceChipClass(conf, { variant }),
    dot: confidenceDotClass(conf, { variant })
  }
})

const OUTCOME_META = {
  approved: { label: 'Approved', chip: 'bg-[#556B2F] text-white', icon: 'M5 13l4 4L19 7' },
  modified: {
    label: 'Modified',
    chip: 'bg-[#1F3A4B] text-white',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
  },
  rejected: { label: 'Rejected', chip: 'bg-[#D14D3E] text-white', icon: 'M6 18L18 6M6 6l12 12' }
}

const outcomeMeta = computed(
  () => OUTCOME_META[props.suggestion?.outcome] || OUTCOME_META.approved
)
const resolvedChipClass = computed(() => outcomeMeta.value.chip)

/* ── Container wrappers per variant ────────────────────────────── */
const wrapperClass = computed(() => {
  if (isCompact.value) {
    return 'inline-flex items-center gap-2 max-w-full rounded-full bg-[#EEF4FB] border border-[#1F3A4B]/10 px-2.5 py-1'
  }
  if (isBanner.value) {
    // glass strip — designed to sit on the dark cluster-alert banner (brandy or slate)
    return 'rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3'
  }
  // card — mirrors .admin-card look (white, soft shadow, 2rem radius) without hover lift
  return 'bg-white border border-[#1F3A4B]/15 rounded-[2rem] shadow-[0_10px_25px_-5px_rgba(31,58,75,0.07)] p-5'
})

/* ── Shared chip styling ───────────────────────────────────────── */
const chipBase =
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap'

const chipBarangay = computed(() =>
  isBanner.value
    ? 'bg-white/15 text-[#F7FB41] border border-white/25'
    : 'bg-[#EEF4FB] text-[#1F3A4B] border border-[#1F3A4B]/15'
)

const chipConfidence = computed(() => confidence.value.chip)

const chipFallback = computed(() =>
  isBanner.value
    ? 'bg-[#D14D3E]/30 text-white border border-[#D14D3E]/50'
    : 'bg-[#FDE8E5] text-[#D14D3E] border border-[#D14D3E]/30'
)

const chipPending = computed(() =>
  isBanner.value
    ? 'bg-white/15 text-white/90 border border-white/20'
    : 'bg-[#1F3A4B]/5 text-[#1F3A4B] border border-[#1F3A4B]/15'
)

const chipScenario = computed(() =>
  isBanner.value
    ? 'bg-white/10 text-white/90 border border-white/15'
    : 'bg-[#1F3A4B]/5 text-[#1F3A4B] border border-[#1F3A4B]/10'
)

/* ── Inline Shield icon (heroicons-style, stroke-width 2) ──────── */
const SHIELD_PATH =
  'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'

const ShieldIcon = {
  props: { class: { type: String, default: '' } },
  render(ctx) {
    return h(
      'svg',
      {
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24',
        class: ctx.class,
        'aria-hidden': 'true'
      },
      [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: SHIELD_PATH
        })
      ]
    )
  }
}
</script>
