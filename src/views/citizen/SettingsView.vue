<template>
  <div class="space-y-5 pb-8">
    <!-- Header / Back Navigation Card -->
    <div class="flex items-center space-x-3 bg-white rounded-2xl p-4 shadow-m3-sm border border-black/5">
      <router-link
        to="/app"
        class="p-2 rounded-full hover:bg-gray-100 text-[#0A0A0A] transition-colors"
        :title="$t('settings.backToHome')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
        </svg>
      </router-link>
      <div>
        <h1 class="font-expressive text-xl font-black text-[#0A0A0A] tracking-tight">
          {{ $t('settings.title') }}
        </h1>
        <p class="text-xs font-medium text-[#717171]">
          {{ $t('settings.subtitle') }}
        </p>
      </div>
    </div>

    <!-- Section 1: Emergency Callback Number Card -->
    <section class="bg-white rounded-3xl p-6 shadow-m3-md border border-black/5 space-y-5">
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 rounded-2xl bg-[#1F3A4B]/10 text-[#1F3A4B] flex items-center justify-center shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <h2 class="font-expressive text-lg font-black text-[#0A0A0A] tracking-tight">
              {{ $t('settings.callbackSectionTitle') }}
            </h2>
            <span
              :class="[
                'inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-1',
                savedNumber ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              ]"
            >
              {{ savedNumber ? $t('settings.statusSaved', { num: savedNumber }) : $t('settings.statusNotSet') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Explanation & Privacy Assurance -->
      <p class="text-xs font-medium text-[#717171] leading-relaxed">
        {{ $t('settings.callbackDescription') }}
      </p>

      <!-- Input Field -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-[#717171] uppercase tracking-wider">
          {{ $t('settings.phoneLabel') }}
        </label>
        <div class="relative">
          <input
            v-model="phoneInput"
            type="tel"
            maxlength="11"
            @input="phoneInput = sanitizePhoneNumber(phoneInput)"
            :placeholder="$t('settings.phonePlaceholder')"
            class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-[#902715] focus:ring-0 text-base font-mono tracking-wide text-[#0A0A0A] bg-white transition-colors"
          />
        </div>

        <!-- Advisory Validation Warning Banner -->
        <div
          v-if="isPhoneInvalidWarningVisible"
          class="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2"
        >
          <svg class="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ $t('settings.invalidPhoneWarning') }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3 pt-1">
        <button
          @click="handleSavePhone"
          :disabled="isSaving"
          class="flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all duration-200 flex items-center justify-center space-x-2 bg-[#902715] text-white hover:bg-[#7a2012] shadow-m3-sm active:scale-[0.99] cursor-pointer disabled:opacity-50"
        >
          <span>{{ $t('settings.savePhone') }}</span>
        </button>

        <button
          v-if="savedNumber"
          @click="handleClearPhone"
          :disabled="isSaving"
          class="py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-1.5 bg-white text-[#902715] border-2 border-[#902715] hover:bg-red-50 shadow-m3-sm active:scale-[0.99] cursor-pointer disabled:opacity-50"
        >
          <span>{{ $t('settings.clearPhone') }}</span>
        </button>
      </div>
    </section>

    <!-- Section 2: Language Preference Card -->
    <section class="bg-white rounded-3xl p-6 shadow-m3-md border border-black/5 space-y-4">
      <div class="flex items-center space-x-3">
        <div class="w-12 h-12 rounded-2xl bg-[#902715]/10 text-[#902715] flex items-center justify-center shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012-2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 class="font-expressive text-lg font-black text-[#0A0A0A] tracking-tight">
            {{ $t('settings.languageSectionTitle') }}
          </h2>
          <p class="text-xs font-medium text-[#717171]">
            {{ $t('settings.languageDescription') }}
          </p>
        </div>
      </div>

      <!-- Segmented Language Selection Buttons -->
      <div class="grid grid-cols-2 gap-3 pt-1">
        <button
          @click="changeLanguage('fil')"
          :class="[
            'py-3.5 px-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2 border-2 cursor-pointer',
            currentLocale === 'fil'
              ? 'bg-[#902715] text-white border-[#902715] shadow-m3-sm'
              : 'bg-gray-50 text-[#0A0A0A] border-gray-200 hover:bg-gray-100'
          ]"
        >
          <span>🇵🇭 {{ $t('settings.filipino') }}</span>
        </button>

        <button
          @click="changeLanguage('en')"
          :class="[
            'py-3.5 px-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2 border-2 cursor-pointer',
            currentLocale === 'en'
              ? 'bg-[#902715] text-white border-[#902715] shadow-m3-sm'
              : 'bg-gray-50 text-[#0A0A0A] border-gray-200 hover:bg-gray-100'
          ]"
        >
          <span>🇺🇸 {{ $t('settings.english') }}</span>
        </button>
      </div>
    </section>

    <!-- Section 3: Location Access & GPS Permissions Card -->
    <section class="bg-white rounded-3xl p-6 shadow-m3-md border border-black/5 space-y-4">
      <div class="flex items-center space-x-3">
        <div class="w-12 h-12 rounded-2xl bg-[#902715]/10 text-[#902715] flex items-center justify-center shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div>
          <h2 class="font-expressive text-lg font-black text-[#0A0A0A] tracking-tight">
            Location & GPS Access
          </h2>
          <span
            :class="[
              'inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-1',
              isGpsActive ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'
            ]"
          >
            {{ isGpsActive ? '🟢 Live Location Active' : '🟡 Location Skipped / Fallback' }}
          </span>
        </div>
      </div>

      <p class="text-xs font-medium text-[#717171] leading-relaxed">
        GPS is used during Emergency SOS dispatches and Evacuation Center routing. You can test or re-enable location permissions here anytime.
      </p>

      <button
        @click="handleTestLocation"
        :disabled="isLocating"
        class="w-full py-3.5 px-4 rounded-xl font-black text-sm transition-all duration-200 flex items-center justify-center space-x-2 bg-[#902715] text-white hover:bg-[#7a2012] shadow-m3-sm active:scale-[0.99] cursor-pointer disabled:opacity-50"
      >
        <svg v-if="isLocating" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ isLocating ? 'Acquiring GPS...' : (isGpsActive ? 'Re-test Live Location' : 'Enable Location Access') }}</span>
      </button>
    </section>


    <!-- Toast Notification Popup -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-4 opacity-0"
    >
      <div
        v-if="toastMessage"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#0A0A0A] text-[#ffffff] px-5 py-3 rounded-full text-sm font-bold shadow-m3-lg flex items-center gap-2"
      >
        <svg class="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

    <!-- GPS Settings Guide Modal -->
    <GpsGuideModal
      :show="showGpsGuideModal"
      @close="showGpsGuideModal = false"
      @retry="handleTestLocation"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGPS } from '@/composables/useGPS'
