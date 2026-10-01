/**
 * services/aiService.js
 * -----------------------------------------------------------------------------
 * Modulo de Inteligencia Artificial SIMULADO para proyecciones de crecimiento.
 *
 * No hay llamada a ningun modelo externo: el "oráculo" calcula una proyeccion
 * determinista a partir de (a) los factores de comportamiento del usuario y
 * (b) los pesos definidos en `db.json -> aiConfig`.
 *
 * Dos garantias importantes:
 *  1. LIMITACION POR USUARIO: cada cuenta tiene un maximo de consultas diarias
 *     (`aiConfig.dailyLimitPerUser`). El contador vive en localStorage con clave
 *     diaria, asi que se reinicia solo a medianoche.
 *  2. DETERMINISMO: la misma combinacion de usuario + factors devuelve siempre
 *     la misma proyeccion, salvo que se incrmente un "uso" (semilla cambia).
 *
 * Para conectar un modelo real (OpenAI, Gemini, un endpoint propio) basta con
 * reemplazar el cuerpo de `generateProjection` por la llamada HTTP y conservar
 * el contrato de retorno.
 * -----------------------------------------------------------------------------
 */

import db from '../data/db.json'
import { readDailyValue, readValue, writeDailyValue } from './storage'

const USAGE_PREFIX = 'ai-usage-'

/**
 * Estado de uso de la IA para un usuario.
 * @returns {{used: number, limit: number, remaining: number, resetAt: string}}
 */
export function getUsageForUser(userId) {
  const limit = db.aiConfig.dailyLimitPerUser
  const used = readDailyValue(USAGE_PREFIX + userId, 0)
  return {
    used,
    limit,
    remaining: Math.max(limit - used, 0),
    resetAt: nextMidnightISO(),
  }
}

/**
 * Genera una proyeccion personalizada.
 *
 * @param {{user: object, factors?: object}} params
 * @param {object} [params.user]   Usuario autenticado (obligatorio).
 * @param {object} [params.factors] Ajuste manual de los factores 0..1.
 * @returns {Promise<object>} proyeccion + metadatos del modelo.
 */
