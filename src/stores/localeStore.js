import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export const useLocaleStore = defineStore('locale', () => {
  const { locale } = useI18n()

  const availableLocales = ['fil', 'en']
  const currentLocale = ref(locale.value)

  function setLocale(loc) {
    if (!availableLocales.includes(loc)) return
    locale.value = loc
    currentLocale.value = loc
    localStorage.setItem('agap_locale', loc)
  }

  function initLocale() {
    const saved = localStorage.getItem('agap_locale')
    if (saved && availableLocales.includes(saved)) {
      setLocale(saved)
    } else {
      const browserLang = navigator.language?.startsWith('fil') ? 'fil' : 'en'
      setLocale(browserLang)
    }
  }

  return {
    availableLocales,
    currentLocale,
    setLocale,
    initLocale
  }
})
