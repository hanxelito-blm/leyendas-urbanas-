/**
 * components/admin/ProjectionsView.jsx
 * -----------------------------------------------------------------------------
 * Modulo de proyecciones impulsado por una IA SIMULADA.
 *
 * Dos bloques:
 *   1. Consumo agregado de la IA (barras horizontales por usuario).
 *   2. Generador de proyección personalizada: usa el comportamiento del
 *      usuario autenticado y respeta un limite diario de consultas.
 *
 * El limite se aplica en `services/aiService.js` y se comunica al usuario
 * con una barra de progreso visible.
 * -----------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react'
import { generateProjection, getUsageForUser } from '../../services/aiService'
import { getAiUsage } from '../../services/metricsService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { LineChart, HorizontalBarChart } from './Charts'

export default function ProjectionsView() {
  const { user } = useAuth()
  const toast = useToast()
  const [usageStats, setUsageStats] = useState({ used: 0, limit: 10, remaining: 10 })
  const [aggregate, setAggregate] = useState([])
  const [projection, setProjection] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [factors, setFactors] = useState({ engagement: null, retention: null, contentSupply: null })

  useEffect(() => {
    getAiUsage().then(setAggregate)
    if (user) setUsageStats(getUsageForUser(user.id))
  }, [user, projection])

  /** Dispara la proyección y descuenta una consulta del limite diario. */
  const runProjection = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await generateProjection({
        user,
        factors: {
          engagement: factors.engagement,
          retention: factors.retention,
          contentSupply: factors.contentSupply,
        },
      })
      setProjection(result)
      setUsageStats(getUsageForUser(user.id))
      toast.success('Proyeccion generada', `Modelo ${result.model} · confianza ${Math.round(result.confidence * 100)}%`)
    } catch (projectionError) {
      setError(projectionError.message)
      toast.error('No se pudo proyectar', projectionError.message)
    } finally {
      setLoading(false)
    }
  }

  const usedPercent = usageStats.limit > 0 ? (usageStats.used / usageStats.limit) * 100 : 0

  return (
    <div className="flex flex-col gap-5">
      {/* Consumo agregado */}
      <section className="panel">
        <h2 className="panel-title">Consumo de la IA por cuenta</h2>
        <p className="panel-subtitle mb-4">
          Consultas usadas hoy frente al limite diario configurado en `db.json`.
        </p>
        <HorizontalBarChart data={aggregate} />
      </section>

      {/* Generador */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel flex flex-col gap-4">
          <div>
            <h2 className="panel-title">Proyeccion personalizada</h2>
            <p className="panel-subtitle">
              El modelo `leyendas-oracle-v1` estima el crecimiento de tu actividad en la
              comunidad a 60 dias.
            </p>
          </div>

          {/* Limite diario */}
          <div>
            <div className="flex items-center justify-between" style={{ fontSize: '0.78rem' }}>
              <span className="text-secondary">Consultas de hoy</span>
              <span className={usageStats.remaining === 0 ? 'badge danger-3' : 'badge'}>
                {usageStats.used} / {usageStats.limit}
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-soft)',
                marginTop: 6,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(usedPercent, 100)}%`,
                  height: '100%',
                  background: usageStats.remaining === 0 ? 'var(--color-alert)' : 'var(--accent)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <p className="text-muted mt-2" style={{ fontSize: '0.72rem' }}>
              El contador se reinicia a medianoche. Quedan {usageStats.remaining} consultas.
            </p>
          </div>

          {/* Ajuste manual de factores */}
          <div className="flex flex-col gap-3">
            <span className="field-label">Ajustar factores (opcional)</span>
            {[
              { key: 'engagement', label: 'Participacion en el foro' },
              { key: 'retention', label: 'Permanencia en la plataforma' },
              { key: 'contentSupply', label: 'Capacidad de crear contenido' },
            ].map((factor) => (
              <label key={factor.key} className="flex flex-col gap-1">
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {factor.label}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={projection?.factors?.[factor.key] ?? factors[factor.key] ?? ''}
                  placeholder="auto"
                  onChange={(event) =>
                    setFactors((prev) => ({ ...prev, [factor.key]: Number(event.target.value) }))
                  }
                />
              </label>
            ))}
            <p className="text-muted" style={{ fontSize: '0.72rem' }}>
              Sin ajuste, el modelo usa los factores calculados a partir de tu actividad real.
            </p>
          </div>

          <button
            type="button"
            className="btn-base btn-solid self-start"
            onClick={runProjection}
            disabled={loading || usageStats.remaining === 0}
          >
            {loading ? 'Proyectando...' : 'Generar proyeccion'}
          </button>

          {error && <p className="field-error">{error}</p>}
        </div>

        {/* Resultado */}
        <div className="panel flex flex-col gap-4">
          <div>
            <h2 className="panel-title">Resultado</h2>
            <p className="panel-subtitle">
              {projection
                ? `Generada el ${new Date(projection.generatedAt).toLocaleString('es-CR')}`
                : 'Aun no has generado ninguna proyeccion.'}
            </p>
          </div>

          {projection ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Crecimiento estimado" value={`${projection.growthRate}%`} />
                <Metric label="Alcance proyectado" value={projection.projectedReach.toLocaleString('es-CR')} />
                <Metric label="Confianza" value={`${Math.round(projection.confidence * 100)}%`} />
                <Metric
                  label="Riesgo"
                  value={projection.riskLevel}
                  color={
                    projection.riskLevel === 'alto'
                      ? 'var(--color-danger)'
                      : projection.riskLevel === 'medio'
                        ? 'var(--color-alert)'
                        : 'var(--color-ok)'
                  }
                />
              </div>

              <LineChart
                data={projection.series}
                series={[
                  { key: 'activeUsers', label: 'Usuarios activos estimados', color: '#00F5D4' },
                  { key: 'posts', label: 'Publicaciones estimadas', color: '#E0A93B' },
                ]}
                height={200}
              />

              <div>
                <h3 className="field-label">Recomendaciones personalizadas</h3>
                <ul className="flex flex-col gap-2 m-0 p-0 list-none">
                  {projection.recommendations.map((item) => (
                    <li key={item.id} className="card-surface p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-primary" style={{ fontSize: '0.85rem' }}>
                          {item.title}
                        </span>
                        <span
                          className="badge ml-auto"
                          style={{
                            color:
                              item.impact === 'alto'
                                ? 'var(--color-danger)'
                                : item.impact === 'medio'
                                  ? 'var(--color-alert)'
                                  : 'var(--color-ok)',
                          }}
                        >
                          impacto {item.impact}
                        </span>
                      </div>
                      <p className="text-secondary mt-1" style={{ fontSize: '0.8rem', lineHeight: 1.55 }}>
                        {item.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-muted" style={{ fontSize: '0.72rem', fontStyle: 'italic' }}>
                {projection.disclaimer}
              </p>
            </>
          ) : (
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Genera una proyeccion para ver la tendencia estimada, el alcance esperado y las
              recomendaciones adaptadas a tu comportamiento.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

/** pequena celda de indicador dentro del panel de proyecciones. */
function Metric({ label, value, color }) {
  return (
    <div className="card-surface p-3">
      <span className="field-label" style={{ marginBottom: 2 }}>{label}</span>
      <span className="text-primary" style={{ fontSize: '1.2rem', fontWeight: 700, color }}>
        {value}
      </span>
    </div>
  )
}
