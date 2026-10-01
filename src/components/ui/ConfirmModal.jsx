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
      className="fixed inset-0 z-[99999] grid place-items-center p-4"
      style={{ background: 'var(--overlay)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
        style={{
          background: 'linear-gradient(160deg, var(--bg-surface) 0%, var(--bg-inset) 100%)',
          border: '1px solid var(--border-strong)',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-card)',
          padding: '1.5rem 1.5rem 1.25rem',
          animation: 'toast-enter 0.25s ease',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 grid place-items-center rounded-lg"
            style={{
              width: 44,
              height: 44,
              background: `${style.iconColor}15`,
              border: `1px solid ${style.iconColor}40`,
              color: style.iconColor,
            }}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              {style.iconSvg}
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2 id="confirm-title" className="heading-gothic text-primary" style={{ fontSize: '1.05rem' }}>
              {title}
            </h2>
            <p id="confirm-message" className="text-secondary mt-1" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            className="btn-base btn-ghost"
            onClick={onClose}
            disabled={loading}
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
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = style.confirmHover
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = style.confirmBg
            }}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}