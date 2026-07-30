<template>
  <Transition name="slide-down">
    <div
      v-if="needRefresh && !dismissed"
      class="fixed top-0 left-0 right-0 z-[9998] px-4 py-3 flex items-center gap-3 bg-white/90 backdrop-blur-md border-b border-black/10 shadow-m3-sm pt-[env(safe-area-inset-top,0px)]"
      role="status"
      aria-live="polite"
    >
      <!-- Icon dot -->
      <span class="inline-block w-2.5 h-2.5 rounded-full bg-sr-brandy animate-pulse shrink-0" />

      <!-- Message -->
      <p class="flex-1 text-sm font-medium text-sr-onyx">
        {{ t('update.available', 'A new version is available') }}
      </p>

      <!-- Actions -->
      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          @click="dismissed = true"
          class="text-sr-onyx-subtle hover:text-sr-onyx text-xs font-semibold underline transition-colors"
        >
          {{ t('connectivity.dismiss', 'Dismiss') }}
        </button>
        <button
          type="button"
          @click="updateServiceWorker()"
          class="bg-sr-brandy text-sr-canary text-xs font-bold px-3 py-1.5 rounded-md hover:bg-sr-brandy-hover active:bg-sr-brandy-light transition-colors shadow-sm"
        >
          {{ t('update.refresh', 'Update') }}
        </button>
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
.slide-down-enter-active {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.25s ease-out;
}
.slide-down-leave-active {
  transition: transform 0.25s ease-in,
              opacity 0.2s ease-in;
}
.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
