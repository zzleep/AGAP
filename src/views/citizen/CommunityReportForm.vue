<template>
  <div class="space-y-4">
    <!-- Header Card -->
    <div class="p-5 rounded-3xl bg-white border border-[#E0E0E0] shadow-m3-sm space-y-1">
      <h2 class="font-expressive font-black text-2xl text-[#0A0A0A] tracking-tight">{{ $t('communityReport.title') }}</h2>
      <p class="text-xs font-medium text-[#717171]">{{ $t('communityReport.description') }}</p>
    </div>

    <!-- Anonymity Notice Banner -->
    <div class="p-4 rounded-3xl bg-[#EEF2E6] border border-[#D8E2C7] text-xs text-[#556B2F] flex items-start space-x-3 shadow-m3-sm">
      <svg class="w-5 h-5 text-[#556B2F] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
      <div class="space-y-0.5">
        <span class="font-expressive font-extrabold text-[#0A0A0A] block text-xs">{{ $t('communityReport.anonymityTitle') }}</span>
        <p class="font-medium text-[#556B2F] leading-relaxed">{{ $t('communityReport.anonymityDescription') }}</p>
      </div>
    </div>

    <!-- Main Report Form -->
    <form @submit.prevent="handleInitialSubmit" class="p-6 rounded-3xl bg-white border border-[#E0E0E0] space-y-4 shadow-m3-sm">
      <!-- Barangay Dropdown -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold uppercase tracking-wider text-[#902715]">{{ $t('communityReport.selectBarangay') }}</label>
        <select
          v-model="form.barangay"
          class="w-full px-4 py-3 rounded-2xl bg-[#F5F5F5] border border-[#E0E0E0] text-[#0A0A0A] text-xs font-semibold focus:outline-none focus:border-[#902715]"
        >
          <option v-for="b in barangays" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>

      <!-- Incident Description -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold uppercase tracking-wider text-[#902715]">{{ $t('communityReport.incidentDescription') }}</label>
        <textarea
          v-model="form.raw_description"
          rows="4"
          required
          :placeholder="$t('communityReport.descriptionPlaceholder')"
          class="w-full px-4 py-3 rounded-2xl bg-[#F5F5F5] border border-[#E0E0E0] text-[#0A0A0A] text-xs font-medium focus:outline-none focus:border-[#902715] placeholder-[#717171]"
        ></textarea>
      </div>

      <!-- Math CAPTCHA Verification -->
      <div class="p-4 rounded-2xl bg-[#f9ebe8] border border-[#f3d3cd] space-y-2">
        <label class="block text-xs font-bold text-[#902715]">
          {{ $t('communityReport.captchaLabel', { num1: captcha.num1, num2: captcha.num2 }) }}
        </label>
        <div class="flex items-center space-x-3">
          <input
            v-model="captcha.userResponse"
            type="number"
            required
            :placeholder="$t('communityReport.answer')"
            class="w-28 px-3.5 py-2 rounded-xl bg-white border border-[#E0E0E0] text-[#0A0A0A] text-xs font-bold focus:outline-none focus:border-[#902715]"
          />
          <button
            type="button"
            @click="generateCaptcha"
            class="text-xs text-[#902715] font-bold hover:underline"
          >
            {{ $t('communityReport.refreshChallenge') }}
          </button>
        </div>
        <p v-if="captchaError" class="text-xs text-[#902715] font-extrabold">
          {{ $t('communityReport.captchaError') }}
        </p>
      </div>

      <!-- Submission Success Banner -->
      <div v-if="submissionSuccess && submittedData" class="p-5 rounded-2xl bg-[#EEF2E6] border border-[#D8E2C7] text-xs space-y-2">
        <div class="flex items-center text-[#556B2F] font-expressive font-extrabold text-sm">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          {{ $t('communityReport.successMessage') }}
        </div>
        <div class="text-[#0A0A0A] space-y-1 text-xs font-medium">
          <p><strong>{{ $t('communityReport.barangay') }}:</strong> {{ submittedData.barangay }}</p>
          <p><strong>{{ $t('communityReport.aiCategory') }}:</strong> <span class="capitalize text-[#902715] font-bold">{{ submittedData.ai_category || $t('communityReport.triagePending') }}</span></p>
          <p><strong>{{ $t('communityReport.aiPriority') }}:</strong> <span class="capitalize text-[#D14D3E] font-bold">{{ submittedData.ai_priority || $t('communityReport.medium') }}</span></p>
          <p v-if="submittedData.ai_department"><strong>{{ $t('communityReport.targetDept') }}:</strong> {{ submittedData.ai_department }}</p>
        </div>
        <button
          type="button"
          @click="resetForm"
          class="mt-2 text-xs text-[#556B2F] hover:underline font-extrabold block"
        >
          {{ $t('communityReport.submitAnother') }}
        </button>
      </div>

      <!-- Submit Action Button -->
      <button
        type="submit"
        :disabled="reportStore.isSubmitting || !form.raw_description || !captcha.userResponse"
        class="w-full py-4 rounded-2xl bg-[#902715] hover:bg-[#781f11] disabled:opacity-50 text-[#F7FB41] font-expressive font-black text-base tracking-wide transition-all shadow-m3-md active:scale-95 border border-[#F7FB41]"
      >
        {{ reportStore.isSubmitting ? $t('communityReport.submitting') : $t('communityReport.submitReport') }}
      </button>
    </form>

    <!-- Soft Throttle Nag Modal -->
    <div v-if="showNagModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="max-w-sm w-full p-6 rounded-3xl bg-white border border-[#E0E0E0] shadow-m3-lg space-y-4">
        <div class="flex items-center space-x-2 text-[#902715]">
          <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <h3 class="font-expressive font-extrabold text-base text-[#0A0A0A]">{{ $t('communityReport.nagTitle') }}</h3>
        </div>

        <p class="text-xs text-[#717171] leading-relaxed font-medium">
          {{ $t('communityReport.nagMessage', { seconds: secondsRemaining }) }}
        </p>

        <div class="flex items-center justify-end space-x-2 pt-2">
          <button
            type="button"
            @click="showNagModal = false"
            class="px-4 py-2 rounded-full bg-[#EBEBEB] hover:bg-[#E0E0E0] text-[#0A0A0A] text-xs font-bold"
          >
            {{ $t('communityReport.cancel') }}
          </button>
          <button
            type="button"
            @click="executeSubmission"
            class="px-4 py-2 rounded-full bg-[#902715] hover:bg-[#781f11] text-[#F7FB41] text-xs font-bold shadow-m3-sm"
          >
            {{ $t('communityReport.proceed') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useReportStore } from '@/stores/reportStore'
import { useCommunityReport } from '@/composables/useCommunityReport'

const reportStore = useReportStore()
const {
  form,
  captcha,
  captchaError,
  showNagModal,
  secondsRemaining,
  submissionSuccess,
  submittedData,
  barangays,
  generateCaptcha,
  handleInitialSubmit,
  executeSubmission,
  resetForm
} = useCommunityReport()
</script>
