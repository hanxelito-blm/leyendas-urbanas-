/**
 * routes/PrivateRoutes.jsx
 * -----------------------------------------------------------------------------
 * Guardas de acceso para las rutas restringidas.
 *
 * Tres niveles de control, aplicados en este orden:
 *   1. `loading` -> muestra un estado de carga (evita "parpadeo" de la vista
 *      protegida mientras se restaura la sesion desde localStorage).
 *   2. Sin sesion -> redirige a /login guardando la ruta de destino, para
 *      devolver al usuario exactamente donde estaba.
 *   3. Rol insuficiente -> pantalla de acceso denegado con el rol actual y
 *      el rol requerido.
 *
 * La visibilidad tambien se aplica en la UI (navbar) y en cada vista, pero la
 * validacion real siempre ocurre aqui: ocultar un enlace no es seguridad.
 * -----------------------------------------------------------------------------
 */

import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * @param {{roles?: string[], children: JSX.Element}} props
 *  - `roles`: si se indica, la sesion debe pertenecer a uno de esos roles.
 */
export default function PrivateRoutes({ roles = [], children }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  /* 1. Restaurando la sesion */
  if (loading) {
    return (
      <div className="app-container py-16 flex flex-col items-center gap-3">
        <div className="skeleton" style={{ width: 220, height: 18 }} />
        <div className="skeleton" style={{ width: 300, height: 12 }} />
        <p className="text-muted" style={{ fontSize: '0.8rem' }}>
          Verificando credenciales...
        </p>
      </div>
    )
  }

  /* 2. Sin sesion: redireccion al inicio de sesion */
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  /* 3. Rol insuficiente */
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <AccessDenied required={roles} current={user.role} />
  }

  return children
}

/** Pantalla mostrada cuando el rol del usuario no es suficiente. */
function AccessDenied({ required, current }) {
  return (
    <div className="app-container py-16 flex justify-center">
      <div className="panel max-w-lg text-center flex flex-col items-center gap-3">
        <svg width="42" height="42" fill="none" stroke="var(--color-danger)" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <h2 className="heading-gothic text-accent" style={{ fontSize: '1.1rem' }}>
          Acceso restringido
        </h2>
        <p className="text-secondary" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
          Esta seccion requiere uno de estos roles:{' '}
          <strong style={{ color: 'var(--accent)' }}>{required.join(' · ')}</strong>. Tu cuenta
          actual tiene el rol <strong style={{ color: 'var(--color-alert)' }}>{current}</strong>.
        </p>
        <div className="flex gap-2 mt-2">
          <Link to="/" className="btn-base btn-ghost">
            Volver al inicio
          </Link>
          <Link to="/comunidad" className="btn-base btn-accent">
            Ir a la comunidad
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Atajos de uso en `AppRoutes`. */
export const AdminOnly = ({ children }) => <PrivateRoutes roles={['admin']}>{children}</PrivateRoutes>
export const StaffOnly = ({ children }) => <PrivateRoutes roles={['moderador', 'admin']}>{children}</PrivateRoutes>
export const AuthenticatedOnly = ({ children }) => <PrivateRoutes>{children}</PrivateRoutes>
