<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      :aria-label="t('advisory.details')"
      @click.self="close"
    >
      <div class="advisory-sheet-panel w-full max-w-lg max-h-[85vh] rounded-t-3xl bg-white shadow-2xl flex flex-col overflow-hidden">
        <!-- Sheet header -->
        <div class="flex items-center justify-between gap-3 px-5 pt-5 pb-3 border-b border-[#0A0A0A]/5 shrink-0">
          <h3 class="font-expressive text-base font-black tracking-tight text-[#0A0A0A]">
            {{ t('advisory.details') }}
          </h3>
          <button
            ref="closeBtnRef"
            type="button"
            :aria-label="t('advisory.close')"
            @click="close"
            class="p-2 -mr-1.5 rounded-full text-[#5C5C5C] hover:text-[#0A0A0A] hover:bg-[#0A0A0A]/5 transition-colors"
          >
            <X class="w-5 h-5" :stroke-width="2.2" aria-hidden="true" />
          </button>
        </div>

        <!-- Scrollable detail body -->
        <div ref="sheetScrollRef" class="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-4 min-h-0">
          <!-- Severity badge + headline -->
          <div class="space-y-2">
            <span
              :class="[
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-m3-sm',
                sheetSeverity.badge
              ]"
            >
              <TriangleAlert v-if="sheetSeverity.isAlert" class="w-3 h-3" :stroke-width="2.2" aria-hidden="true" />
              <CloudRain v-else class="w-3 h-3" :stroke-width="2.2" aria-hidden="true" />
              {{ sheetSeverity.label }}
            </span>
            <h4
              v-if="sheetHeadlineParts.text || sheetHeadlineParts.tag"
              class="font-expressive text-lg font-black tracking-tight text-[#0A0A0A] leading-snug"
            >
              {{ sheetHeadlineParts.text }}
              <span v-if="sheetHeadlineParts.tag" class="text-xs font-semibold text-[#5C5C5C]">{{ sheetHeadlineParts.tag }}</span>
            </h4>
          </div>

          <!-- Official message: structured blocks (preferred) or flat text (fallback) -->
          <div v-if="hasBlocks" class="space-y-2.5">
            <template v-for="view in sheetBlockViews" :key="view.i">
              <!-- Severity tier (rainfall warning level); user's tier open + highlighted -->
              <div
                v-if="isTierBlock(view.block)"
                :class="[
                  isTierExpanded(view.i) ? 'rounded-2xl border border-[#8a7e00]/30 bg-[#F7FB41]/20 overflow-hidden' : ''
                ]"
              >
                <button
                  type="button"
                  @click="toggleTier(view.i)"
                  :aria-expanded="isTierExpanded(view.i)"
                  :aria-controls="`advisory-tier-${view.i}`"
                  :class="[
                    'w-full flex items-center gap-2 text-left transition-colors',
                    isTierExpanded(view.i)
                      ? 'px-3.5 pt-3 pb-2'
                      : 'rounded-2xl border border-[#0A0A0A]/5 bg-[#FAFAFA] px-3.5 py-2.5 hover:bg-[#F5F5F5]'
                  ]"
                >
                  <span
                    :class="[
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0',
                      severityOfBlock(view.block).badge
                    ]"
                  >
                    {{ severityOfBlock(view.block).label }}
                  </span>
                  <span
                    :class="[
                      'min-w-0 flex-1 truncate font-expressive text-[13px] tracking-tight',
                      isTierExpanded(view.i) ? 'font-black text-[#0A0A0A]' : 'font-bold text-[#4A4A4A]'
                    ]"
                  >
                    {{ tierHeaderLabel(view.block) }}
                  </span>
                  <ChevronDown
                    :class="['w-4 h-4 shrink-0 text-[#5C5C5C] transition-transform duration-300', isTierExpanded(view.i) ? 'rotate-180' : '']"
                    :stroke-width="2.2"
                    aria-hidden="true"
                  />
                </button>

                <!-- Tier body: per-province areas (live data) or legacy single paragraph -->
                <template v-if="isTierExpanded(view.i)">
                  <div v-if="hasTierAreas(view.block)" :id="`advisory-tier-${view.i}`" class="px-3.5 pb-3 -mt-1">
                    <ul class="space-y-1.5">
                      <template v-for="(row, ri) in tierAreaRows(view.block)" :key="row.separator ? `sep-${ri}` : row.ai">
                        <!-- Group label: the user's area first, everything else under "Other areas" -->
                        <li v-if="row.separator" class="px-1 pt-2">
                          <p class="text-[10px] font-black uppercase tracking-wider text-[#5C5C5C]">
                            {{ t('advisory.otherAreas') }}
                          </p>
                        </li>
                        <li v-else>
                          <!-- Province with municipalities: collapsible row -->
                          <button
                            v-if="tierAreaMunicipalities(row.area).length"
                            type="button"
                            @click="toggleTierRow(view.i, row.ai)"
                            :aria-expanded="isTierRowExpanded(view.i, row.ai)"
                            :aria-controls="`advisory-tier-row-${view.i}-${row.ai}`"
                            class="w-full flex items-center gap-2 rounded-xl border border-[#0A0A0A]/5 bg-white px-3 py-2 text-left hover:bg-[#F5F5F5] transition-colors"
                          >
                            <span
                              :class="[
                                'min-w-0 flex-1 truncate text-[13px] tracking-tight',
                                isTierRowYourArea(row.area) ? 'font-black text-[#0A0A0A]' : 'font-bold text-[#4A4A4A]'
                              ]"
                            >
                              {{ row.area.province }}
                            </span>
                            <span
                              v-if="isTierRowYourArea(row.area)"
                              class="inline-flex items-center rounded-full bg-[#902715] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
                            >
                              {{ t('advisory.yourArea') }}
                            </span>
                            <ChevronDown
                              :class="['w-4 h-4 shrink-0 text-[#5C5C5C] transition-transform duration-300', isTierRowExpanded(view.i, row.ai) ? 'rotate-180' : '']"
                              :stroke-width="2.2"
                              aria-hidden="true"
                            />
                          </button>
                          <!-- Bare province (no municipalities): static line, no chevron -->
                          <div
                            v-else
                            class="w-full flex items-center gap-2 rounded-xl border border-[#0A0A0A]/5 bg-white px-3 py-2 text-left"
                          >
                            <span class="min-w-0 flex-1 truncate text-[13px] font-bold text-[#4A4A4A]">
                              {{ row.area.province }}
                            </span>
                          </div>
                          <p
                            v-if="tierAreaMunicipalities(row.area).length && isTierRowExpanded(view.i, row.ai)"
                            :id="`advisory-tier-row-${view.i}-${row.ai}`"
                            class="mt-1 px-3 text-[13px] font-medium text-[#4A4A4A] leading-relaxed whitespace-pre-line"
                          >
                            <template v-if="tierMunicipalityParts(row.area)">
                              {{ tierMunicipalityParts(row.area).before }}
                              <strong class="font-black text-[#0A0A0A]">{{ tierMunicipalityParts(row.area).match }}</strong>
                              {{ tierMunicipalityParts(row.area).after }}
                            </template>
                            <template v-else>
                              {{ tierAreaMunicipalities(row.area).join(', ') }}
                            </template>
                          </p>
                        </li>
                      </template>
                    </ul>
                    <!-- What this level means (muted, no badge) -->
                    <p v-if="view.block.hazard" class="mt-2 px-1 text-[11px] font-semibold text-[#5C5C5C]">
                      {{ view.block.hazard }}
                    </p>
                  </div>
                  <!-- Legacy tier body (no areas in cached data) -->
                  <p
                    v-else-if="view.block.text"
                    :id="`advisory-tier-${view.i}`"
                    class="px-3.5 pb-3 -mt-1 text-[13px] font-medium text-[#4A4A4A] leading-relaxed whitespace-pre-line"
                  >
                    {{ view.block.text }}
                  </p>
                </template>
              </div>

              <!-- Flood advisory river list (collapsible per province) -->
              <div v-else-if="isFloodBlock(view.block)" class="rounded-2xl border border-[#0A0A0A]/5 bg-[#FAFAFA] px-3.5 py-3">
                <p v-if="view.block.title" class="text-[10px] font-black uppercase tracking-wider text-[#5C5C5C]">
                  {{ view.block.title }}
                </p>
                <ul :class="[view.block.title ? 'mt-2' : '', 'space-y-1.5']">
                  <template v-for="(row, rj) in floodItemRows(view.block)" :key="row.separator ? `sep-${rj}` : row.ji">
                    <li v-if="row.separator" class="px-1 pt-2">
                      <p class="text-[10px] font-black uppercase tracking-wider text-[#5C5C5C]">
                        {{ t('advisory.otherAreas') }}
                      </p>
                    </li>
                    <li v-else>
                      <button
                        type="button"
                        @click="toggleFlood(view.i, row.ji)"
                        :aria-expanded="isFloodExpanded(view.i, row.ji)"
                        :aria-controls="`advisory-flood-${view.i}-${row.ji}`"
                        class="w-full flex items-center gap-2 rounded-xl border border-[#0A0A0A]/5 bg-white px-3 py-2 text-left hover:bg-[#F5F5F5] transition-colors"
                      >
                        <span
                          :class="[
                            'min-w-0 flex-1 truncate text-[13px] tracking-tight',
                            isFloodYourArea(row.item) ? 'font-black text-[#0A0A0A]' : 'font-bold text-[#4A4A4A]'
                          ]"
                        >
                          {{ row.item.label }}
                        </span>
                        <span
                          v-if="isFloodYourArea(row.item)"
                          class="inline-flex items-center rounded-full bg-[#902715] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
                        >
                          {{ t('advisory.yourArea') }}
                        </span>
                        <ChevronDown
                          :class="['w-4 h-4 shrink-0 text-[#5C5C5C] transition-transform duration-300', isFloodExpanded(view.i, row.ji) ? 'rotate-180' : '']"
                          :stroke-width="2.2"
                          aria-hidden="true"
                        />
                      </button>
                      <p
                        v-if="isFloodExpanded(view.i, row.ji) && row.item.text"
                        :id="`advisory-flood-${view.i}-${row.ji}`"
                        class="mt-1 px-3 text-[13px] font-medium text-[#4A4A4A] leading-relaxed whitespace-pre-line"
                      >
                        {{ row.item.text }}
                      </p>
                    </li>
                  </template>
                </ul>
              </div>

              <!-- Header / weather-system paragraph (before the first structured block) -->
              <p
                v-else-if="isPlainBlock(view.block) && view.block.text"
                class="text-[13px] font-medium text-[#4A4A4A] leading-relaxed whitespace-pre-line"
              >
                {{ view.block.text }}
              </p>
            </template>

            <!-- Additional details: forecast-narrative / closing text that follows the last structured block -->
            <div v-if="sheetAdditionalBlocks.length" class="pt-3 border-t border-[#0A0A0A]/10">
              <p class="text-[10px] font-black uppercase tracking-wider text-[#5C5C5C]">
                {{ t('advisory.additionalDetails') }}
              </p>
              <div class="mt-2 space-y-2.5">
                <p
                  v-for="view in sheetAdditionalBlocks"
                  :key="view.i"
                  class="text-[13px] font-medium text-[#4A4A4A] leading-relaxed whitespace-pre-line"
                >
                  {{ view.block.text }}
                </p>
              </div>
            </div>
          </div>

          <!-- Legacy fallback: flat official message -->
          <div v-else-if="sheetFlatMessage">
            <p class="rounded-2xl border border-[#0A0A0A]/5 bg-[#FAFAFA] px-4 py-3 text-[13px] font-medium text-[#4A4A4A] leading-relaxed whitespace-pre-line max-h-[60vh] overflow-y-auto">
              {{ sheetFlatMessage }}
            </p>
          </div>

          <!-- Coverage chips -->
          <div v-if="sheetCoverage.length">
            <p class="text-[10px] font-black uppercase tracking-wider text-[#5C5C5C]">
              {{ t('advisory.covers') }}
            </p>
            <ul class="mt-1.5 flex flex-wrap gap-1.5">
              <li v-for="(item, i) in sheetCoverage" :key="i">
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

          <!-- Issued / valid meta -->
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] font-semibold text-[#5C5C5C]">
            <span v-if="sheetIssuedLabel" class="inline-flex items-center gap-1">
              {{ t('advisory.issued') }}
              <span class="font-bold text-[#4A4A4A]">{{ sheetIssuedLabel }}</span>
            </span>
            <span v-if="sheetIssuedLabel && sheetValidUntilLabel" aria-hidden="true" class="text-[#C4C4C4]">·</span>
            <span v-if="sheetValidUntilLabel" class="inline-flex items-center gap-1">
              {{ t('advisory.validUntil') }}
              <span class="font-bold text-[#4A4A4A]">{{ sheetValidUntilLabel }}</span>
            </span>
          </div>

          <!-- Actions: official link + share -->
          <div class="flex flex-wrap items-center gap-2 pt-1">
            <a
              :href="OFFICIAL_ADVISORY_URL"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`${t('advisory.source')}: ${t('advisory.viewOfficial')}`"
              class="inline-flex items-center gap-1.5 rounded-2xl border border-[#0A0A0A]/10 bg-[#FAFAFA] px-3.5 py-2 text-[11px] font-black uppercase tracking-wider text-[#902715] hover:text-[#781f11] transition-colors"
            >
              <ExternalLink class="w-3.5 h-3.5" :stroke-width="2.2" aria-hidden="true" />
              {{ t('advisory.viewOfficial') }}
            </a>
            <button
              type="button"
              @click="shareAdvisory"
              aria-live="polite"
              class="inline-flex items-center gap-1.5 rounded-2xl border border-[#902715]/25 bg-[#902715]/5 px-3.5 py-2 text-[11px] font-black uppercase tracking-wider text-[#902715] hover:bg-[#902715]/10 transition-colors active:scale-95"
            >
              <Share v-if="shareState !== 'copied'" class="w-3.5 h-3.5" :stroke-width="2.2" aria-hidden="true" />
              {{ shareState === 'copied' ? t('advisory.copied') : t('advisory.share') }}
            </button>
          </div>
        </div>

        <!-- All advisories (compact rows, tap to swap the detail) -->
        <div
          v-if="advisories.length > 1"
          class="shrink-0 border-t border-[#0A0A0A]/5 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <p class="text-[10px] font-black uppercase tracking-wider text-[#5C5C5C]">
            {{ t('advisory.allAdvisories') }}
          </p>
          <ul class="mt-2 space-y-1.5">
            <li v-for="(a, i) in advisories" :key="a?.id ?? i">
              <button
                type="button"
                @click="selectAdvisory(i)"
                :aria-pressed="i === selectedIndex"
                :class="[
                  'w-full flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors',
                  i === selectedIndex
                    ? 'border-[#902715]/30 bg-[#902715]/5'
                    : 'border-[#0A0A0A]/5 bg-white hover:bg-[#FAFAFA]'
                ]"
              >
                <span
                  :class="['w-2 h-2 rounded-full shrink-0', dotForLevel(severityLevelOf(a))]"
                  aria-hidden="true"
                ></span>
                <span class="w-14 shrink-0 text-[10px] font-black uppercase tracking-wider text-[#4A4A4A]">
                  {{ severityOf(a).label }}
                </span>
                <span class="min-w-0 flex-1 truncate text-[12px] font-semibold text-[#0A0A0A]">
                  {{ splitHeadline(a?.headline).text || a?.headline }}
                </span>
                <ChevronUp
                  :class="['w-4 h-4 shrink-0 transition-transform duration-300', i === selectedIndex ? 'rotate-180' : 'rotate-90']"
                  :stroke-width="2.2"
                  aria-hidden="true"
                />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, ChevronUp, CloudRain, ExternalLink, Share, TriangleAlert, X } from 'lucide-vue-next'
