<template>
  <svg 
    class="w-6 h-6" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    :aria-hidden="ariaHidden"
  >
    <path 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      stroke-width="2.3" 
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    />
    <circle cx="12" cy="13" r="3" stroke-width="2.3"/>
    <circle cx="12" cy="13" r="1" fill="currentColor"/>
  </svg>
</template>

<script setup>
defineProps({
  ariaHidden: {
    type: String,
    default: 'true'
  }
})
</script>
