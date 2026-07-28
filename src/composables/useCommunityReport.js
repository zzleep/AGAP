import { ref } from 'vue'
import { useReportStore } from '@/stores/reportStore'
import { BARANGAY_LIST } from '@/data/barangay_coords'

export function useCommunityReport() {
  const reportStore = useReportStore()

  const form = ref({
    barangay: 'Tagapo',
    raw_description: '',
    image_url: ''
  })

  // Soft Throttle & Nag Modal state
  const showNagModal = ref(false)
  const secondsRemaining = ref(0)
  const submissionSuccess = ref(false)
  const submittedData = ref(null)

  function checkThrottle() {
    const lastSubmit = localStorage.getItem('agap_last_community_report_time')
    if (!lastSubmit) return false

    const elapsed = (Date.now() - parseInt(lastSubmit, 10)) / 1000
    if (elapsed >= 0 && elapsed < 30) {
      secondsRemaining.value = Math.ceil(30 - elapsed)
      return true
    }
    return false
  }

  async function handleInitialSubmit() {
    if (checkThrottle()) {
      showNagModal.value = true
    } else {
      await executeSubmission()
    }
  }

  async function executeSubmission() {
    showNagModal.value = false
    try {
      const res = await reportStore.submitReport({
        barangay: form.value.barangay,
        raw_description: form.value.raw_description,
        image_url: form.value.image_url
      })
      localStorage.setItem('agap_last_community_report_time', Date.now().toString())
      submittedData.value = res
      submissionSuccess.value = true
      form.value.raw_description = ''
      form.value.image_url = ''
    } catch (err) {
      console.error('Community report submission error:', err)
    }
  }

  function resetForm() {
    submissionSuccess.value = false
    submittedData.value = null
    form.value.image_url = ''
  }

  return {
    form,
    showNagModal,
    secondsRemaining,
    submissionSuccess,
    submittedData,
    barangays: BARANGAY_LIST,
    handleInitialSubmit,
    executeSubmission,
    resetForm
  }
}
