<template>
  <section class="sos-screen space-y-4" aria-labelledby="sos-heading">
    <!-- Header -->
    <div class="text-center">
      <p class="text-xs font-black uppercase tracking-[0.2em] text-[#902715]">AGAP SOS</p>
      <h2 id="sos-heading" class="font-expressive mt-1.5 text-3xl font-black tracking-tight text-[#0A0A0A]">{{ headerTitle }}</h2>
      <p class="mx-auto mt-1.5 max-w-[19rem] text-xs font-medium leading-relaxed text-[#717171]">{{ headerSubtitle }}</p>
    </div>

    <!-- Safety Guidance Pill (Solid Slate Blue Action Bar — Top Primary Placement) -->
    <div v-if="displayStatus !== 'resolved'">
      <router-link
        to="/app/guides"
        class="flex w-full items-center justify-between gap-3 rounded-2xl bg-[#1F3A4B] p-3.5 text-white shadow-m3-md transition-all hover:bg-[#182e3b] active:scale-[0.99] group cursor-pointer"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-[#F7FB41]">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div class="min-w-0 text-left">
            <h3 class="font-expressive text-xs font-black uppercase tracking-wider text-white truncate">{{ t('sos.guidanceTitle') }}</h3>
            <p class="text-xs font-medium text-white/80 line-clamp-1 mt-0.5">{{ t('sos.guidanceBody') }}</p>
          </div>
        </div>
        <svg class="h-5 w-5 shrink-0 text-[#F7FB41] transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
        </svg>
      </router-link>
    </div>

    <!-- Delivery Message Banner (Solid High-Readability Surface) -->
    <div v-if="deliveryMessage && displayStatus !== 'resolved'" class="sos-delivery-status rounded-2xl p-4 shadow-m3-sm" :class="deliveryTone" role="status" aria-live="polite">
      <span class="font-expressive text-base font-extrabold block text-white">{{ deliveryMessage }}</span>
      <span class="mt-1 block text-xs font-medium text-white/90 leading-relaxed">{{ deliveryDetail }}</span>
    </div>

    <!-- GPS Disabled / Location Required Banner (Solid Brandy Red Surface) -->
    <div
      v-if="isLocationFallback && !sos.hasActiveSOS"
      class="p-4 rounded-2xl bg-[#902715] text-white space-y-2.5 max-w-sm mx-auto shadow-m3-md"
    >
      <div class="flex items-center space-x-2 font-black text-[#F7FB41]">
        <svg class="w-5 h-5 text-[#F7FB41] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span class="text-xs uppercase tracking-wider">{{ $t('sos.locationRequiredTitle') }}</span>
      </div>
      <p class="text-xs text-white/90 leading-relaxed font-medium">
        {{ $t('sos.locationRequiredBody') }}
      </p>
      <button
        type="button"
        @click="handleEnableGPS"
        :disabled="isLocating"
        class="w-full py-2.5 px-4 rounded-xl bg-[#F7FB41] text-[#902715] font-black text-xs uppercase tracking-wider hover:bg-[#e9ee3a] active:scale-95 transition-all shadow-m3-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-75"
      >
        <svg class="w-4 h-4 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span>{{ $t('sos.enableLocation') }}</span>
      </button>
    </div>

    <!-- Active Emergency Request Status Surface (Unified Brandy Red Command Surface) -->
    <div
      v-if="sos.hasActiveSOS && displayStatus !== 'resolved'"
      class="rounded-[2rem] bg-[#902715] text-white p-5 shadow-m3-lg space-y-4"
      role="status"
      aria-live="polite"
    >
      <!-- Command Surface Header -->
      <div class="flex items-center justify-between gap-2 border-b border-white/10 pb-3.5">
        <div class="flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F7FB41] opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-[#F7FB41]"></span>
          </span>
          <h3 class="text-xs font-black uppercase tracking-wider text-[#F7FB41]">{{ t('sos.statusTitle') }}</h3>
        </div>
      </div>

      <!-- Truth Panel: Queued Means NOT Delivered — Urgent Brandy Red Block -->
      <div v-if="sos.deliveryState === 'queued'" class="rounded-2xl bg-[#902715] p-4 text-white space-y-3 shadow-m3-md">
        <div class="flex items-center space-x-2 text-[#F7FB41]">
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <p class="text-xs font-black uppercase tracking-wider">{{ t('sos.truthTitle') }}</p>
        </div>
        <p class="text-xs font-medium leading-relaxed text-white/95">{{ t('sos.truthBody') }}</p>
        <div class="flex gap-2.5 pt-1">
          <a
            href="tel:911"
            class="flex h-12 flex-1 basis-0 min-w-0 items-center justify-center gap-2 rounded-full bg-white px-3.5 text-[#902715] shadow-m3-xs transition-all hover:bg-gray-100 active:scale-95"
          >
            <svg class="shrink-0 text-[#902715]" style="width: 22px; height: 22px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span class="text-xs font-black uppercase tracking-wider">{{ t('sos.call911') }}</span>
          </a>
          <button
            type="button"
            @click="shareLocationText"
            class="flex h-12 flex-1 basis-0 min-w-0 items-center justify-center gap-2 rounded-full bg-[#F7FB41] px-3.5 text-xs font-black uppercase tracking-wider text-[#0A0A0A] shadow-m3-xs transition-all hover:bg-[#e9ee3a] active:scale-95 cursor-pointer"
          >
            <svg class="shrink-0 text-[#0A0A0A]" style="width: 22px; height: 22px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span v-if="!smsFallback" class="truncate">{{ t('sos.textLocation') }}</span>
            <span v-else class="truncate">{{ t('sos.smsFallbackCopied') }}</span>
          </button>
        </div>
        <div class="pt-2 border-t border-white/15 space-y-1">
          <p class="text-xs font-bold text-white/90">{{ t('sos.truthRelay') }}</p>
          <p class="font-mono text-xl font-black tracking-widest text-[#F7FB41]">#{{ sosRequestIdShort || '----' }}</p>
          <p class="text-xs font-mono text-white/70">{{ sosCoords.lat }}, {{ sosCoords.lng }}</p>
        </div>
        <p class="text-xs font-medium leading-relaxed text-white/80 pt-1">{{ t('sos.batteryTip') }}</p>
        <p class="rounded-xl bg-white/10 p-2.5 text-xs font-bold leading-relaxed text-[#F7FB41]">{{ t('sos.osSosTip') }}</p>
      </div>

      <!-- High-Contrast Vertical Timeline Steps -->
      <ol v-else class="list-none space-y-3.5 pt-1">
        <li
          v-for="(step, i) in statusSteps"
          :key="step.key"
          class="relative flex gap-3.5 items-start"
        >
          <!-- Connecting Line -->
          <span
            v-if="i < statusSteps.length - 1"
            class="absolute left-[9px] top-[24px] bottom-[-14px] w-0.5 rounded-full"
            :style="{ backgroundColor: statusSteps[i + 1].reached ? statusSteps[i + 1].color : 'rgba(255,255,255,0.2)' }"
            aria-hidden="true"
          ></span>
          <!-- Step Dot Indicator -->
          <span class="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
            <span class="h-3.5 w-3.5 rounded-full shadow-sm" :style="{ backgroundColor: step.reached ? step.color : 'rgba(255,255,255,0.3)' }"></span>
            <span
              v-if="step.isCurrent"
              class="absolute inline-flex h-5 w-5 animate-ping rounded-full opacity-60"
              :style="{ backgroundColor: step.color }"
              aria-hidden="true"
            ></span>
          </span>
          <div class="min-w-0 flex-1">
            <p
              class="text-sm leading-snug"
              :class="step.isCurrent ? 'font-black text-white' : step.reached ? 'font-bold text-white/90' : 'font-medium text-white/50'"
            >
              {{ t(step.key) }}
            </p>
            <p v-if="step.subKey && step.reached" class="mt-0.5 text-xs font-bold leading-snug text-[#F7FB41]">
              {{ t(step.subKey) }}
            </p>
          </div>
        </li>
      </ol>

      <!-- Active-State Detail Line (Clean spacing, no container background) -->
      <p v-if="sos.deliveryState !== 'queued'" class="px-1.5 py-1 text-xs font-semibold leading-relaxed text-white/95">
        {{ statusDetail }}
      </p>

      <!-- Traditional Communication Channels -->
      <div v-if="sos.deliveryState !== 'queued'" class="rounded-2xl bg-black/20 p-4 border border-white/10 space-y-2.5">
        <div>
          <p class="text-xs font-black uppercase tracking-wider text-[#F7FB41]">{{ t('sos.channelsTitle') }}</p>
          <p class="mt-0.5 text-xs font-medium leading-relaxed text-white/90">{{ t('sos.channelsBody') }}</p>
        </div>
        <div class="flex gap-2.5 pt-0.5">
          <a
            href="tel:911"
            class="flex h-12 flex-1 basis-0 min-w-0 items-center justify-center gap-2 rounded-full bg-[#F7FB41] px-3.5 text-[#902715] shadow-m3-sm transition-all hover:bg-[#e9ee3a] active:scale-95"
          >
            <svg class="shrink-0 text-[#902715]" style="width: 22px; height: 22px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span class="text-xs font-black uppercase tracking-wider">{{ t('sos.call911') }}</span>
          </a>
          <button
            type="button"
            @click="shareLocationText"
            class="flex h-12 flex-1 basis-0 min-w-0 items-center justify-center gap-2 rounded-full bg-white/20 border border-white/25 px-3.5 text-xs font-black uppercase tracking-wider text-white shadow-m3-xs transition-all hover:bg-white/30 active:scale-95 cursor-pointer"
          >
            <svg class="shrink-0 text-white" style="width: 22px; height: 22px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span v-if="!smsFallback" class="truncate">{{ t('sos.textLocation') }}</span>
            <span v-else class="truncate">{{ t('sos.smsFallbackCopied') }}</span>
          </button>
        </div>
      </div>

      <!-- Victim Update Status Controls (Direct High-Contrast Action Surface) -->
      <div v-if="sos.deliveryState !== 'queued'" class="pt-3 border-t border-white/15 space-y-2.5">
        <h3 class="text-xs font-black uppercase tracking-wider text-[#F7FB41]">{{ t('sos.updateTitle') }}</h3>
        <p class="text-xs font-medium text-white/90 leading-relaxed">{{ t('sos.updateSubtitle') }}</p>

        <div class="space-y-2 pt-0.5">
          <!-- 1. I'm still here (Solid Earthy Slate Blue Surface) -->
          <button
            type="button"
            :disabled="updateBusy !== null"
            @click="startUpdate('still-here')"
            class="flex w-full items-center gap-3 rounded-2xl bg-[#1F3A4B] px-4 py-3 text-left transition-all hover:bg-[#182e3b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-m3-xs"
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 text-[#F7FB41]">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-xs font-black text-white">{{ t('sos.updateStillHere') }}</span>
              <span class="block text-[11px] font-medium leading-snug text-white/80">{{ t('sos.updateStillHereDetail') }}</span>
            </span>
            <span v-if="updateBusy === 'still-here'" class="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true"></span>
          </button>

          <!-- 2. I moved — update my location (Solid Rosy Copper Surface) -->
          <button
            type="button"
            :disabled="updateBusy !== null"
            @click="startUpdate('moved')"
            class="flex w-full items-center gap-3 rounded-2xl bg-[#D14D3E] px-4 py-3 text-left transition-all hover:bg-[#b83f32] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-m3-xs"
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-xs font-black text-white">{{ updateLocating ? t('sos.updateLocating') : t('sos.updateMoved') }}</span>
              <span class="block text-[11px] font-medium leading-snug text-white/80">{{ t('sos.updateMovedDetail') }}</span>
            </span>
            <span v-if="updateBusy === 'moved'" class="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true"></span>
          </button>

          <!-- 3. I've been rescued (Solid Dark Olive Surface) -->
          <div v-if="showRescueConfirm" class="rounded-2xl bg-black/20 p-4 space-y-2 border border-white/20">
            <p class="text-xs font-black text-[#F7FB41]">{{ t('sos.rescueConfirmTitle') }}</p>
            <p class="text-xs font-medium text-white/90 leading-relaxed">{{ t('sos.rescueConfirmBody') }}</p>
            <div class="mt-3 flex gap-2">
              <button
                type="button"
                :disabled="updateBusy !== null"
                @click="startUpdate('rescue')"
                class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#556B2F] px-3 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-m3-xs transition-all hover:bg-[#425324] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span v-if="updateBusy === 'rescue'" class="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true"></span>
                {{ t('sos.rescueConfirmYes') }}
              </button>
              <button
                type="button"
                :disabled="updateBusy !== null"
                @click="collapseRescueConfirm"
                class="flex-1 cursor-pointer rounded-xl bg-white/20 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ t('sos.rescueConfirmKeep') }}
              </button>
            </div>
          </div>
          <button
            v-else
            type="button"
            :disabled="updateBusy !== null"
            @click="showRescueConfirm = true"
            class="flex w-full items-center gap-3 rounded-2xl bg-[#556B2F] px-4 py-3 text-left transition-all hover:bg-[#425324] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-m3-xs"
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 text-[#F7FB41]">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-xs font-black text-white">{{ t('sos.rescueRow') }}</span>
              <span class="block text-[11px] font-medium leading-snug text-white/80">{{ t('sos.rescueRowDetail') }}</span>
            </span>
          </button>
        </div>

        <!-- Update Feedback Line -->
        <p
          v-if="updateFeedback"
          class="mt-2 text-xs font-bold"
          :class="updateFeedback.ok ? 'text-[#F7FB41]' : 'text-[#FF8A8A]'"
          role="status"
          aria-live="polite"
        >
          {{ updateFeedback.msg }}
        </p>
      </div>
    </div>

    <!-- Rescue Complete Card (Solid Dark Olive Victory Surface) -->
    <div
      v-else-if="sos.hasActiveSOS"
      class="rounded-[2rem] bg-[#556B2F] text-white p-5 shadow-m3-lg space-y-4"
      role="status"
      aria-live="polite"
    >
      <div class="flex items-center justify-between gap-2 border-b border-white/15 pb-3">
        <div class="flex items-center gap-2.5">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <h3 class="text-xs font-black uppercase tracking-wider text-white">{{ t('sos.completeTitle') }}</h3>
        </div>
      </div>

      <p class="text-xs font-medium leading-relaxed text-white/95">
        {{ t('sos.completeBody') }}
      </p>
      <button
        type="button"
        @click="sos.dismissSOS()"
        class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-[#556B2F] shadow-m3-sm transition-all hover:bg-gray-100 active:scale-95"
      >
        {{ t('sos.completeDismiss') }}
      </button>
    </div>



    <!-- Clean Modern M3 Expressive Tactile SOS Button (Hero Action Control) -->
    <div v-if="!sos.hasActiveSOS" class="flex flex-1 items-center justify-center py-5">
      <button
        type="button"
        class="sos-hold-button"
        :class="{ 'is-holding': isHolding, 'is-busy': isBusy, 'opacity-65 grayscale cursor-pointer': isLocationFallback }"
        :disabled="isBusy"
        :aria-label="$t('sos.holdSosAria')"
        @pointerdown="startHold"
        @pointerup="cancelHold"
        @pointercancel="cancelHold"
        @pointerleave="cancelHold"
        @lostpointercapture="cancelHold"
        @keydown.space.prevent="startKeyboardHold"
        @keyup.space.prevent="cancelHold"
        @keydown.enter.prevent="startKeyboardHold"
        @keyup.enter.prevent="cancelHold"
      >
        <!-- Outer Progress Track Ring -->
        <svg class="sos-hold-button__progress" viewBox="0 0 100 100" aria-hidden="true">
          <circle class="sos-hold-button__progress-track" cx="50" cy="50" r="46" pathLength="100" />
          <circle class="sos-hold-button__progress-value" cx="50" cy="50" r="46" pathLength="100" :style="{ strokeDashoffset: 100 - holdProgress }" />
        </svg>

        <!-- Clean Surface Content -->
        <span class="sos-hold-button__surface space-y-1">
          <svg class="h-8 w-8 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span class="font-expressive text-5xl font-black tracking-tight text-white leading-none">SOS</span>
          <span class="font-expressive text-xs font-bold uppercase tracking-wider text-[#F7FB41] pt-1 block">{{ holdLabel }}</span>
          <span class="text-[11px] font-semibold text-white/70 block">{{ holdTimeLabel }}</span>
        </span>
      </button>
    </div>

    <!-- Expectations Notice (Clean Whitespace Division — No Pale Box Container) -->
    <div v-if="!sos.hasActiveSOS" class="px-2 text-center space-y-1" role="note">
      <div class="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#1F3A4B]">
        <svg class="h-4 w-4 text-[#1F3A4B] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ t('sos.expectationTitle') }}</span>
      </div>
      <p class="max-w-xs mx-auto text-xs font-medium leading-relaxed text-[#717171]">{{ t('sos.expectationBody') }}</p>
    </div>



    <!-- GPS Settings Guide Modal -->
    <GpsGuideModal
      :show="showGpsGuideModal"
      @close="showGpsGuideModal = false"
      @retry="handleEnableGPS"
    />

    <!-- First-Use SOS Acknowledgment Gate -->
    <Teleport to="body">
      <div
        v-if="showSosGate"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        role="alertdialog"
        aria-modal="true"
        :aria-label="t('sos.gateAria')"
        aria-labelledby="sos-gate-title"
        aria-describedby="sos-gate-body"
        @click.self="cancelGate"
      >
        <div class="w-full max-w-md rounded-3xl border border-[#1F3A4B]/15 bg-white p-6 shadow-2xl space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-2xl bg-[#902715]/10 text-[#902715] flex items-center justify-center shrink-0">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 id="sos-gate-title" class="font-expressive text-lg font-black tracking-tight text-[#0A0A0A]">{{ t('sos.gateTitle') }}</h3>
              <p id="sos-gate-body" class="mt-1 text-xs font-medium leading-relaxed text-[#717171]">{{ t('sos.gateBody') }}</p>
            </div>
          </div>
          <div class="space-y-2 pt-1">
            <button
              ref="sosGateConfirmRef"
              type="button"
              @click="confirmGate"
              class="w-full cursor-pointer rounded-xl bg-[#902715] px-4 py-3 text-xs font-black uppercase tracking-wider text-[#F7FB41] shadow-m3-xs transition-all hover:bg-[#781f11] active:scale-95"
            >
              {{ t('sos.gateConfirm') }}
            </button>
            <button
              type="button"
              @click="cancelGate"
              class="w-full cursor-pointer rounded-xl bg-[#F5F5F5] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#1F3A4B] transition-all hover:bg-gray-200 active:scale-95"
            >
              {{ t('sos.gateCancel') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSOSStore } from '@/stores/sosStore'
import { useSOS } from '@/composables/useSOS'
import { useGPS } from '@/composables/useGPS'
import { useConnectivityStore } from '@/stores/connectivityStore'
import GpsGuideModal from '@/components/common/GpsGuideModal.vue'

const HOLD_DURATION_MS = 2000
const sos = useSOSStore()
const connectivity = useConnectivityStore()
const { t } = useI18n()
const { dispatchSOS, warmConnection } = useSOS()
const { isLocating, refreshLocation, cachedLocation, initGPS } = useGPS()

const showGpsGuideModal = ref(false)
const showSosGate = ref(false)
const sosGateConfirmRef = ref(null)
const referenceCopied = ref(false)
const updateBusy = ref(null) // 'still-here' | 'moved' | 'rescue' | null
const updateLocating = ref(false)
const showRescueConfirm = ref(false)
const updateFeedback = ref(null) // { ok: boolean, msg: string } | null
const updatePanelOpen = ref(false)
const holdProgress = ref(0)
const isHolding = ref(false)
const isDispatching = ref(false)
let holdFrame = null
let holdStartedAt = 0
let activePointerId = null
let statusPollTimer = null
let referenceCopyTimer = null
const smsFallback = ref(false)
let smsFallbackTimer = null

const isLocationFallback = computed(() => !cachedLocation.value || cachedLocation.value.isFallback)

async function handleEnableGPS() {
  const res = await initGPS(true)
  if (res?.denied) {
    showGpsGuideModal.value = true
    return
  }
  if (res && res.success) {
    localStorage.setItem('agap_location_pref', 'granted')
  }
  const loc = await refreshLocation(true)
  if (loc && loc.isFallback) {
    showGpsGuideModal.value = true
  }
}

onMounted(() => {
  warmConnection()
  if (sos.hasActiveSOS) {
    sos.fetchMySOSStatus()
  }
  statusPollTimer = setInterval(pollSOSStatus, 10000)
  window.addEventListener('keydown', onGateKeydown)
})

onBeforeUnmount(() => {
  clearHold()
  if (statusPollTimer) clearInterval(statusPollTimer)
  if (referenceCopyTimer) clearTimeout(referenceCopyTimer)
  if (smsFallbackTimer) clearTimeout(smsFallbackTimer)
  window.removeEventListener('keydown', onGateKeydown)
})

watch(() => sos.deliveryState, (state) => {
  if (state === 'sent' && sos.hasActiveSOS) {
    sos.fetchMySOSStatus()
  }
})

const isBusy = computed(() => isLocating.value || sos.isPending || isDispatching.value)

const headerTitle = computed(() => {
  if (displayStatus.value === 'resolved') return t('sos.resolvedTitle')
  if (sos.hasActiveSOS) return t('sos.activeTitle')
  return t('sos.title')
})

const headerSubtitle = computed(() => {
  if (displayStatus.value === 'resolved') return t('sos.resolvedDescription')
  if (sos.hasActiveSOS) return t('sos.activeDescription')
  return t('sos.description')
})

const holdLabel = computed(() => {
  if (isLocationFallback.value) return 'Location Access Required'
  if (isLocating.value) return t('sos.findingLocation')
  if (sos.isPending || isDispatching.value) return t('sos.sendingRequest')
  return isHolding.value ? t('sos.keepHolding') : t('sos.holdToSend')
})

const holdTimeLabel = computed(() => {
  if (isLocationFallback.value) return 'Tap to Enable GPS'
  return isHolding.value ? `${Math.ceil((100 - holdProgress.value) / 50) || 1}s` : 'Press & Hold 2s'
})

const deliveryMessage = computed(() => {
  if (sos.deliveryState === 'sent') return t('sos.sentMessage')
  if (sos.deliveryState === 'queued') return t('sos.queuedMessage')
  return ''
})

const deliveryDetail = computed(() => sos.deliveryState === 'sent' ? t('sos.sentDetail') : t('sos.queuedDetail'))

const deliveryTone = computed(() => sos.deliveryState === 'sent'
  ? 'bg-[#556B2F] text-white shadow-m3-md'
  : 'bg-[#902715] text-white shadow-m3-md')

const displayStatus = computed(() => sos.mySosStatus?.status || sos.currentSOS?.status || 'pending')

const statusSteps = computed(() => {
  const current = displayStatus.value === 'pending' ? 2 : displayStatus.value === 'responding' ? 3 : 4
  const pulsing = displayStatus.value !== 'resolved'
  return [
    { key: 'sos.statusRequestReceived', color: '#F7FB41', reached: current >= 1, isCurrent: current === 1 && pulsing },
    { key: 'sos.statusAssessing', color: '#F7FB41', reached: current >= 2, isCurrent: current === 2 && pulsing },
    { key: 'sos.statusTeamAssigned', color: '#60A5FA', reached: current >= 3, isCurrent: current === 3 && pulsing, subKey: 'sos.statusEnRoute' },
    { key: 'sos.statusCompleted', color: '#F7FB41', reached: current >= 4, isCurrent: current === 4 && pulsing }
  ]
})

const statusDetail = computed(() => {
  if (sos.deliveryState === 'queued') return t('sos.statusQueuedDetail')
  if (displayStatus.value === 'resolved') return t('sos.statusResolvedDetail')
  if (displayStatus.value === 'responding') return t('sos.statusRespondingDetail')
  if (displayStatus.value === 'pending') {
    const created = sos.mySosStatus?.created_at || sos.currentSOS?.created_at
    const stale = created && Date.now() - Date.parse(created) > 5 * 60 * 1000
    return stale ? t('sos.statusPendingStaleDetail') : t('sos.statusPendingDetail')
  }
  return t('sos.statusPendingDetail')
})

const sosRequestId = computed(() => sos.mySosStatus?.id || sos.currentSOS?.id || null)
const sosRequestIdShort = computed(() => (sosRequestId.value ? sosRequestId.value.slice(0, 8) : ''))

async function copyReferenceId() {
  const fullId = sosRequestId.value
  if (!fullId) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(fullId)
    }
  } catch (err) {
    // Clipboard fallback: reference ID remains visible on the chip
  }
  referenceCopied.value = true
  clearTimeout(referenceCopyTimer)
  referenceCopyTimer = setTimeout(() => {
    referenceCopied.value = false
  }, 2000)
}

const sosCoords = computed(() => {
  const rec = sos.currentSOS || sos.mySosStatus
  return {
    lat: rec?.latitude ?? 0,
    lng: rec?.longitude ?? 0
  }
})

async function shareLocationText() {
  const rec = sos.currentSOS || sos.mySosStatus
  const lat = rec?.latitude ?? 0
  const lng = rec?.longitude ?? 0
  const ref = (sos.mySosStatus?.id || sos.currentSOS?.id || '').slice(0, 8)
  const text = `AGAP SOS #${ref} - I need help at ${lat},${lng} - https://maps.google.com/?q=${lat},${lng}`
  try {
    if (navigator.share) {
      await navigator.share({ title: 'AGAP SOS', text })
      return
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return
  }
  try {
    await navigator.clipboard.writeText(text)
    smsFallback.value = true
    if (smsFallbackTimer) clearTimeout(smsFallbackTimer)
    smsFallbackTimer = setTimeout(() => {
      smsFallback.value = false
    }, 4000)
  } catch (err) {
    // Clipboard unavailable
  }
  window.location.href = `sms:?&body=${encodeURIComponent(text)}`
}

function startUpdate(kind) {
  if (updateBusy.value) return
  updateFeedback.value = null
  runUpdate(kind)
}

async function runUpdate(kind) {
  updateBusy.value = kind
  let res = null
  if (kind === 'moved') {
    updateLocating.value = true
    let coords = null
    try {
      coords = await refreshLocation(true)
    } finally {
      updateLocating.value = false
    }
    if (!coords || coords.isFallback) {
      // No fresh fix this attempt. Degrade gracefully instead of dropping the
      // update: use the last real cached fix (max 10 min old) when available;
      // otherwise still record the move with a note-only update (the RPC keeps
      // the last known coordinates) so operators see the movement. Only nudge
      // GPS when there is no usable location data at all.
      const cached = cachedLocation.value
      if (cached && !cached.isFallback && Number.isFinite(cached.latitude) && Number.isFinite(cached.longitude)) {
        res = await sos.updateMySOS({ latitude: cached.latitude, longitude: cached.longitude, note: 'moved' })
      } else {
        res = await sos.updateMySOS({ note: 'moved' })
        handleEnableGPS()
      }
      updateBusy.value = null
      if (res && res.success) {
        updateFeedback.value = { ok: true, msg: t('sos.updateSuccess') }
      } else if (res && res.reason === 'offline') {
        updateFeedback.value = null
      } else {
        updateFeedback.value = { ok: false, msg: t('sos.updateFailed') }
      }
      return
    }
    res = await sos.updateMySOS({ latitude: coords.latitude, longitude: coords.longitude, note: 'moved' })
  } else if (kind === 'rescue') {
    res = await sos.confirmMyRescue()
  } else {
    res = await sos.updateMySOS({ note: 'still_here' })
  }
  updateBusy.value = null
  if (res && res.success) {
    updateFeedback.value = { ok: true, msg: t('sos.updateSuccess') }
  } else if (res && res.reason === 'offline') {
    updateFeedback.value = null
  } else {
    updateFeedback.value = { ok: false, msg: t('sos.updateFailed') }
  }
  if (kind === 'rescue' && res && res.success) {
    showRescueConfirm.value = false
  }
}

function collapseRescueConfirm() {
  showRescueConfirm.value = false
}

function pollSOSStatus() {
  if (!sos.hasActiveSOS) return
  if (sos.hasActiveSOS && connectivity.isOnline && !connectivity.isSlowConnection) {
    sos.fetchMySOSStatus()
  }
}

function startHold(event) {
  if (isLocationFallback.value) {
    handleEnableGPS()
    return
  }
  if (isBusy.value || isHolding.value) return
  if (event?.button !== undefined && event.button !== 0) return

  if (typeof window !== 'undefined') {
    window._agapIsSendingSOS = true
  }

  warmConnection(true)

  event?.preventDefault?.()
  activePointerId = event?.pointerId ?? null
  event?.currentTarget?.setPointerCapture?.(activePointerId)
  isHolding.value = true
  holdStartedAt = performance.now()
  animateHold(holdStartedAt)
}

function startKeyboardHold() {
  startHold()
}

function animateHold(now) {
  holdProgress.value = Math.min(100, ((now - holdStartedAt) / HOLD_DURATION_MS) * 100)
  if (holdProgress.value >= 100) {
    finishHold()
    return
  }
  holdFrame = requestAnimationFrame(animateHold)
}

function cancelHold(event) {
  if (activePointerId !== null && event?.pointerId !== undefined && event.pointerId !== activePointerId) return
  if (isDispatching.value) return
  clearHold()
}

function clearHold() {
  if (holdFrame) cancelAnimationFrame(holdFrame)
  holdFrame = null
  activePointerId = null
  isHolding.value = false
  holdProgress.value = 0

  if (!isDispatching.value && !deliveryMessage.value && typeof window !== 'undefined') {
    window._agapIsSendingSOS = false
    if (window._agapPendingReload && typeof window.agapSafeReload === 'function') {
      window.agapSafeReload('hold-cancelled')
    }
  }
}

async function finishHold() {
  if (!isHolding.value || isDispatching.value) return
  if (holdFrame) cancelAnimationFrame(holdFrame)
  holdFrame = null
  activePointerId = null
  isHolding.value = false
  holdProgress.value = 100

  if (sosGateAcked()) {
    await performDispatch()
  } else {
    showSosGate.value = true
    clearHold()
  }
}

async function performDispatch() {
  isDispatching.value = true

  try {
    let coords = await refreshLocation(true)
    if (!coords || coords.isFallback) {
      clearHold()
      showGpsGuideModal.value = true
      return
    }
    await dispatchSOS(coords)
  } finally {
    isDispatching.value = false
    holdProgress.value = 0
    if (deliveryMessage.value && typeof window !== 'undefined') {
      window._agapIsSendingSOS = true
    }
  }
}

function sosGateAcked() {
  return localStorage.getItem('agap_sos_gate_acked') === 'true'
}

function confirmGate() {
  localStorage.setItem('agap_sos_gate_acked', 'true')
  showSosGate.value = false
  performDispatch()
}

function cancelGate() {
  showSosGate.value = false
}

function onGateKeydown(e) {
  if (!showSosGate.value) return
  if (e.key === 'Escape') {
    cancelGate()
  }
}
</script>
