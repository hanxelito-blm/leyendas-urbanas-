/**
 * context/AccessibilityContext.jsx
 * -----------------------------------------------------------------------------
 * Preferencias visuales del usuario (accesibilidad).
 *
 *  - theme:  'dark' | 'light'   (claro con tonos oscuros elegante / oscuro profundo)
 *  - fontScale: 0.875 | 1 | 1.125 | 1.25 | 1.5   (ajuste del tamano de texto)
 *  - colorMode: 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia'
 *  - highContrast: boolean
 *
 * Todo se persiste en localStorage y se aplica sobre `<html>` mediante
 * atributos data-*, de modo que el CSS de `assets/accessibility.css` hace el
 * resto sin necesidad de re-renderizar el arbol completo.
 * -----------------------------------------------------------------------------
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { readValue, writeValue } from '../services/storage'

const STORAGE_KEY = 'accessibility'

/** Valores permitidos: mantienen el selector consistente con el CSS. */
export const THEMES = ['dark', 'light']
export const FONT_SCALES = [0.875, 1, 1.125, 1.25, 1.5]

/** Daltonismos mas frecuentes en la poblacion. */
export const COLOR_MODES = [
  {
    id: 'normal',
    label: 'Vision normal',
    description: 'Sin ajustes de color',
    prevalence: 'Por defecto',
  },
  {
    id: 'deuteranopia',
    label: 'Deuteranopia',
    description: 'Dificultad para distinguir verde y rojo (la mas comun)',
    prevalence: '~6% de hombres',
  },
  {
    id: 'protanopia',
    label: 'Protanopia',
    description: 'Ausencia de conos rojos',
    prevalence: '~2% de hombres',
  },
  {
    id: 'tritanopia',
    label: 'Tritanopia',
    description: 'Dificultad para distinguir azul y amarillo',
    prevalence: '~0.01%',
  },
]

const DEFAULTS = {
  theme: 'dark',
  fontScale: 1,
  colorMode: 'normal',
  highContrast: false,
  voiceNarration: false,
}

const AccessibilityContext = createContext(null)

export function AccessibilityProvider({ children }) {
  const [preferences, setPreferences] = useState(() => ({
    ...DEFAULTS,
    ...readValue(STORAGE_KEY, {}),
  }))

  /* Persiste los cambios. */
  useEffect(() => {
    writeValue(STORAGE_KEY, preferences)
  }, [preferences])

  /* Aplica los atributos al elemento raiz: CSS hace el resto. */
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = preferences.theme
    root.dataset.colorMode = preferences.colorMode
    root.dataset.contrast = preferences.highContrast ? 'high' : 'normal'
    root.dataset.fontScale = String(Math.round(preferences.fontScale * 100))
    const applyResponsiveFontScale = () => {
      const preferredSize = 16 * preferences.fontScale
      const screenLimit = Math.max(16, Math.min(24, window.innerWidth / 18))
      root.style.fontSize = `${Math.min(preferredSize, screenLimit)}px`
    }

    applyResponsiveFontScale()
    window.addEventListener('resize', applyResponsiveFontScale)
    return () => window.removeEventListener('resize', applyResponsiveFontScale)
  }, [preferences])

  const setTheme = useCallback((theme) => {
    setPreferences((prev) => (THEMES.includes(theme) ? { ...prev, theme } : prev))
  }, [])

  const toggleTheme = useCallback(() => {
    setPreferences((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))
  }, [])

  const setFontScale = useCallback((fontScale) => {
    setPreferences((prev) => ({ ...prev, fontScale }))
  }, [])

  /** Sube o baja el tamano de texto en pasos discretos. */
  const stepFontScale = useCallback((direction) => {
    setPreferences((prev) => {
      const index = FONT_SCALES.indexOf(prev.fontScale)
      const nextIndex = Math.min(Math.max(index + direction, 0), FONT_SCALES.length - 1)
      return { ...prev, fontScale: FONT_SCALES[nextIndex] }
    })
  }, [])

  const setColorMode = useCallback((colorMode) => {
    setPreferences((prev) => ({ ...prev, colorMode }))
  }, [])

  const toggleHighContrast = useCallback(() => {
    setPreferences((prev) => ({ ...prev, highContrast: !prev.highContrast }))
  }, [])

  const toggleVoiceNarration = useCallback(() => {
    setPreferences((prev) => ({ ...prev, voiceNarration: !prev.voiceNarration }))
  }, [])

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULTS)
  }, [])

  const value = useMemo(
    () => ({
      ...preferences,
      isDark: preferences.theme === 'dark',
      fontScaleLabel: `${Math.round(preferences.fontScale * 100)}%`,
      setTheme,
      toggleTheme,
      setFontScale,
      stepFontScale,
      setColorMode,
      toggleHighContrast,
      toggleVoiceNarration,
      resetPreferences,
    }),
    [
      preferences,
      setTheme,
      toggleTheme,
      setFontScale,
      stepFontScale,
      setColorMode,
      toggleHighContrast,
      toggleVoiceNarration,
      resetPreferences,
    ]
  )

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
}

/** Hook de acceso a las preferencias de accesibilidad. */
export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) throw new Error('useAccessibility debe usarse dentro de <AccessibilityProvider>')
  return context
}
