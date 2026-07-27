<template>
  <div class="min-h-screen relative flex overflow-hidden">
    <img src="/bg.png" class="absolute inset-0 w-full h-full object-cover" alt="Background" />

    <div class="absolute inset-0 bg-[#EEF4FB]/30 pointer-events-none"></div>

    <div class="hidden lg:flex lg:w-1/2 relative z-10 flex-col px-12 xl:px-16 py-12 h-screen">

      <div class="flex items-center gap-2 flex-shrink-0">
        <div class="flex items-center">
          <img src="/location_pin.svg" class="h-10" alt="AGAP" />
        </div>
        <h1 class="text-2xl font-black text-[#1F3A4B] tracking-tight drop-shadow-sm">Santa Rosa, Laguna</h1>
      </div>

      <div class="mt-4 flex-shrink-0">
        <p class="text-[#1F3A4B]/90 text-lg leading-snug max-w-[280px] drop-shadow-sm">
          Advance Guidance & Assistance Platform
        </p>
        <div class="mt-4 w-12 h-1 bg-[#902715] rounded-full"></div>
      </div>

      <div class="flex-1"></div>

      <img src="/arkosta.png" class="absolute
         -bottom-20
         left-[500px]
         -translate-x-1/3
         w-full
         max-w-[900px]
         pointer-events-none
         select-none
         drop-shadow-[0_40px_60px_rgba(0,0,0,.2)]" alt="Santa Rosa Arch" />
    </div>

    <!-- Login -->
    <div class="flex-1 flex items-center justify-center p-6 sm:p-8 relative z-10 h-screen">

      <div class="w-full max-w-[460px]">

        <!-- Login Card -->
        <div class="bg-white
             rounded-tl-[48px]
             rounded-tr-[24px]
             rounded-br-[48px]
             rounded-bl-[24px]
             border border-[#EEF2F6]
             shadow-[0_25px_60px_rgba(31,58,75,.12)]
             px-10 py-12">

          <div class="text-center">

            <div class="mx-auto w-48 h-48
                 flex items-center justify-center
                 ">

              <img src="/agap icon.svg" class="h-46" alt="AGAP" />

            </div>

            <h2 class="mt-5 text-[42px] leading-none
                 font-black tracking-tight
                 text-[#1F3A4B]">
              Operator Portal

            </h2>

            <p class="mt-2 text-[14px]
                 font-bold uppercase
                 tracking-wide
                 text-[#A5361E]">

              Santa Rosa City CDRRMO Emergency Dispatch

            </p>

          </div>

          <!-- Form -->
          <form @submit.prevent="handleLogin" class="mt-10 space-y-6">

            <div>

              <label class="block mb-2
                   text-[14px]
                   font-extrabold
                   uppercase
                   tracking-wide
                   text-[#1F3A4B]">
                Operator Email

              </label>

              <input v-model="email" type="email" required placeholder="operator@santarosa.gov.ph" class="w-full
                   h-14
                   rounded-[18px]
                   border border-[#C8D5E5]
                   bg-[#EAF2FB]
                   px-5
                   text-[#1F3A4B]
                   placeholder:text-[#587089]
                   outline-none
                   transition
                   focus:border-[#1F3A4B]
                   focus:ring-2
                   focus:ring-[#1F3A4B]/10" />

            </div>

            <div>

              <label class="block mb-2
                   text-[14px]
                   font-extrabold
                   uppercase
                   tracking-wide
                   text-[#1F3A4B]">
                Password

              </label>

              <div class="relative">

                <input v-model="password" :type="showPassword ? 'text' : 'password'" required placeholder="••••••••••"
                  class="w-full
                     h-14
                     rounded-[18px]
                     border border-[#C8D5E5]
                     bg-[#EAF2FB]
                     px-5
                     pr-14
                     text-[#1F3A4B]
                     outline-none
                     transition
                     focus:border-[#1F3A4B]
                     focus:ring-2
                     focus:ring-[#1F3A4B]/10" />

                <button type="button" @click="showPassword = !showPassword"
                  class="absolute right-5 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#1F3A4B] transition">

                  <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />

                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />

                  </svg>

                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />

                  </svg>

                </button>

              </div>

            </div>

            <div v-if="errorMessage" class="rounded-xl
                 border border-red-200
                 bg-red-50
                 px-4 py-3
                 text-sm text-red-600">

              {{ errorMessage }}

            </div>

            <button type="submit" :disabled="auth.isLoading" class="mt-2
                 w-full
                 h-14
                 rounded-full
                 bg-[#223F54]
                 hover:bg-[#1C3446]
                 text-white
                 font-extrabold
                 tracking-wide
                 shadow-[0_12px_25px_rgba(34,63,84,.25)]
                 transition-all
                 active:scale-[0.98]
                 disabled:opacity-70">

              {{ auth.isLoading ? 'Authenticating...' : 'SIGN IN TO DISPATCH' }}

            </button>

          </form>

        </div>

      </div>

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
const showPassword = ref(false)
const rememberMe = ref(false)

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