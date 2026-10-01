/**
 * pages/ExpeditionsPage.jsx
 * -----------------------------------------------------------------------------
 * Sustituye el antiguo apartado "Encuentros paranormales" por las jornadas
 * programadas. Datos desde `db.json` mediante el servicio, con estado de
 * ocupacion y nivel de riesgo visible.
 * -----------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react'
import { getExpeditions, getProvinces } from '../services/dbService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ExpeditionsPage() {
  const { isAuthenticated } = useAuth()
  const toast = useToast()
  const [expeditions, setExpeditions] = useState([])
  const [provinces, setProvinces] = useState([])
  const [province, setProvince] = useState('')

  useEffect(() => {
    Promise.all([getExpeditions(), getProvinces()]).then(([list, provinceList]) => {
      setExpeditions(list)
      setProvinces(provinceList)
    })
  }, [])

  const visible = province ? expeditions.filter((item) => item.province === province) : expeditions

  const handleJoin = (expedition) => {
    if (!isAuthenticated) {
      toast.warning('Acceso restringido', 'Inicia sesion para unirte a las jornadas.')
      return
    }
    const message = encodeURIComponent(`Quiero unirme a la expedicion: ${expedition.name}`)
    window.open(`${expedition.contact}?text=${message}`, '_blank', 'noopener')
  }

  return (
    <div className="app-container flex flex-col gap-5 py-6">
      <header>
        <h1 className="heading-display text-accent" style={{ fontSize: '1.8rem' }}>
          Expediciones
        </h1>
        <p className="text-muted mt-1" style={{ fontSize: '0.85rem', maxWidth: '60ch' }}>
          Jornadas guiadas para visitar los lugares del archivo. Todas incluyen protocolo de
          seguridad, hora de salida y nivel de riesgo del sitio.
        </p>
      </header>

      <div className="panel" style={{ maxWidth: 280 }}>
        <label className="field-label" htmlFor="filtro-expediciones">
          Provincia
        </label>
        <select
          id="filtro-expediciones"
          className="field-select"
          value={province}
          onChange={(event) => setProvince(event.target.value)}
        >
          <option value="">Todas</option>
          {provinces.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((expedition) => {
          const percent = Math.round((expedition.joined / expedition.capacity) * 100)
          return (
            <article key={expedition.id} className="card-surface p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="badge">Dificultad {expedition.difficulty}</span>
                <span className={`badge danger-${expedition.dangerLevel}`}>
                  Riesgo {expedition.dangerLevel}
                </span>
              </div>

              <h2 className="heading-gothic text-accent" style={{ fontSize: '1rem' }}>
                {expedition.name}
              </h2>
              <p className="text-muted" style={{ fontSize: '0.76rem' }}>
                {expedition.province} · {new Date(expedition.date).toLocaleString('es-CR')}
              </p>
              <p className="text-secondary" style={{ fontSize: '0.84rem', lineHeight: 1.6, flex: 1 }}>
                {expedition.description}
              </p>

              <div>
                <div className="flex items-center justify-between" style={{ fontSize: '0.75rem' }}>
                  <span className="text-muted">Cupo</span>
                  <span className="text-secondary">
                    {expedition.joined}/{expedition.capacity}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 999,
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border-soft)',
                    marginTop: 5,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent)' }} />
                </div>
              </div>

              <button type="button" className="btn-base btn-accent mt-2" onClick={() => handleJoin(expedition)}>
                Unirme a la jornada
              </button>
            </article>
          )
        })}
      </section>

      {visible.length === 0 && (
        <p className="text-muted text-center py-10" style={{ fontSize: '0.88rem' }}>
          No hay expediciones programadas en esa provincia.
        </p>
      )}
    </div>
  )
}
