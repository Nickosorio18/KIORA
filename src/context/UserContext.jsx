import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@context/AuthContext'
import { supabase } from '@api/supabaseClient'

/* ═══════════════════════════════════════════════════════
   KYŌRA — UserContext
   Perfil nutricional del usuario (datos del onboarding).
   Persistido en localStorage con clave única por usuario.
   El campo `plan` se sincroniza desde Supabase (tabla profiles)
   para que un webhook de pago lo actualice sin relogin.
   Auth delegado a AuthContext.
   ═══════════════════════════════════════════════════════ */

const UserContext = createContext(null)

const PROFILE_KEY_PREFIX = 'kyora.profile.'

const EMPTY_PROFILE = {
  nombre: '',
  edad: '',
  sexo: '',
  peso: '',
  altura: '',
  objetivo: '',
  restricciones: [],
  actividad: '',
  cocinas: [],
  plan: 'esencial',
}

function storageKey(userId) {
  return userId ? `${PROFILE_KEY_PREFIX}${userId}` : null
}

function loadProfile(userId) {
  try {
    const key = storageKey(userId)
    if (!key) return null
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveProfile(userId, profile) {
  try {
    const key = storageKey(userId)
    if (!key) return
    if (profile) localStorage.setItem(key, JSON.stringify(profile))
    else localStorage.removeItem(key)
  } catch { /* ignore */ }
}

export const UserProvider = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [state, setState] = useState({ profile: null, loadedForUser: null })

  // Cargar perfil desde localStorage cuando el usuario cambia
  useEffect(() => {
    if (authLoading) return
    if (isAuthenticated && user?.id) {
      const saved = loadProfile(user.id)
      setState({ profile: saved, loadedForUser: user.id })
    } else {
      setState({ profile: null, loadedForUser: null })
    }
  }, [isAuthenticated, user?.id, authLoading])

  // Sincronizar plan desde Supabase (fuente de verdad para suscripciones)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data?.plan) return
        setState(prev => {
          if (prev.loadedForUser !== user.id) return prev
          const merged = { ...EMPTY_PROFILE, ...(prev.profile || {}), plan: data.plan }
          saveProfile(user.id, merged)
          return { profile: merged, loadedForUser: user.id }
        })
      })
  }, [isAuthenticated, user?.id])

  const profile = state.profile

  const profileLoading = authLoading || (isAuthenticated && !!user?.id && state.loadedForUser !== user.id)

  const setProfile = (newProfile) => {
    const merged = { ...EMPTY_PROFILE, ...newProfile }
    setState({ profile: merged, loadedForUser: user?.id || null })
    if (user?.id) saveProfile(user.id, merged)
  }

  const updateProfile = (partial) => {
    setState((prev) => {
      const updated = { ...EMPTY_PROFILE, ...(prev.profile || {}), ...partial }
      if (user?.id) saveProfile(user.id, updated)
      return { profile: updated, loadedForUser: prev.loadedForUser }
    })
  }

  const clearProfile = () => {
    setState({ profile: null, loadedForUser: state.loadedForUser })
    if (user?.id) saveProfile(user.id, null)
  }

  // Re-fetch plan desde Supabase — llamar después de un checkout exitoso
  const refreshPlan = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    if (data?.plan) {
      setState(prev => {
        const merged = { ...EMPTY_PROFILE, ...(prev.profile || {}), plan: data.plan }
        saveProfile(user.id, merged)
        return { ...prev, profile: merged }
      })
    }
  }, [user?.id])

  const GOAL_LABELS = {
    lose: 'Perder grasa', gain: 'Ganar músculo', both: 'Recomposición corporal',
    health: 'Comer mejor', energy: 'Más energía', maintain: 'Mantener estado actual',
  }
  const profileForAgent = profile
    ? {
        nombre: profile.nombre || 'Usuario',
        sexo: profile.sexo === 'hombre' ? 'Hombre' : profile.sexo === 'mujer' ? 'Mujer' : 'No especificado',
        edad: profile.edad || 'No especificada',
        peso: profile.peso ? `${profile.peso} kg` : 'No especificado',
        altura: profile.altura ? `${profile.altura} cm` : 'No especificada',
        objetivo: GOAL_LABELS[profile.objetivo] || profile.objetivo || 'No especificado',
        restricciones: profile.restricciones?.length ? profile.restricciones.join(', ') : 'Ninguna',
        actividad: profile.actividad || 'No especificada',
        preferencias: profile.cocinas?.length ? profile.cocinas.join(', ') : 'Sin preferencias específicas',
      }
    : null

  return (
    <UserContext.Provider
      value={{
        profile,
        profileLoading,
        profileForAgent,
        setProfile,
        updateProfile,
        clearProfile,
        refreshPlan,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
