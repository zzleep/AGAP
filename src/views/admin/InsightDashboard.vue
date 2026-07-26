<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-white">CDRRMO Operational Insight Dashboard</h2>
        <p class="text-xs text-slate-400">30-day analytics, response metrics & AI-powered trend detection</p>
      </div>
      <button
        @click="generateInsight"
        :disabled="isGenerating"
        class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-md"
      >
        {{ isGenerating ? '⏳ Generating...' : '🤖 Generate AI Insight' }}
      </button>
    </div>

    <!-- Stat Metric Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <span class="text-[10px] uppercase font-bold text-slate-400">Total SOS Alerts</span>
        <p class="text-2xl font-black text-white mt-1">{{ metrics.totalSOS }}</p>
        <span class="text-[10px] text-emerald-400">{{ metrics.sosResolvedRate }}% Resolved</span>
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <span class="text-[10px] uppercase font-bold text-slate-400">Community Reports</span>
        <p class="text-2xl font-black text-white mt-1">{{ metrics.totalReports }}</p>
        <span class="text-[10px] text-blue-400">AI Triage Verified</span>
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <span class="text-[10px] uppercase font-bold text-slate-400">Aegis Acceptance</span>
        <p class="text-2xl font-black text-purple-400 mt-1">{{ metrics.aegisAcceptanceRate }}%</p>
        <span class="text-[10px] text-slate-400">
          {{ metrics.aegisApproved }} approved · {{ metrics.aegisModified }} modified · {{ metrics.aegisRejected }} rejected
        </span>
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <span class="text-[10px] uppercase font-bold text-slate-400">Dismissed Reports</span>
        <p class="text-2xl font-black text-amber-400 mt-1">{{ metrics.dismissedCount }}</p>
        <span class="text-[10px] text-slate-400">Flagged as not actionable</span>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Category Distribution -->
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Report Categories</h3>
        <div class="space-y-2">
          <div v-for="cat in categoryData" :key="cat.name" class="space-y-1">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center space-x-2">
                <span class="capitalize text-slate-300 font-semibold">{{ cat.label }}</span>
                <span v-if="cat.trend > 20"
                  class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-950 text-red-400 border border-red-800 animate-pulse"
                >
                  ↑ {{ cat.trend }}% WoW
                </span>
              </div>
              <span class="text-slate-400 font-mono">{{ cat.count }}</span>
            </div>
            <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                :class="['h-full rounded-full transition-all duration-500', cat.color]"
                :style="{ width: cat.percentage + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Priority Distribution -->
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Priority Distribution</h3>
        <div class="flex items-end justify-center space-x-4 h-40">
          <div v-for="p in priorityData" :key="p.name" class="flex flex-col items-center space-y-1">
            <span class="text-xs font-bold text-white">{{ p.count }}</span>
            <div
              :class="['w-12 rounded-t-lg transition-all duration-500', p.color]"
              :style="{ height: p.height + 'px' }"
            ></div>
            <span class="text-[10px] text-slate-400 capitalize">{{ p.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Resolution Rates -->
    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Resolution Rates</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div v-for="status in resolutionData" :key="status.name" class="space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-300 capitalize font-semibold">{{ status.name }}</span>
            <span class="text-slate-400 font-mono">{{ status.count }} ({{ status.percentage }}%)</span>
          </div>
          <div class="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              :class="['h-full rounded-full transition-all duration-500', status.color]"
              :style="{ width: status.percentage + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Aegis Outcome Rate -->
    <div class="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-3">
      <h3 class="text-xs font-bold uppercase tracking-wider text-purple-300">Aegis Suggestion Outcomes</h3>
      <div class="grid grid-cols-3 gap-3">
        <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-center">
          <p class="text-xl font-black text-emerald-400">{{ metrics.aegisApproved }}</p>
          <span class="text-[10px] text-emerald-300 uppercase font-bold">Approved</span>
        </div>
        <div class="p-3 rounded-lg bg-amber-950/40 border border-amber-800/40 text-center">
          <p class="text-xl font-black text-amber-400">{{ metrics.aegisModified }}</p>
          <span class="text-[10px] text-amber-300 uppercase font-bold">Modified</span>
        </div>
        <div class="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-center">
          <p class="text-xl font-black text-rose-400">{{ metrics.aegisRejected }}</p>
          <span class="text-[10px] text-rose-300 uppercase font-bold">Rejected</span>
        </div>
      </div>
    </div>

    <!-- AI Insight Card -->
    <div class="p-4 rounded-xl bg-gradient-to-br from-blue-950/40 to-purple-950/40 border border-blue-800/40 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase tracking-wider text-blue-300">🤖 AI Insight — 30-Day Summary</h3>
        <span v-if="insightData" class="text-[10px] text-slate-500">Generated by Gemini 2.0 Flash</span>
      </div>

      <div v-if="isGenerating" class="p-4 text-center">
        <div class="w-6 h-6 mx-auto border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p class="text-xs text-blue-300">Analyzing 30 days of community report data...</p>
      </div>

      <div v-else-if="insightData" class="space-y-3">
        <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{{ insightData.summary }}</p>

        <div v-if="insightData.trends && insightData.trends.length > 0" class="space-y-1">
          <span class="text-[10px] uppercase font-bold text-blue-400">Detected Trends</span>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="trend in insightData.trends" :key="trend"
              class="px-2 py-0.5 text-[10px] rounded bg-blue-950 text-blue-300 border border-blue-800/60"
            >
              {{ trend }}
            </span>
          </div>
        </div>

        <div v-if="insightData.recommendations && insightData.recommendations.length > 0" class="space-y-1">
          <span class="text-[10px] uppercase font-bold text-purple-400">Recommendations</span>
          <ul class="text-xs text-slate-300 space-y-1 list-disc list-inside">
            <li v-for="rec in insightData.recommendations" :key="rec">{{ rec }}</li>
          </ul>
        </div>
      </div>

      <div v-else class="p-4 text-center text-xs text-slate-500">
        Click "Generate AI Insight" to produce a Gemini-powered 30-day analysis.
      </div>
    </div>

    <!-- Week-over-Week Trend Alerts -->
    <div v-if="trendAlerts.length > 0" class="space-y-2">
      <h3 class="text-xs font-bold uppercase tracking-wider text-red-400">⚠️ Week-over-Week Trend Alerts (&gt;20% increase)</h3>
      <div v-for="alert in trendAlerts" :key="alert.category"
        class="p-3 rounded-lg bg-red-950/40 border border-red-800/40 flex items-center justify-between"
      >
        <div class="flex items-center space-x-2">
          <span class="text-xs text-white font-semibold capitalize">{{ alert.category }}</span>
          <span class="text-[10px] text-red-300">{{ alert.thisWeek }} reports this week vs {{ alert.lastWeek }} last week</span>
        </div>
        <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-red-900 text-red-300">
          ↑ {{ alert.percentChange }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReportStore } from '@/stores/reportStore'
import { useSOSStore } from '@/stores/sosStore'
import { supabase } from '@/lib/supabase'

const reportStore = useReportStore()
const sosStore = useSOSStore()

const isGenerating = ref(false)
const insightData = ref(null)
const aegisSuggestions = ref([])

onMounted(async () => {
  await reportStore.fetchReports()
  await sosStore.fetchActiveReports()
  await fetchAegisSuggestions()
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

// Category breakdown with colors
const categoryData = computed(() => {
  const reports = reportStore.reports
  const total = reports.length || 1
  const categories = {
    infrastructure: { label: 'Infrastructure', color: 'bg-blue-500', count: 0 },
    environment: { label: 'Environment', color: 'bg-emerald-500', count: 0 },
    bullying: { label: 'Bullying', color: 'bg-rose-500', count: 0 },
    mental_health: { label: 'Mental Health', color: 'bg-purple-500', count: 0 }
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

// Priority distribution
const priorityData = computed(() => {
  const reports = reportStore.reports
  const maxCount = Math.max(1, ...['low', 'medium', 'high', 'critical'].map(
    p => reports.filter(r => r.ai_priority === p).length
  ))

  return [
    { name: 'low', count: reports.filter(r => r.ai_priority === 'low').length, color: 'bg-slate-600' },
    { name: 'medium', count: reports.filter(r => r.ai_priority === 'medium').length, color: 'bg-amber-500' },
    { name: 'high', count: reports.filter(r => r.ai_priority === 'high').length, color: 'bg-orange-500' },
    { name: 'critical', count: reports.filter(r => r.ai_priority === 'critical').length, color: 'bg-red-500' }
  ].map(p => ({ ...p, height: Math.max(8, (p.count / maxCount) * 120) }))
})

// Resolution status breakdown
const resolutionData = computed(() => {
  const reports = reportStore.reports
  const total = reports.length || 1
  const statuses = [
    { name: 'open', color: 'bg-blue-500' },
    { name: 'in_review', color: 'bg-amber-500' },
    { name: 'resolved', color: 'bg-emerald-500' },
    { name: 'dismissed', color: 'bg-slate-500' }
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
    const thisWeek = reports.filter(r =>
      r.ai_category === cat && (now - new Date(r.created_at).getTime()) < oneWeek
    ).length
    const lastWeek = reports.filter(r => {
      const age = now - new Date(r.created_at).getTime()
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

  const thisWeek = reports.filter(r =>
    r.ai_category === category && (now - new Date(r.created_at).getTime()) < oneWeek
  ).length
  const lastWeek = reports.filter(r => {
    const age = now - new Date(r.created_at).getTime()
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
