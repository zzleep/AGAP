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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

    <!-- Section 3: Privacy & Device Diagnostics Card -->
    <section class="bg-white rounded-3xl p-6 shadow-m3-md border border-black/5 space-y-3">
      <h2 class="font-expressive text-sm font-black text-[#0A0A0A] uppercase tracking-wider">
        {{ $t('settings.deviceInfoTitle') }}
      </h2>
      <div class="p-3.5 rounded-2xl bg-[#F5F5F5] border border-black/5 space-y-2 text-xs font-mono text-[#717171]">
        <div class="flex items-center justify-between">
          <span>{{ $t('settings.deviceHashLabel') }}</span>
          <span class="font-bold text-[#0A0A0A]">{{ truncatedDeviceHash || 'Loading...' }}</span>
        </div>
        <div class="flex items-center justify-between border-t border-gray-200 pt-2 text-[11px] font-sans">
          <span>{{ $t('settings.storageType') }}</span>
          <span class="text-green-700 font-semibold">Ready</span>
        </div>
      </div>
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
        class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#0A0A0A] text-white px-5 py-3 rounded-full text-sm font-bold shadow-m3-lg flex items-center gap-2"
      >
        <svg class="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGPS } from '@/composables/useGPS'
import { useLocaleStore } from '@/stores/localeStore'
import { normalizeCallbackNumber, looksValid } from '@/utils/callbackNumber'

const { t } = useI18n()
const { getCallbackNumber, setCallbackNumber, getSOSDeviceHash } = useGPS()
const localeStore = useLocaleStore()

const savedNumber = ref(null)
const phoneInput = ref('')
const sosDeviceHash = ref('')
const toastMessage = ref('')
const isSaving = ref(false)

const currentLocale = computed(() => localeStore.currentLocale)

const normalizedInput = computed(() => normalizeCallbackNumber(phoneInput.value))
const isPhoneInvalidWarningVisible = computed(() => {
  if (!phoneInput.value || !phoneInput.value.trim()) return false
  return !looksValid(normalizedInput.value)
})

const truncatedDeviceHash = computed(() => {
  if (!sosDeviceHash.value) return ''
  const hash = sosDeviceHash.value
  if (hash.length <= 12) return hash
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
})

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
  sosDeviceHash.value = await getSOSDeviceHash()
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
