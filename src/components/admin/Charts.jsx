/**
 * components/admin/Charts.jsx
 * -----------------------------------------------------------------------------
 * Graficas en SVG puro (sin librerias externas).
 *
 * Motivo: la aplicacion debe funcionar sin dependencias de terceros, y SVG
 * escala bien en cualquier densidad de pantalla (movil, tablet, escritorio).
 * Cada grafica recibe datos ya normalizados desde `services/metricsService`.
 * -----------------------------------------------------------------------------
 */

const PALETTE = ['#00F5D4', '#7C5CFF', '#E0A93B', '#3BCE7A', '#D02B3C', '#4AA8FF', '#FF7AB8']

/** Convierte una lista de numeros en una escala 0..max. */
function scaleMax(values, headroom = 1.1) {
  const max = Math.max(...values, 1)
  return max * headroom
}

/* ═══════════════════════════════════════════════════════════════════════════
   GRAFICA DE LINEAS MULTISERIE
   ═══════════════════════════════════════════════════════════════════════════ */
export function LineChart({ data = [], series = [], height = 220, yLabel = '' }) {
  if (data.length === 0) return <ChartEmpty />

  const width = 640
  const padding = { top: 16, right: 16, bottom: 34, left: 44 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const maxValue = scaleMax(data.flatMap((row) => series.map((s) => row[s.key] || 0)))

  const x = (index) => padding.left + (index / (data.length - 1)) * innerW
  const y = (value) => padding.top + innerH - (value / maxValue) * innerH

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={`Grafica de lineas: ${series.map((s) => s.label).join(', ')}`}>
        {/* Rejilla y escala vertical */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = maxValue * ratio
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y(value)}
                y2={y(value)}
                stroke="var(--border-soft)"
                strokeWidth="1"
                strokeDasharray="3 4"
              />
              <text x={4} y={y(value) + 4} fill="var(--text-muted)" fontSize="10">
                {formatShort(value)}
              </text>
            </g>
          )
        })}

        {/* Etiquetas del eje X */}
        {data.map((row, index) => (
          <text
            key={row.month || index}
            x={x(index)}
            y={height - 12}
            fill="var(--text-muted)"
            fontSize="10"
            textAnchor="middle"
          >
            {row.month}
          </text>
        ))}

        {/* Series */}
        {series.map((s, sIndex) => {
          const points = data.map((row, index) => `${x(index)},${y(row[s.key] || 0)}`).join(' ')
          return (
            <g key={s.key}>
              <polyline
                points={points}
                fill="none"
                stroke={s.color || PALETTE[sIndex % PALETTE.length]}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {data.map((row, index) => (
                <circle key={index} cx={x(index)} cy={y(row[s.key] || 0)} r="3" fill={s.color || PALETTE[sIndex % PALETTE.length]}>
                  <title>{`${row.month}: ${formatShort(row[s.key] || 0)}`}</title>
                </circle>
              ))}
            </g>
          )
        })}

        {yLabel && (
          <text x={4} y={12} fill="var(--text-muted)" fontSize="9">
            {yLabel}
          </text>
        )}
      </svg>

      <figcaption className="flex flex-wrap gap-3 mt-2">
        {series.map((s, index) => (
          <span key={s.key} className="flex items-center gap-1.5" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color || PALETTE[index % PALETTE.length] }} />
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   GRAFICA DE BARRAS VERTICALES
   ═══════════════════════════════════════════════════════════════════════════ */
export function BarChart({ data = [], labelKey = 'label', valueKey = 'value', height = 220, color = '#00F5D4' }) {
  if (data.length === 0) return <ChartEmpty />

  const width = 640
  const padding = { top: 16, right: 12, bottom: 44, left: 44 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const maxValue = scaleMax(data.map((row) => row[valueKey] || 0))
  const slot = innerW / data.length
  const barW = Math.min(slot * 0.6, 48)

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Grafica de barras">
        {[0, 0.5, 1].map((ratio) => {
          const value = maxValue * ratio
          const yPos = padding.top + innerH - (value / maxValue) * innerH
          return (
            <line
              key={ratio}
              x1={padding.left}
              x2={width - padding.right}
              y1={yPos}
              y2={yPos}
              stroke="var(--border-soft)"
              strokeDasharray="3 4"
            />
          )
        })}

        {data.map((row, index) => {
          const value = row[valueKey] || 0
          const barH = (value / maxValue) * innerH
          const xPos = padding.left + slot * index + (slot - barW) / 2
          const yPos = padding.top + innerH - barH
          return (
            <g key={row[labelKey] || index}>
              <rect
                x={xPos}
                y={yPos}
                width={barW}
                height={barH}
                rx="4"
                fill={row.color || color}
                opacity="0.85"
              >
                <title>{`${row[labelKey]}: ${formatShort(value)}`}</title>
              </rect>
              <text
                x={xPos + barW / 2}
                y={height - 26}
                fill="var(--text-muted)"
                fontSize="9.5"
                textAnchor="middle"
              >
                {String(row[labelKey]).length > 10 ? `${row[labelKey].slice(0, 9)}…` : row[labelKey]}
              </text>
              <text x={xPos + barW / 2} y={yPos - 5} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">
                {formatShort(value)}
              </text>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   GRAFICA DE ANILLO (reparto por rol)
   ═══════════════════════════════════════════════════════════════════════════ */
export function DonutChart({ data = [], size = 190, thickness = 26 }) {
  if (data.length === 0) return <ChartEmpty />

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <figure className="m-0 flex flex-col items-center">
      <svg width={size} height={size} role="img" aria-label="Grafica de anillo por rol">
        <g transform={`translate(${size / 2}, ${size / 2}) rotate(-90)`}>
          {data.map((item, index) => {
            const fraction = total > 0 ? (item.value || 0) / total : 0
            const dash = fraction * circumference
            const segment = (
              <circle
                key={item.role || index}
                r={radius}
                fill="none"
                stroke={item.color || PALETTE[index % PALETTE.length]}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              >
                <title>{`${item.role}: ${item.value}`}</title>
              </circle>
            )
            offset += dash
            return segment
          })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" fill="var(--text-primary)" fontSize="22" fontWeight="700">
          {formatShort(total)}
        </text>
        <text x="50%" y="62%" textAnchor="middle" fill="var(--text-muted)" fontSize="10">
          usuarios totales
        </text>
      </svg>

      <figcaption className="flex flex-col gap-1 mt-3 w-full">
        {data.map((item, index) => (
          <div key={item.role || index} className="flex items-center gap-2" style={{ fontSize: '0.78rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: item.color || PALETTE[index % PALETTE.length] }} />
            <span className="text-secondary capitalize">{item.role}</span>
            <span className="text-muted ml-auto">{formatShort(item.value)}</span>
          </div>
        ))}
      </figcaption>
    </figure>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   BARRAS HORIZONTALES (uso de la IA por usuario frente a su limite)
   ═══════════════════════════════════════════════════════════════════════════ */
export function HorizontalBarChart({ data = [], labelKey = 'label', valueKey = 'used', limitKey = 'limit' }) {
  if (data.length === 0) return <ChartEmpty />

  return (
    <ul className="flex flex-col gap-2.5 m-0 p-0 list-none">
      {data.map((row) => {
        const limit = row[limitKey] || 1
        const used = row[valueKey] || 0
        const percent = Math.min((used / limit) * 100, 100)
        const exhausted = used >= limit
        return (
          <li key={row[labelKey]}>
            <div className="flex items-center justify-between" style={{ fontSize: '0.78rem' }}>
              <span className="text-secondary">{row[labelKey]}</span>
              <span className={exhausted ? 'text-muted' : 'text-accent'} style={{ fontSize: '0.72rem' }}>
                {used}/{limit} {exhausted ? '· agotado' : ''}
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-soft)',
                marginTop: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: '100%',
                  background: exhausted ? 'var(--color-alert)' : 'var(--accent)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MINI-GRAFICA DE SPARKLINE (tarjetas KPI)
   ═══════════════════════════════════════════════════════════════════════════ */
export function Sparkline({ values = [], color = '#00F5D4', width = 120, height = 32 }) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} aria-hidden="true" className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Auxiliares ────────────────────────────────────────────────────────────── */

function ChartEmpty() {
  return (
    <p className="text-muted text-center py-6" style={{ fontSize: '0.82rem' }}>
      Sin datos suficientes para graficar.
    </p>
  )
}

/** 12345 -> "12.3k" */
function formatShort(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(Math.round(value))
}
