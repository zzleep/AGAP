<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-xl font-bold text-white">Community Incident Report</h2>
      <p class="text-xs text-slate-400">100% Anonymous reporting with automated Gemini 2.0 AI triage</p>
    </div>

    <!-- Anonymity Notice Banner -->
    <div class="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 flex items-start space-x-2">
      <svg class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
      <div>
        <span class="font-bold text-white block">App-Layer Anonymity Protected</span>
        No user account or device GPS coordinates required. Your privacy is guaranteed.
      </div>
    </div>

    <!-- Main Report Form -->
    <form @submit.prevent="handleInitialSubmit" class="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-4 shadow-md">
      <!-- Barangay Dropdown -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Select Barangay Location</label>
        <select
          v-model="form.barangay"
          class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
        >
          <option v-for="b in barangays" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>

      <!-- Incident Description -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Incident Description</label>
        <textarea
          v-model="form.raw_description"
          rows="4"
          required
          placeholder="Describe the incident (e.g. submerged road on creek bridge, fallen tree touching powerlines, clogged main canal)..."
          class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500"
        ></textarea>
      </div>

      <!-- Math CAPTCHA Verification -->
      <div class="p-3 rounded-lg bg-slate-900/80 border border-slate-700 space-y-2">
        <label class="block text-xs font-semibold text-slate-300">
          Bot Defense Verification: What is <span class="text-blue-400 font-bold">{{ captcha.num1 }} + {{ captcha.num2 }}</span>?
        </label>
        <div class="flex items-center space-x-2">
          <input
            v-model="captcha.userResponse"
            type="number"
            required
            placeholder="Answer"
            class="w-28 px-3 py-1.5 rounded bg-slate-800 border border-slate-600 text-white text-xs focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            @click="generateCaptcha"
            class="text-[11px] text-slate-400 hover:text-slate-200 underline"
          >
            Refresh Math Challenge
          </button>
        </div>
        <p v-if="captchaError" class="text-[11px] text-red-400 font-semibold">
          Incorrect answer. Please solve the math challenge to verify human submission.
        </p>
      </div>

      <!-- Submission Success Banner -->
      <div v-if="submissionSuccess && submittedData" class="p-4 rounded-xl bg-emerald-950/70 border border-emerald-700 text-xs space-y-2">
        <div class="flex items-center text-emerald-400 font-bold text-sm">
          <svg class="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          Community Incident Report Dispatched!
        </div>
        <div class="text-slate-300 space-y-1 text-[11px]">
          <p><strong>Barangay:</strong> {{ submittedData.barangay }}</p>
          <p><strong>AI Category:</strong> <span class="capitalize text-blue-300 font-semibold">{{ submittedData.ai_category || 'triage pending' }}</span></p>
          <p><strong>AI Priority:</strong> <span class="capitalize text-amber-300 font-semibold">{{ submittedData.ai_priority || 'medium' }}</span></p>
          <p v-if="submittedData.ai_department"><strong>Target Dept:</strong> {{ submittedData.ai_department }}</p>
        </div>
        <button
          type="button"
          @click="resetForm"
          class="mt-2 text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold"
        >
          Submit Another Anonymous Incident
        </button>
      </div>

      <!-- Submit Action Button -->
      <button
        type="submit"
        :disabled="reportStore.isSubmitting || !form.raw_description || !captcha.userResponse"
        class="w-full py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm transition-colors shadow-lg"
      >
        {{ reportStore.isSubmitting ? 'Submitting Incident & Processing AI Triage...' : 'Submit Anonymous Report' }}
      </button>
    </form>

    <!-- Soft Throttle Nag Modal (Bypassable Rate Limit) -->
    <div v-if="showNagModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="max-w-sm w-full p-5 rounded-xl bg-slate-800 border border-amber-500/50 shadow-2xl space-y-4">
        <div class="flex items-center space-x-2 text-amber-400">
          <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <h3 class="font-bold text-base text-white">Frequent Submission Notice</h3>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">
          You submitted a community report less than 30 seconds ago. To prevent accidental duplicate reports, please verify your submission. Cooldown remaining: <span class="font-bold text-amber-400">{{ secondsRemaining }}s</span>.
        </p>

        <div class="flex items-center justify-end space-x-2 pt-2">
          <button
            type="button"
            @click="showNagModal = false"
            class="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="executeSubmission"
            class="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow"
          >
            Proceed & Submit Anyway
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
