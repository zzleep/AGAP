<template>
  <div class="min-h-[85vh] flex items-center justify-center p-4 bg-[#EEF4FB]">
    <div class="w-full max-w-md bg-white border border-[#1F3A4B]/10 rounded-[3rem_1.5rem_3rem_1.5rem] p-8 md:p-10 shadow-[0_16px_40px_rgba(31,58,75,0.1)] space-y-6 relative overflow-hidden">
      <!-- Soft Pastel Accent Backdrop -->
      <div class="absolute -top-12 -right-12 w-40 h-40 bg-[#FDE8E5] rounded-full blur-2xl pointer-events-none"></div>
      
      <div class="text-center space-y-3 relative z-10">
        <div class="w-16 h-16 rounded-3xl bg-[#902715] mx-auto flex items-center justify-center p-2.5 shadow-[0_8px_20px_rgba(144,39,21,0.3)]">
          <img src="/agap icon.svg" alt="AGAP Logo" class="h-full w-auto object-contain filter brightness-200" />
        </div>
        <div>
          <h2 class="font-expressive text-3xl font-black text-[#1F3A4B] tracking-tight">Operator Portal</h2>
          <p class="text-xs text-[#902715] mt-1 font-extrabold uppercase tracking-wider">Santa Rosa City CDRRMO Emergency Dispatch</p>
        </div>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4 relative z-10">
        <div>
          <label class="block text-xs font-black text-[#1F3A4B] uppercase tracking-wider mb-2">Operator Email</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="operator@santarosa.gov.ph"
            class="w-full px-4 py-3.5 rounded-2xl bg-[#EBF2FA] border border-[#1F3A4B]/15 text-[#1F3A4B] text-sm focus:outline-none focus:border-[#1F3A4B] focus:ring-2 focus:ring-[#1F3A4B]/20 placeholder-[#717171] transition-all font-semibold"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-[#1F3A4B] uppercase tracking-wider mb-2">Password</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-3.5 rounded-2xl bg-[#EBF2FA] border border-[#1F3A4B]/15 text-[#1F3A4B] text-sm focus:outline-none focus:border-[#1F3A4B] focus:ring-2 focus:ring-[#1F3A4B]/20 placeholder-[#717171] transition-all font-semibold"
          />
        </div>

        <div v-if="errorMessage" class="p-4 rounded-2xl bg-[#FDE8E5] border border-[#D14D3E]/30 text-[#D14D3E] text-xs font-bold flex items-center space-x-2.5">
          <svg class="w-5 h-5 shrink-0 text-[#D14D3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <button
          type="submit"
          :disabled="auth.isLoading"
          class="w-full py-4 rounded-full bg-[#1F3A4B] hover:bg-[#152a37] disabled:opacity-50 text-white font-black text-sm tracking-wider uppercase shadow-[0_8px_20px_rgba(31,58,75,0.25)] active:scale-[0.98] transition-all duration-200"
        >
          {{ auth.isLoading ? 'Authenticating...' : 'Sign In to Dispatch' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('operator@santarosa.gov.ph')
const password = ref('password123')
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''
  const result = await auth.login(email.value, password.value)
  if (result.success) {
    const redirectPath = route.query.redirect || '/admin/sos-feed'
    router.push(redirectPath)
  } else {
    errorMessage.value = result.error || 'Failed to authenticate operator.'
  }
}
</script>
