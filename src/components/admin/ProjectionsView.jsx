/**
 * components/admin/ProjectionsView.jsx
 * -----------------------------------------------------------------------------
 * Modulo de proyecciones impulsado por DeepSeek.
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

const EXPORT_FORMATS = [
  { id: 'pdf', label: 'PDF (guardar desde imprimir)' },
  { id: 'word', label: 'Word (.doc)' },
  { id: 'excel', label: 'Excel (.xls)' },
  { id: 'csv', label: 'CSV (.csv)' },
  { id: 'json', label: 'JSON (.json)' },
  { id: 'txt', label: 'Texto (.txt)' },
  { id: 'html', label: 'HTML (.html)' },
]

function createReport(user, usageStats, aggregate, projection) {
  return {
    title: 'Informe de proyecciones de IA',
    exportedAt: new Date().toISOString(),
    account: user?.displayName || user?.username || user?.email || 'No disponible',
    dailyUsage: usageStats,
    aggregateUsage: aggregate,
    projection: projection
      ? {
          model: projection.model,
          generatedAt: projection.generatedAt,
          horizonDays: projection.horizonDays,
          growthRate: projection.growthRate,
          projectedReach: projection.projectedReach,
          confidence: projection.confidence,
          riskLevel: projection.riskLevel,
          factors: projection.factors,
          series: projection.series,
          recommendations: projection.recommendations,
          disclaimer: projection.disclaimer,
        }
      : null,
  }
}

function createReportRows(report) {
  const rows = [
    ['Informe', 'Fecha de exportacion', report.exportedAt],
    ['Informe', 'Cuenta', report.account],
    ...Object.entries(report.dailyUsage).map(([key, value]) => ['Uso diario', key, value]),
  ]

  report.aggregateUsage.forEach((item, index) => {
    Object.entries(item).forEach(([key, value]) => {
      rows.push(['Consumo agregado', `Cuenta ${index + 1} - ${key}`, value])
    })
  })

  if (!report.projection) {
    rows.push(['Proyeccion', 'Estado', 'No se ha generado una proyeccion'])
    return rows
  }

  Object.entries(report.projection).forEach(([key, value]) => {
    if (['factors', 'series', 'recommendations', 'disclaimer'].includes(key)) return
    rows.push(['Proyeccion', key, value])
  })
  Object.entries(report.projection.factors || {}).forEach(([key, value]) => {
    rows.push(['Factores', key, value])
  })
  ;(report.projection.series || []).forEach((item, index) => {
    Object.entries(item).forEach(([key, value]) => {
      rows.push(['Serie proyectada', `${item.month || index + 1} - ${key}`, value])
    })
  })
  ;(report.projection.recommendations || []).forEach((item, index) => {
    rows.push(['Recomendacion', `${index + 1} - ${item.title}`, `${item.detail} (impacto: ${item.impact})`])
  })
  rows.push(['Proyeccion', 'Aviso', report.projection.disclaimer])
  return rows
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function createReportHtml(title, rows, autoPrint = false) {
  const tableRows = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('')

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font-family:Arial,sans-serif;color:#202820;margin:32px}h1{font-size:22px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #aab4a8;padding:8px;text-align:left;overflow-wrap:anywhere}th{background:#e8eee8}tr:nth-child(even){background:#f5f7f4}@media print{body{margin:16mm}h1{font-size:18px}tr{break-inside:avoid}}</style>
</head><body><h1>${escapeHtml(title)}</h1><table><thead><tr><th>Seccion</th><th>Dato</th><th>Valor</th></tr></thead><tbody>${tableRows}</tbody></table>
${autoPrint ? '<script>window.addEventListener("load",()=>window.print())</script>' : ''}</body></html>`
}

function downloadFile(content, mimeType, extension) {
  const fileName = `proyecciones-ia-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function exportReport(format, report, rows) {
  const title = report.title
  const html = createReportHtml(title, rows)

  if (format === 'pdf') {
    const printWindow = window.open(URL.createObjectURL(new Blob([createReportHtml(title, rows, true)], { type: 'text/html' })), '_blank')
    if (!printWindow) window.alert('Permite las ventanas emergentes para guardar el informe como PDF.')
    return
  }
  if (format === 'word') return downloadFile(`\ufeff${html}`, 'application/msword;charset=utf-8', 'doc')
  if (format === 'excel') return downloadFile(`\ufeff${html}`, 'application/vnd.ms-excel;charset=utf-8', 'xls')
  if (format === 'csv') {
    const csv = [['Seccion', 'Dato', 'Valor'], ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n')
    return downloadFile(`\ufeff${csv}`, 'text/csv;charset=utf-8', 'csv')
  }
  if (format === 'json') return downloadFile(JSON.stringify(report, null, 2), 'application/json;charset=utf-8', 'json')
  if (format === 'txt') {
    const text = [title, ...rows.map(([section, label, value]) => `${section} | ${label}: ${value ?? ''}`)].join('\r\n')
    return downloadFile(text, 'text/plain;charset=utf-8', 'txt')
  }
  downloadFile(html, 'text/html;charset=utf-8', 'html')
}

export default function ProjectionsView({ generateRequest = 0 }) {
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

  useEffect(() => {
    if (generateRequest > 0) runProjection()
  }, [generateRequest])

  const usedPercent = usageStats.limit > 0 ? (usageStats.used / usageStats.limit) * 100 : 0
  const report = createReport(user, usageStats, aggregate, projection)
  const reportRows = createReportRows(report)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <details className="relative">
          <summary className="btn-base btn-ghost cursor-pointer list-none">Descargar informe</summary>
          <div className="panel absolute right-0 z-20 mt-2 flex min-w-60 flex-col gap-1 p-2">
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.id}
                type="button"
                className="btn-base btn-ghost w-full justify-start"
                onClick={(event) => {
                  exportReport(format.id, report, reportRows)
                  event.currentTarget.closest('details').open = false
                }}
              >
                {format.label}
              </button>
            ))}
          </div>
        </details>
      </div>

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
              DeepSeek estima el crecimiento de tu actividad en la comunidad a 60 dias.
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
