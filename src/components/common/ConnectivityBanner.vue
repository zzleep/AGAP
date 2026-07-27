<template>
  <div
    v-if="connectivity.mode !== 'online' || showWhenOnline"
    :class="[
      'w-full py-2 px-4 text-xs md:text-sm font-medium flex items-center justify-between transition-colors duration-300 shadow-md border-b border-white/10 z-50',
      connectivity.bannerConfig.bgClass
    ]"
    role="status"
    aria-live="polite"
  >
    <div class="flex items-center space-x-2 container mx-auto">
      <span class="inline-block w-2.5 h-2.5 rounded-full animate-pulse bg-white"></span>
      <span class="font-bold uppercase tracking-wider">{{ connectivity.bannerConfig.label }}:</span>
      <span>{{ connectivity.bannerConfig.message }}</span>
    </div>
    <button
      v-if="connectivity.mode === 'online'"
      @click="showWhenOnline = false"
      class="text-white/80 hover:text-white ml-2 text-xs font-semibold underline shrink-0"
    >
      Dismiss
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useConnectivityStore } from '@/stores/connectivityStore'

const connectivity = useConnectivityStore()
const showWhenOnline = ref(false)

onMounted(() => {
  connectivity.initListeners()
})

onUnmounted(() => {
  connectivity.destroyListeners()
})
</script>
