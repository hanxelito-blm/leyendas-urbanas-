/**
 * components/admin/OverviewView.jsx
 * -----------------------------------------------------------------------------
 * Vista parcial: resumen general con KPIs y graficas de tendencia.
 * Solo accesible para el rol "admin" (la proteccion vive en las rutas).
 * -----------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react'
import {
  getKpis,
  getMonthlySeries,
  getProvinceSeries,
  getRoleDistribution,
  getMonthlyDelta,
  getTopLegendViews,
} from '../../services/metricsService'
import StatCard from './StatCard'
import { LineChart, BarChart, DonutChart } from './Charts'

export default function OverviewView({ exportRequest = 0 }) {
  const [data, setData] = useState({
    kpis: null,
    monthly: [],
    provinces: [],
    roles: [],
    delta: {},
    topLegends: [],
  })

  useEffect(() => {
    let active = true
    Promise.all([getKpis(), getMonthlySeries(), getProvinceSeries(), getRoleDistribution(), getMonthlyDelta(), getTopLegendViews()])
      .then(([kpis, monthly, provinces, roles, delta, topLegends]) => {
        if (active) setData({ kpis, monthly, provinces, roles, delta, topLegends })
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!exportRequest || !data.kpis) return

    const rows = [
      ['Indicador', 'Valor'],
      ['Usuarios registrados', data.kpis.totalUsers],
      ['Usuarios activos en 7 dias', data.kpis.activeUsers7d],
      ['Visitas al mapa', data.kpis.mapVisits],
      ['Publicaciones del foro', data.kpis.forumPosts],
      ['Comentarios del foro', data.kpis.forumComments],
      ['Lecturas de leyendas', data.kpis.legendViews],
      ['Duracion promedio de sesion (minutos)', data.kpis.avgSessionMinutes],
      ['Nuevos usuarios este mes', data.kpis.newUsersThisMonth],
    ]
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `indicadores-admin-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, [exportRequest, data.kpis])

  if (!data.kpis) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="skeleton" style={{ height: index < 4 ? 110 : 220 }} />
        ))}
      </div>
    )
  }

  const { kpis, monthly, provinces, roles, delta, topLegends } = data

  return (
    <div className="flex flex-col gap-5">
      {/* Indicadores principales */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores principales">
        <StatCard
          label="Usuarios registrados"
          value={kpis.totalUsers.toLocaleString('es-CR')}
          delta={delta.users}
          trend={monthly.map((item) => item.users)}
          hint={`${kpis.newUsersThisMonth} nuevos este mes`}
        />
        <StatCard
          label="Visitas al mapa"
          value={kpis.mapVisits.toLocaleString('es-CR')}
          delta={delta.visits}
          trend={monthly.map((item) => item.visits)}
          color="#7C5CFF"
          hint={`${kpis.activeUsers7d.toLocaleString('es-CR')} activos en 7 dias`}
        />
        <StatCard
          label="Publicaciones del foro"
          value={kpis.forumPosts.toLocaleString('es-CR')}
          delta={delta.posts}
          trend={monthly.map((item) => item.posts)}
          color="#E0A93B"
          hint={`${kpis.forumComments.toLocaleString('es-CR')} comentarios`}
        />
        <StatCard
          label="Lecturas de leyendas"
          value={kpis.legendViews.toLocaleString('es-CR')}
          color="#3BCE7A"
          hint={`Sesion promedio: ${kpis.avgSessionMinutes} min`}
        />
      </section>

      {/* Tendencias y distribucion */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <h2 className="panel-title">Crecimiento mensual</h2>
          <p className="panel-subtitle mb-3">Usuarios, visitas al mapa y publicaciones (12 meses)</p>
          <LineChart
            data={monthly}
            series={[
              { key: 'users', label: 'Usuarios', color: '#00F5D4' },
              { key: 'visits', label: 'Visitas al mapa', color: '#7C5CFF' },
              { key: 'posts', label: 'Publicaciones', color: '#E0A93B' },
            ]}
          />
        </div>

        <div className="panel">
          <h2 className="panel-title">Reparto por rol</h2>
          <p className="panel-subtitle mb-3">Cantidad de cuentas por tipo de permiso</p>
          <DonutChart data={roles} />
        </div>
      </section>

      {/* Visitas por provincia y contenido top */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <h2 className="panel-title">Visitas por provincia</h2>
          <p className="panel-subtitle mb-3">Distribucion geografica de la exploracion del mapa</p>
          <BarChart
            data={provinces.map((item) => ({ label: item.province, value: item.visits }))}
            color="#00F5D4"
          />
        </div>

        <div className="panel">
          <h2 className="panel-title">Leyendas con mas trafico</h2>
          <p className="panel-subtitle mb-3">Top 8 por vistas acumuladas</p>
          <div className="table-scroll">
            <table className="w-full text-left" style={{ fontSize: '0.82rem' }}>
              <thead>
                <tr className="text-muted" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <th className="py-2">Leyenda</th>
                  <th className="py-2">Provincia</th>
                  <th className="py-2 text-right">Vistas</th>
                  <th className="py-2 text-right">Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {topLegends.map((legend) => (
                  <tr key={legend.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td className="py-2 text-secondary">{legend.title}</td>
                    <td className="py-2 text-muted">{legend.province}</td>
                    <td className="py-2 text-right text-primary">{legend.views.toLocaleString('es-CR')}</td>
                    <td className="py-2 text-right">
                      <span className={`badge danger-${legend.dangerLevel}`}>{legend.dangerLevel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
