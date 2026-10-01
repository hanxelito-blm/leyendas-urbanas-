/**
 * routes/AppRoutes.jsx
 * -----------------------------------------------------------------------------
 * Mapa completo de rutas del portal.
 *
 * PUBLICAS   : accesibles sin sesion.
 * PRIVADAS   : envueltas en <PrivateRoutes>, que valida sesion y rol antes
 *              de renderizar. Al no estar autenticado, el usuario es
 *              redirigido a /login conservando la ruta de destino.
 *
 *               /comunidad            -> cualquier usuario autenticado
 *               /comunidad/:postId    -> detalle de publicacion
 *               /moderacion           -> moderador + admin
 *               /admin                -> solo admin
 * -----------------------------------------------------------------------------
 */

import { Route, Routes } from 'react-router-dom'
import PrivateRoutes, { AdminOnly, StaffOnly, AuthenticatedOnly } from './PrivateRoutes'

import HomePage from '../pages/HomePage'
import MapPage from '../pages/MapPage'
import CommunityForum from '../pages/CommunityForum'
import ExpeditionsPage from '../pages/ExpeditionsPage'
import LoginPage from '../pages/LoginPage'
import AdminDashboard from '../pages/AdminDashboard'
import ModerationPage from '../pages/ModerationPage'
import NotFoundPage from '../pages/NotFoundPage'

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Rutas publicas ─────────────────────────────────────────────── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/mapa" element={<MapPage />} />
      <Route path="/expediciones" element={<ExpeditionsPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* ── Rutas privadas ──────────────────────────────────────────────── */}
      <Route
        path="/comunidad"
        element={
          <AuthenticatedOnly>
            <CommunityForum />
          </AuthenticatedOnly>
        }
      />
      <Route
        path="/comunidad/:postId"
        element={
          <AuthenticatedOnly>
            <CommunityForum />
          </AuthenticatedOnly>
        }
      />
      <Route
        path="/moderacion"
        element={
          <StaffOnly>
            <ModerationPage />
          </StaffOnly>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminOnly>
            <AdminDashboard />
          </AdminOnly>
        }
      />

      {/* ── 404 ─────────────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

/* `PrivateRoutes` se reexporta para consumo externo (tests, Documentacion). */
export { PrivateRoutes }
