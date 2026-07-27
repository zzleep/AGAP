import 'leaflet/dist/leaflet.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import en from './locales/en.json'
import fil from './locales/fil.json'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('agap_locale') || 'fil',
  fallbackLocale: 'en',
  messages: { en, fil }
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')
