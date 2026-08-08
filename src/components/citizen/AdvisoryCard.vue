<template>
  <!-- ══════════════════════ LOADING · slim M3 skeleton ══════════════════════ -->
  <div
    v-if="loading"
    class="rounded-[1.5rem] border border-[#0A0A0A]/5 bg-white px-4 py-3.5 animate-pulse"
    role="status"
    aria-busy="true"
    aria-live="polite"
  >
    <div class="flex items-center justify-between gap-3">
      <span class="h-5 w-24 rounded-full bg-[#EBEBEB]"></span>
      <span class="h-5 w-14 rounded-full bg-[#EBEBEB]"></span>
    </div>
    <div class="mt-3 h-4 w-4/5 rounded-lg bg-[#EBEBEB]"></div>
    <div class="mt-2 h-3 w-full rounded-md bg-[#EBEBEB]"></div>
    <div class="mt-2 h-3 w-2/3 rounded-md bg-[#EBEBEB]"></div>
  </div>

  <!-- ══════════════════════ NO ACTIVE · quiet all-clear strip ══════════════════════ -->
  <div
    v-else-if="!topAdvisory"
    class="rounded-[1.5rem] border border-[#0A0A0A]/5 bg-white/70 px-4 py-3.5 flex items-center gap-3"
  >
    <div class="w-9 h-9 rounded-xl bg-[#EEF2E6] text-[#556B2F] flex items-center justify-center shrink-0">
      <ShieldCheck class="w-4 h-4" :stroke-width="2" />
    </div>
    <div class="min-w-0">
      <p class="font-expressive text-sm font-black tracking-tight text-[#4A4A4A] leading-tight">
        {{ t('advisory.noActiveTitle') }}
      </p>
      <p class="mt-0.5 text-xs font-medium text-[#717171] leading-snug">
        {{ t('advisory.noActiveDesc') }}
      </p>
    </div>
  </div>

  <!-- ══════════════════════ ACTIVE ADVISORY ══════════════════════ -->
  <section
    v-else
    :class="['rounded-[1.5rem] border bg-white px-4 py-3.5 shadow-m3-sm', severity.border]"
  >
    <!-- Header row: severity badge + title, then ACTIVE pill / derived chip -->
    <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <!-- Severity badge (solid chip, mirrors HomeView risk chip) -->
        <span
          :class="[
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-m3-sm whitespace-nowrap shrink-0',
            severity.badge
          ]"
        >
          <TriangleAlert v-if="severity.isAlert" class="w-3 h-3" :stroke-width="2.2" aria-hidden="true" />
          <CloudRain v-else class="w-3 h-3" :stroke-width="2.2" aria-hidden="true" />
          {{ severity.label }}
        </span>
        <h3 class="font-expressive text-sm font-black tracking-tight text-[#4A4A4A] truncate">
          {{ t('advisory.title') }}
        </h3>
      </div>

      <!-- Live pill (issued by PAGASA) -->
      <span
        v-if="!topAdvisory.isDerived"
        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-[#0A0A0A]/5 text-[#4A4A4A] border border-[#0A0A0A]/10 shrink-0"
      >
        <span class="relative flex w-1.5 h-1.5" aria-hidden="true">
          <span class="absolute inline-flex w-full h-full rounded-full bg-[#902715] opacity-40 animate-ping"></span>
          <span class="relative inline-flex w-1.5 h-1.5 rounded-full bg-[#902715]"></span>
        </span>
        {{ t('advisory.activeLabel') }}
      </span>

      <!-- Derived chip (computed from live rainfall, not issued) -->
      <span
        v-else
        class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold bg-[#EEF2E6] text-[#556B2F] border border-[#556B2F]/25 shrink-0"
      >
        <CloudRain class="w-3 h-3" :stroke-width="2" aria-hidden="true" />
        {{ t('advisory.derivedLabel') }}
      </span>
    </div>

    <!-- Context note: the official warning can read higher than the local level -->
    <p v-if="higherElsewhere" class="mt-2 text-[11px] font-semibold text-[#5C5C5C]">
      {{ t('advisory.higherElsewhere', { severity: higherSeverityLabel }) }}
    </p>

    <!-- Headline (warning name bold, trailing #tag de-emphasized) -->
    <p
      v-if="headlineParts.text || headlineParts.tag"
      class="mt-2.5 font-expressive text-lg font-black tracking-tight text-[#0A0A0A] leading-snug line-clamp-2"
    >
      {{ headlineParts.text }}
      <span v-if="headlineParts.tag" class="text-xs font-semibold text-[#5C5C5C]">{{ headlineParts.tag }}</span>
    </p>

    <!-- Covers: nearby municipalities the advisory actually affects (scannable chips) -->
    <div v-if="coverageItems.length" class="mt-2.5">
      <p class="text-[10px] font-black uppercase tracking-wider text-[#5C5C5C]">
        {{ t('advisory.covers') }}
      </p>
      <ul class="mt-1.5 flex flex-wrap gap-1.5">
        <li v-for="(item, i) in coverageItems" :key="i">
          <span
            :class="[
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] whitespace-nowrap',
              isYourArea(item) ? 'font-black' : 'font-bold',
              coverageMeta(item).chip,
              item.provinceWide ? 'border-dashed' : ''
            ]"
            :aria-label="
              item.provinceWide ? `${item.name}: ${t('advisory.provinceWide')}` : item.name
            "
          >
            <span
              :class="['w-2 h-2 rounded-full shrink-0', coverageMeta(item).dot]"
              aria-hidden="true"
            ></span>
            {{ item.provinceWide ? t('advisory.provinceWide') : item.name }}
            <span
              v-if="isYourArea(item)"
              class="inline-flex items-center rounded-full bg-[#902715] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
            >
              {{ t('advisory.yourArea') }}
            </span>
          </span>
        </li>
      </ul>
    </div>

    <!-- Friendly practical guidance for the user's local level -->
    <div class="mt-2.5 flex items-start gap-2.5 rounded-2xl border border-[#0A0A0A]/5 bg-[#FAFAFA] px-3.5 py-3">
      <component
        :is="guideIcon"
        :class="['w-4 h-4 shrink-0 mt-px', severity.accent]"
        :stroke-width="2"
        aria-hidden="true"
      />
      <p class="text-[13px] font-medium text-[#4A4A4A] leading-relaxed">
        {{ guideMessage }}
      </p>
    </div>

    <!-- Footer meta row: issued · urgency countdown · source + official link -->
    <div class="mt-3 pt-3 border-t border-[#0A0A0A]/5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] font-semibold text-[#5C5C5C]">
      <!-- "Issued" only for official entries — a derived warning's timestamp is
           the computation time, and the derived chip already says so -->
      <span v-if="issuedLabel && !topAdvisory.isDerived" class="inline-flex items-center gap-1">
        {{ t('advisory.issued') }}
        <span class="font-bold text-[#4A4A4A]">{{ issuedLabel }}</span>
      </span>

      <span v-if="issuedLabel && validUntilTs" aria-hidden="true" class="text-[#C4C4C4]">·</span>

      <!-- Urgency countdown: the first thing users check -->
      <span
        v-if="validUntilTs"
        :class="[
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]',
          isExpired
            ? 'bg-[#0A0A0A]/5 text-[#5C5C5C] border border-[#0A0A0A]/10'
            : 'bg-[#F7FB41]/40 text-[#0A0A0A] border border-[#8a7e00]/25'
        ]"
      >
        <Clock class="w-3 h-3 shrink-0" :stroke-width="2.2" aria-hidden="true" />
        <span class="font-black tracking-tight">
          {{ isExpired ? t('advisory.expired') : t('advisory.expiresIn', { time: countdownText }) }}
        </span>
      </span>

      <span aria-hidden="true" class="text-[#C4C4C4]">·</span>

      <span class="inline-flex items-center gap-1.5">
        <span class="font-black uppercase tracking-wider text-[#4A4A4A]">{{ t('advisory.source') }}</span>
        <a
          :href="OFFICIAL_ADVISORY_URL"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`${t('advisory.source')}: ${t('advisory.viewOfficial')}`"
          class="inline-flex items-center gap-0.5 font-black text-[#902715] hover:text-[#781f11] underline-offset-2 hover:underline transition-colors"
        >
          {{ t('advisory.viewOfficial') }}
          <ExternalLink class="w-3 h-3" :stroke-width="2.2" aria-hidden="true" />
        </a>
      </span>
    </div>

    <!-- Tap-to-open details affordance -->
    <button
      ref="detailsBtnRef"
      type="button"
      aria-haspopup="dialog"
      @click="sheetOpen = true"
      class="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-[#902715]/25 bg-[#902715]/5 px-4 py-2.5 text-[12px] font-black uppercase tracking-wider text-[#902715] hover:bg-[#902715]/10 transition-colors active:scale-[0.99]"
    >
      {{ t('advisory.details') }}
      <ChevronUp class="w-4 h-4" :stroke-width="2.5" aria-hidden="true" />
    </button>

    <!-- ?diag=1 troubleshooting panel: identifies the running build and the
         data path (live feed / cache / rainfall-derived), plus the fetch
         failure reason — so a phone-vs-desktop discrepancy can be pinned down -->
    <pre
      v-if="debugOn"
      class="mt-3 rounded-xl bg-[#0A0A0A] text-[#7CFC98] text-[10px] leading-relaxed p-3 overflow-x-auto whitespace-pre-wrap break-all"
    >build: {{ buildCommit }}
