<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      @click.self="close"
    >
      <div class="max-w-md w-full rounded-3xl bg-white border border-[#E0E0E0] shadow-2xl overflow-hidden space-y-4 p-6 font-sans">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-11 h-11 rounded-2xl bg-[#902715]/10 text-[#902715] flex items-center justify-center shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <div>
              <h3 class="font-expressive font-black text-lg text-[#0A0A0A] tracking-tight">How to Enable Location</h3>
              <p class="text-xs font-semibold text-[#717171]">Browser settings guide</p>
            </div>
          </div>
          <button @click="close" class="p-2 rounded-full hover:bg-gray-100 text-[#717171] hover:text-[#0A0A0A] transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <p class="text-xs text-[#0A0A0A] leading-relaxed font-medium">
          Location access was blocked in your browser settings. To enable GPS for emergency dispatch and evacuation maps, follow these quick steps:
        </p>

        <!-- OS / Browser Switcher Tabs -->
        <div class="grid grid-cols-2 gap-2 bg-[#F5F5F5] p-1 rounded-2xl border border-black/5">
          <button
            type="button"
            @click="activeTab = 'chrome'"
            :class="[
              'py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5',
              activeTab === 'chrome' ? 'bg-white text-[#902715] shadow-xs font-black' : 'text-[#717171] hover:text-[#0A0A0A]'
            ]"
          >
            <span>🌐 Chrome / Android</span>
          </button>
          <button
            type="button"
            @click="activeTab = 'safari'"
            :class="[
              'py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5',
              activeTab === 'safari' ? 'bg-white text-[#902715] shadow-xs font-black' : 'text-[#717171] hover:text-[#0A0A0A]'
            ]"
          >
            <span>🍏 Safari / iOS</span>
          </button>
        </div>

        <!-- Chrome / Android Steps -->
        <div v-if="activeTab === 'chrome'" class="space-y-3 p-4 rounded-2xl bg-[#F8F9FA] border border-[#E0E0E0] text-xs">
          <div class="flex items-start space-x-3">
            <span class="w-5 h-5 rounded-full bg-[#902715] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
            <p class="text-[#0A0A0A] font-medium">
              Tap the <strong>Tune / Lock icon (🔒 or 🎛️)</strong> next to the web address at the top of your browser.
            </p>
          </div>
          <div class="flex items-start space-x-3">
            <span class="w-5 h-5 rounded-full bg-[#902715] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
            <p class="text-[#0A0A0A] font-medium">
              Tap <strong>Permissions</strong> or <strong>Site Settings</strong>.
            </p>
          </div>
          <div class="flex items-start space-x-3">
            <span class="w-5 h-5 rounded-full bg-[#902715] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
            <p class="text-[#0A0A0A] font-medium">
              Switch <strong>Location</strong> from <em>Block</em> to <strong>Allow</strong>.
            </p>
          </div>
        </div>

        <!-- Safari / iOS Steps -->
        <div v-else class="space-y-3 p-4 rounded-2xl bg-[#F8F9FA] border border-[#E0E0E0] text-xs">
          <div class="flex items-start space-x-3">
            <span class="w-5 h-5 rounded-full bg-[#902715] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
            <p class="text-[#0A0A0A] font-medium">
              Tap the <strong>"aA" or Page Settings icon</strong> on the left side of the Safari address bar.
            </p>
          </div>
          <div class="flex items-start space-x-3">
            <span class="w-5 h-5 rounded-full bg-[#902715] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
            <p class="text-[#0A0A0A] font-medium">
              Select <strong>Website Settings</strong>.
            </p>
          </div>
          <div class="flex items-start space-x-3">
            <span class="w-5 h-5 rounded-full bg-[#902715] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
            <p class="text-[#0A0A0A] font-medium">
              Change <strong>Location</strong> permission to <strong>Allow</strong>.
            </p>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="pt-2 flex items-center justify-end space-x-2">
          <button
            type="button"
            @click="close"
            class="px-4 py-2.5 rounded-2xl bg-[#EBEBEB] hover:bg-[#E0E0E0] text-[#0A0A0A] text-xs font-extrabold transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            @click="onRetry"
            class="px-5 py-2.5 rounded-2xl bg-[#902715] hover:bg-[#781f11] text-[#F7FB41] text-xs font-black uppercase tracking-wider shadow-m3-sm active:scale-95 transition-all"
          >
            Re-test GPS Location
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'retry'])

const activeTab = ref('chrome')

function close() {
  emit('close')
}

function onRetry() {
  emit('retry')
  emit('close')
}
</script>