import { formatAdvisoryText } from '@/lib/advisoryFeed'
import {
  OFFICIAL_ADVISORY_URL,
  coverageMeta,
  coverageOf,
  dotForLevel,
  formatDateTime,
  hasTierAreas,
  isFloodBlock,
  isFloodYourArea,
  isPlainBlock,
  isStructuredBlock,
  isTierBlock,
  isTierRowYourArea,
  isYourArea,
  severityLevelOf,
  severityOf,
  severityOfBlock,
  splitHeadline,
  tierAreaMunicipalities,
  tierMunicipalityParts,
  tsOf
} from '@/lib/advisoryDisplay'

/* ────────────────────────────────────────────────────────────────────────────
   AdvisoryDetailsSheet — bottom-sheet detail view for the advisory card.
   Owns all sheet state (selected advisory, block collapse state, share) and
   renders the official message as structured tiers / river lists. All
   advisory text is {{ }}-interpolated only (live feed has contained script
   tags — never v-html). Focus returns to the parent's trigger on close.
   ──────────────────────────────────────────────────────────────────────────── */
const props = defineProps({
  advisories: { type: Array, default: () => [] },
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const { t, locale } = useI18n()

const selectedIndex = ref(0)
const closeBtnRef = ref(null)
const sheetScrollRef = ref(null)
const shareState = ref('idle')

const selected = computed(() => props.advisories[selectedIndex.value] || props.advisories[0] || null)

const sheetSeverity = computed(() => severityOf(selected.value))
const sheetCoverage = computed(() => coverageOf(selected.value))
const sheetHeadlineParts = computed(() => splitHeadline(selected.value?.headline))
const sheetIssuedLabel = computed(() => formatDateTime(tsOf(selected.value?.issuedAt), locale.value === 'fil' ? 'fil-PH' : 'en-PH'))
const sheetValidUntilLabel = computed(() =>
  selected.value?.validUntil ? formatDateTime(tsOf(selected.value.validUntil), locale.value === 'fil' ? 'fil-PH' : 'en-PH') : null
)

/* ── Structured message blocks (messageBlocks) ────────────────────────────
   Rendered when present; the flat advisory.message remains for share +
   legacy fallback. All text stays {{ }}-interpolated, never v-html. */
const messageBlocksOf = (a) => (Array.isArray(a?.messageBlocks) ? a.messageBlocks : [])
const sheetBlocks = computed(() => messageBlocksOf(selected.value))
const hasBlocks = computed(() => sheetBlocks.value.length > 0)
const sheetFlatMessage = computed(() => formatAdvisoryText(selected.value?.message || ''))

/* Header label: "Areas affected" when the tier scopes provinces (kills the
   "YELLOW / YELLOW" duplication); legacy blocks keep title or severity name. */
const tierHeaderLabel = (b) =>
  hasTierAreas(b) ? t('advisory.areasAffected') : b?.title || severityOfBlock(b).label

/* Group rows within a tier: the user's area row first, then an "Other areas"
   label followed by the rest. Rows keep their original indices so collapse
   state + aria-controls stay stable. No separator when either group is empty. */
function groupedRows(rows, isYourRow) {
  const your = rows.filter(isYourRow)
  const other = rows.filter((r) => !isYourRow(r))
  if (!your.length || !other.length) return rows
  return [...your, { separator: true }, ...other]
}

const tierAreaRows = (block) =>
  groupedRows(block.areas.map((area, ai) => ({ area, ai })), (r) => isTierRowYourArea(r.area))

const floodItemRows = (block) =>
  groupedRows(block.items.map((item, ji) => ({ item, ji })), (r) => isFloodYourArea(r.item))

/* Default focus: the tier matching the user's LOCAL level (fallback: the first
   tier block) is hoisted to the front and expanded; everything else keeps its
   reading order and starts collapsed. */
const sheetTierIndex = computed(() => {
  const blocks = sheetBlocks.value
  if (!blocks.length) return -1
  const localLevel = severityLevelOf(selected.value)
  const match = blocks.findIndex((b) => isTierBlock(b) && b.severity === localLevel)
  return match !== -1 ? match : blocks.findIndex((b) => isTierBlock(b))
})

/* Plain blocks AFTER the last structured block are forecast-narrative / closing
   text — grouped under "Additional details". Earlier plain blocks (the
   weather-system header) stay inline in reading order. */
const sheetAdditionalBlocks = computed(() => {
  const blocks = sheetBlocks.value
  let lastStructured = -1
  blocks.forEach((b, i) => {
    if (isStructuredBlock(b)) lastStructured = i
  })
  return blocks
    .map((block, i) => ({ block, i }))
    .filter(({ block, i }) => isPlainBlock(block) && i > lastStructured)
})

const sheetBlockViews = computed(() => {
  const blocks = sheetBlocks.value
  if (!blocks.length) return []
  const additional = new Set(sheetAdditionalBlocks.value.map((v) => v.i))
  const tierIdx = sheetTierIndex.value
  const rest = blocks
    .map((block, i) => ({ block, i }))
    .filter((v) => v.i !== tierIdx && !additional.has(v.i))
  return tierIdx !== -1 ? [{ block: blocks[tierIdx], i: tierIdx }, ...rest] : rest
})

/* Collapse/expand state, keyed by the block's original index. */
const expandedTiers = ref({})
const expandedTierRows = ref({})
const expandedFlood = ref({})

const isTierExpanded = (i) => !!expandedTiers.value[i]
function toggleTier(i) {
  expandedTiers.value[i] = !expandedTiers.value[i]
}

const isTierRowExpanded = (blockIdx, areaIdx) => !!expandedTierRows.value[`${blockIdx}:${areaIdx}`]
function toggleTierRow(blockIdx, areaIdx) {
  const key = `${blockIdx}:${areaIdx}`
  expandedTierRows.value[key] = !expandedTierRows.value[key]
}

const isFloodExpanded = (blockIdx, itemIdx) => !!expandedFlood.value[`${blockIdx}:${itemIdx}`]
function toggleFlood(blockIdx, itemIdx) {
  const key = `${blockIdx}:${itemIdx}`
  expandedFlood.value[key] = !expandedFlood.value[key]
}

/* Reset per advisory: user's tier open, the area/flood row containing the
   user's area open, everything else closed. */
function resetBlockState() {
  expandedTiers.value = {}
  expandedTierRows.value = {}
  expandedFlood.value = {}
  const blocks = sheetBlocks.value
  const tierIdx = sheetTierIndex.value
  if (tierIdx !== -1) expandedTiers.value[tierIdx] = true
  blocks.forEach((block, bi) => {
    if (isTierBlock(block) && hasTierAreas(block)) {
      block.areas.forEach((area, ai) => {
        if (isTierRowYourArea(area)) expandedTierRows.value[`${bi}:${ai}`] = true
      })
    }
    if (isFloodBlock(block)) {
      block.items.forEach((item, ji) => {
        if (isFloodYourArea(item)) expandedFlood.value[`${bi}:${ji}`] = true
      })
    }
  })
}

function selectAdvisory(i) {
  selectedIndex.value = i
  resetBlockState()
  nextTick(() => {
    if (sheetScrollRef.value) sheetScrollRef.value.scrollTop = 0
  })
}

/* Close button + backdrop tap → parent. Escape goes through onEscapeKey. */
function close() {
  emit('close')
}

/* Open/close lifecycle: reset state, focus the close button, and bind Escape
   while open. The parent restores focus to the trigger on close. */
watch(
  () => props.open,
  (open) => {
    if (open) {
      selectedIndex.value = 0
      shareState.value = 'idle'
      resetBlockState()
      document.addEventListener('keydown', onEscapeKey)
      nextTick(() => closeBtnRef.value?.focus())
    } else {
      document.removeEventListener('keydown', onEscapeKey)
    }
  },
  { immediate: true }
)

function onEscapeKey(e) {
  if (e.key === 'Escape') emit('close')
}

/* ── Share: native share sheet → clipboard copy fallback ────────────────── */
let copiedTimer = null

function flashCopied() {
  shareState.value = 'copied'
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (shareState.value = 'idle'), 2000)
}

async function shareAdvisory() {
  const a = selected.value
  const title = a?.headline || t('advisory.title')
  const text = `${formatAdvisoryText(a?.message) || ''}\n\n${OFFICIAL_ADVISORY_URL}`.trim()
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title, text })
      return
    }
    await navigator.clipboard.writeText(text)
    flashCopied()
  } catch (err) {
    if (err?.name === 'AbortError') return
    try {
      await navigator.clipboard.writeText(text)
      flashCopied()
    } catch {
      /* clipboard unavailable — no-op */
    }
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onEscapeKey)
  if (copiedTimer) clearTimeout(copiedTimer)
})
</script>

<style scoped>
@keyframes advisory-sheet-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.advisory-sheet-panel {
  animation: advisory-sheet-up 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
