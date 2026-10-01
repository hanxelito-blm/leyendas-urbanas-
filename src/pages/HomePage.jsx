/**
 * pages/HomePage.jsx
 * -----------------------------------------------------------------------------
 * Portada del portal adaptada para laptops y pantallas anchas.
 * Incluye accesos directos al mapa, comunidad, expediciones, y categorías del foro.
 * -----------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLegends, getTopLegends, getForumCategories, getExpeditions } from '../services/dbService'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { isAuthenticated, user, hasRole } = useAuth()
  const [legends, setLegends] = useState([])
  const [top, setTop] = useState([])
  const [categories, setCategories] = useState([])
  const [expeditions, setExpeditions] = useState([])

  useEffect(() => {
    Promise.all([getLegends(), getTopLegends(4), getForumCategories(), getExpeditions()]).then(
      ([legendList, topList, categoryList, expeditionList]) => {
        setLegends(legendList)
        setTop(topList)
        setCategories(categoryList)
        setExpeditions(expeditionList)
      }
    )
  }, [])

  /** Accesos principales del portal. */
  const entries = [
    {
      to: '/mapa',
      title: 'Mapa Interactivo',
      subtitle: `${legends.length} leyendas geolocalizadas en Costa Rica con audio 8D y alerta de peligro.`,
      icon: (
        <svg width="28" height="28" fill="none" stroke="var(--accent)" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      to: '/comunidad',
      title: 'Comunidad Secreta',
      subtitle: `${categories.length} foros para compartir testimonios, debates paranormales y avistamientos.`,
      icon: (
        <svg width="28" height="28" fill="none" stroke="var(--accent)" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a3 3 0 106 0 3 3 0 00-6 0zm6 0a3 3 0 106 0 3 3 0 00-6 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-2a6 6 0 00-12 0v2m12 0v-2a6 6 0 00-6-6 6 6 0 00-6 6v2m6 0v4a2 2 0 002 2h4a2 2 0 002-2v-4" />
        </svg>
      ),
      badge: isAuthenticated ? null : 'Privado',
    },
    {
      to: '/expediciones',
      title: 'Expediciones Guiadas',
      subtitle: `${expeditions.length} rutas programadas a sitios de apariciones con guías especializados.`,
      icon: (
        <svg width="28" height="28" fill="none" stroke="var(--accent)" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1 3-6z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-10 py-6">
      {/* 1. HERO - Introducción y llamado a la acción */}
      <section className="app-container text-center flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(0,245,212,0.08)] border border-[rgba(0,245,212,0.3)] text-[#00F5D4] text-xs font-semibold tracking-widest uppercase mb-1">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Archivo del Folclore y Apariciones Sobrenaturales</span>
        </div>
        <h1 className="heading-display text-accent" style={{ fontSize: '2.4rem', lineHeight: 1.15 }}>
          LEYENDAS CR
        </h1>
        <p className="text-secondary max-w-2xl text-sm leading-relaxed">
          Explora los mitos, espíritus y relatos sombríos de Costa Rica. Escucha narraciones sonoras inmersivas,
          descubre su nivel de peligro y navega por el mapa interactivo en pantalla completa.
        </p>

        {isAuthenticated ? (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <span className="badge badge-role">{user.displayName}</span>
            <span className="badge">{user.role}</span>
            {hasRole('admin') && (
              <Link to="/admin" className="btn-base btn-accent">
                Panel de administración
              </Link>
            )}
            <Link to="/mapa" className="btn-base btn-accent">
              Abrir Mapa Interactivo
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <Link to="/login" className="btn-base btn-solid flex items-center gap-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Iniciar Sesión</span>
            </Link>
          </div>
        )}
      </section>

      {/* 2. ACCESOS DIRECTOS */}
      <section className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 max-w-[1700px] mx-auto">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Link
              key={entry.to}
              to={entry.to}
              className="card-surface min-w-0 p-5 flex flex-col gap-2 hover:border-[#00F5D4] transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between">
                {entry.icon}
                {entry.badge && <span className="badge">{entry.badge}</span>}
              </div>
              <h2 className="heading-gothic text-accent text-base">
                {entry.title}
              </h2>
              <p className="text-muted text-xs leading-relaxed">
                {entry.subtitle}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. CATEGORÍAS DE LA COMUNIDAD */}
      <section className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 max-w-[1700px] mx-auto">
        <div className="panel p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00F5D4] animate-pulse" />
                <h2 className="heading-gothic text-accent text-xl sm:text-2xl">
                  CATEGORÍAS DE LA COMUNIDAD
                </h2>
              </div>
              <p className="text-muted text-xs sm:text-sm">
                {categories.length} espacios de discusión para testimonios, debates e investigaciones
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <li key={category.id} className="min-w-0">
                <Link
                  to="/comunidad"
                  className="card-surface block w-full min-w-0 p-4 hover:border-[#00F5D4] transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: category.color,
                        flexShrink: 0,
                      }}
                    />
                    <div className="flex-1 min-w-0 break-words">
                      <h3 className="heading-gothic text-accent text-sm whitespace-normal break-words">
                        {category.name}
                      </h3>
                      <p className="text-muted text-xs whitespace-normal break-words">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </div>

          {!isAuthenticated && (
            <p className="text-muted mt-4 text-center text-xs">
              <Link to="/login" className="text-accent hover:underline">
                Inicia sesión
              </Link>{' '}
              para leer y publicar en el foro.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}