<template>
  <div class="h-full w-full bg-slate-900 text-slate-100 selection:bg-blue-600 selection:text-white">
    <UpdateBanner />
    <router-view />
  </div>
</template>

<script setup>
import UpdateBanner from '@/components/common/UpdateBanner.vue'
</script>
