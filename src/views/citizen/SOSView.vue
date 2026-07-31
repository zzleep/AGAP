<template>
  <section class="sos-screen space-y-4" aria-labelledby="sos-heading">
    <!-- Header -->
    <div class="text-center">
      <p class="text-xs font-extrabold uppercase tracking-[0.18em] text-[#902715]">AGAP SOS</p>
      <h2 id="sos-heading" class="font-expressive mt-2 text-3xl font-black tracking-tight text-[#0A0A0A]">{{ $t('sos.title') }}</h2>
      <p class="mx-auto mt-2 max-w-[18rem] text-sm font-medium leading-relaxed text-[#717171]">{{ $t('sos.description') }}</p>
    </div>

    <!-- Delivery Message Banner (Dark Olive Background with White Text for High Readability) -->
    <div v-if="deliveryMessage && displayStatus !== 'resolved'" class="sos-delivery-status" :class="deliveryTone" role="status" aria-live="polite">
      <span class="font-expressive text-base font-extrabold block text-white">{{ deliveryMessage }}</span>
      <span class="mt-1 block text-xs font-medium text-white/90 leading-relaxed">{{ deliveryDetail }}</span>
    </div>

    <!-- GPS Disabled / Fallback Warning Pill -->
    <div
      v-if="isLocationFallback"
      class="p-4 rounded-3xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2 max-w-sm mx-auto shadow-m3-sm"
    >
      <div class="flex items-center space-x-2 font-bold text-amber-950">
        <svg class="w-5 h-5 text-amber-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span class="text-xs">Location Required for Emergency SOS</span>
      </div>
      <p class="text-[11px] text-amber-900 leading-relaxed font-medium">
        CDRRMO dispatchers need your live GPS position to send emergency responders to your location.
      </p>
      <button
        type="button"
        @click="handleEnableGPS"
        :disabled="isLocating"
        class="w-full py-2.5 px-4 rounded-xl bg-[#902715] text-[#F7FB41] font-black text-xs uppercase tracking-wider hover:bg-[#781f11] active:scale-95 transition-all shadow-m3-xs flex items-center justify-center space-x-1.5 cursor-pointer"
      >
        <svg class="w-4 h-4 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span>Enable Location Access</span>
      </button>
    </div>

    <!-- Request Status Timeline Card -->
    <div
      v-if="sos.hasActiveSOS && displayStatus !== 'resolved'"
      class="rounded-3xl border border-[#1F3A4B]/15 bg-white p-5 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div class="-mx-5 -mt-5 mb-4 flex items-center justify-between gap-2 rounded-t-3xl bg-[#1F3A4B] px-5 pt-4 pb-3">
        <h3 class="text-[10px] font-black uppercase tracking-wider text-[#F7FB41]">{{ t('sos.statusTitle') }}</h3>
        <button
          v-if="sosRequestId"
          type="button"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-[10px] font-black tracking-wide text-white transition-all hover:bg-white/20 active:scale-95 cursor-pointer"
          :aria-label="referenceCopied ? t('sos.referenceCopied') : t('sos.referenceLabel')"
          :title="t('sos.referenceCopy')"
          @click="copyReferenceId"
        >
          <span v-if="!referenceCopied">#{{ sosRequestIdShort }}</span>
          <span v-else>{{ t('sos.referenceCopied') }}</span>
          <svg v-if="!referenceCopied" class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" />
          </svg>
          <svg v-else class="h-3 w-3 shrink-0 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      <!-- Truth panel: queued means NOT delivered — traditional channels front and center -->
      <div v-if="sos.deliveryState === 'queued'" class="mt-4 rounded-xl border border-[#902715]/30 bg-[#902715] px-3 py-3">
        <p class="text-[10px] font-black uppercase tracking-wider text-[#F7FB41]">{{ t('sos.truthTitle') }}</p>
        <p class="mt-1 text-[11px] font-medium leading-relaxed text-white/90">{{ t('sos.truthBody') }}</p>
        <div class="mt-2.5 flex gap-2">
          <a
            href="tel:911"
            class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#902715] shadow-m3-xs transition-all hover:bg-[#F5F5F5] active:scale-95"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {{ t('sos.call911') }}
          </a>
          <button
            type="button"
            @click="shareLocationText"
            class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F7FB41] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#0A0A0A] shadow-m3-xs transition-all hover:bg-[#e9ee3a] active:scale-95"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span v-if="!smsFallback">{{ t('sos.textLocation') }}</span>
            <span v-else>{{ t('sos.smsFallbackCopied') }}</span>
          </button>
        </div>
        <p class="mt-3 text-[11px] font-bold text-white/90">{{ t('sos.truthRelay') }}</p>
        <p class="mt-1 font-mono text-lg font-black tracking-widest text-[#F7FB41]">#{{ sosRequestIdShort || '----' }}</p>
        <p class="text-[11px] font-mono text-white/70">{{ sosCoords.lat }}, {{ sosCoords.lng }}</p>
        <div class="my-2.5 h-px bg-white/15" aria-hidden="true"></div>
        <p class="text-[11px] font-medium leading-relaxed text-white/70">{{ t('sos.batteryTip') }}</p>
        <p class="mt-2 rounded-lg bg-white/10 px-2.5 py-2 text-[11px] font-bold leading-relaxed text-[#F7FB41]">{{ t('sos.osSosTip') }}</p>
      </div>

      <!-- Timeline steps -->
      <ol v-else class="mt-4 list-none">
        <li
          v-for="(step, i) in statusSteps"
          :key="step.key"
          class="relative flex gap-3"
          :class="i < statusSteps.length - 1 ? 'pb-5' : ''"
        >
          <span
            v-if="i < statusSteps.length - 1"
            class="absolute bottom-0 left-[7px] top-[20px] w-0.5 rounded-full"
            :style="{ backgroundColor: statusSteps[i + 1].reached ? statusSteps[i + 1].color : '#E0E0E0' }"
            aria-hidden="true"
          ></span>
          <span class="relative mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
            <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: step.reached ? step.color : '#E0E0E0' }"></span>
            <span
              v-if="step.isCurrent"
              class="absolute inline-flex h-3 w-3 animate-ping rounded-full opacity-50"
              :style="{ backgroundColor: step.color }"
              aria-hidden="true"
            ></span>
          </span>
          <div class="min-w-0 flex-1">
            <p
              class="text-sm leading-snug"
              :class="step.isCurrent ? 'font-black text-[#0A0A0A]' : step.reached ? 'font-bold text-[#1F3A4B]' : 'font-medium text-[#717171]'"
            >
              {{ t(step.key) }}
            </p>
            <p v-if="step.subKey && step.reached" class="mt-0.5 text-[11px] font-semibold leading-snug text-[#2563EB]">
              {{ t(step.subKey) }}
            </p>
          </div>
        </li>
      </ol>

      <!-- Active-state detail line -->
      <p v-if="sos.deliveryState !== 'queued'" class="mt-4 rounded-xl bg-[#F5F5F5] px-3 py-2.5 text-[11px] font-medium leading-relaxed text-[#717171]">
        {{ statusDetail }}
      </p>

      <!-- Traditional channels: AGAP coordinates, it does not replace 911 -->
      <div v-if="sos.deliveryState !== 'queued'" class="mt-4 rounded-xl bg-[#EEF4FB] px-3 py-2.5">
        <p class="text-[10px] font-black uppercase tracking-wider text-[#1F3A4B]">{{ t('sos.channelsTitle') }}</p>
        <p class="mt-1 text-[11px] font-medium leading-relaxed text-[#717171]">{{ t('sos.channelsBody') }}</p>
        <div class="mt-2.5 flex gap-2">
          <a
            href="tel:911"
            class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#902715] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-m3-xs transition-all hover:bg-[#781f11] active:scale-95"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {{ t('sos.call911') }}
          </a>
          <button
            type="button"
            @click="shareLocationText"
            class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1F3A4B] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-m3-xs transition-all hover:bg-[#162d3b] active:scale-95"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span v-if="!smsFallback">{{ t('sos.textLocation') }}</span>
            <span v-else>{{ t('sos.smsFallbackCopied') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Rescue Complete Card (terminal state, shown only when the request is resolved) -->
    <div
      v-else-if="sos.hasActiveSOS"
      class="rounded-3xl border border-[#1F3A4B]/15 bg-white p-5 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#556B2F]/10 text-[#556B2F]">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <h3 class="text-[10px] font-black uppercase tracking-wider text-[#1F3A4B]">{{ t('sos.completeTitle') }}</h3>
        </div>
        <button
          v-if="sosRequestId"
          type="button"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#1F3A4B]/15 bg-[#F5F5F5] px-2.5 py-1 font-mono text-[10px] font-black tracking-wide text-[#1F3A4B] transition-all hover:bg-[#EEF4FB] active:scale-95 cursor-pointer"
          :aria-label="referenceCopied ? t('sos.referenceCopied') : t('sos.referenceLabel')"
          :title="t('sos.referenceCopy')"
          @click="copyReferenceId"
        >
          <span v-if="!referenceCopied">#{{ sosRequestIdShort }}</span>
          <span v-else>{{ t('sos.referenceCopied') }}</span>
          <svg v-if="!referenceCopied" class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" />
          </svg>
          <svg v-else class="h-3 w-3 shrink-0 text-[#556B2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      <p class="mt-4 rounded-xl bg-[#F5F5F5] px-3 py-2.5 text-[11px] font-medium leading-relaxed text-[#717171]">
        {{ t('sos.completeBody') }}
      </p>
      <button
        type="button"
        @click="sos.dismissSOS()"
        class="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#556B2F] px-3 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-m3-xs transition-all hover:bg-[#425324] active:scale-95"
      >
        {{ t('sos.completeDismiss') }}
      </button>
    </div>

    <!-- Victim Update Status Panel -->
    <div
      v-if="sos.hasActiveSOS && displayStatus !== 'resolved' && sos.deliveryState !== 'queued'"
      class="rounded-3xl border border-[#1F3A4B]/15 bg-white p-5 shadow-sm"
    >
      <button
        type="button"
        @click="updatePanelOpen = !updatePanelOpen"
        class="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
        :aria-expanded="updatePanelOpen"
      >
        <span class="flex min-w-0 items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#556B2F]/10 text-[#556B2F]">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </span>
          <h3 class="text-[10px] font-black uppercase tracking-wider text-[#1F3A4B]">{{ t('sos.updateTitle') }}</h3>
        </span>
        <svg class="h-4 w-4 shrink-0 text-[#1F3A4B] transition-transform duration-200" :class="{ 'rotate-180': updatePanelOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div v-if="updatePanelOpen">
        <p class="mt-1 text-[11px] font-medium leading-relaxed text-[#717171]">{{ t('sos.updateSubtitle') }}</p>

        <div class="mt-3 space-y-2">
          <!-- I'm still here -->
          <button
            type="button"
            :disabled="updateBusy !== null"
            @click="startUpdate('still-here')"
            class="flex w-full items-center gap-3 rounded-2xl border border-[#1F3A4B]/10 bg-[#F5F5F5] px-3.5 py-3 text-left transition-all hover:bg-[#EEF4FB] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#556B2F]/10 text-[#556B2F]">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-xs font-bold text-[#1F3A4B]">{{ t('sos.updateStillHere') }}</span>
              <span class="block text-[10px] font-medium leading-snug text-[#717171]">{{ t('sos.updateStillHereDetail') }}</span>
            </span>
            <span v-if="updateBusy === 'still-here'" class="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#1F3A4B]/20 border-t-[#1F3A4B]" aria-hidden="true"></span>
          </button>

          <!-- I moved — update my location -->
          <button
            type="button"
            :disabled="updateBusy !== null"
            @click="startUpdate('moved')"
            class="flex w-full items-center gap-3 rounded-2xl border border-[#1F3A4B]/10 bg-[#F5F5F5] px-3.5 py-3 text-left transition-all hover:bg-[#EEF4FB] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1F3A4B]/10 text-[#1F3A4B]">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-xs font-bold text-[#1F3A4B]">{{ updateLocating ? t('sos.updateLocating') : t('sos.updateMoved') }}</span>
              <span class="block text-[10px] font-medium leading-snug text-[#717171]">{{ t('sos.updateMovedDetail') }}</span>
            </span>
            <span v-if="updateBusy === 'moved'" class="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#1F3A4B]/20 border-t-[#1F3A4B]" aria-hidden="true"></span>
          </button>

          <!-- I've been rescued (two-step confirm) -->
          <div v-if="showRescueConfirm" class="rounded-2xl border border-[#556B2F]/20 bg-[#f1f7ea] p-3.5">
            <p class="text-xs font-black text-[#556B2F]">{{ t('sos.rescueConfirmTitle') }}</p>
            <p class="mt-1 text-[11px] font-medium leading-relaxed text-[#717171]">{{ t('sos.rescueConfirmBody') }}</p>
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
                class="flex-1 cursor-pointer rounded-xl bg-[#F5F5F5] px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1F3A4B] transition-all hover:bg-[#e8e8e8] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
            class="flex w-full items-center gap-3 rounded-2xl border border-[#1F3A4B]/10 bg-[#F5F5F5] px-3.5 py-3 text-left transition-all hover:bg-[#EEF4FB] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#556B2F]/10 text-[#556B2F]">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-xs font-bold text-[#1F3A4B]">{{ t('sos.rescueRow') }}</span>
              <span class="block text-[10px] font-medium leading-snug text-[#717171]">{{ t('sos.rescueRowDetail') }}</span>
            </span>
            <svg class="h-4 w-4 shrink-0 text-[#717171]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Update feedback line -->
      <p
        v-if="updateFeedback"
        class="mt-3 text-[11px] font-bold"
        :class="updateFeedback.ok ? 'text-[#556B2F]' : 'text-[#902715]'"
        role="status"
        aria-live="polite"
      >
        {{ updateFeedback.msg }}
      </p>
    </div>

    <!-- Clean Modern M3 Expressive Tactile SOS Button -->
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

    <!-- Expectations Notice -->
    <div v-if="!sos.hasActiveSOS" class="rounded-2xl border border-[#1F3A4B]/10 bg-[#EEF4FB] p-4" role="note">
      <div class="flex items-start gap-2.5">
        <svg class="mt-0.5 h-4 w-4 shrink-0 text-[#1F3A4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 class="text-xs font-black uppercase tracking-wide text-[#1F3A4B]">{{ t('sos.expectationTitle') }}</h3>
          <p class="mt-1 text-[11px] font-medium leading-relaxed text-[#717171]">{{ t('sos.expectationBody') }}</p>
        </div>
      </div>
    </div>

    <!-- Safety Guidance Card -->
    <div v-if="displayStatus !== 'resolved'" class="rounded-3xl border border-[#1F3A4B]/15 bg-white p-5 shadow-sm">
      <h3 class="text-[10px] font-black uppercase tracking-wider text-[#1F3A4B]">{{ t('sos.guidanceTitle') }}</h3>
      <p class="mt-1 text-[11px] font-medium leading-relaxed text-[#717171]">{{ t('sos.guidanceBody') }}</p>
      <router-link
        to="/app/guides"
        class="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#1F3A4B] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#F7FB41] shadow-m3-xs transition-all hover:bg-[#152a37] active:scale-95"
      >
        <svg class="h-4 w-4 shrink-0 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        {{ t('sos.guidanceOpen') }}
      </router-link>
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
        <div class="w-full max-w-md rounded-3xl border border-[#1F3A4B]/15 bg-white p-6 shadow-2xl">
          <div class="flex items-start gap-3">
            <svg class="h-6 w-6 shrink-0 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 id="sos-gate-title" class="font-expressive text-xl font-black tracking-tight text-[#0A0A0A]">{{ t('sos.gateTitle') }}</h3>
          </div>
          <p id="sos-gate-body" class="mt-3 text-sm font-medium leading-relaxed text-[#717171]">{{ t('sos.gateBody') }}</p>
          <div class="mt-5 space-y-2.5">
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
              class="w-full cursor-pointer rounded-xl bg-[#F5F5F5] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#1F3A4B] transition-all hover:bg-[#e8e8e8] active:scale-95"
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
import { findNearestBarangay } from '@/data/barangay_coords'
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
  // Re-attach immediately after a reload/restart: the store restores the in-flight
  // SOS from localStorage, so fetch server status now instead of waiting for the first poll.
  if (sos.hasActiveSOS) {
    sos.fetchMySOSStatus()
  }
  statusPollTimer = setInterval(pollSOSStatus, 10000)
  window.addEventListener('keydown', onGateKeydown)
})

watch(sos.deliveryState, (state) => {
  if (state === 'sent' && sos.hasActiveSOS) {
    sos.fetchMySOSStatus()
  }
})

const isBusy = computed(() => isLocating.value || sos.isPending || isDispatching.value)
const holdLabel = computed(() => {
  if (isLocationFallback.value) return 'Location Required'
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
  ? 'bg-[#556B2F] border-[#425324] text-white shadow-m3-md'
  : 'bg-[#902715] border-[#781f11] text-white shadow-m3-md')

// Request status timeline: prefer live server status, fall back to the local record
const displayStatus = computed(() => sos.mySosStatus?.status || sos.currentSOS?.status || 'pending')

const statusSteps = computed(() => {
  const current = displayStatus.value === 'pending' ? 2 : displayStatus.value === 'responding' ? 3 : 4
  const pulsing = displayStatus.value !== 'resolved'
  return [
    { key: 'sos.statusRequestReceived', color: '#F7C530', reached: current >= 1, isCurrent: current === 1 && pulsing },
    { key: 'sos.statusAssessing', color: '#F7C530', reached: current >= 2, isCurrent: current === 2 && pulsing },
    { key: 'sos.statusTeamAssigned', color: '#2563EB', reached: current >= 3, isCurrent: current === 3 && pulsing, subKey: 'sos.statusEnRoute' },
    { key: 'sos.statusCompleted', color: '#556B2F', reached: current >= 4, isCurrent: current === 4 && pulsing }
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

// Reference ID chip: quoteable request number for phone handoffs to dispatchers
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
    // Clipboard can reject in insecure contexts; the chip itself still shows the ID.
  }
  referenceCopied.value = true
  clearTimeout(referenceCopyTimer)
  referenceCopyTimer = setTimeout(() => {
    referenceCopied.value = false
  }, 2000)
}

// Truth-panel coordinates: prefer the live record, fall back to the server copy
const sosCoords = computed(() => {
  const rec = sos.currentSOS || sos.mySosStatus
  return {
    lat: rec?.latitude ?? 0,
    lng: rec?.longitude ?? 0
  }
})

// Traditional-channel fallback: share sheet → SMS deep link + clipboard copy
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
    if (err && err.name === 'AbortError') return // user dismissed the share sheet
  }
  // Fallback path: copy the text first (so it can be pasted anywhere, even if the
  // sms: navigation does nothing), then attempt the SMS deep link — this works
  // when data is dead but SMS is alive.
  try {
    await navigator.clipboard.writeText(text)
    smsFallback.value = true
    if (smsFallbackTimer) clearTimeout(smsFallbackTimer)
    smsFallbackTimer = setTimeout(() => {
      smsFallback.value = false
    }, 4000)
  } catch (err) {
    // Clipboard unavailable — the sms: deep link below is still attempted.
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
    if (!coords) {
      // Same fallback pattern as performDispatch
      const fallbackLat = 14.3123
      const fallbackLng = 121.1114
      coords = {
        latitude: fallbackLat,
        longitude: fallbackLng,
        accuracy: 0,
        barangay: findNearestBarangay(fallbackLat, fallbackLng),
        isFallback: true
      }
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
    // Offline is expected and already surfaced by the connectivity banner —
    // don't alarm the victim with an error for a state they can see.
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

  // Start SW reload protection window immediately at t=0.0s of user hold intent
  if (typeof window !== 'undefined') {
    window._agapIsSendingSOS = true
  }

  // Asynchronously trigger pre-warm right at t=0.0s of hold start
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

  // If hold was cancelled prior to dispatch and no confirmation banner is active, release protection
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

  // First-use acknowledgment gate: one explicit comprehension checkpoint per device.
  if (sosGateAcked()) {
    await performDispatch()
  } else {
    showSosGate.value = true
    // Reset hold state through the existing cancel path so the SW reload-protection
    // flag is released exactly as a cancelled hold would; no dispatch has started.
    clearHold()
  }
}

async function performDispatch() {
  isDispatching.value = true

  try {
    let coords = await refreshLocation(true)
    if (!coords) {
      const fallbackLat = 14.3123
      const fallbackLng = 121.1114
      coords = {
        latitude: fallbackLat,
        longitude: fallbackLng,
        accuracy: 0,
        barangay: findNearestBarangay(fallbackLat, fallbackLng),
        isFallback: true
      }
    }
    await dispatchSOS(coords)
  } finally {
    isDispatching.value = false
    holdProgress.value = 0
    // Re-activate protection so the confirmation banner is not interrupted by a reload.
    // dispatchSOS clears the flag in its own finally, so we re-set it here.
    if (deliveryMessage.value && typeof window !== 'undefined') {
      window._agapIsSendingSOS = true
    }
  }
}

function sosGateAcked() {
  return typeof localStorage !== 'undefined' && localStorage.getItem('agap_sos_ack') === '1'
}

function confirmGate() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('agap_sos_ack', '1')
  }
  showSosGate.value = false
  performDispatch()
}

function cancelGate() {
  showSosGate.value = false
  clearHold()
}

function onGateKeydown(event) {
  if (event.key === 'Escape' && showSosGate.value) {
    cancelGate()
  }
}

watch(showSosGate, (visible) => {
  if (visible) {
    nextTick(() => sosGateConfirmRef.value?.focus())
  }
})

onBeforeUnmount(() => {
  if (statusPollTimer) clearInterval(statusPollTimer)
  statusPollTimer = null
  if (referenceCopyTimer) clearTimeout(referenceCopyTimer)
  referenceCopyTimer = null
  if (smsFallbackTimer) clearTimeout(smsFallbackTimer)
  smsFallbackTimer = null
  window.removeEventListener('keydown', onGateKeydown)
  clearHold()
  // Only release SOS protection on unmount if no dispatch is in progress
  // and no confirmation banner is active, to avoid mid-dispatch reloads.
  if (typeof window !== 'undefined' && !isDispatching.value && !deliveryMessage.value) {
    window._agapIsSendingSOS = false
    if (window._agapPendingReload && typeof window.agapSafeReload === 'function') {
      window.agapSafeReload('sos-view-unmounted')
    }
  }
})
</script>

