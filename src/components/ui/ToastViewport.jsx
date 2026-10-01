/**
 * components/ui/ToastViewport.jsx
 * -----------------------------------------------------------------------------
 * Contenedor visual de los toasts. Accesible (role="status", aria-live) y
 * responsive: columna unica en movil, columna compacta en escritorio.
 * -----------------------------------------------------------------------------
 */

const TYPE_STYLES = {
  info: { border: 'var(--toast-info)', accent: '#00F5D4' },
  success: { border: 'var(--toast-success)', accent: '#3BCE7A' },
  warning: { border: 'var(--toast-warning)', accent: '#E0A93B' },
  error: { border: 'var(--toast-error)', accent: '#D02B3C' },
}

const TYPE_ICONS = {
  info: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  success: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
  warning: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />,
  error: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
}

export default function ToastViewport({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div
      className="toast-viewport"
      role="status"
      aria-live="polite"
      aria-label="Notificaciones del sistema"
    >
      {toasts.map((toast) => {
        const style = TYPE_STYLES[toast.type] || TYPE_STYLES.info
        return (
          <article
            key={toast.id}
            className="toast-card"
            style={{ '--toast-accent': style.accent, borderLeftColor: style.accent }}
          >
            <span className="toast-icon" style={{ color: style.accent }}>
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                {TYPE_ICONS[toast.type] || TYPE_ICONS.info}
              </svg>
            </span>

            <div className="toast-body">
              {toast.title && <h4 className="toast-title">{toast.title}</h4>}
              {toast.message && <p className="toast-message">{toast.message}</p>}
              {toast.action && (
                <button type="button" className="toast-action" onClick={toast.action.onClick}>
                  {toast.action.label}
                </button>
              )}
            </div>

            <button
              type="button"
              className="toast-close"
              onClick={() => onDismiss(toast.id)}
              aria-label={`Cerrar aviso: ${toast.title || 'notificacion'}`}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </article>
        )
      })}
    </div>
  )
}
