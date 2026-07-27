<template>
  <div class="space-y-6">
    <div>
      <h2 class="font-expressive text-3xl font-black text-[#1F3A4B] tracking-tight">Hotspot & Incident Density Map</h2>
      <p class="text-xs text-[#902715] font-extrabold uppercase tracking-wider mt-0.5">Spatial incident density aggregation across Santa Rosa barangays</p>
    </div>

    <HotspotMap />
  </div>
</template>

<script setup>
import HotspotMap from '@/components/HotspotMap.vue'
</script>

