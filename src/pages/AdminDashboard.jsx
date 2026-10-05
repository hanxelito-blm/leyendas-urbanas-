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
import { Link } from 'react-router-dom'
import OverviewView from '../components/admin/OverviewView'
import UsersView from '../components/admin/UsersView'
import ModerationView from '../components/admin/ModerationView'
import ProjectionsView from '../components/admin/ProjectionsView'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getDatabase, getUsers } from '../services/dbService'
import { listPosts } from '../services/forumService'
import { readValue } from '../services/storage'

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
  map: 'M3 8l7-4 8 4 5-3v13l-5 3-8-4-7 4V8zm7 0v13m8-9v13',
  lock: 'M7 10V7a5 5 0 0110 0v3m-9 0h10a2 2 0 012 2v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7a2 2 0 012-2z',
  tool: 'M12 2v6m0 0L8 6m4 2l4-2M5 12a7 7 0 1114 0 7 7 0 01-14 0z',
}

const ADMIN_TOOLS = [
  {
    id: 'backup',
    label: 'Respaldo del archivo',
    description: 'Descarga los datos base y cambios locales del portal',
    action: 'Descargar copia JSON',
    icon: 'tool',
  },
  {
    id: 'forum-report',
    label: 'Actividad del foro',
    description: 'Exporta publicaciones y comentarios para revisión externa',
    action: 'Descargar reporte CSV',
    icon: 'chart',
  },
  {
    id: 'audit',
    label: 'Auditoría de integridad',
    description: 'Busca referencias faltantes y datos fuera de rango',
    action: 'Ejecutar revisión',
    icon: 'shield',
  },
  {
    id: 'legend-catalog',
    label: 'Catálogo de leyendas',
    description: 'Exporta ubicaciones, categorías, riesgo y visitas',
    action: 'Descargar catálogo CSV',
    icon: 'map',
  },
]

function downloadFile(content, mimeType, fileName) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function toCsv(rows) {
  return `\ufeff${rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')}`
}

