import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import CitizenLayout from '@/layouts/CitizenLayout.vue'

// Eagerly loaded for instant home & SOS access
import HomeView from '@/views/citizen/HomeView.vue'
import SOSView from '@/views/citizen/SOSView.vue'

// Dynamically imported citizen views for lightweight initial PWA bundle
const OnboardingView = () => import('@/views/citizen/OnboardingView.vue')
const SettingsView = () => import('@/views/citizen/SettingsView.vue')
const EvacMap = () => import('@/views/citizen/EvacMap.vue')
const GuideList = () => import('@/views/citizen/GuideList.vue')
const GuideDetail = () => import('@/views/citizen/GuideDetail.vue')
const CommunityReportForm = () => import('@/views/citizen/CommunityReportForm.vue')
const FlowEngine = () => import('@/views/citizen/FlowEngine.vue')

// Dynamically imported admin layout & views (decoupled from citizen bundle)
const AdminLayout = () => import('@/layouts/AdminLayout.vue')
const LoginView = () => import('@/views/admin/LoginView.vue')
const LiveSOSFeed = () => import('@/views/admin/LiveSOSFeed.vue')
const FlaggedSOSView = () => import('@/views/admin/FlaggedSOSView.vue')
const CommunityReportsView = () => import('@/views/admin/CommunityReportsView.vue')
const HotspotMap = () => import('@/views/admin/HotspotMap.vue')
const AegisPanel = () => import('@/views/admin/AegisPanel.vue')
const InsightDashboard = () => import('@/views/admin/InsightDashboard.vue')

const routes = [
  {
    path: '/',
    redirect: '/app'
  },
  {
    path: '/app',
    component: CitizenLayout,
    children: [
      { path: '', name: 'citizen-home', component: HomeView },
      { path: 'setup', name: 'citizen-setup', component: OnboardingView },
      { path: 'settings', name: 'citizen-settings', component: SettingsView },
      { path: 'sos', name: 'citizen-sos', component: SOSView },
      { path: 'map', name: 'citizen-map', component: EvacMap },
      { path: 'flow', name: 'citizen-flow-engine', component: FlowEngine },
      { path: 'guides', name: 'citizen-guides', component: GuideList },
      { path: 'guides/:id', name: 'citizen-guide-detail', component: GuideDetail },
      { path: 'report', name: 'citizen-report', component: CommunityReportForm }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      { path: '', redirect: '/admin/sos-feed' },
      {
        path: 'login',
        name: 'admin-login',
        component: LoginView,
        meta: { requiresAuth: false }
      },
      {
        path: 'sos-feed',
        name: 'admin-sos-feed',
        component: LiveSOSFeed,
        meta: { requiresAuth: true }
      },
      {
        path: 'flagged-sos',
        name: 'admin-flagged-sos',
        component: FlaggedSOSView,
        meta: { requiresAuth: true }
      },
      {
        path: 'community-reports',
        name: 'admin-community-reports',
        component: CommunityReportsView,
        meta: { requiresAuth: true }
      },
      {
        path: 'hotspot-map',
        name: 'admin-hotspot-map',
        component: HotspotMap,
        meta: { requiresAuth: true }
      },
      {
        path: 'aegis',
        name: 'admin-aegis',
        component: AegisPanel,
        meta: { requiresAuth: true }
      },
      {
        path: 'insights',
        name: 'admin-insights',
        component: InsightDashboard,
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/app'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (!authStore.isInitialized) {
    await authStore.initializeAuth()
  }

  const isAdminRoute = to.path.startsWith('/admin')
  const isLoginPage = to.name === 'admin-login'
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth) || (isAdminRoute && !isLoginPage)

  if (requiresAuth) {
    if (!authStore.isAuthenticated || !authStore.profile) {
      return next({ name: 'admin-login', query: { redirect: to.fullPath } })
    }
  }

  if (isLoginPage && authStore.isAuthenticated && authStore.profile) {
    return next({ name: 'admin-sos-feed' })
  }

  const isAppRoute = to.path.startsWith('/app')
  const isSetupPage = to.path === '/app/setup' || to.name === 'citizen-setup'

  if (isAppRoute) {
    const onboardingDone = localStorage.getItem('agap_onboarding_done') === 'true'
    if (isSetupPage && onboardingDone) {
      return next({ name: 'citizen-home' })
    }
    if (!isSetupPage && !onboardingDone) {
      return next({ name: 'citizen-setup' })
    }
  }

  next()
})

export default router
