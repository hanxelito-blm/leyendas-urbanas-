/**
 * components/ui/ConfirmModal.jsx
 * -----------------------------------------------------------------------------
 * Modal de confirmacion generico y accesible.
 * - Se cierra con Escape o clic fuera.
 * - Maneja foco correctamente (trap).
 * -----------------------------------------------------------------------------
 */

import { useEffect, useRef } from 'react'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar',
  message = '¿Estás seguro?',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger', // 'danger' | 'primary' | 'warning'
  loading = false,
}) {
  const overlayRef = useRef(null)
  const dialogRef = useRef(null)
  const previousActiveElement = useRef(null)
  const focusableElementsRef = useRef([])

  // Trap focus
  useEffect(() => {
    if (!isOpen) return

    previousActiveElement.current = document.activeElement
    const dialog = dialogRef.current
    if (!dialog) return

    // Recopilar elementos enfocables
    const focusable = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusableElementsRef.current = Array.from(focusable)

    const first = focusableElementsRef.current[0]
    const last = focusableElementsRef.current[focusableElementsRef.current.length - 1]
    first?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'Tab') {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousActiveElement.current?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      confirmBg: 'var(--color-danger)',
      confirmHover: 'rgba(208, 43, 60, 0.9)',
      confirmBorder: 'var(--color-danger)',
      iconColor: 'var(--color-danger)',
      iconSvg: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      ),
    },
    warning: {
      confirmBg: 'var(--color-alert)',
      confirmHover: 'rgba(224, 169, 59, 0.9)',
      confirmBorder: 'var(--color-alert)',
      iconColor: 'var(--color-alert)',
      iconSvg: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      ),
    },
    primary: {
      confirmBg: 'var(--accent)',
      confirmHover: 'var(--accent-strong)',
      confirmBorder: 'var(--accent)',
      iconColor: 'var(--accent)',
      iconSvg: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
  }

  const style = variantStyles[variant] || variantStyles.danger

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[99999] grid place-items-center p-4 logout-modal-overlay"
      style={{ background: 'rgba(3, 8, 9, 0.78)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="logout-modal-panel w-full max-w-md"
        style={{
          background: 'linear-gradient(160deg, rgba(18, 14, 10, 0.98) 0%, rgba(9, 13, 16, 0.95) 100%)',
          border: '1px solid rgba(196, 158, 84, 0.7)',
          borderRadius: '18px',
          boxShadow: '0 0 0 1px rgba(16, 18, 17, 0.9), 0 0 30px rgba(0,0,0,0.72), 0 0 24px rgba(196, 158, 84, 0.14)',
          padding: '1.5rem 1.5rem 1.25rem',
          animation: 'logout-modal-enter 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
          position: 'relative',
          maxWidth: 'min(100%, 28rem)',
          width: '100%',
          overflow: 'visible',
          isolation: 'isolate',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at top, rgba(196, 158, 84, 0.14), transparent 45%)',
            pointerEvents: 'none',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className="flex-shrink-0 grid place-items-center rounded-xl"
                style={{
                  width: 46,
                  height: 46,
                  background: `${style.iconColor}18`,
                  border: `1px solid ${style.iconColor}55`,
                  color: style.iconColor,
                  boxShadow: `0 0 20px ${style.iconColor}30`,
                  animation: 'logout-pulse 1.8s ease-in-out infinite',
                }}
              >
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  {style.iconSvg}
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className="mb-2 inline-flex items-center rounded-full border px-2 py-1 uppercase tracking-[0.18em]"
                  style={{
                    fontSize: '0.6rem',
                    letterSpacing: '0.18em',
                    color: 'rgba(233, 214, 170, 0.9)',
                    borderColor: 'rgba(196, 158, 84, 0.5)',
                    background: 'rgba(196, 158, 84, 0.06)',
                  }}
                >
                  advertencia
                </div>
                <h2 id="confirm-title" className="heading-gothic text-primary" style={{ fontSize: '1.08rem', margin: 0 }}>
                  {title}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar dialogo"
              className="rounded-full border transition-all duration-200 hover:scale-110"
              style={{
                width: 32,
                height: 32,
                borderColor: 'rgba(196, 158, 84, 0.55)',
                background: 'rgba(255,255,255,0.02)',
                color: 'rgba(233,214,170,0.9)',
              }}
            >
              ×
            </button>
          </div>

          <p id="confirm-message" className="text-secondary mt-3" style={{ fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
            {message}
          </p>

          <div className="flex justify-end gap-2 mt-5 pt-3" style={{ borderTop: '1px solid rgba(196, 158, 84, 0.18)' }}>
            <button
              type="button"
              className="btn-base btn-ghost"
              onClick={onClose}
              disabled={loading}
              style={{
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                transform: 'translateY(0)',
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className="btn-base btn-solid"
              onClick={onConfirm}
              disabled={loading}
              style={{
                background: style.confirmBg,
                borderColor: style.confirmBorder,
                color: 'var(--bg-base)',
                boxShadow: `0 0 0 1px rgba(11,16,12,0.95), 0 0 0 3px rgba(65,48,17,0.18), 0 0 22px ${style.iconColor}25`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = style.confirmHover
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)'
                  e.currentTarget.style.filter = 'brightness(1.08)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = style.confirmBg
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.filter = 'brightness(1)'
                }
              }}
            >
              {loading ? 'Procesando...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}