import { useLocaleStore } from '@/stores/localeStore'
import { normalizeCallbackNumber, looksValid, sanitizePhoneNumber } from '@/utils/callbackNumber'
import GpsGuideModal from '@/components/common/GpsGuideModal.vue'

const { t } = useI18n()
const { getCallbackNumber, setCallbackNumber, cachedLocation, isLocating, refreshLocation, initGPS } = useGPS()
const localeStore = useLocaleStore()

const showGpsGuideModal = ref(false)
const savedNumber = ref(null)
const phoneInput = ref('')
const toastMessage = ref('')
const isSaving = ref(false)

const currentLocale = computed(() => localeStore.currentLocale)
const isGpsActive = computed(() => !!cachedLocation.value && !cachedLocation.value.isFallback)

const normalizedInput = computed(() => normalizeCallbackNumber(phoneInput.value))
const isPhoneInvalidWarningVisible = computed(() => {
  if (!phoneInput.value || !phoneInput.value.trim()) return false
  return !looksValid(normalizedInput.value)
})

async function handleTestLocation() {
  const res = await initGPS(true)
  if (res?.denied) {
    showGpsGuideModal.value = true
    return
  }
  const loc = await refreshLocation(true)
  if (loc && !loc.isFallback) {
    localStorage.setItem('agap_location_pref', 'granted')
    showToast('GPS location acquired and enabled!')
  } else {
    showGpsGuideModal.value = true
  }
}

function showToast(msg) {
  toastMessage.value = msg
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = ''
    }
  }, 3000)
}

async function loadData() {
  savedNumber.value = await getCallbackNumber()
  if (savedNumber.value) {
    phoneInput.value = savedNumber.value
  }
}

async function handleSavePhone() {
  isSaving.value = true
  try {
    const res = await setCallbackNumber(phoneInput.value)
    savedNumber.value = res
    if (res) {
      phoneInput.value = res
    }
    showToast(t('settings.phoneSaved'))
  } catch (err) {
    console.error('Failed to save callback number:', err)
  } finally {
    isSaving.value = false
  }
}

async function handleClearPhone() {
  isSaving.value = true
  try {
    await setCallbackNumber('')
    savedNumber.value = null
    phoneInput.value = ''
    showToast(t('settings.phoneCleared'))
  } catch (err) {
    console.error('Failed to clear callback number:', err)
  } finally {
    isSaving.value = false
  }
}

function changeLanguage(lang) {
  localeStore.setLocale(lang)
  showToast(t('settings.languageUpdated'))
}

onMounted(() => {
  loadData()
})
</script>
