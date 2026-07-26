import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import CitizenLayout from '@/layouts/CitizenLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

import HomeView from '@/views/citizen/HomeView.vue'
import SOSView from '@/views/citizen/SOSView.vue'
import EvacMap from '@/views/citizen/EvacMap.vue'
import GuideList from '@/views/citizen/GuideList.vue'
import GuideDetail from '@/views/citizen/GuideDetail.vue'
import CommunityReportForm from '@/views/citizen/CommunityReportForm.vue'
import FlowEngine from '@/views/citizen/FlowEngine.vue'

import LoginView from '@/views/admin/LoginView.vue'
import LiveSOSFeed from '@/views/admin/LiveSOSFeed.vue'
import CommunityReportsView from '@/views/admin/CommunityReportsView.vue'
import HotspotMap from '@/views/admin/HotspotMap.vue'
import AegisPanel from '@/views/admin/AegisPanel.vue'
import InsightDashboard from '@/views/admin/InsightDashboard.vue'

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

  next()
})

export default router
