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
      <span v-if="issuedLabel" class="inline-flex items-center gap-1">
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
      type="button"
      aria-haspopup="dialog"
      @click="openDetails"
      class="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-[#902715]/25 bg-[#902715]/5 px-4 py-2.5 text-[12px] font-black uppercase tracking-wider text-[#902715] hover:bg-[#902715]/10 transition-colors active:scale-[0.99]"
    >
      {{ t('advisory.details') }}
      <ChevronUp class="w-4 h-4" :stroke-width="2.5" aria-hidden="true" />
    </button>
  </section>

  <!-- ══════════════════════ DETAIL SHEET · bottom sheet ══════════════════════ -->
  <Teleport to="body">
    <div
      v-if="sheetOpen"
      class="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      :aria-label="t('advisory.details')"
      @click.self="closeSheet"
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
            @click="closeSheet"
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
                      <li v-for="(area, ai) in view.block.areas" :key="ai">
                        <!-- Province with municipalities: collapsible row -->
                        <button
                          v-if="tierAreaMunicipalities(area).length"
                          type="button"
                          @click="toggleTierRow(view.i, ai)"
                          :aria-expanded="isTierRowExpanded(view.i, ai)"
                          :aria-controls="`advisory-tier-row-${view.i}-${ai}`"
                          class="w-full flex items-center gap-2 rounded-xl border border-[#0A0A0A]/5 bg-white px-3 py-2 text-left hover:bg-[#F5F5F5] transition-colors"
                        >
                          <span
                            :class="[
                              'min-w-0 flex-1 truncate text-[13px] tracking-tight',
                              isTierRowYourArea(area) ? 'font-black text-[#0A0A0A]' : 'font-bold text-[#4A4A4A]'
                            ]"
                          >
                            {{ area.province }}
                          </span>
                          <span
                            v-if="isTierRowYourArea(area)"
                            class="inline-flex items-center rounded-full bg-[#902715] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
                          >
                            {{ t('advisory.yourArea') }}
                          </span>
                          <ChevronDown
                            :class="['w-4 h-4 shrink-0 text-[#5C5C5C] transition-transform duration-300', isTierRowExpanded(view.i, ai) ? 'rotate-180' : '']"
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
                            {{ area.province }}
                          </span>
                        </div>
                        <p
                          v-if="tierAreaMunicipalities(area).length && isTierRowExpanded(view.i, ai)"
                          :id="`advisory-tier-row-${view.i}-${ai}`"
                          class="mt-1 px-3 text-[13px] font-medium text-[#4A4A4A] leading-relaxed whitespace-pre-line"
                        >
                          <template v-if="tierMunicipalityParts(area)">
                            {{ tierMunicipalityParts(area).before }}
                            <strong class="font-black text-[#0A0A0A]">{{ tierMunicipalityParts(area).match }}</strong>
                            {{ tierMunicipalityParts(area).after }}
                          </template>
                          <template v-else>
                            {{ tierAreaMunicipalities(area).join(', ') }}
                          </template>
                        </p>
                      </li>
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
                  <li v-for="(item, ji) in view.block.items" :key="ji">
                    <button
                      type="button"
                      @click="toggleFlood(view.i, ji)"
                      :aria-expanded="isFloodExpanded(view.i, ji)"
                      :aria-controls="`advisory-flood-${view.i}-${ji}`"
                      class="w-full flex items-center gap-2 rounded-xl border border-[#0A0A0A]/5 bg-white px-3 py-2 text-left hover:bg-[#F5F5F5] transition-colors"
                    >
                      <span
                        :class="[
                          'min-w-0 flex-1 truncate text-[13px] tracking-tight',
                          isFloodYourArea(item) ? 'font-black text-[#0A0A0A]' : 'font-bold text-[#4A4A4A]'
                        ]"
                      >
                        {{ item.label }}
                      </span>
                      <span
                        v-if="isFloodYourArea(item)"
                        class="inline-flex items-center rounded-full bg-[#902715] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
                      >
                        {{ t('advisory.yourArea') }}
                      </span>
                      <ChevronDown
                        :class="['w-4 h-4 shrink-0 text-[#5C5C5C] transition-transform duration-300', isFloodExpanded(view.i, ji) ? 'rotate-180' : '']"
                        :stroke-width="2.2"
                        aria-hidden="true"
                      />
                    </button>
                    <p
                      v-if="isFloodExpanded(view.i, ji) && item.text"
                      :id="`advisory-flood-${view.i}-${ji}`"
                      class="mt-1 px-3 text-[13px] font-medium text-[#4A4A4A] leading-relaxed whitespace-pre-line"
                    >
                      {{ item.text }}
                    </p>
                  </li>
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
import {
  ChevronDown,
  ChevronUp,
  Clock,
  CloudRain,
  ExternalLink,
  Share,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Umbrella,
  X
} from 'lucide-vue-next'
import { formatAdvisoryText } from '@/lib/advisoryFeed'
import { useNow } from '@/composables/useNow'

