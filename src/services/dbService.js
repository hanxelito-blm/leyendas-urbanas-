/**
 * services/dbService.js
 * -----------------------------------------------------------------------------
 * Capa de acceso a la base de datos local (`src/data/db.json`).
 *
 * Toda la aplicacion lee de aqui; ningun componente importa el JSON
 * directamente. Esto permite cambiar la fuente (fetch a una API real, axios,
 * un backend) sin tocar las vistas.
 *
 * En una API real, cada metodo se convertiria en una llamada `fetch`:
 *   const res = await fetch(`/api/${resource}`); return res.json()
 * Por eso todas las funciones son asincronas aunque hoy resuelvan en memoria.
 * -----------------------------------------------------------------------------
 */

import db from '../data/db.json'
import { readValue } from './storage'

/* ── Utilidades de copia profunda ──────────────────────────────────────────── */

/** Clona los datos para que ningun consumidor mute la "base de datos". */
const clone = (value) => JSON.parse(JSON.stringify(value))

/* ── Metadatos del sitio ───────────────────────────────────────────────────── */

/** Devuelve la configuracion general del portal (nombre, centro, tiles). */
export async function getMeta() {
  return clone(db.meta)
}

/** Lista de provincias con al menos una leyenda. */
export async function getProvinces() {
  return [...new Set(db.legends.map((legend) => legend.province))].sort()
}

/** Lista de categorias de leyenda disponibles. */
export async function getCategories() {
  return [...new Set(db.legends.map((legend) => legend.category))].sort()
}

/* ── Leyendas ──────────────────────────────────────────────────────────────── */

/** Todas las leyendas del catalogo. */
export async function getLegends() {
  return clone(db.legends)
}

/** Obtiene una leyenda por su id. */
export async function getLegendById(id) {
  const found = db.legends.find((legend) => legend.id === id)
  return found ? clone(found) : null
}

/**
 * Filtra el catalogo.
 * @param {{province?: string, category?: string, maxDanger?: number, search?: string}} filters
 */
export async function getFilteredLegends(filters = {}) {
  const { province, category, maxDanger, search } = filters
  const term = (search || '').trim().toLowerCase()

  const result = db.legends.filter((legend) => {
    if (province && legend.province !== province) return false
    if (category && legend.category !== category) return false
    if (maxDanger && legend.danger.level > maxDanger) return false
    if (term) {
      const haystack = [
        legend.title,
        legend.locationName,
        legend.province,
        legend.fullStory,
        ...legend.tags,
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(term)) return false
    }
    return true
  })

  return clone(result)
}

/** Leyendas ordenadas por numero de avistamientos (las mas reportadas). */
export async function getTopLegends(limit = 5) {
  return clone(
    [...db.legends].sort((a, b) => b.stats.sightings - a.stats.sightings).slice(0, limit)
  )
}

/* ── Usuarios y roles ──────────────────────────────────────────────────────── */

/** Lista de usuarios (sin el campo de contrasena). */
export async function getUsers() {
  return requestUserApi('/api/users')
}

export async function createUser(user) {
  return requestUserApi('/api/users', {
    method: 'POST',
    body: JSON.stringify(user),
  })
}

export async function updateUserRole(id, role) {
  return requestUserApi(`/api/users/${encodeURIComponent(id)}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

async function requestUserApi(url, options = {}) {
  const session = readValue('session', null)
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...options.headers,
    },
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'No se pudo actualizar la lista de usuarios.')
  return result
}

/** Busca un usuario por nombre de usuario o correo. */
export async function findUserByIdentifier(identifier) {
  const value = String(identifier || '').trim().toLowerCase()
  return (
    db.users.find(
      (user) =>
        user.username.toLowerCase() === value || user.email.toLowerCase() === value
    ) || null
  )
}

/** Lista de roles con sus permisos. */
export async function getRoles() {
  return clone(db.roles)
}

/** Consulta los permisos asociados a un rol. */
export async function getPermissionsForRole(roleId) {
  const role = db.roles.find((item) => item.id === roleId)
  return role ? [...role.permissions] : []
}

/** Elimina el campo de contrasena antes de exponer un usuario al cliente. */
function stripPassword(user) {
  // eslint-disable-next-line no-unused-vars
  const { password, ...safe } = user
  return safe
}

/* ── Foro ──────────────────────────────────────────────────────────────────── */

export async function getForumCategories() {
  return clone(db.forum.categories)
}

export async function getForumPosts() {
  return clone(db.forum.posts)
}

export async function getForumComments() {
  return clone(db.forum.comments)
}

/** Publicaciones visibles publicamente (las ocultas solo las ve el staff). */
export async function getVisiblePosts() {
  return clone(db.forum.posts.filter((post) => post.status === 'publicado'))
}

/* ── Expediciones y onboarding ─────────────────────────────────────────────── */

export async function getExpeditions() {
  return clone(db.expeditions)
}

/** Tips de bienvenida mostrados como notificaciones al ingresar. */
export async function getOnboardingTips() {
  return clone(db.onboardingTips)
}

/* ── Configuracion de la IA simulada ───────────────────────────────────────── */

export async function getAiConfig() {
  return clone(db.aiConfig)
}

/** Exporta la base completa (util para depuracion o exportación). */
export async function getDatabase() {
  return clone(db)
}
