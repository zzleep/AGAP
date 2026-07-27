import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useReportStore = defineStore('report', () => {
  const reports = ref([])
  const isSubmitting = ref(false)
  const reportChannel = ref(null)

  const filters = ref({
    category: 'all',
    priority: 'all',
    status: 'all',
    plausibility: 'all',
    barangay: 'all',
    searchQuery: ''
  })

  function normalizePlausibility(val) {
    if (!val) return 'unverified'
    if (val === 'plausible') return 'verified'
    if (val === 'verified' || val === 'unverified' || val === 'suspected_spam') return val
    return 'unverified'
  }

  const filteredReports = computed(() => {
    return reports.value.filter(r => {
      if (filters.value.category !== 'all' && r.ai_category !== filters.value.category) return false
      if (filters.value.priority !== 'all') {
        if (filters.value.priority === 'high') {
          if (r.ai_priority !== 'high' && r.ai_priority !== 'critical') return false
        } else if (r.ai_priority !== filters.value.priority) {
          return false
        }
      }
      if (filters.value.status !== 'all' && r.status !== filters.value.status) return false

      if (filters.value.plausibility !== 'all') {
        const normPlausibility = normalizePlausibility(r.ai_plausibility)
        if (normPlausibility !== filters.value.plausibility) return false
      }

      if (filters.value.barangay !== 'all' && r.barangay !== filters.value.barangay) return false

      if (filters.value.searchQuery && filters.value.searchQuery.trim() !== '') {
        const query = filters.value.searchQuery.toLowerCase().trim()
        const text = `${r.id} ${r.barangay} ${r.raw_description} ${r.ai_category} ${r.ai_department}`.toLowerCase()
        if (!text.includes(query)) return false
      }

      return true
    })
  })

  const unreadHighPriorityCount = computed(() => {
    return reports.value.filter(r => (r.ai_priority === 'high' || r.ai_priority === 'critical') && r.status === 'open').length
  })

  function subscribeRealtimeReports() {
    if (reportChannel.value) return
    reportChannel.value = supabase
      .channel('public:community_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_reports' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const exists = reports.value.some(r => r.id === payload.new.id)
          if (!exists) {
            reports.value.unshift({
              ...payload.new,
              ai_plausibility: normalizePlausibility(payload.new.ai_plausibility)
            })
          }
        } else if (payload.eventType === 'UPDATE') {
          const index = reports.value.findIndex(r => r.id === payload.new.id)
          if (index !== -1) {
            reports.value[index] = {
              ...reports.value[index],
              ...payload.new,
              ai_plausibility: normalizePlausibility(payload.new.ai_plausibility || reports.value[index].ai_plausibility)
            }
          }
        } else if (payload.eventType === 'DELETE') {
          reports.value = reports.value.filter(r => r.id !== payload.old.id)
        }
      })
      .subscribe()
  }

  function unsubscribeRealtimeReports() {
    if (reportChannel.value) {
      supabase.removeChannel(reportChannel.value)
      reportChannel.value = null
    }
  }

  async function fetchReports() {
    try {
      const { data, error } = await supabase
        .from('community_reports')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) {
        reports.value = data.map(item => ({
          ...item,
          ai_plausibility: normalizePlausibility(item.ai_plausibility)
        }))
      }
    } catch (err) {
      console.warn('Fetch community reports fallback:', err)
    }
  }

  async function submitReport(payload) {
    isSubmitting.value = true
    try {
      let insertedReport = null

      try {
        const { data, error } = await supabase
          .from('community_reports')
          .insert([{
            raw_description: payload.raw_description,
            barangay: payload.barangay || 'Tagapo',
            status: 'open'
          }])
          .select()
          .single()

        if (!error && data) {
          insertedReport = {
            ...data,
            ai_plausibility: normalizePlausibility(data.ai_plausibility)
          }
        }
      } catch (dbErr) {
        console.warn('DB Insert fallback triggered:', dbErr)
      }

      if (!insertedReport) {
        insertedReport = {
          id: 'rep_' + Date.now(),
          raw_description: payload.raw_description,
          barangay: payload.barangay || 'Tagapo',
          ai_category: 'infrastructure',
          ai_priority: 'medium',
          ai_department: 'City Engineer',
          ai_reasoning: 'Automated triage pending processing',
          ai_plausibility: 'unverified',
          status: 'open',
          created_at: new Date().toISOString()
        }
      }

      reports.value.unshift(insertedReport)

      try {
        const { data: aiResult, error: aiErr } = await supabase.functions.invoke('classify-report', {
          body: {
            report_id: insertedReport.id,
            raw_description: insertedReport.raw_description,
            barangay: insertedReport.barangay
          }
        })

        if (!aiErr && aiResult) {
          const index = reports.value.findIndex(r => r.id === insertedReport.id)
          if (index !== -1) {
            reports.value[index] = {
              ...reports.value[index],
              ...aiResult,
              ai_plausibility: normalizePlausibility(aiResult.ai_plausibility)
            }
            return reports.value[index]
          }
        }
      } catch (edgeErr) {
        console.warn('Edge Function classify-report fallback:', edgeErr)
      }

      return insertedReport
    } finally {
      isSubmitting.value = false
    }
  }

  async function updateReportStatus(id, newStatus) {
    const report = reports.value.find(r => r.id === id)
    const oldStatus = report ? report.status : null

    try {
      const { error } = await supabase
        .from('community_reports')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) {
        console.warn('DB update report status error:', error)
        if (report && oldStatus !== null) {
          report.status = oldStatus
        }
        return { success: false, error }
      }

      if (report) {
        report.status = newStatus
      }
      return { success: true }
    } catch (err) {
      console.warn('DB update report status exception:', err)
      if (report && oldStatus !== null) {
        report.status = oldStatus
      }
      return { success: false, error: err }
    }
  }

  async function updatePlausibility(id, newPlausibility) {
    const report = reports.value.find(r => r.id === id)
    const oldPlausibility = report ? report.ai_plausibility : null

    try {
      const { error } = await supabase
        .from('community_reports')
        .update({ ai_plausibility: newPlausibility })
        .eq('id', id)

      if (error) {
        console.warn('DB update plausibility error:', error)
        if (report && oldPlausibility !== null) {
          report.ai_plausibility = oldPlausibility
        }
        return { success: false, error }
      }

      if (report) {
        report.ai_plausibility = newPlausibility
      }
      return { success: true }
    } catch (err) {
      console.warn('DB update plausibility exception:', err)
      if (report && oldPlausibility !== null) {
        report.ai_plausibility = oldPlausibility
      }
      return { success: false, error: err }
    }
  }

  return {
    reports,
    isSubmitting,
    filters,
    filteredReports,
    unreadHighPriorityCount,
    normalizePlausibility,
    subscribeRealtimeReports,
    unsubscribeRealtimeReports,
    fetchReports,
    submitReport,
    updateReportStatus,
    updatePlausibility
  }
})

