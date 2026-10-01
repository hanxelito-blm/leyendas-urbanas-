/**
 * services/metricsService.js
 * -----------------------------------------------------------------------------
 * Agrega las metricas crudas de `db.json` en series listas para graficar.
 *
 * Si en el futuro estas cifras vienen de una API, este archivo pasaria a hacer
 * los `fetch` y a normalizar la respuesta con exactamente estas mismas firmas.
 * -----------------------------------------------------------------------------
 */

import db from '../data/db.json'
import { getLegends } from './dbService'

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

/** Indicadores principales (tarjetas KPI del dashboard). */
export async function getKpis() {
  await delay()
  return { ...db.metrics.kpis }
}

/** Serie mensual de los ultimos 12 meses: usuarios, visitas y publicaciones. */
export async function getMonthlySeries() {
  await delay()
  return db.metrics.monthly.map((item) => ({ ...item }))
}

/** Visitas y cantidad de leyendas por provincia. */
export async function getProvinceSeries() {
  await delay()
  return db.metrics.byProvince.map((item) => ({ ...item }))
}

/** Reparto de usuarios por rol (para la grafica de anillo). */
export async function getRoleDistribution() {
  await delay()
  return db.metrics.byRole.map((item) => ({ ...item }))
}

/** Consumo de la IA simulada por usuario frente a su limite diario. */
export async function getAiUsage() {
  await delay()
  return db.metrics.aiUsage.map((item) => ({ ...item }))
}

/**
 * Leyendas mas vistas: alimenta la tabla de "contenido de mayor trafico".
 */
export async function getTopLegendViews(limit = 8) {
  await delay()
  const legends = await getLegends()
  return [...legends]
    .sort((a, b) => b.stats.views - a.stats.views)
    .slice(0, limit)
    .map((legend) => ({
      id: legend.id,
      title: legend.title,
      province: legend.province,
      views: legend.stats.views,
      comments: legend.stats.comments,
      dangerLevel: legend.danger.level,
    }))
}

/**
 * Variacion porcentual entre el ultimo mes y el anterior.
 * Se usa para las flechas verdes/rojas de los KPI.
 */
export async function getMonthlyDelta() {
  await delay()
  const series = db.metrics.monthly
  const last = series[series.length - 1]
  const prev = series[series.length - 2]
  const pct = (current, previous) =>
    previous === 0 ? 0 : Number((((current - previous) / previous) * 100).toFixed(1))

  return {
    users: pct(last.users, prev.users),
    visits: pct(last.visits, prev.visits),
    posts: pct(last.posts, prev.posts),
  }
}