/* ────────────────────────────────────────────────────────────────────────────
   AdvisoryCard — compact, light-surface PAGASA weather advisory strip for the
   citizen home page. Purely presentational: receives a severity-sorted list of
   normalized advisories via props, renders the top one, and opens an in-app
   detail sheet with the full official text. Never touches stores or the
   network, and all advisory text is rendered via {{ }} interpolation only
   (live feed has contained script tags — never v-html).
   ──────────────────────────────────────────────────────────────────────────── */
const props = defineProps({
  advisories: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const { t, locale } = useI18n()

const OFFICIAL_ADVISORY_URL = 'https://bagong.pagasa.dost.gov.ph/weather/weather-advisory'
const USER_MUNICIPALITY = 'santa rosa'

/* Top of the severity-sorted list is what the user's area faces most. */
const topAdvisory = computed(() => (Array.isArray(props.advisories) ? props.advisories[0] : null) || null)

/* ── Severity display meta (PAGASA color-code → app palette) ───────────────
   Solid chips mirror HomeView's risk chip; translucent *-400 tinted variants
   are tuned for the dark hero and would fail contrast on a light surface.
   `accent` tints the guidance callout icon for the user's local level.       */
const VALID_LEVELS = ['watch', 'yellow', 'orange', 'red']

const SEVERITY_META = {
  watch: {
    label: 'WATCH',
    badge: 'bg-[#E3EBF0] text-[#1F3A4B]',
    border: 'border-[#1F3A4B]/15',
    accent: 'text-[#1F3A4B]',
    isAlert: false
  },
  yellow: {
    label: 'YELLOW',
    badge: 'bg-[#F7FB41] text-[#902715]',
    border: 'border-[#8a7e00]/35',
    accent: 'text-sr-canary-text',
    isAlert: true
  },
  orange: {
    label: 'ORANGE',
    badge: 'bg-[#D14D3E] text-white',
    border: 'border-[#D14D3E]/35',
    accent: 'text-sr-copper-hover',
    isAlert: true
  },
  red: {
    label: 'RED',
    badge: 'bg-[#902715] text-white animate-pulse',
    border: 'border-[#902715]/50',
    accent: 'text-sr-brandy',
    isAlert: true
  }
}

/* Badge, card border and guidance reflect the user's LOCAL level (max severity
   across the covered towns), not the Luzon-wide headline level. Falls back to
   the advisory's own severity for legacy data without localSeverity. */
function severityLevelOf(a) {
  const raw = a?.localSeverity || a?.severity
  return VALID_LEVELS.includes(raw) ? raw : 'watch'
}
function severityOf(a) {
  return SEVERITY_META[severityLevelOf(a)]
}

const severityLevel = computed(() => severityLevelOf(topAdvisory.value))
const severity = computed(() => SEVERITY_META[severityLevel.value])

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

/* ── Headline #tag de-emphasis (e.g. trailing "#NCR_PRSD") ───────────────── */
function splitHeadline(headline) {
  const s = String(headline || '')
  const m = s.match(/^(.*?)(\s+#\w+)$/)
  if (m) return { text: m[1], tag: m[2] }
  return { text: s, tag: null }
}
const headlineParts = computed(() => splitHeadline(topAdvisory.value?.headline))

/* ── Coverage chips (nearby municipalities in scope) ───────────────────────
   Compact, scannable "Covers" pills. Mirrors SEVERITY_META's palette on a
   translucent base; the colored dot carries the severity signal and the
   tinted border groups chips at a glance. Unknown/missing severities fall
   back to watch. Renders nothing for old cached data without localCoverage. */
const COVERAGE_SEVERITY_META = {
  watch: {
    dot: 'bg-slate-500',
    chip: 'bg-slate-100 text-slate-600 border-slate-300'
  },
  yellow: {
    dot: 'bg-sr-canary ring-1 ring-inset ring-sr-canary-text/50',
    chip: 'bg-sr-canary/25 text-sr-canary-text border-sr-canary-text/30'
  },
  orange: {
    dot: 'bg-sr-copper',
    chip: 'bg-sr-copper/10 text-sr-copper-hover border-sr-copper/30'
  },
  red: {
    dot: 'bg-sr-brandy',
    chip: 'bg-sr-brandy/10 text-sr-brandy border-sr-brandy/30'
  }
}

const coverageOf = (a) => (Array.isArray(a?.localCoverage) ? a.localCoverage : [])
const coverageItems = computed(() => coverageOf(topAdvisory.value))

const coverageMeta = (item) => COVERAGE_SEVERITY_META[item?.severity] || COVERAGE_SEVERITY_META.watch
const dotForLevel = (level) => COVERAGE_SEVERITY_META[level]?.dot || COVERAGE_SEVERITY_META.watch.dot

/* "Your area" personal relevance: match the chip name against the user's
   municipality, normalized (lowercase, trimmed, "city" suffix stripped). */
function normalizeName(name) {
  return String(name ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s*city$/i, '')
    .trim()
}
const isYourArea = (item) => normalizeName(item?.name) === USER_MUNICIPALITY

/* ── Date formatting (en-PH / fil-PH short form, forced to Asia/Manila so
   mobile and desktop never read local-device time; "PHT" disambiguates). */
function formatDateTime(ts) {
  if (!ts || !Number.isFinite(ts)) return ''
  try {
    const tag = locale.value === 'fil' ? 'fil-PH' : 'en-PH'
    const local = new Date(ts).toLocaleString(tag, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Manila'
    })
    return `${local} PHT`
  } catch {
    return new Date(ts).toLocaleString()
  }
}

const issuedLabel = computed(() => formatDateTime(topAdvisory.value?.issuedAt))

/* ── Urgency countdown: reactive minute tick via useNow ─────────────────── */
const { now } = useNow()

function tsOf(value) {
  if (value == null) return null
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : null
}

const validUntilTs = computed(() => tsOf(topAdvisory.value?.validUntil))
const isExpired = computed(() => validUntilTs.value != null && validUntilTs.value - now.value.getTime() <= 0)

function formatRemaining(ms) {
  const totalMin = Math.max(1, Math.ceil(ms / 60_000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const countdownText = computed(() => {
  const ts = validUntilTs.value
  if (ts == null || isExpired.value) return null
  return formatRemaining(ts - now.value.getTime())
})

/* ── Detail sheet (bottom sheet over Teleport) ──────────────────────────── */
const sheetOpen = ref(false)
const selectedIndex = ref(0)
const closeBtnRef = ref(null)
const sheetScrollRef = ref(null)
const triggerEl = ref(null)
const shareState = ref('idle')

const selected = computed(() => props.advisories[selectedIndex.value] || topAdvisory.value || null)

const sheetSeverity = computed(() => severityOf(selected.value))
const sheetCoverage = computed(() => coverageOf(selected.value))
const sheetHeadlineParts = computed(() => splitHeadline(selected.value?.headline))
const sheetIssuedLabel = computed(() => formatDateTime(selected.value?.issuedAt))
const sheetValidUntilLabel = computed(() =>
  selected.value?.validUntil ? formatDateTime(selected.value.validUntil) : null
)

/* ── Structured message blocks (messageBlocks) ────────────────────────────
   Rendered in the sheet when present; the flat advisory.message remains for
   share + legacy fallback. All text stays {{ }}-interpolated, never v-html. */
const messageBlocksOf = (a) => (Array.isArray(a?.messageBlocks) ? a.messageBlocks : [])
const sheetBlocks = computed(() => messageBlocksOf(selected.value))
const hasBlocks = computed(() => sheetBlocks.value.length > 0)
const sheetFlatMessage = computed(() => formatAdvisoryText(selected.value?.message || ''))

const isTierBlock = (b) => !!b?.severity && !(Array.isArray(b?.items) && b.items.length > 0)
const isFloodBlock = (b) => Array.isArray(b?.items) && b.items.length > 0
const isPlainBlock = (b) => !isTierBlock(b) && !isFloodBlock(b)
const isStructuredBlock = (b) => isTierBlock(b) || isFloodBlock(b)

const severityOfBlock = (b) => SEVERITY_META[b?.severity] || SEVERITY_META.watch

/* Tier blocks (live data) carry `areas` — per-province scopes. Legacy cached
   entries lack it: fall back to the single-paragraph body. */
const tierAreasOf = (b) => (Array.isArray(b?.areas) ? b.areas : [])
const hasTierAreas = (b) => tierAreasOf(b).length > 0
const tierAreaMunicipalities = (area) => (Array.isArray(area?.municipalities) ? area.municipalities : [])

/* Municipality-bearing rows are the user's area when the list contains their
   municipality; bare provinces (empty list) never match. */
const isTierRowYourArea = (area) =>
  tierAreaMunicipalities(area).some((m) => normalizeName(m) === USER_MUNICIPALITY)

/* Bold the user's municipality inside the joined list without v-html: split
   the joined string around the matching entry's raw label. */
const tierMunicipalityParts = (area) => {
  const munis = tierAreaMunicipalities(area)
  if (!munis.length) return null
  const joined = munis.join(', ')
  const idx = munis.findIndex((m) => normalizeName(m) === USER_MUNICIPALITY)
  if (idx === -1) return null
  const label = munis[idx]
  const at = joined.indexOf(label)
  if (at === -1) return null
  return { before: joined.slice(0, at), match: label, after: joined.slice(at + label.length) }
}

/* Header label: "Areas affected" when the tier scopes provinces (kills the
   "YELLOW / YELLOW" duplication); legacy blocks keep title or severity name. */
const tierHeaderLabel = (b) =>
  hasTierAreas(b) ? t('advisory.areasAffected') : b?.title || severityOfBlock(b).label

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

/* Flood rows are labeled by province, not municipality (see advisoryFeed
 * HOME_PROVINCE); the Laguna row is the user's area. */
const HOME_PROVINCE = 'laguna'
const isFloodYourArea = (item) => normalizeName(item?.label) === HOME_PROVINCE

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

function openDetails(evt) {
  selectedIndex.value = 0
  triggerEl.value = evt?.currentTarget || null
  shareState.value = 'idle'
  resetBlockState()
  sheetOpen.value = true
  nextTick(() => closeBtnRef.value?.focus())
}

function closeSheet() {
  sheetOpen.value = false
  nextTick(() => triggerEl.value?.focus())
}

function selectAdvisory(i) {
  selectedIndex.value = i
  resetBlockState()
  nextTick(() => {
    if (sheetScrollRef.value) sheetScrollRef.value.scrollTop = 0
  })
}

function onEscapeKey(e) {
  if (e.key === 'Escape') closeSheet()
}

watch(sheetOpen, (open) => {
  if (open) document.addEventListener('keydown', onEscapeKey)
  else document.removeEventListener('keydown', onEscapeKey)
})

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
