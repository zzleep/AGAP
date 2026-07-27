import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGuidesStore = defineStore('guides', () => {
  const rawGuideFiles = import.meta.glob('@/guides/*.md', { query: '?raw', eager: true })

  function extractFrontmatter(text) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
    if (!match) return { metadata: {}, body: text }

    const metaStr = match[1]
    const body = match[2]
    const metadata = {}
    metaStr.split('\n').forEach(line => {
      const parts = line.split(':')
      if (parts.length >= 2) {
        const key = parts[0].trim()
        const val = parts.slice(1).join(':').trim()
        metadata[key] = val
      }
    })
    return { metadata, body }
  }

  function parseGuideFiles(files) {
    const list = []
    for (const path in files) {
      const contentStr = files[path].default || files[path]
      if (typeof contentStr === 'string') {
        const { metadata, body } = extractFrontmatter(contentStr)
        const fallbackId = path.split('/').pop().replace('.md', '')
        list.push({
          id: metadata.id || fallbackId,
          title: metadata.title || 'Disaster Guide',
          category: metadata.category || 'general',
          icon: metadata.icon || 'file-text',
          summary: metadata.summary || '',
          content: body
        })
      }
    }
    return list
  }

  const guides = ref(parseGuideFiles(rawGuideFiles))
  const activeGuide = ref(null)
  const isLoading = ref(false)

  const guidesByCategory = computed(() => {
    const map = {}
    guides.value.forEach(g => {
      if (!map[g.category]) map[g.category] = []
      map[g.category].push(g)
    })
    return map
  })

  function getGuideById(id) {
    return guides.value.find(g => g.id === id) || null
  }

  return {
    guides,
    activeGuide,
    isLoading,
    guidesByCategory,
    getGuideById
  }
})
