<template>
  <Transition name="slide-up">
    <div
      v-if="needRefresh && !dismissed"
      class="fixed bottom-0 left-0 right-0 z-[9998] p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <!-- Glass card container -->
      <div
        class="relative w-full max-w-lg mx-auto bg-white/95 backdrop-blur-2xl rounded-2xl border border-black/5 shadow-m3-lg overflow-hidden pointer-events-auto"
      >
        <!-- Brand red accent bar at top of card -->
        <div class="h-1.5 w-full bg-gradient-to-r from-sr-brandy via-sr-brandy-light to-sr-brandy" />

        <div class="px-5 pt-4 pb-5">
          <!-- Header row: icon + title -->
          <div class="flex items-start gap-3.5">
            <!-- Pulse dot -->
            <span
              class="relative mt-0.5 w-3.5 h-3.5 rounded-full bg-sr-brandy shrink-0"
            >
              <span
                class="absolute inset-0 rounded-full bg-sr-brandy animate-ping opacity-30"
              />
              <span
                class="absolute inset-0.5 rounded-full bg-sr-brandy"
              />
            </span>

            <!-- Title -->
            <div class="flex-1 min-w-0">
              <p class="font-expressive font-bold text-base text-sr-onyx tracking-tight">
                {{ t('update.available', 'A new version is available') }}
              </p>
              <p class="text-sm text-sr-onyx-subtle mt-1.5 leading-relaxed">
                {{ t('update.description', 'A new version of AGAP is ready. Update to get the latest features and improvements.') }}
              </p>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center justify-end gap-3 mt-5">
            <button
              type="button"
              @click="dismissed = true"
              class="text-sr-onyx-subtle hover:text-sr-onyx text-sm font-semibold underline underline-offset-2 decoration-sr-onyx-subtle/30 hover:decoration-sr-onyx/50 transition-all px-2 py-1.5"
            >
              {{ t('connectivity.dismiss', 'Dismiss') }}
            </button>

            <button
              type="button"
              @click="updateServiceWorker()"
              class="inline-flex items-center gap-2 bg-sr-brandy text-sr-canary text-sm font-bold px-5 py-3 rounded-xl hover:bg-sr-brandy-hover active:bg-sr-brandy-light active:scale-[0.97] transition-all shadow-md hover:shadow-lg hover:shadow-sr-brandy/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sr-brandy focus-visible:ring-offset-2"
            >
              <!-- Refresh icon -->
              <svg
                class="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15.29-6.29L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15.29 6.29L3 16" />
              </svg>
              {{ t('update.refresh', 'Update') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUpdatePrompt } from '@/composables/useUpdatePrompt'

const { t } = useI18n()
const { needRefresh, updateServiceWorker } = useUpdatePrompt()
const dismissed = ref(false)
</script>

<style scoped>
/* ── Slide-up transition (bottom sheet) ── */
.slide-up-enter-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.3s ease-out;
}
.slide-up-leave-active {
  transition: transform 0.25s ease-in,
              opacity 0.2s ease-in;
}
.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