function datedFileName(prefix, extension) {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.${extension}`
}

const ADMIN_PERMISSIONS = [
  'admin:panel',
  'admin:users',
  'admin:ai',
  'forum:moderate',
  'read:legends',
  'use:map',
  'forum:write',
  'profile:read',
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [section, setSection] = useState('resumen')
  const [activeTool, setActiveTool] = useState(null)
  const [lastTool, setLastTool] = useState(null)
  const [auditResult, setAuditResult] = useState(null)

  const runTool = async (toolId) => {
    setActiveTool(toolId)
    setAuditResult(null)
    try {
      if (toolId === 'backup') {
        const [database, users] = await Promise.all([getDatabase(), getUsers()])
        database.users = users.map((account) =>
          Object.fromEntries(
            Object.entries(account).filter(([key]) => !['password', 'passwordHash'].includes(key))
          )
        )
        const localChanges = Object.fromEntries(
          ['forum-posts', 'forum-comments', 'forum-comment-likes', 'forum-post-overrides']
            .map((key) => [key, readValue(key, key === 'forum-post-overrides' ? {} : [])])
        )
        downloadFile(
          JSON.stringify({ exportedAt: new Date().toISOString(), database, localChanges }, null, 2),
          'application/json;charset=utf-8',
          datedFileName('respaldo-leyendas-cr', 'json')
        )
        toast.success('Respaldo preparado', 'Se descargó el JSON sin contraseñas ni hashes de usuarios.')
      }

      if (toolId === 'forum-report') {
        const [database, posts] = await Promise.all([getDatabase(), listPosts({ includeHidden: true })])
        const comments = [...database.forum.comments, ...readValue('forum-comments', [])]
        const rows = [
          ['tipo', 'id', 'publicacion_id', 'contenido', 'autor_id', 'fecha', 'estado', 'me_gusta'],
          ...posts.map((post) => ['publicacion', post.id, post.id, `${post.title}\n${post.excerpt}`, post.authorId, post.createdAt, post.status, post.likes]),
          ...comments.map((comment) => ['comentario', comment.id, comment.postId, comment.body, comment.authorId, comment.createdAt, comment.status, comment.likes]),
        ]
        downloadFile(toCsv(rows), 'text/csv;charset=utf-8', datedFileName('actividad-foro', 'csv'))
        toast.success('Reporte del foro descargado', `${posts.length} publicaciones y ${comments.length} comentarios incluidos.`)
      }

      if (toolId === 'audit') {
        const [database, posts, users] = await Promise.all([
          getDatabase(),
          listPosts({ includeHidden: true }),
          getUsers(),
        ])
        const comments = [...database.forum.comments, ...readValue('forum-comments', [])]
        const userIds = new Set(users.map((item) => item.id))
        const postIds = new Set(posts.map((item) => item.id))
        const categoryIds = new Set(database.forum.categories.map((item) => item.id))
        const legendIds = new Set(database.legends.map((item) => item.id))
        const commentIds = new Set(comments.map((item) => item.id))
        const findings = []

        posts.forEach((post) => {
          if (!userIds.has(post.authorId)) findings.push({ record: post.id, issue: 'Autor de publicación inexistente' })
          if (!categoryIds.has(post.categoryId)) findings.push({ record: post.id, issue: 'Categoría de publicación inexistente' })
          if (post.relatedLegendId && !legendIds.has(post.relatedLegendId)) findings.push({ record: post.id, issue: 'Leyenda relacionada inexistente' })
        })
        comments.forEach((comment) => {
          if (!postIds.has(comment.postId)) findings.push({ record: comment.id, issue: 'Publicación del comentario inexistente' })
          if (!userIds.has(comment.authorId)) findings.push({ record: comment.id, issue: 'Autor del comentario inexistente' })
          if (comment.parentId && !commentIds.has(comment.parentId)) findings.push({ record: comment.id, issue: 'Comentario padre inexistente' })
        })
        database.legends.forEach((legend) => {
          const coordinates = legend.coordinates
          if (!Array.isArray(coordinates) || coordinates.length !== 2 || !coordinates.every(Number.isFinite)) {
            findings.push({ record: legend.id, issue: 'Coordenadas inválidas o incompletas' })
          }
          if (!Number.isInteger(legend.danger?.level) || legend.danger.level < 1 || legend.danger.level > 4) {
            findings.push({ record: legend.id, issue: 'Nivel de riesgo fuera del rango 1-4' })
          }
        })

        setAuditResult({ findings, checked: posts.length + comments.length + database.legends.length })
        toast[findings.length ? 'warning' : 'success'](
          findings.length ? 'Auditoría completada con observaciones' : 'Auditoría completada',
          findings.length ? `Se encontraron ${findings.length} problemas en ${posts.length + comments.length + database.legends.length} registros.` : 'No se encontraron referencias faltantes ni valores fuera de rango.'
        )
      }

      if (toolId === 'legend-catalog') {
        const database = await getDatabase()
        const rows = [
          ['id', 'titulo', 'categoria', 'provincia', 'ubicacion', 'latitud', 'longitud', 'riesgo', 'vistas', 'avistamientos'],
          ...database.legends.map((legend) => [
            legend.id,
            legend.title,
            legend.category,
            legend.province,
            legend.locationName,
            legend.coordinates?.[0],
            legend.coordinates?.[1],
            legend.danger?.level,
            legend.stats?.views,
            legend.stats?.sightings,
          ]),
        ]
        downloadFile(toCsv(rows), 'text/csv;charset=utf-8', datedFileName('catalogo-leyendas', 'csv'))
        toast.success('Catálogo descargado', `${database.legends.length} leyendas incluidas en el CSV.`)
      }

      setLastTool(toolId)
    } catch (error) {
      toast.error('No se pudo completar la herramienta', error.message)
    } finally {
      setActiveTool(null)
    }
  }

  const initials = (user?.displayName || 'Admin')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const adminStats = [
    { label: 'Usuarios activos', value: '18.4K' },
    { label: 'Sesiones hoy', value: '3.2K' },
    { label: 'Alertas', value: '07' },
    { label: 'Estado', value: 'Online' },
  ]

  return (
    <div className="app-container flex flex-col gap-5 py-6">
      <header className="panel" style={{ background: 'linear-gradient(135deg, rgba(18,24,33,0.96), rgba(33,42,58,0.9))' }}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center rounded-full border"
              style={{
                width: 76,
                height: 76,
                background: 'linear-gradient(135deg, rgba(0,245,212,0.18), rgba(124,92,255,0.18))',
                borderColor: 'rgba(0,245,212,0.5)',
                color: 'var(--accent)',
                fontSize: '1.5rem',
                fontWeight: 700,
              }}
            >
              {initials}
            </div>

            <div>
              <p className="field-label" style={{ marginBottom: 4 }}>
                Perfil administrativo
              </p>
              <h1 className="heading-display text-accent" style={{ fontSize: '1.9rem', lineHeight: 1.1 }}>
                {user?.displayName || 'Guardian del Archivo'}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="badge badge-role">Administrador</span>
                <span className="badge">{user?.province || 'San José'}</span>
                <span className="badge">Nivel máximo</span>
              </div>
              <p className="text-muted mt-2" style={{ fontSize: '0.82rem' }}>
                Sesion activa: {user?.email || 'admin@leyendascr.cr'} · {user?.role || 'admin'}
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[420px]">
            {adminStats.map((item) => (
              <div key={item.label} className="card-surface p-3 min-w-0">
                <p className="text-muted" style={{ fontSize: '0.66rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {item.label}
                </p>
                <p className="heading-gothic mt-1" style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="panel p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="heading-gothic text-accent" style={{ fontSize: '1.1rem' }}>
              Herramientas de trabajo
            </h2>
            <span className="badge">Acceso directo</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {ADMIN_TOOLS.map((tool) => {
              const isActive = activeTool === tool.id
              const hasRun = lastTool === tool.id

              return (
                <button
                  key={tool.id}
                  type="button"
                  className={`card-surface text-left p-3 transition ${isActive ? 'border-[var(--accent)] bg-[rgba(0,245,212,0.04)]' : 'hover:border-[var(--accent)]'}`}
                  onClick={() => runTool(tool.id)}
                  disabled={isActive}
                  title={tool.action}
                  aria-label={`${tool.action}: ${tool.label}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[tool.icon]} />
                      </svg>
                      <span className="font-semibold text-primary">{tool.label}</span>
                    </div>
                    <span className={`badge ${isActive ? 'badge-role' : ''}`} style={{ fontSize: '0.6rem' }}>
                      {isActive ? 'Ejecutando' : hasRun ? 'Listo' : 'Herramienta'}
                    </span>
                  </div>

                  <p className="text-muted" style={{ fontSize: '0.72rem', lineHeight: 1.5 }}>
                    {tool.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border-soft)] pt-2">
                    <span className="text-muted" style={{ fontSize: '0.64rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Acción
                    </span>
                    <span className="text-primary" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {tool.action}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {auditResult && (
            <section className="mt-4 rounded border border-[var(--border-soft)] p-3" aria-live="polite">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-primary">Resultado de auditoría</h3>
                <span className="badge">{auditResult.checked} registros revisados</span>
              </div>
              {auditResult.findings.length === 0 ? (
                <p className="text-muted mt-2" style={{ fontSize: '0.8rem' }}>No se encontraron problemas.</p>
              ) : (
                <ul className="mt-2 flex max-h-52 flex-col gap-1 overflow-y-auto" style={{ fontSize: '0.78rem' }}>
                  {auditResult.findings.map((finding, index) => (
                    <li key={`${finding.record}-${finding.issue}-${index}`} className="text-secondary">
                      <span className="text-accent">{finding.record}</span>: {finding.issue}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="heading-gothic text-accent" style={{ fontSize: '1.1rem' }}>
              Permisos activos
            </h2>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.lock} />
            </svg>
          </div>

          <ul className="flex flex-col gap-2">
            {ADMIN_PERMISSIONS.map((permission) => (
              <li
                key={permission}
                className="flex items-center justify-between gap-2 rounded border border-[var(--border-soft)] px-2 py-1.5 text-sm"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <span className="text-primary">{permission}</span>
                <span className="badge" style={{ fontSize: '0.62rem' }}>ON</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/mapa" className="btn-base btn-ghost">Abrir mapa</Link>
            <Link to="/comunidad" className="btn-base btn-ghost">Foro</Link>
            <Link to="/expediciones" className="btn-base btn-ghost">Expediciones</Link>
          </div>
        </div>
      </section>

      {/* Navegacion de vistas parciales */}
      <nav className="panel" aria-label="Secciones del panel">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="a11y-option"
              aria-pressed={section === item.id}
              onClick={() => {
                setSection(item.id)
                setToolAction(null)
              }}
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
