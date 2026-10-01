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
import { useLocation } from 'react-router-dom'
import { COLOR_MODES, useAccessibility } from '../../context/AccessibilityContext'

export default function AccessibilityPanel() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const buttonRef = useRef(null)
  const {
    theme,
    voiceNarration,
    fontScale,
    colorMode,
    highContrast,
    fontScaleLabel,
    setTheme,
    toggleVoiceNarration,
    stepFontScale,
    setFontScale,
    setColorMode,
    toggleHighContrast,
    resetPreferences,
  } = useAccessibility()

  /** Escalas disponibles, en el mismo orden que el control deslizante. */
  const FONT_SCALES = [0.875, 1, 1.125, 1.25, 1.5]

  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined
    const speech = window.speechSynthesis
    speech.cancel()
    if (!voiceNarration) return undefined

    let cancelled = false
    const speakHeading = () => {
      if (cancelled) return
      const heading = document.querySelector('main h1, main h2')?.textContent?.trim()
      if (!heading) return

      const spanishVoices = speech.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('es'))
      const latinoVoices = spanishVoices.filter((voice) =>
        /^es-(419|mx|ar|bo|cl|co|cr|cu|do|ec|sv|gt|hn|ni|pa|py|pe|pr|us|uy|ve)(-|$)/i.test(voice.lang) ||
        /latino|latin american|mexico|argentina|colombia|costa rica/i.test(voice.name)
      )
      const voicePool = latinoVoices.length ? latinoVoices : spanishVoices
      const deepVoice = voicePool.find((voice) => /male|masculino|jorge|david|pablo|diego|raul|raúl|alvaro|álvaro|enrique/i.test(voice.name))
      const narration = new SpeechSynthesisUtterance(heading)
      narration.lang = deepVoice?.lang || voicePool[0]?.lang || 'es-419'
      narration.pitch = 0
      narration.rate = 0.9
      narration.volume = 0.9
      narration.voice = deepVoice || spanishVoices[0] || null
      speech.speak(narration)
    }

    const timeoutId = window.setTimeout(() => {
      if (speech.getVoices().length > 0) {
        speakHeading()
      } else {
        speech.addEventListener('voiceschanged', speakHeading, { once: true })
      }
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      speech.removeEventListener('voiceschanged', speakHeading)
      speech.cancel()
    }
  }, [location.pathname, voiceNarration])

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
        className="a11y-nav-button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Abrir ajustes de accesibilidad visual"
        title="Accesibilidad visual"
      >
        <svg width="21" height="21" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.25-6 9.75-6 9.75 6 9.75 6-3.25 6-9.75 6-9.75-6-9.75-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
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
            <div className="flex gap-2">
              {[
                { id: 'dark', label: 'Oscuro', swatch: '#020403' },
                { id: 'light', label: 'Claro', swatch: '#26392f' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="a11y-option flex-1"
                  aria-pressed={theme === option.id}
                  onClick={() => setTheme(option.id)}
                >
                  <span className="a11y-swatch" style={{ background: option.swatch }} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Voz ──────────────────────────────────────────────────────── */}
          <div className="a11y-group">
            <h3 className="field-label">Narración</h3>
            <button
              type="button"
              className="a11y-option"
              onClick={toggleVoiceNarration}
              aria-pressed={voiceNarration}
              disabled={!('speechSynthesis' in window)}
            >
              <span>Voz tenebrosa por página</span>
              <span className="badge">{voiceNarration ? 'Activa' : 'Inactiva'}</span>
            </button>
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
