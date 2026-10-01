/**
 * context/ToastContext.jsx
 * -----------------------------------------------------------------------------
 * Sistema de notificaciones flotantes (toasts).
 *
 * Se usa para dos cosas:
 *  1. Avisos de confirmacion/error de acciones (login, publicar, moderar).
 *  2. Onboarding: al ingresar por primera vez se encola una serie de avisos
 *     que explican que contiene la pagina y como usarla.
 * -----------------------------------------------------------------------------
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import ToastViewport from '../components/ui/ToastViewport'

const ToastContext = createContext(null)

/** Duracion por defecto de cada aviso (ms). */
const DEFAULT_DURATION = 5000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())
  const counter = useRef(0)

  /** Cierra un toast y limpia su temporizador. */
  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  /** Crea un toast. Devuelve el id para poder cerrarlo manualmente. */
  const push = useCallback(
    ({ title, message, type = 'info', duration = DEFAULT_DURATION, icon, action }) => {
      counter.current += 1
      const id = `toast-${counter.current}`
      const toast = { id, title, message, type, icon, action }

      setToasts((prev) => [...prev.slice(-3), toast])

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration)
        timers.current.set(id, timer)
      }
      return id
    },
    [dismiss]
  )

  /* Limpia los temporizadores al desmontar para evitar fugas de memoria. */
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer) => clearTimeout(timer))
      pending.clear()
    }
  }, [])

  const value = useMemo(
    () => ({
      toasts,
      push,
      dismiss,
      success: (title, message, options) => push({ title, message, type: 'success', ...options }),
      error: (title, message, options) => push({ title, message, type: 'error', ...options }),
      info: (title, message, options) => push({ title, message, type: 'info', ...options }),
      warning: (title, message, options) => push({ title, message, type: 'warning', ...options }),
    }),
    [toasts, push, dismiss]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Contenedor fijo de notificaciones (esquina inferior derecha en movil). */}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

/** Hook de acceso al sistema de notificaciones. */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return context
}
