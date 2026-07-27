<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-expressive text-3xl font-black text-[#1F3A4B] tracking-tight">CDRRMO Operational Insight Dashboard</h2>
        <p class="text-xs text-[#902715] font-extrabold uppercase tracking-wider mt-0.5">30-day analytics, response metrics & AI-powered trend detection</p>
      </div>
      <button
        @click="generateInsight"
        :disabled="isGenerating"
        class="px-5 py-2.5 rounded-full bg-[#1F3A4B] hover:bg-[#152733] text-white text-xs font-black transition-all shadow-md disabled:opacity-50 active:scale-95 flex items-center space-x-2 uppercase tracking-wider"
      >
        <svg class="w-4 h-4 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>{{ isGenerating ? 'Generating...' : 'Generate AI Insight' }}</span>
      </button>
    </div>

    <!-- Stat Metric Cards (Expressive Solid Saturated Colors — NO PALE PASTELS) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
      <!-- 1. Total SOS: Hero Card in Brandy Red solid! -->
      <div class="p-6 rounded-[2.5rem_1.25rem_2.5rem_1.25rem] bg-[#902715] text-white shadow-[0_10px_25px_rgba(144,39,21,0.3)] admin-stat">
        <span class="text-[10px] uppercase font-black text-white/80 tracking-wider">Total SOS Alerts</span>
        <p class="text-4xl font-black text-white mt-1">{{ metrics.totalSOS }}</p>
        <span class="text-xs font-black text-[#F7FB41] mt-2 inline-block shadow-sm">{{ metrics.sosResolvedRate }}% Resolved</span>
      </div>

      <!-- 2. Community Reports: Solid Canary Yellow Card! -->
      <div class="p-6 rounded-[1.25rem_2.5rem_1.25rem_2.5rem] bg-[#F7FB41] text-[#0A0A0A] shadow-[0_10px_25px_rgba(247,251,65,0.35)] admin-stat">
        <span class="text-[10px] uppercase font-black text-[#0A0A0A]/80 tracking-wider">Community Reports</span>
        <p class="text-4xl font-black text-[#0A0A0A] mt-1">{{ metrics.totalReports }}</p>
        <span class="text-xs font-black text-[#0A0A0A]/80 mt-2 inline-block">AI Triage Verified</span>
      </div>

      <!-- 3. Aegis Acceptance: Solid Earthy Slate Blue card — breaks pattern! -->
      <div class="p-6 rounded-[2.5rem_1.5rem_2.5rem_1.5rem] bg-[#1F3A4B] text-white shadow-[0_10px_25px_rgba(31,58,75,0.25)] admin-stat">
        <span class="text-[10px] uppercase font-black text-[#F7FB41] tracking-wider">Aegis Acceptance</span>
        <p class="text-4xl font-black text-[#F7FB41] mt-1">{{ metrics.aegisAcceptanceRate }}%</p>
        <span class="text-[10px] text-white/80 font-bold block mt-2">
          {{ metrics.aegisApproved }} approved · {{ metrics.aegisModified }} modified · {{ metrics.aegisRejected }} rejected
        </span>
      </div>

      <!-- 4. Dismissed Reports: Solid Rosy Copper Card -->
      <div class="p-6 rounded-[1.5rem_2.5rem_1.5rem_2.5rem] bg-[#D14D3E] text-white shadow-[0_10px_25px_rgba(209,77,62,0.3)] admin-stat">
        <span class="text-[10px] uppercase font-black text-white/80 tracking-wider">Dismissed Reports</span>
        <p class="text-4xl font-black text-white mt-1">{{ metrics.dismissedCount }}</p>
        <span class="text-xs font-bold text-white/90 mt-2 inline-block">Flagged as not actionable</span>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Category Distribution -->
      <div class="p-6 bg-white border border-[#1F3A4B]/15 rounded-3xl space-y-4 shadow-sm admin-card">
        <h3 class="text-xs font-black uppercase tracking-wider text-[#1F3A4B]">Report Categories</h3>
        <div class="space-y-3.5">
          <div v-for="cat in categoryData" :key="cat.name" class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center space-x-2">
                <span class="capitalize text-[#0A0A0A] font-black">{{ cat.label }}</span>
                <span v-if="cat.trend > 20"
                  class="px-2.5 py-0.5 text-[9px] font-black rounded-full bg-[#902715] text-white shadow-sm"
                >
                  ↑ {{ cat.trend }}% WoW
                </span>
              </div>
              <span class="text-[#902715] font-mono font-black">{{ cat.count }}</span>
            </div>
            <div class="h-3.5 bg-[#1F3A4B]/15 rounded-full overflow-hidden border border-[#1F3A4B]/20">
              <div
                :class="['h-full rounded-full transition-all duration-500', cat.color]"
                :style="{ width: cat.percentage + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Priority Distribution -->
      <div class="p-6 bg-white border border-[#1F3A4B]/15 rounded-3xl space-y-4 shadow-sm admin-card">
        <h3 class="text-xs font-black uppercase tracking-wider text-[#1F3A4B]">Priority Distribution</h3>
        <div class="flex items-end justify-center space-x-6 h-44 pt-4">
          <div v-for="p in priorityData" :key="p.name" class="flex flex-col items-center space-y-2">
            <span class="text-xs font-black text-[#1F3A4B]">{{ p.count }}</span>
            <div
              :class="['w-14 rounded-t-2xl transition-all duration-500 shadow-md', p.color]"
              :style="{ height: p.height + 'px' }"
            ></div>
            <span class="text-[10px] font-black text-[#1F3A4B] capitalize tracking-wider">{{ p.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Resolution Rates -->
    <div class="p-6 bg-white border border-[#1F3A4B]/15 rounded-3xl space-y-4 shadow-sm admin-card">
      <h3 class="text-xs font-black uppercase tracking-wider text-[#1F3A4B]">Resolution Rates</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="status in resolutionData" :key="status.name" class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-[#0A0A0A] capitalize font-black">{{ status.name }}</span>
            <span class="text-[#902715] font-mono font-black">{{ status.count }} ({{ status.percentage }}%)</span>
          </div>
          <div class="h-3.5 bg-[#1F3A4B]/15 rounded-full overflow-hidden border border-[#1F3A4B]/20">
            <div
              :class="['h-full rounded-full transition-all duration-500', status.color]"
              :style="{ width: status.percentage + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Aegis Outcome Rate -->
    <div class="p-6 rounded-[2.25rem_1.25rem_2.25rem_1.25rem] bg-[#1F3A4B] text-white border border-[#1F3A4B] space-y-4 shadow-md admin-card">
      <h3 class="text-xs font-black uppercase tracking-wider text-[#F7FB41]">Aegis Suggestion Outcomes</h3>
      <div class="grid grid-cols-3 gap-5">
        <div class="p-5 rounded-2xl bg-white text-[#0A0A0A] text-center shadow-md border-2 border-[#556B2F]">
          <p class="text-3xl font-black text-[#556B2F]">{{ metrics.aegisApproved }}</p>
          <span class="text-[10px] text-[#556B2F] uppercase font-black tracking-wider">Approved</span>
        </div>
        <div class="p-5 rounded-2xl bg-white text-[#0A0A0A] text-center shadow-md border-2 border-[#8A4B08]">
          <p class="text-3xl font-black text-[#8A4B08]">{{ metrics.aegisModified }}</p>
          <span class="text-[10px] text-[#8A4B08] uppercase font-black tracking-wider">Modified</span>
        </div>
        <div class="p-5 rounded-2xl bg-white text-[#0A0A0A] text-center shadow-md border-2 border-[#D14D3E]">
          <p class="text-3xl font-black text-[#D14D3E]">{{ metrics.aegisRejected }}</p>
          <span class="text-[10px] text-[#D14D3E] uppercase font-black tracking-wider">Rejected</span>
        </div>
      </div>
    </div>

    <!-- AI Insight Card -->
    <div class="p-7 rounded-[2.25rem_1.25rem_2.25rem_1.25rem] bg-white border border-[#1F3A4B]/15 space-y-4 shadow-md admin-card">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-[#1F3A4B] text-[#F7FB41] flex items-center justify-center font-bold shadow-md shrink-0">
            <svg class="w-5 h-5 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="text-xs font-black uppercase tracking-wider text-[#1F3A4B]">AI Insight — 30-Day Summary</h3>
        </div>
        <span v-if="insightData" class="text-[10px] font-black text-[#902715] uppercase tracking-wider">Generated by Gemini 2.0 Flash</span>
      </div>

      <div v-if="isGenerating" class="p-6 text-center">
        <div class="w-7 h-7 mx-auto border-3 border-[#1F3A4B] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p class="text-xs text-[#1F3A4B] font-bold">Analyzing 30 days of community report data...</p>
      </div>

      <div v-else-if="insightData" class="space-y-4">
        <p class="text-sm text-[#0A0A0A] leading-relaxed whitespace-pre-line font-medium">{{ insightData.summary }}</p>

        <div v-if="insightData.trends && insightData.trends.length > 0" class="space-y-2">
          <span class="text-[10px] uppercase font-black text-[#1F3A4B] tracking-wider">Detected Trends</span>
          <div class="flex flex-wrap gap-2">
            <span v-for="trend in insightData.trends" :key="trend"
              class="px-3 py-1 text-xs rounded-full bg-white text-[#1F3A4B] font-bold border border-black/5 shadow-sm"
            >
              {{ trend }}
            </span>
          </div>
        </div>

        <div v-if="insightData.recommendations && insightData.recommendations.length > 0" class="space-y-2">
          <span class="text-[10px] uppercase font-black text-[#902715] tracking-wider">Recommendations</span>
          <ul class="text-xs text-[#0A0A0A] space-y-1.5 list-disc list-inside font-medium">
            <li v-for="rec in insightData.recommendations" :key="rec">{{ rec }}</li>
          </ul>
        </div>
      </div>

      <div v-else class="p-6 text-center text-xs text-[#717171] font-medium">
        Click "Generate AI Insight" to produce a Gemini-powered 30-day analysis.
      </div>
    </div>

    <!-- Week-over-Week Trend Alerts -->
    <div v-if="trendAlerts.length > 0" class="space-y-3">
      <h3 class="text-xs font-black uppercase tracking-wider text-[#D14D3E] flex items-center space-x-1.5">
        <svg class="w-4 h-4 text-[#D14D3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Week-over-Week Trend Alerts (&gt;20% increase)</span>
      </h3>
      <div v-for="alert in trendAlerts" :key="alert.category"
        class="p-4 rounded-2xl bg-[#D14D3E]/10 border border-[#D14D3E]/20 flex items-center justify-between shadow-m3-sm"
      >
        <div class="flex items-center space-x-2.5">
          <span class="text-xs text-[#0A0A0A] font-black capitalize">{{ alert.category }}</span>
          <span class="text-xs text-[#717171] font-medium">{{ alert.thisWeek }} reports this week vs {{ alert.lastWeek }} last week</span>
        </div>
        <span class="px-3 py-1 text-xs font-black rounded-full bg-[#D14D3E] text-white shadow-sm">
          ↑ {{ alert.percentChange }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useReportStore } from '@/stores/reportStore'
import { useSOSStore } from '@/stores/sosStore'
import { supabase } from '@/lib/supabase'

const reportStore = useReportStore()
const sosStore = useSOSStore()

const isGenerating = ref(false)
const insightData = ref(null)
const aegisSuggestions = ref([])
const aegisPollInterval = ref(null)

onMounted(async () => {
  await reportStore.fetchReports()
  await sosStore.fetchActiveReports()
  sosStore.subscribeToRealtimeSOS()
  await fetchAegisSuggestions()
  aegisPollInterval.value = window.setInterval(fetchAegisSuggestions, 60000)
})

onUnmounted(() => {
  if (aegisPollInterval.value) {
    clearInterval(aegisPollInterval.value)
  }
})

// Computed Metrics
const metrics = computed(() => {
  const reports = reportStore.reports
  const sosReports = sosStore.activeReports
  const totalReports = reports.length
  const resolvedCount = reports.filter(r => r.status === 'resolved').length
  const dismissedCount = reports.filter(r => r.status === 'dismissed').length
  const resolvedSOSCount = sosReports.filter(r => r.status === 'resolved').length

  const approved = aegisSuggestions.value.filter(s => s.outcome === 'approved').length
  const modified = aegisSuggestions.value.filter(s => s.outcome === 'modified').length
  const rejected = aegisSuggestions.value.filter(s => s.outcome === 'rejected').length
  const totalAegis = approved + modified + rejected
  const acceptanceRate = totalAegis > 0 ? Math.round(((approved + modified) / totalAegis) * 100) : 0

  return {
    totalSOS: sosReports.length,
    sosResolvedRate: sosReports.length > 0 ? Math.round((resolvedSOSCount / sosReports.length) * 100) : 0,
    totalReports,
    resolvedRate: totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0,
    dismissedCount,
    aegisApproved: approved,
    aegisModified: modified,
    aegisRejected: rejected,
    aegisAcceptanceRate: acceptanceRate
  }
})

// Category breakdown with colors (Santa Rosa Palette)
const categoryData = computed(() => {
  const reports = reportStore.reports
  const total = reports.length || 1
  const categories = {
    infrastructure: { label: 'Infrastructure', color: 'bg-[#1F3A4B]', count: 0 },
    environment: { label: 'Environment', color: 'bg-[#556B2F]', count: 0 },
    bullying: { label: 'Bullying / Safety', color: 'bg-[#902715]', count: 0 },
    mental_health: { label: 'Mental Health', color: 'bg-[#D14D3E]', count: 0 }
  }

  reports.forEach(r => {
    const cat = r.ai_category || 'infrastructure'
    if (categories[cat]) categories[cat].count++
  })

  return Object.entries(categories).map(([name, data]) => ({
    name,
    ...data,
    percentage: Math.round((data.count / total) * 100),
    trend: computeWoWTrend(name)
  }))
})

// Priority distribution (Santa Rosa Palette)
const priorityData = computed(() => {
  const reports = reportStore.reports
  const maxCount = Math.max(1, ...['low', 'medium', 'high', 'critical'].map(
    p => reports.filter(r => r.ai_priority === p).length
  ))

  return [
    { name: 'low', count: reports.filter(r => r.ai_priority === 'low').length, color: 'bg-[#556B2F]' },
    { name: 'medium', count: reports.filter(r => r.ai_priority === 'medium').length, color: 'bg-[#F7FB41]' },
    { name: 'high', count: reports.filter(r => r.ai_priority === 'high').length, color: 'bg-[#902715]' },
    { name: 'critical', count: reports.filter(r => r.ai_priority === 'critical').length, color: 'bg-[#D14D3E]' }
  ].map(p => ({ ...p, height: Math.max(12, (p.count / maxCount) * 130) }))
})

// Resolution status breakdown
const resolutionData = computed(() => {
  const reports = reportStore.reports
  const total = reports.length || 1
  const statuses = [
    { name: 'open', color: 'bg-[#1F3A4B]' },
    { name: 'in_review', color: 'bg-[#F7FB41]' },
    { name: 'resolved', color: 'bg-[#556B2F]' },
    { name: 'dismissed', color: 'bg-[#717171]' }
  ]

  return statuses.map(s => {
    const count = reports.filter(r => r.status === s.name).length
    return { ...s, count, percentage: Math.round((count / total) * 100) }
  })
})

// Week-over-week trend detection (>20% increase)
const trendAlerts = computed(() => {
  const alerts = []
  const now = Date.now()
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  const reports = reportStore.reports

  const categories = ['infrastructure', 'environment', 'bullying', 'mental_health']
  categories.forEach(cat => {
    const thisWeek = reports.filter(r => {
      const reportTime = r.created_at ? new Date(r.created_at).getTime() : NaN
      if (!Number.isFinite(reportTime)) return false
      return r.ai_category === cat && (now - reportTime) < oneWeek
    }).length
    const lastWeek = reports.filter(r => {
      const reportTime = r.created_at ? new Date(r.created_at).getTime() : NaN
      if (!Number.isFinite(reportTime)) return false
      const age = now - reportTime
      return r.ai_category === cat && age >= oneWeek && age < oneWeek * 2
    }).length

    if (lastWeek > 0) {
      const change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
      if (change > 20) {
        alerts.push({ category: cat, thisWeek, lastWeek, percentChange: change })
      }
    }
  })

  return alerts
})

function computeWoWTrend(category) {
  const now = Date.now()
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  const reports = reportStore.reports

  const thisWeek = reports.filter(r => {
    const reportTime = r.created_at ? new Date(r.created_at).getTime() : NaN
    if (!Number.isFinite(reportTime)) return false
    return r.ai_category === category && (now - reportTime) < oneWeek
  }).length
  const lastWeek = reports.filter(r => {
    const reportTime = r.created_at ? new Date(r.created_at).getTime() : NaN
    if (!Number.isFinite(reportTime)) return false
    const age = now - reportTime
    return r.ai_category === category && age >= oneWeek && age < oneWeek * 2
  }).length

  if (lastWeek === 0) return 0
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
}

async function fetchAegisSuggestions() {
  try {
    const { data, error } = await supabase
      .from('aegis_suggestions')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      aegisSuggestions.value = data
    }
  } catch (err) {
    console.warn('Failed to fetch Aegis suggestions:', err)
  }
}

async function generateInsight() {
  isGenerating.value = true
  try {
    const reports = reportStore.reports
    const summary = {
      total_reports: reports.length,
      categories: {},
      priorities: {},
      statuses: {},
      barangays: {}
    }

    reports.forEach(r => {
      const cat = r.ai_category || 'unknown'
      const pri = r.ai_priority || 'unknown'
      const sta = r.status || 'unknown'
      const bgy = r.barangay || 'Unknown'

      summary.categories[cat] = (summary.categories[cat] || 0) + 1
      summary.priorities[pri] = (summary.priorities[pri] || 0) + 1
      summary.statuses[sta] = (summary.statuses[sta] || 0) + 1
      summary.barangays[bgy] = (summary.barangays[bgy] || 0) + 1
    })

    const { data, error } = await supabase.functions.invoke('generate-insight', {
      body: { reports_summary: summary }
    })

    if (!error && data) {
      insightData.value = data
    } else {
      insightData.value = {
        summary: 'AI insight generation is currently unavailable. Review the dashboard charts above for manual analysis of community report trends.',
        trends: [],
        recommendations: ['Review dashboard charts manually', 'Check high-priority report queue']
      }
    }
  } catch (err) {
    console.warn('Generate insight error:', err)
    insightData.value = {
      summary: 'Unable to generate AI insight at this time.',
      trends: [],
      recommendations: []
    }
  } finally {
    isGenerating.value = false
  }
}
</script>
