import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)
  const profile = ref(null)
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const authError = ref(null)

  const isAuthenticated = computed(() => user.value !== null && profile.value !== null)
  const assignedArea = computed(() => profile.value?.assigned_area || 'all')
  const userRole = computed(() => profile.value?.role || 'operator')

  async function fetchProfile(userId) {
    if (!userId) {
      profile.value = null
      return null
    }
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        profile.value = data
        return data
      }
      profile.value = null
      return null
    } catch (err) {
      console.error('Error fetching admin_users profile:', err)
      profile.value = null
      return null
    }
  }

  async function initializeAuth() {
    if (isInitialized.value) return
    isLoading.value = true
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      session.value = currentSession
      user.value = currentSession?.user || null

      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id)
      }

      supabase.auth.onAuthStateChange(async (event, newSession) => {
        session.value = newSession
        user.value = newSession?.user || null

        if (newSession?.user) {
          if (!profile.value || profile.value.id !== newSession.user.id) {
            await fetchProfile(newSession.user.id)
          }
        } else {
          profile.value = null
        }
      })
    } catch (err) {
      console.warn('Auth initialization error:', err)
    } finally {
      isInitialized.value = true
      isLoading.value = false
    }
  }

  async function login(email, password) {
    isLoading.value = true
    authError.value = null
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        authError.value = error.message
        return { success: false, error: error.message }
      }

      session.value = data.session
      user.value = data.user

      const userProfile = await fetchProfile(data.user.id)
      if (!userProfile) {
        await logout()
        const denyMsg = 'Access denied: Account is not registered as an admin operator.'
        authError.value = denyMsg
        return { success: false, error: denyMsg }
      }

      return { success: true }
    } catch (err) {
      const errMsg = err.message || 'Login failed'
      authError.value = errMsg
      return { success: false, error: errMsg }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Logout error:', err)
    } finally {
      user.value = null
      session.value = null
      profile.value = null
      isLoading.value = false
    }
  }

  return {
    user,
    session,
    profile,
    isInitialized,
    isLoading,
    authError,
    isAuthenticated,
    assignedArea,
    userRole,
    initializeAuth,
    fetchProfile,
    login,
    logout
  }
})

