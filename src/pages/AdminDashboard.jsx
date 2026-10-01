/**
 * pages/AdminDashboard.jsx
 * -----------------------------------------------------------------------------
 * Panel de administracion (ruta privada, solo rol "admin").
 *
 * Se compone de VISTAS PARCIALES independientes, cada una encapsulada en su
 * propio componente dentro de `components/admin/`:
 *
 *   1. Resumen      -> KPIs, crecimiento, reparto por rol, contenido top.
 *   2. Usuarios     -> gestion de cuentas y asignacion de roles.
 *   3. Moderacion   -> cola de publicaciones (tambien disponible para
 *                      moderadores mediante StaffOnly en las rutas).
 *   4. Proyecciones  -> modulo de IA simulada, limitado por usuario.
 *
 * La navegacion entre parciales es local (`useState`), por lo que cambiar de
 * seccion no recarga los datos ya descargados.
 * -----------------------------------------------------------------------------
 */

import { useState } from 'react'
import OverviewView from '../components/admin/OverviewView'
import UsersView from '../components/admin/UsersView'
import ModerationView from '../components/admin/ModerationView'
import ProjectionsView from '../components/admin/ProjectionsView'
import { useAuth } from '../context/AuthContext'

/** Definicion de las vistas parciales del panel. */
const SECTIONS = [
  { id: 'resumen', label: 'Resumen y metricas', icon: 'chart' },
  { id: 'usuarios', label: 'Usuarios y roles', icon: 'users' },
  { id: 'moderacion', label: 'Moderacion del foro', icon: 'shield' },
  { id: 'proyecciones', label: 'Proyecciones IA', icon: 'spark' },
]

const ICONS = {
  chart: 'M3 13h4v8H3v-8zm7-6h4v14h-4V7zm7-4h4v18h-4V3z',
  users: 'M9 10a3 3 0 100-6 3 3 0 000 6zm0 0v9m-6 2h12M17 11a3 3 0 100-6m-1 14h5v-6',
  shield: 'M12 3l8 3v6c0 4.5-3.2 8.3-8 9-4.8-.7-8-4.5-8-9V6l8-3z',
  spark: 'M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z',
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [section, setSection] = useState('resumen')

  return (
    <div className="app-container flex flex-col gap-5 py-6">
      {/* Encabezado */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label" style={{ marginBottom: 2 }}>
            Panel de administracion
          </p>
          <h1 className="heading-display text-accent" style={{ fontSize: '1.7rem' }}>
            Centro de control
          </h1>
          <p className="text-muted mt-1" style={{ fontSize: '0.82rem' }}>
            Sesion activa: {user?.displayName} · rol {user?.role}
          </p>
        </div>
      </header>

      {/* Navegacion de vistas parciales */}
      <nav className="panel" aria-label="Secciones del panel">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="a11y-option"
              aria-pressed={section === item.id}
              onClick={() => setSection(item.id)}
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[item.icon]} />
                </svg>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Contenido de la vista parcial activa */}
      <main>
        {section === 'resumen' && <OverviewView />}
        {section === 'usuarios' && <UsersView />}
        {section === 'moderacion' && <ModerationView />}
        {section === 'proyecciones' && <ProjectionsView />}
      </main>
    </div>
  )
}
