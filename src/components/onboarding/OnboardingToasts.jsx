/**
 * components/onboarding/OnboardingToasts.jsx
 * -----------------------------------------------------------------------------
 * Guia inicial del sistema.
 *
 * Al ingresar por primera vez (o registrarse) encola una serie de avisos
 * flotantes que explican:
 *   - que contiene la pagina,
 *   - como usar el mapa,
 *   - que es la comunidad y como entrar,
 *   - donde cambiar los ajustes de accesibilidad,
 *   - que rutas son privadas.
 *
 * Se apoya en `ToastContext` (sin estado propio) y en `getOnboardingTips()`.
 * Los avisos se emiten espaciados para que puedan leerse, y el boton de
 * "saltar" los cierra todos.
 * -----------------------------------------------------------------------------
 */

import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOnboardingTips } from '../../services/dbService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

/** Milisegundos entre cada aviso. */
const TIP_DELAY = 2600

export default function OnboardingToasts() {
  const { isAuthenticated, isFirstSession, completeOnboarding } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const started = useRef(false)

  useEffect(() => {
    // Solo se dispara una vez por sesion/montaje y solo para usuarios nuevos.
    if (!isAuthenticated || !isFirstSession || started.current) return undefined
    started.current = true

    let cancelled = false
    const timers = []

    getOnboardingTips().then((tips) => {
      if (cancelled) return

      // Boton de salida rapida disponible durante toda la secuencia.
      const skipId = toast.info('Bienvenido a LEYENDAS CR', 'Te mostraremos una guia rapida de la pagina.', {
        duration: TIP_DELAY * tips.length,
        action: { label: 'Saltar guia', onClick: () => clearAll() },
      })

      const clearAll = () => {
        timers.forEach((timer) => clearTimeout(timer))
        toast.dismiss(skipId)
        completeOnboarding()
      }

      tips.forEach((tip, index) => {
        const timer = setTimeout(() => {
          if (cancelled) return
          toast.push({
            title: tip.title,
            message: tip.message,
            type: 'info',
            duration: 5200,
            action: tip.route
              ? {
                  label: 'Ir ahora',
                  onClick: () => {
                    navigate(tip.route)
                    clearAll()
                  },
                }
              : undefined,
          })
        }, TIP_DELAY * (index + 1))
        timers.push(timer)
      })

      // Al terminar la secuencia, se marca el onboarding como visto.
      const finish = setTimeout(clearAll, TIP_DELAY * (tips.length + 1))
      timers.push(finish)
    })

    return () => {
      cancelled = true
      timers.forEach((timer) => clearTimeout(timer))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isFirstSession])

  return null
}
