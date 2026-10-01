/**
 * components/accessibility/AccessibilityPanel.jsx
 * -----------------------------------------------------------------------------
 * Boton flotante + panel de configuracion visual.
 *
 * Expone tres controles pedidos:
 *   1. Modo claro / oscuro (el claro mantiene tonos oscuros elegantes).
 *   2. Tamano del texto, de 87.5% a 150%.
 *   3. Modos de daltonismo mas frecuentes + contraste alto.
 *
 * El estado vive en `AccessibilityContext` y se persiste en localStorage.
 * -----------------------------------------------------------------------------
 */

import { useEffect, useRef, useState } from 'react'
import { COLOR_MODES, useAccessibility } from '../../context/AccessibilityContext'

export default function AccessibilityPanel() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const buttonRef = useRef(null)
  const {
    theme,
    fontScale,
    colorMode,
    highContrast,
    fontScaleLabel,
    toggleTheme,
    stepFontScale,
    setFontScale,
    setColorMode,
    toggleHighContrast,
    resetPreferences,
  } = useAccessibility()

  /** Escalas disponibles, en el mismo orden que el control deslizante. */
  const FONT_SCALES = [0.875, 1, 1.125, 1.25, 1.5]

  /* Cierra el panel al pulsar Escape o al hacer clic fuera de el. */
  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointerDown = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="a11y-fab"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Abrir ajustes de accesibilidad visual"
        title="Accesibilidad visual"
      >
        {theme === 'dark' ? (
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="a11y-panel"
          role="dialog"
          aria-label="Ajustes de accesibilidad visual"
        >
          {/* ── Tema ─────────────────────────────────────────────────────── */}
          <div className="a11y-group">
            <h3 className="field-label">Modo de visualizacion</h3>
            <button type="button" className="a11y-option" onClick={toggleTheme} aria-pressed={false}>
              <span>{theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}</span>
              <span className="badge">{theme === 'dark' ? 'Oscuro profundo' : 'Claro elegante'}</span>
            </button>
            <div className="flex gap-2 mt-2">
              {[
                { id: 'dark', label: 'Oscuro' },
                { id: 'light', label: 'Claro' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="a11y-option flex-1"
                  aria-pressed={theme === option.id}
                  onClick={() => (theme === option.id ? null : toggleTheme())}
                >
                  <span className="a11y-swatch" style={{ background: option.id === 'dark' ? '#020403' : '#243b31' }} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Tamano del texto ─────────────────────────────────────────── */}
          <div className="a11y-group">
            <h3 className="field-label">Tamano del texto</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-base btn-ghost"
                onClick={() => stepFontScale(-1)}
                aria-label="Reducir tamano del texto"
              >
                A-
              </button>
              <span className="text-scale-label" aria-live="polite">
                {fontScaleLabel}
              </span>
              <button
                type="button"
                className="btn-base btn-ghost"
                onClick={() => stepFontScale(1)}
                aria-label="Aumentar tamano del texto"
              >
                A+
              </button>
            </div>
            <input
              type="range"
              min="0"
              max={FONT_SCALES.length - 1}
              step="1"
              value={Math.max(FONT_SCALES.indexOf(fontScale), 0)}
              onChange={(event) => setFontScale(FONT_SCALES[Number(event.target.value)])}
              className="w-full mt-3"
              aria-label="Escala tipografica"
            />
          </div>

          {/* ── Daltonismo ───────────────────────────────────────────────── */}
          <div className="a11y-group">
            <h3 className="field-label">Modo de daltonismo</h3>
            {COLOR_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className="a11y-option"
                aria-pressed={colorMode === mode.id}
                onClick={() => setColorMode(mode.id)}
              >
                <span className="flex flex-col items-start">
                  <span>{mode.label}</span>
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {mode.description}
                  </span>
                </span>
                <span className="badge">{mode.prevalence}</span>
              </button>
            ))}
          </div>

          {/* ── Contraste y reinicio ─────────────────────────────────────── */}
          <div className="a11y-group">
            <button
              type="button"
              className="a11y-option"
              aria-pressed={highContrast}
              onClick={toggleHighContrast}
            >
              <span>Contraste alto</span>
              <span className="badge">{highContrast ? 'Activo' : 'Inactivo'}</span>
            </button>
            <button type="button" className="a11y-option mt-1" onClick={resetPreferences}>
              <span>Restablecer ajustes</span>
              <span className="text-accent">↺</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
