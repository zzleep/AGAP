<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-xl font-bold text-white">Hotspot & Incident Density Map</h2>
      <p class="text-xs text-slate-400">Spatial incident density aggregation across Santa Rosa barangays</p>
    </div>

    <HotspotMap />
  </div>
</template>

<script setup>
import HotspotMap from '@/components/HotspotMap.vue'
</script>

