import { ref } from 'vue'
import { useReportStore } from '@/stores/reportStore'
import { BARANGAY_LIST } from '@/data/barangay_coords'

export function useCommunityReport() {
  const reportStore = useReportStore()

  const form = ref({
    barangay: 'Tagapo',
    raw_description: ''
  })

  // Math CAPTCHA state
  const captcha = ref({ num1: 0, num2: 0, answer: 0, userResponse: '' })
  const captchaError = ref(false)

  // Soft Throttle & Nag Modal state
  const showNagModal = ref(false)
  const secondsRemaining = ref(0)
  const submissionSuccess = ref(false)
  const submittedData = ref(null)

  function generateCaptcha() {
    const n1 = Math.floor(Math.random() * 9) + 1
    const n2 = Math.floor(Math.random() * 9) + 1
    captcha.value = {
      num1: n1,
      num2: n2,
      answer: n1 + n2,
      userResponse: ''
    }
    captchaError.value = false
  }

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
    // Validate Math CAPTCHA with regex digits check before numeric comparison
    const userResp = String(captcha.value.userResponse || '').trim()
    if (!/^\d+$/.test(userResp) || parseInt(userResp, 10) !== captcha.value.answer) {
      generateCaptcha()
      captchaError.value = true
      return
    }
    captchaError.value = false

    // Check soft throttle rate limit
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
        raw_description: form.value.raw_description
      })
      localStorage.setItem('agap_last_community_report_time', Date.now().toString())
      submittedData.value = res
      submissionSuccess.value = true
      form.value.raw_description = ''
      generateCaptcha()
    } catch (err) {
      console.error('Community report submission error:', err)
    }
  }

  function resetForm() {
    submissionSuccess.value = false
    submittedData.value = null
    generateCaptcha()
  }

  // Initialize captcha on setup
  generateCaptcha()

  return {
    form,
    captcha,
    captchaError,
    showNagModal,
    secondsRemaining,
    submissionSuccess,
    submittedData,
    barangays: BARANGAY_LIST,
    generateCaptcha,
    handleInitialSubmit,
    executeSubmission,
    resetForm
  }
}
