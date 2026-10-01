/**
 * context/AuthContext.jsx
 * -----------------------------------------------------------------------------
 * Estado global de sesión, roles y verificación de edad.
 * -----------------------------------------------------------------------------
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService'
import db from '../data/db.json'
import { canAccessDangerLevel, getAgeBasedRecommendations } from '../services/ageVerificationService'

const AuthContext = createContext(null)

const ROLE_PERMISSIONS = db.roles.reduce((acc, role) => {
  acc[role.id] = role.permissions
  return acc
}, {})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFirstSession, setIsFirstSession] = useState(false)

  useEffect(() => {
    let active = true
    authService.restoreSession().then((restored) => {
      if (!active) return
      setUser(restored)
      setIsFirstSession(Boolean(restored))
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials)
    if (result.success) {
      setUser(result.user)
      const seen = window.localStorage.getItem('leyendas-cr:onboarding-seen')
      setIsFirstSession(seen !== result.user.id)
    }
    return result
  }, [])

  const register = useCallback(async (payload) => {
    const result = await authService.register(payload)
    if (result.success) {
      setUser(result.user)
      const seen = window.localStorage.getItem('leyendas-cr:onboarding-seen')
      setIsFirstSession(seen !== result.user.id)
    }
    return result
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const completeOnboarding = useCallback(() => {
    if (user) window.localStorage.setItem('leyendas-cr:onboarding-seen', user.id)
    setIsFirstSession(false)
  }, [user])

  // Funciones de control de acceso por edad
  const canAccessLegend = useCallback((legend) => {
    if (!user) return false
    if (user.isAdult === false && user.age && user.age < 18) {
      const level = legend.danger?.level || 2
      if (user.age < 15 && level >= 2) return false
      if (user.age < 18 && level >= 3) return false
    }
    return true
  }, [user])

  const getRecommendedLegends = useCallback((legends) => {
    if (!user || !user.age) return legends
    const { recommended } = getAgeBasedRecommendations(legends, user.age)
    return recommended
  }, [user])

  const getRestrictedLegends = useCallback((legends) => {
    if (!user || !user.age) return []
    const { restricted } = getAgeBasedRecommendations(legends, user.age)
    return restricted
  }, [user])

  const value = useMemo(() => {
    const permissions = user ? ROLE_PERMISSIONS[user.role] || [] : []
    return {
      user,
      loading,
      isFirstSession,
      isAuthenticated: Boolean(user),
      role: user ? user.role : null,
      permissions,
      // Edad
      age: user?.age,
      isAdult: user?.isAdult,
      birthDate: user?.birthDate,
      // Permisos por rol
      can: (permission) => permissions.includes(permission),
      hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
      // Control de acceso por edad
      canAccessLegend,
      getRecommendedLegends,
      getRestrictedLegends,
      isMinor: user?.isAdult === false,
      userAge: user?.age,
      // Auth
      login,
      register,
      logout,
      completeOnboarding,
    }
  }, [user, loading, isFirstSession, login, register, logout, completeOnboarding, canAccessLegend, getRecommendedLegends, getRestrictedLegends])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}