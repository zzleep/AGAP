<template>
    <div class="rounded-3xl border border-[#E0E0E0] bg-white p-4 shadow-m3-sm space-y-3">
      <!-- Line 1: Title + Location Refresh Action -->
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <span class="text-[10px] font-black uppercase tracking-[0.18em] text-[#717171] block">
            {{ $t('evacMap.nearestLabel') }}
          </span>
          <h2 class="font-expressive font-black text-xl text-[#0A0A0A] tracking-tight leading-tight truncate mt-0.5">
            {{ nearestEvacCenter?.name || $t('evacMap.locating') }}
          </h2>
        </div>

        <!-- Single Purposeful Refresh Icon Button -->
        <button
          type="button"
          class="p-2.5 rounded-full border border-[#E0E0E0] bg-white text-[#0A0A0A] shadow-m3-sm transition-transform active:scale-95 hover:bg-[#F5F5F5] hover:border-[#902715]/40 shrink-0"
          :disabled="isLocating"
          title="Refresh location and safety score"
          @click="emit('refresh')"
        >
          <svg class="w-4 h-4 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
      </div>

      <!-- Line 2: Location Subtitle & Walk Time -->
      <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#717171]">
        <span v-if="userLocation">
          {{ userLocation.barangay || $t('home.currentLocation') }} · {{ formatDistanceToKm(nearestEvacDistance) }} km {{ $t('evacMap.straightLine') }}
        </span>
        <span v-else>{{ $t('evacMap.locationHint') }}</span>
        <span v-if="nearestEvacRouteInfo" class="px-2.5 py-0.5 rounded-full bg-[#902715]/10 text-[#902715] font-extrabold text-[11px]">
          {{ formatDistanceToKm(nearestEvacRouteInfo.distanceKm) }} km {{ $t('evacMap.walkingRoute') }} · {{ formatDurationToMinutes(nearestEvacRouteInfo.durationMinutes) }} min walk
        </span>
      </div>

      <!-- GPS Fallback / Disabled Pill -->
      <div
        v-if="userLocation?.isFallback"
        class="p-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2"
      >
        <div class="flex items-center gap-1.5 min-w-0">
          <svg class="w-4 h-4 text-amber-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span class="font-semibold text-[11px] truncate">Using default location. Enable GPS for live route.</span>
        </div>
        <button
          type="button"
          @click="emit('refresh')"
          :disabled="isLocating"
          class="px-2.5 py-1 rounded-xl bg-[#902715] text-[#F7FB41] font-black text-[10px] uppercase tracking-wider shrink-0 hover:bg-[#781f11] active:scale-95 transition-all shadow-xs"
        >
          Enable GPS
        </button>
      </div>

      <!-- Approximate Location Pill (coarse but usable fix) -->
      <div
        v-if="userLocation?.lowAccuracy"
        class="p-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2"
      >
        <svg class="w-4 h-4 text-amber-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span class="font-semibold text-[11px]">Approximate location — GPS accuracy is limited. Refresh to try again.</span>
      </div>

      <p v-if="stuckAlert" class="text-[11px] font-extrabold text-[#902715] flex items-center gap-1.5 pt-0.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Potentially stuck in risk zone. Alert sent.
      </p>

      <!-- Line 3: Integrated Horizontal M3 Safety Bar & Context Chips -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F0F0F0]">
        <!-- Left: Integrated Safety Bar -->
        <div class="flex items-center gap-2.5">
          <div class="flex items-baseline gap-1">
            <span class="text-[10px] font-black uppercase tracking-wider text-[#717171]">Safety</span>
            <span class="font-expressive font-black text-lg leading-none" :style="{ color: safetyMeterColor }">{{ safetyScore }}</span>
          </div>

          <!-- M3 5-Segment Progress Bar -->
          <div class="flex items-center gap-1 w-20">
            <div
              v-for="seg in 5"
              :key="seg"
              class="h-1.5 flex-1 rounded-full transition-all duration-500"
              :style="{ backgroundColor: seg * 20 <= safetyScore ? safetyMeterColor : '#E0E0E0' }"
            ></div>
          </div>

          <span
            class="px-2 py-0.5 text-[9px] font-black uppercase rounded-full text-white shadow-xs"
            :style="{ backgroundColor: safetyMeterColor }"
          >
            {{ safetyMeterLabel }}
          </span>
        </div>

        <!-- Right: Risk Context Badges (No Emojis) -->
        <div class="flex items-center gap-1.5 text-[10px] font-extrabold text-[#1F3A4B]">
          <span class="px-2.5 py-1 rounded-full bg-[#1F3A4B]/5 border border-[#1F3A4B]/15">
            {{ nearbyIncidentCount }} Incidents
          </span>
          <span class="px-2.5 py-1 rounded-full bg-[#1F3A4B]/5 border border-[#1F3A4B]/15 capitalize">
            {{ riskLevel }} Risk
          </span>
        </div>
      </div>
    </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { formatDistanceToKm, formatDurationToMinutes } from '@/utils/geo'

const props = defineProps({
  nearestEvacCenter: { type: Object, default: null },
  userLocation: { type: Object, default: null },
  nearestEvacDistance: { type: Number, default: null },
  nearestEvacRouteInfo: { type: Object, default: null },
  safetyScore: { type: Number, required: true },
  safetyMeterColor: { type: String, required: true },
  safetyMeterLabel: { type: String, required: true },
  nearbyIncidentCount: { type: Number, required: true },
  riskLevel: { type: String, required: true },
  isLocating: { type: Boolean, default: false },
  stuckAlert: { type: Boolean, default: false }
})
const emit = defineEmits(['refresh'])
const { t } = useI18n()
</script>