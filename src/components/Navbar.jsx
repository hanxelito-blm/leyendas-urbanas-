/**
 * components/Navbar.jsx
 * -----------------------------------------------------------------------------
 * Barra de navegacion responsive.
 *
 * - Escritorio: enlaces horizontales + acciones de cuenta.
 * - Movil: menu desplegable que ocupa el ancho completo.
 *
 * Los enlaces se filtran por rol: el panel de administracion solo aparece
 * para cuentas con rol "admin" y el de moderacion para "moderador"/"admin".
 * La proteccion real esta en `routes/PrivateRoutes.jsx`; aqui solo se oculta
 * lo que el usuario no puede usar.
 * -----------------------------------------------------------------------------
 */

import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ConfirmModal from './ui/ConfirmModal'

/** Enlaces publicos del sitio. */
const PUBLIC_LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/mapa', label: 'Mapa' },
  { to: '/comunidad', label: 'Comunidad', requiresAuth: true },
  { to: '/expediciones', label: 'Expediciones' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const { user, isAuthenticated, hasRole, logout } = useAuth()
  const navigate = useNavigate()

  /** Filtra enlaces segun la sesion y el rol actual. */
  const links = PUBLIC_LINKS.filter((link) => !link.requiresAuth || isAuthenticated)

  const handleLogout = async () => {
    await logout()
    setMenuOpen(false)
    setLogoutOpen(false)
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="app-container flex items-center justify-between gap-4 py-3">
        {/* Marca */}
        <Link to="/" className="flex items-center gap-3 shrink-0" onClick={() => setMenuOpen(false)}>
          <span
            className="grid place-items-center rounded"
            style={{
              width: 40,
              height: 40,
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-surface)',
            }}
          >
            <svg width="22" height="22" fill="none" stroke="var(--accent)" viewBox="0 0 24 24" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m6 3l-5.447-2.724A1 1 0 0115 4.618v10.764a1 1 0 01-.553.894L9 19" />
            </svg>
          </span>
          <span className="leading-none">
            <span className="heading-display block text-lg" style={{ color: 'var(--accent)' }}>
              LEYENDAS CR
            </span>
            <span className="block text-muted" style={{ fontSize: '0.62rem', letterSpacing: '0.25em' }}>
              MAPAS DEL MAS ALLA
            </span>
          </span>
        </Link>

        {/* Enlaces de escritorio */}
        <nav className="hidden lg:flex items-center gap-3" aria-label="Navegacion principal">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
          {hasRole('admin') && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              Administracion
            </NavLink>
          )}
        </nav>

        {/* Acciones de escritorio */}
        <div className="hidden lg:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="badge badge-role" title={user.email}>
                {user.displayName}
              </span>
              <span className="text-muted" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                {user.role.toUpperCase()}
              </span>
              <button type="button" className="btn-base btn-ghost" onClick={() => setLogoutOpen(true)}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-base btn-solid">
                Ingresar
              </Link>
            </>
          )}
        </div>

        {/* Boton de menu (movil) */}
        <button
          type="button"
          className="lg:hidden btn-base btn-ghost"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-controls="menu-movil"
          aria-label="Abrir menu de navegacion"
        >
          {menuOpen ? (
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu desplegable en movil */}
      {menuOpen && (
        <div id="menu-movil" className="lg:hidden" style={{ borderTop: '1px solid var(--border-soft)' }}>
          <nav className="app-container flex flex-col gap-1 py-3" aria-label="Navegacion movil">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
            {hasRole('admin') && (
              <NavLink
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                Administracion
              </NavLink>
            )}

            <hr className="divider my-2" />

            {isAuthenticated ? (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="badge badge-role">{user.displayName}</span>
                <button
                  type="button"
                  className="btn-base btn-ghost"
                  onClick={() => {
                    setMenuOpen(false)
                    setLogoutOpen(true)
                  }}
                >
                  Cerrar sesion
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-1">
                <Link to="/login" className="btn-base btn-solid" onClick={() => setMenuOpen(false)}>
                  Ingresar
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Modal de confirmación para cerrar sesión */}
      <ConfirmModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        title="Cerrar sesión"
        message="¿Estás seguro de que deseas salir del portal de LEYENDAS CR?"
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </header>
  )
}
