/**
 * pages/NotFoundPage.jsx
 * -----------------------------------------------------------------------------
 * Vista 404: se muestra cuando la ruta solicitada no existe en AppRoutes.
 * -----------------------------------------------------------------------------
 */

import { Link, useLocation } from 'react-router-dom'

export default function NotFoundPage() {
  const location = useLocation()

  return (
    <div className="app-container py-20 flex justify-center">
      <div className="panel max-w-md text-center flex flex-col items-center gap-3">
        <h1 className="heading-display text-accent" style={{ fontSize: '3rem', lineHeight: 1 }}>
          404
        </h1>
        <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
          La ruta <code style={{ color: 'var(--accent)' }}>{location.pathname}</code> no existe
          en el archivo.
        </p>
        <Link to="/" className="btn-base btn-accent mt-2">
          Regresar al inicio
        </Link>
      </div>
    </div>
  )
}
