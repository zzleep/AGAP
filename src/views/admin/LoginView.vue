<template>
  <div class="min-h-[80vh] flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
      <div class="text-center space-y-2">
        <div class="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center font-black text-white text-2xl mx-auto shadow-lg shadow-red-950">
          A
        </div>
        <h2 class="text-2xl font-bold text-white tracking-tight">Operator Portal</h2>
        <p class="text-xs text-slate-400">Sign in to access Santa Rosa CDRRMO emergency dispatch</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Operator Email</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="operator@santarosa.gov.ph"
            class="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
        </div>

        <div v-if="errorMessage" class="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-400 text-xs">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          :disabled="auth.isLoading"
          class="w-full py-3 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-950/50 transition-colors"
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
