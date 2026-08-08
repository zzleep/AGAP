<template>
  <div class="space-y-4">
    <!-- Header Card -->
    <div class="p-5 rounded-3xl bg-white border border-[#E0E0E0] shadow-m3-sm space-y-1">
      <h2 class="font-expressive font-black text-2xl text-[#0A0A0A] tracking-tight">{{ $t('communityReport.title') }}</h2>
      <p class="text-xs font-medium text-[#717171]">{{ $t('communityReport.description') }}</p>
    </div>

    <!-- Anonymity Notice Banner -->
    <div class="p-4 rounded-3xl bg-[#EEF2E6] border border-[#D8E2C7] text-xs text-[#556B2F] flex items-start space-x-3 shadow-m3-sm">
      <svg class="w-5 h-5 text-[#556B2F] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
      <div class="space-y-0.5">
        <span class="font-expressive font-extrabold text-[#0A0A0A] block text-xs">{{ $t('communityReport.anonymityTitle') }}</span>
        <p class="font-medium text-[#556B2F] leading-relaxed">{{ $t('communityReport.anonymityDescription') }}</p>
      </div>
    </div>

    <!-- Main Report Form -->
    <form @submit.prevent="handleInitialSubmit" class="p-6 rounded-3xl bg-white border border-[#E0E0E0] space-y-5 shadow-m3-sm">
      <!-- Barangay Dropdown -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold uppercase tracking-wider text-[#902715]">{{ $t('communityReport.selectBarangay') }}</label>
        <select
          v-model="form.barangay"
          class="w-full px-4 py-3 rounded-2xl bg-[#F5F5F5] border border-[#E0E0E0] text-[#0A0A0A] text-xs font-semibold focus:outline-none focus:border-[#902715]"
        >
          <option v-for="b in barangays" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>

      <!-- Incident Description -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold uppercase tracking-wider text-[#902715]">{{ $t('communityReport.incidentDescription') }}</label>
        <textarea
          v-model="form.raw_description"
          rows="4"
          required
          :placeholder="$t('communityReport.descriptionPlaceholder')"
          class="w-full px-4 py-3 rounded-2xl bg-[#F5F5F5] border border-[#E0E0E0] text-[#0A0A0A] text-xs font-medium focus:outline-none focus:border-[#902715] placeholder-[#717171]"
        ></textarea>
      </div>

      <!-- Incident Photo Attachment Section -->
      <div class="space-y-3 p-4 rounded-3xl bg-[#F8F9FA] border border-[#E0E0E0]">
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <label class="block text-xs font-semibold text-[#1F3A4B]">
              Attach Incident Photo
            </label>
            <span class="block text-[10px] text-[#717171] font-normal">(camera only)</span>
          </div>
          <span v-if="form.image_url" class="px-2.5 py-0.5 rounded-full bg-[#183F07] text-[#F7FB41] text-[10px] font-black uppercase tracking-wider flex items-center shadow-m3-xs">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            Photo Attached
          </span>
        </div>

        <!-- Hidden Native File Input forced to Camera using capture="environment" -->
        <input
          type="file"
          ref="fileInputRef"
          accept="image/*"
          capture="environment"
          @change="handleNativeCameraCapture"
          class="hidden"
        />

        <!-- Photo Preview Box (If Photo Captured) -->
        <div v-if="form.image_url" class="relative rounded-2xl overflow-hidden border border-[#E0E0E0] bg-slate-900 group">
          <img :src="form.image_url" alt="Captured incident photo" class="w-full h-48 object-cover" />
          <div class="absolute inset-0 bg-black/50 flex items-center justify-center space-x-3 opacity-95 transition-opacity p-4">
            <button
              type="button"
              @click="triggerCameraInput"
              class="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F5F5F5] text-[#0A0A0A] text-xs font-extrabold shadow-m3-sm flex items-center space-x-2 active:scale-95"
            >
              <svg class="w-4 h-4 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3" stroke-width="2"/></svg>
              <span>Retake</span>
            </button>
            <button
              type="button"
              @click="removeCapturedPhoto"
              class="px-4 py-2.5 rounded-2xl bg-[#902715] hover:bg-[#781f11] text-[#F7FB41] text-xs font-extrabold shadow-m3-sm flex items-center space-x-2 active:scale-95"
            >
              <svg class="w-4 h-4 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>Remove</span>
            </button>
          </div>
        </div>

        <!-- Material 3 Expressive Square Camera Action Buttons (If No Photo Yet) -->
        <div v-else class="grid grid-cols-2 gap-3 pt-1">
          <!-- 1. Live Camera Viewfinder (Square Expressive Tile) -->
          <button
            type="button"
            @click="startLiveCamera"
            class="group flex flex-col items-center justify-center p-4 rounded-3xl bg-[#1F3A4B] hover:bg-[#182e3b] text-white shadow-m3-sm transition-all active:scale-95 border border-white/10 space-y-2.5 text-center min-h-[110px]"
            aria-label="Open live camera viewfinder to capture photo in real-time"
            title="Open live camera viewfinder"
          >
            <div class="w-11 h-11 rounded-2xl bg-[#F7FB41] text-[#1F3A4B] flex items-center justify-center shadow-m3-xs group-hover:scale-105 transition-transform">
              <CameraIcon />
            </div>
            <span class="font-expressive text-xs font-black tracking-tight text-white leading-tight">
              Live Viewfinder
            </span>
          </button>

          <!-- 2. Attach Photo from Device (Square Expressive Tile) -->
          <button
            type="button"
            @click="triggerCameraInput"
            class="group flex flex-col items-center justify-center p-4 rounded-3xl bg-[#902715] hover:bg-[#7a2012] text-white shadow-m3-sm transition-all active:scale-95 border border-white/10 space-y-2.5 text-center min-h-[110px]"
            aria-label="Attach an existing photo from your device gallery or camera roll"
            title="Attach photo from device"
          >
            <div class="w-11 h-11 rounded-2xl bg-[#F7FB41] text-[#902715] flex items-center justify-center shadow-m3-xs group-hover:scale-105 transition-transform">
              <GalleryIcon />
            </div>
            <span class="font-expressive text-xs font-black tracking-tight text-white leading-tight">
              Attach Photo from Device
            </span>
          </button>
        </div>

        <p class="text-[11px] text-[#555555] font-semibold leading-tight pt-1">
          Attaching a photo helps CDRRMO verify and dispatch response faster.
        </p>
      </div>

      <!-- Submission Success Banner -->
      <div v-if="submissionSuccess && submittedData" class="p-5 rounded-3xl bg-[#EEF2E6] border border-[#D8E2C7] text-xs space-y-2.5">
        <div class="flex items-center text-[#183F07] font-expressive font-extrabold text-sm">
          <svg class="w-5 h-5 mr-2 text-[#183F07]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          {{ $t('communityReport.successMessage') }}
        </div>
        <div class="text-[#0A0A0A] space-y-1 text-xs font-medium">
          <p><strong>{{ $t('communityReport.barangay') }}:</strong> {{ submittedData.barangay }}</p>
          <p><strong>{{ $t('communityReport.aiCategory') }}:</strong> <span class="capitalize text-[#902715] font-bold">{{ submittedData.ai_category || $t('communityReport.triagePending') }}</span></p>
          <p><strong>{{ $t('communityReport.aiPriority') }}:</strong> <span class="capitalize text-[#D14D3E] font-bold">{{ submittedData.ai_priority || $t('communityReport.medium') }}</span></p>
          <p v-if="submittedData.ai_department"><strong>{{ $t('communityReport.targetDept') }}:</strong> {{ submittedData.ai_department }}</p>
          <div v-if="submittedData.image_url" class="mt-2 pt-2 border-t border-[#D8E2C7]">
            <p class="text-[11px] font-bold text-[#183F07] mb-1">Attached Camera Photo:</p>
            <img :src="submittedData.image_url" alt="Attached photo" class="w-24 h-24 object-cover rounded-xl border border-[#D8E2C7]" />
          </div>
        </div>
        <button
          type="button"
          @click="resetForm"
          class="mt-2 text-xs text-[#183F07] hover:underline font-black block uppercase tracking-wider"
        >
          {{ $t('communityReport.submitAnother') }}
        </button>
      </div>

      <!-- High-Impact Material 3 Expressive Action Pill Submit Button -->
      <button
        type="submit"
        :disabled="reportStore.isSubmitting || !form.raw_description"
        class="w-full py-4 px-6 rounded-full bg-[#902715] hover:bg-[#781f11] disabled:opacity-50 text-[#F7FB41] font-expressive font-black text-sm tracking-wider uppercase transition-all shadow-m3-md hover:shadow-m3-lg active:scale-95 flex items-center justify-center gap-3"
      >
        <div class="w-8 h-8 rounded-full bg-[#F7FB41] text-[#902715] flex items-center justify-center shrink-0 shadow-m3-xs">
          <!-- Incognito Disguise Icon (Hat + Glasses) -->
          <svg class="w-4.5 h-4.5 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 13h18M5 13l1.5-6a2 2 0 011.9-1.5h7.2a2 2 0 011.9 1.5L19 13M8 19.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm8 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm-5.5-2.5h3"/>
          </svg>
        </div>
        <span>{{ reportStore.isSubmitting ? $t('communityReport.submitting') : $t('communityReport.submitReport') }}</span>
      </button>
    </form>

    <!-- HTML5 Live Camera View Finder Modal -->
    <div v-if="showLiveCameraModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div class="max-w-md w-full p-5 rounded-3xl bg-slate-900 border border-slate-700 space-y-4 text-white shadow-2xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
            <h3 class="font-expressive font-bold text-sm">Live Camera Viewfinder</h3>
          </div>
          <button type="button" @click="stopLiveCamera" class="text-slate-400 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Camera Video Feed Container -->
        <div class="relative w-full h-64 rounded-2xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
          <video ref="videoEl" autoplay playsinline class="w-full h-full object-cover"></video>
          <div v-if="cameraError" class="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center space-y-2">
            <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <p class="text-xs text-red-300 font-semibold">{{ cameraError }}</p>
            <button type="button" @click="triggerCameraInput" class="px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white">Use Device Camera App</button>
          </div>
        </div>

        <div class="flex items-center justify-between pt-1">
          <button type="button" @click="stopLiveCamera" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold">Cancel</button>
          <button
            type="button"
            @click="snapLivePhoto"
            :disabled="!!cameraError"
            class="px-5 py-2.5 rounded-xl bg-[#902715] hover:bg-[#781f11] disabled:opacity-50 text-[#F7FB41] text-xs font-extrabold flex items-center space-x-2 shadow-lg active:scale-95"
          >
            <svg class="w-4 h-4 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3" stroke-width="2.5"/></svg>
            <span>SNAP PHOTO</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Soft Throttle Nag Modal -->
    <div v-if="showNagModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="max-w-sm w-full p-6 rounded-3xl bg-white border border-[#E0E0E0] shadow-m3-lg space-y-4">
        <div class="flex items-center space-x-2 text-[#902715]">
          <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <h3 class="font-expressive font-extrabold text-base text-[#0A0A0A]">{{ $t('communityReport.nagTitle') }}</h3>
        </div>

        <p class="text-xs text-[#717171] leading-relaxed font-medium">
          {{ $t('communityReport.nagMessage', { seconds: secondsRemaining }) }}
        </p>

        <div class="flex items-center justify-end space-x-2 pt-2">
          <button
            type="button"
            @click="showNagModal = false"
            class="px-4 py-2 rounded-full bg-[#EBEBEB] hover:bg-[#E0E0E0] text-[#0A0A0A] text-xs font-bold"
          >
            {{ $t('communityReport.cancel') }}
          </button>
          <button
            type="button"
            @click="executeSubmission"
            class="px-4 py-2 rounded-full bg-[#902715] hover:bg-[#781f11] text-[#F7FB41] text-xs font-bold shadow-m3-sm"
          >
            {{ $t('communityReport.proceed') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, nextTick } from 'vue'
import { useReportStore } from '@/stores/reportStore'
import { useCommunityReport } from '@/composables/useCommunityReport'
import CameraIcon from '@/components/common/CameraIcon.vue'
import GalleryIcon from '@/components/common/GalleryIcon.vue'

const reportStore = useReportStore()
const {
  form,
  showNagModal,
  secondsRemaining,
  submissionSuccess,
  submittedData,
  barangays,
  handleInitialSubmit,
  executeSubmission,
  resetForm
} = useCommunityReport()

// Camera state & media stream handlers
const fileInputRef = ref(null)
const videoEl = ref(null)
const showLiveCameraModal = ref(false)
const cameraError = ref('')
let mediaStream = null

function triggerCameraInput() {
  stopLiveCamera()
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

function handleNativeCameraCapture(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    compressImage(e.target.result, 1024, 0.8, (compressedDataUrl) => {
      form.value.image_url = compressedDataUrl
    })
  }
  reader.readAsDataURL(file)
}

async function startLiveCamera() {
  cameraError.value = ''
  showLiveCameraModal.value = true
  await nextTick()

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cameraError.value = 'Live camera access not supported by browser. Use device camera app.'
      return
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    })

    if (videoEl.value) {
      videoEl.value.srcObject = mediaStream
    }
  } catch (err) {
    console.warn('Camera stream error:', err)
    cameraError.value = 'Could not start camera. Please grant camera permission or use device camera app.'
  }
}

function snapLivePhoto() {
  if (!videoEl.value) return

  const canvas = document.createElement('canvas')
  const video = videoEl.value
  canvas.width = video.videoWidth || 640
  canvas.height = video.videoHeight || 480

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.8)
    compressImage(rawDataUrl, 1024, 0.8, (compressedDataUrl) => {
      form.value.image_url = compressedDataUrl
      stopLiveCamera()
    })
  }
}

function stopLiveCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  showLiveCameraModal.value = false
  cameraError.value = ''
}

function removeCapturedPhoto() {
  form.value.image_url = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function compressImage(base64Str, maxDim, quality, callback) {
  const img = new Image()
  img.onload = () => {
    let width = img.width
    let height = img.height

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width)
        width = maxDim
      } else {
        width = Math.round((width * maxDim) / height)
        height = maxDim
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)
    callback(canvas.toDataURL('image/jpeg', quality))
  }
  img.src = base64Str
}

onUnmounted(() => {
  stopLiveCamera()
})
</script>
