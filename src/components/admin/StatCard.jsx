/**
 * components/admin/StatCard.jsx
 * -----------------------------------------------------------------------------
 * Tarjeta de indicador clave (KPI) con variacion mensual y mini-grafica.
 * -----------------------------------------------------------------------------
 */

import { Sparkline } from './Charts'

export default function StatCard({ label, value, delta, trend = [], color = '#00F5D4', hint }) {
  const positive = typeof delta === 'number' && delta >= 0

  return (
    <div className="card-surface p-4 flex flex-col gap-2">
      <span className="field-label" style={{ marginBottom: 0 }}>
        {label}
      </span>

      <div className="flex items-end justify-between gap-2">
        <span className="text-primary" style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 }}>
          {value}
        </span>
        {typeof delta === 'number' && (
          <span
            className="badge"
            style={{ color: positive ? 'var(--color-ok)' : 'var(--color-danger)' }}
            title="Variacion respecto al mes anterior"
          >
            {positive ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
      </div>

      {trend.length > 1 && <Sparkline values={trend} color={color} />}

      {hint && (
        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
          {hint}
        </span>
      )}
    </div>
  )
}
