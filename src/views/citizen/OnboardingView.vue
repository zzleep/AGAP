<template>
  <div class="min-h-[80vh] flex flex-col justify-between py-4 space-y-6">
    <!-- Top Stepper Header -->
    <div class="space-y-3">
      <div class="flex items-center justify-between text-xs font-bold text-[#717171] uppercase tracking-wider">
        <span>AGAP Citizen Setup</span>
        <span>Step {{ currentStep }} of 2</span>
      </div>
      <!-- Progress Bar -->
      <div class="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
        <div
          class="bg-[#902715] h-full transition-all duration-300 ease-out"
          :style="{ width: currentStep === 1 ? '50%' : '100%' }"
        ></div>
      </div>
    </div>

    <!-- Screen 1: GPS Permission Screen -->
    <div v-if="currentStep === 1" class="flex-1 flex flex-col justify-between space-y-6">
      <div class="bg-white rounded-3xl p-6 shadow-m3-md border border-black/5 space-y-6">
        <!-- Hero Icon Badge -->
        <div class="w-16 h-16 rounded-2xl bg-[#902715]/10 text-[#902715] flex items-center justify-center">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <div class="space-y-2">
          <h1 class="font-expressive text-2xl font-black text-[#0A0A0A] tracking-tight">
            Enable Location Access
          </h1>
          <p class="text-sm font-semibold text-[#0A0A0A] leading-relaxed">
            So responders know where to find you during an emergency.
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-[#F5F5F5] border border-black/5 space-y-2.5 text-xs font-medium text-[#717171]">
          <div class="flex items-start space-x-2.5">
            <svg class="w-4 h-4 text-[#902715] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>Pinpoints your exact position for CDRRMO emergency response</span>
          </div>
          <div class="flex items-start space-x-2.5">
            <svg class="w-4 h-4 text-[#902715] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>Calculates safe evacuation routes to the nearest center</span>
          </div>
        </div>
      </div>

      <!-- Equal Visual Weight & Tappability Actions for Screen 1 -->
      <div class="space-y-3 pt-2">
        <button
          @click="handleAllowGPS"
          :disabled="isLocating"
          class="w-full py-4 px-5 rounded-2xl font-black text-base transition-all duration-200 flex items-center justify-center space-x-2 bg-[#902715] text-white hover:bg-[#7a2012] shadow-m3-sm active:scale-[0.99] disabled:opacity-75 cursor-pointer"
        >
          <svg v-if="isLocating" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isLocating ? 'Locating...' : 'Allow Location Access' }}</span>
        </button>

        <button
          @click="handleSkipGPS"
          :disabled="isLocating"
          class="w-full py-4 px-5 rounded-2xl font-black text-base transition-all duration-200 flex items-center justify-center space-x-2 bg-white text-[#0A0A0A] border-2 border-[#0A0A0A] hover:bg-gray-100 shadow-m3-sm active:scale-[0.99] cursor-pointer"
        >
          <span>Continue without location</span>
        </button>
      </div>
    </div>

    <!-- Screen 2: Callback Number Capture Screen -->
    <div v-else-if="currentStep === 2" class="flex-1 flex flex-col justify-between space-y-6">
      <div class="bg-white rounded-3xl p-6 shadow-m3-md border border-black/5 space-y-6">
        <!-- Hero Icon Badge -->
        <div class="w-16 h-16 rounded-2xl bg-[#1F3A4B]/10 text-[#1F3A4B] flex items-center justify-center">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>

        <div class="space-y-2">
          <h1 class="font-expressive text-2xl font-black text-[#0A0A0A] tracking-tight">
            Emergency Callback Number
          </h1>
          <p class="text-sm font-medium text-[#717171] leading-relaxed">
            Dispatchers use this number to contact you during an emergency response. This number is dispatch-only and never public.
          </p>
        </div>

        <!-- Phone Input Block -->
        <div class="space-y-3">
          <label class="block text-xs font-bold text-[#717171] uppercase tracking-wider">
            Callback Phone Number
          </label>
          <input
            v-model="phoneInput"
            type="tel"
            placeholder="09__ ___ ____"
            class="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 focus:border-[#902715] focus:ring-0 text-lg font-mono tracking-wide text-[#0A0A0A] bg-white transition-colors"
          />

          <!-- Advisory Validation Pill -->
          <div
            v-if="isPhoneInvalidWarningVisible"
            class="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2"
          >
            <svg class="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>This doesn't look like a valid number — save anyway?</span>
          </div>
        </div>
      </div>

      <!-- Equal Visual Weight & Tappability Actions for Screen 2 -->
      <div class="space-y-3 pt-2">
        <button
          @click="handleSavePhone"
          class="w-full py-4 px-5 rounded-2xl font-black text-base transition-all duration-200 flex items-center justify-center space-x-2 bg-[#902715] text-white hover:bg-[#7a2012] shadow-m3-sm active:scale-[0.99] cursor-pointer"
        >
          <span>Save number</span>
        </button>

        <button
          @click="handleSkipPhone"
          class="w-full py-4 px-5 rounded-2xl font-black text-base transition-all duration-200 flex items-center justify-center space-x-2 bg-white text-[#0A0A0A] border-2 border-[#0A0A0A] hover:bg-gray-100 shadow-m3-sm active:scale-[0.99] cursor-pointer"
        >
          <span>Skip for now</span>
        </button>
      </div>
    </div>

    <!-- Brief Confirmation Toast -->
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
        class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#0A0A0A] text-white px-5 py-3 rounded-full text-sm font-bold shadow-m3-lg flex items-center gap-2"
      >
        <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGPS } from '@/composables/useGPS'
import { normalizeCallbackNumber, looksValid } from '@/utils/callbackNumber'

const router = useRouter()
const { initGPS, setCallbackNumber } = useGPS()

const currentStep = ref(1)
const isLocating = ref(false)
const phoneInput = ref('')
const toastMessage = ref('')

const normalizedPhone = computed(() => normalizeCallbackNumber(phoneInput.value))

const isPhoneInvalidWarningVisible = computed(() => {
  const raw = phoneInput.value.trim()
  if (!raw) return false
  return !looksValid(normalizedPhone.value)
})

async function handleAllowGPS() {
  isLocating.value = true
  try {
    await initGPS()
  } catch (err) {
    console.warn('GPS init error in onboarding:', err)
  } finally {
    isLocating.value = false
    currentStep.value = 2
  }
}

function handleSkipGPS() {
  currentStep.value = 2
}

function completeOnboarding() {
  localStorage.setItem('agap_onboarding_done', 'true')
  router.push('/app')
}

async function handleSavePhone() {
  await setCallbackNumber(phoneInput.value)
  toastMessage.value = 'Callback number saved!'
  setTimeout(() => {
    toastMessage.value = ''
    completeOnboarding()
  }, 600)
}

function handleSkipPhone() {
  completeOnboarding()
}
</script>