export async function generateProjection({ user, factors } = {}) {
  if (!user || !user.id) {
    throw new Error('La proyeccion de IA requiere un usuario autenticado.')
  }

  const usage = getUsageForUser(user.id)
  if (usage.remaining <= 0) {
    throw new Error(
      `Alcanzaste el limite de ${usage.limit} proyecciones por dia. Se renueva a medianoche.`
    )
  }

  const profile = computeFactors(user, factors)
  const session = readValue('session', null)
  const response = await fetch('/api/ai/projection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: JSON.stringify({ factors: profile }),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'No se pudo generar la proyección con DeepSeek.')

  const nextUsed = usage.used + 1
  writeDailyValue(USAGE_PREFIX + user.id, nextUsed)
  return {
    ...result,
    factors: profile,
    usage: { used: nextUsed, limit: usage.limit, remaining: usage.limit - nextUsed },
  }
}

/* ── Perfil de comportamiento ──────────────────────────────────────────────── */

/**
 * Traduce la actividad del usuario a tres factores normalizados 0..1.
 * - engagement:  participacion en el foro y en el mapa.
 * - retention:   antiguedad y reputacion (senal de permanencia).
 * - contentSupply: cantidad de contenido propio (capacidad de crear).
 */
function computeFactors(user, overrides) {
  const stats = user.stats || { posts: 0, comments: 0, legendsVisited: 0 }
  const engagement = clamp01((stats.comments * 0.4 + stats.posts * 2.5 + stats.legendsVisited * 1.2) / 160)
  const reputation = clamp01((user.reputation || 0) / 3000)
  const daysActive = daysSince(user.joinedAt)
  const retention = clamp01(0.35 + reputation * 0.4 + Math.min(daysActive / 730, 0.25))
  const contentSupply = clamp01((stats.posts * 3 + reputation * 0.3) / 80)

  return {
    engagement: override(overrides?.engagement, engagement),
    retention: override(overrides?.retention, retention),
    contentSupply: override(overrides?.contentSupply, contentSupply),
  }
}

function override(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? clamp01(value) : fallback
}

function clamp01(value) {
  return Number(Math.min(Math.max(value, 0), 1).toFixed(3))
}

function daysSince(date) {
  if (!date) return 0
  const start = new Date(date).getTime()
  if (Number.isNaN(start)) return 0
  return Math.max(Math.floor((Date.now() - start) / 86400000), 0)
}

/* ── Motor de proyeccion ───────────────────────────────────────────────────── */

/**
 * Proyeccion de crecimiento mensual del numero de usuarios activos y
 * publicaciones generadas por el usuario, con複合ando del factor dominante.
 */
function project(profile, weights, seed) {
  const horizonDays = db.aiConfig.horizons[1] // 60 dias
  const months = [1, 2, 3]

  // Semilla determinista pero distinta por uso: pseudo-aleatorio estable.
  const jitter = seededNoise(userHashSeed(profile) + seed)

  const baseScore =
    profile.engagement * weights.engagement +
    profile.retention * weights.retention +
    profile.contentSupply * weights.contentSupply

  const growthRate = 0.08 + baseScore * 0.35 + jitter * 0.05

  const monthlyProjected = months.map((month) => {
    const value = 1 * (1 + growthRate) ** month
    return {
      month: `Mes +${month}`,
      activeUsers: Math.round(120 * value),
      posts: Math.round(18 * value),
      engagement: Number((0.35 + baseScore * 0.5).toFixed(3)),
    }
  })

  const confidence = Number((0.62 + baseScore * 0.33 - jitter * 0.05).toFixed(2))

  return {
    projection: {
      score: Number(baseScore.toFixed(3)),
      growthRate: Number((growthRate * 100).toFixed(1)),
      projectedReach: monthlyProjected[2].activeUsers,
      riskLevel: baseScore > 0.66 ? 'alto' : baseScore > 0.38 ? 'medio' : 'bajo',
    },
    series: monthlyProjected,
    confidence: Math.min(Math.max(confidence, 0.4), 0.97),
    horizonDays,
  }
}

/**
 * Recomendaciones de contenido personalizadas en funcion de los factores.
 */
function buildRecommendations(profile, user) {
  const name = user.displayName || user.username
  const list = []

  if (profile.engagement < 0.35) {
    list.push({
      id: 'r-engage',
      title: 'Publica tu primer testimonio',
      detail: `Tu actividad en el foro es baja. ${name} puede aumentar su reputacion publicando un avistamiento con fecha, hora y provincia.`,
      impact: 'alto',
    })
  } else {
    list.push({
      id: 'r-comment',
      title: 'Responde debates abiertos',
      detail: `Con un nivel de participacion de ${Math.round(profile.engagement * 100)}%, comentar en los debates activos es la via mas rapida para ganar visibilidad en la comunidad.`,
      impact: 'medio',
    })
  }

  if (profile.contentSupply > 0.5) {
    list.push({
      id: 'r-create',
      title: 'Abre una categoria de investigacion',
      detail: 'Tu capacidad de crear contenido es alta. Podrias serializar tus registros en una categoria propia dentro del foro.',
      impact: 'alto',
    })
  }

  if (profile.retention < 0.5) {
    list.push({
      id: 'r-return',
      title: 'Mantén una racha semanal',
      detail: 'Volver al menos una vez por semana durante un mes es el factor que mas influye en la proyeccion de crecimiento de tu perfil.',
      impact: 'medio',
    })
  }

  list.push({
    id: 'r-legend',
    title: 'Explora leyendas de riesgo alto',
    detail: 'Las leyendas de peligro 3 y 4 concentran el mayor tiempo de exploracion por sesion. Empieza por el Sanatorio Duran.',
    impact: 'bajo',
  })

  return list
}

/* ── Utilidades ────────────────────────────────────────────────────────────── */

function nextMidnightISO() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return midnight.toISOString()
}

/** Hash entero simple, estable por combinacion de factores. */
function userHashSeed(profile) {
  const key = `${profile.engagement}|${profile.retention}|${profile.contentSupply}`
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000
  }
  return hash
}

/** Ruido en [-0.5, 0.5] derivado de la semilla. */
function seededNoise(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return (x - Math.floor(x)) - 0.5
}