source: {{ diag?.source ?? 'n/a' }} | entries: {{ diag?.entryCount ?? 'n/a' }} | at: {{ diag?.at ? new Date(diag.at).toISOString() : 'n/a' }}
{{ diag?.error ? `error: ${diag.error} — ${diag.detail ?? ''}` : 'fetch: ok' }}
top: {{ topAdvisory?.id ?? 'none' }}
top: derived={{ !!topAdvisory?.isDerived }} sev={{ topAdvisory?.severity }} local={{ topAdvisory?.localSeverity }}
issuedAt: {{ topAdvisory?.issuedAt ? new Date(topAdvisory.issuedAt).toISOString() : 'null' }}
validUntil: {{ topAdvisory?.validUntil ? new Date(topAdvisory.validUntil).toISOString() : 'null' }}
now: {{ now.toISOString() }} | locale: {{ locale }} | onLine: {{ navigatorOnLine }}</pre>
  </section>

  <AdvisoryDetailsSheet :advisories="advisories" :open="sheetOpen" @close="closeSheet" />
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronUp, Clock, CloudRain, ExternalLink, ShieldAlert, ShieldCheck, TriangleAlert, Umbrella } from 'lucide-vue-next'
import AdvisoryDetailsSheet from '@/components/citizen/AdvisoryDetailsSheet.vue'
import { useNow } from '@/composables/useNow'
import {
  OFFICIAL_ADVISORY_URL,
  advisoryMeta,
  coverageMeta,
  coverageOf,
  formatRemaining,
  isYourArea,
  severityLevelOf,
  severityOf,
  splitHeadline
} from '@/lib/advisoryDisplay'

/* ────────────────────────────────────────────────────────────────────────────
   AdvisoryCard — compact, light-surface PAGASA weather advisory strip for the
   citizen home page. Purely presentational: receives a severity-sorted list of
   normalized advisories via props, renders the top one, and opens the detail
   sheet (AdvisoryDetailsSheet) with the full official text. Never touches
   stores or the network; all advisory text is {{ }}-interpolated only (live
   feed has contained script tags — never v-html).
   ──────────────────────────────────────────────────────────────────────────── */
const props = defineProps({
  advisories: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  diag: { type: Object, default: null }
})

const { t, locale } = useI18n()

/* ── Diagnostic panel (?diag=1) — see the template pre block ─────────────── */
const buildCommit = __BUILD_COMMIT__
const debugOn = typeof window !== 'undefined' && /[?&]diag=1\b/.test(window.location.search)
const navigatorOnLine = typeof navigator !== 'undefined' ? String(navigator.onLine) : 'n/a'

/* Top of the severity-sorted list is what the user's area faces most. */
const topAdvisory = computed(() => (Array.isArray(props.advisories) ? props.advisories[0] : null) || null)

/* Badge, card border and guidance reflect the user's LOCAL level (max severity
   across the covered towns), not the Luzon-wide headline level. */
const severityLevel = computed(() => severityLevelOf(topAdvisory.value))
const severity = computed(() => severityOf(topAdvisory.value))

const guideMessage = computed(() => {
  const lvl = severityLevel.value
  return t(`advisory.guide${lvl.charAt(0).toUpperCase()}${lvl.slice(1)}`)
})

/* Umbrella for rain levels (yellow/watch), shield for safety levels (orange/red). */
const guideIcon = computed(() =>
  severityLevel.value === 'yellow' || severityLevel.value === 'watch' ? Umbrella : ShieldAlert
)

/* Official warning can exceed the local level (e.g. RED elsewhere in Luzon,
   YELLOW here) — explain that in one muted line instead of alarming. */
const higherElsewhere = computed(() => !!(topAdvisory.value?.higherElsewhere && topAdvisory.value?.severity))
const higherSeverityLabel = computed(() => (topAdvisory.value?.severity || '').toUpperCase())

const headlineParts = computed(() => splitHeadline(topAdvisory.value?.headline))

/* Coverage chips: nearby municipalities in scope; renders nothing for old
   cached data without localCoverage. */
const coverageItems = computed(() => coverageOf(topAdvisory.value))

/* ── Date + urgency countdown (reactive minute tick via useNow) ─────────── */
const { now } = useNow()

/* Shared time meta (issued label, expiry window, remaining time) — the same
   source the details sheet uses, so the two can't drift. */
const timeMeta = computed(() =>
  advisoryMeta(topAdvisory.value, {
    nowTs: now.value.getTime(),
    localeTag: locale.value === 'fil' ? 'fil-PH' : 'en-PH'
  })
)

const issuedLabel = computed(() => timeMeta.value.issuedLabel)
const validUntilTs = computed(() => timeMeta.value.validUntilTs)
const isExpired = computed(() => timeMeta.value.isExpired)
const countdownText = computed(() =>
  validUntilTs.value == null || isExpired.value ? null : formatRemaining(timeMeta.value.remainingMs)
)

/* ── Detail sheet (state lives in AdvisoryDetailsSheet) ─────────────────── */
const sheetOpen = ref(false)
const detailsBtnRef = ref(null)

function closeSheet() {
  sheetOpen.value = false
  nextTick(() => detailsBtnRef.value?.focus())
}
</script>
