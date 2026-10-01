/**
 * services/storage.js
 * -----------------------------------------------------------------------------
 * Envoltura tipada y segura sobre `localStorage`.
 *
 * `localStorage` puede lanzar excepciones (modo privado de Safari, cuota
 * excedida, SSR). Este modulo centraliza el manejo de errores para que ningun
 * servicio tenga que depender directamente del navegador.
 * -----------------------------------------------------------------------------
 */

const NAMESPACE = 'leyendas-cr'

/** Construye la clave completa con el namespace de la aplicacion. */
const key = (name) => `${NAMESPACE}:${name}`

/** Lee y parsea un valor, devolviendo `fallback` si no existe o esta corrupto. */
export function readValue(name, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key(name))
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch (error) {
    console.warn(`[storage] no se pudo leer "${name}"`, error)
    return fallback
  }
}

/** Serializa y guarda un valor. Devuelve `true` si se persistio. */
export function writeValue(name, value) {
  try {
    window.localStorage.setItem(key(name), JSON.stringify(value))
    return true
  } catch (error) {
    console.warn(`[storage] no se pudo guardar "${name}"`, error)
    return false
  }
}

/** Elimina una clave del namespace. */
export function removeValue(name) {
  try {
    window.localStorage.removeItem(key(name))
    return true
  } catch (error) {
    console.warn(`[storage] no se pudo borrar "${name}"`, error)
    return false
  }
}

/**
 * Crea una clave de estado ligada a la fecha: permite guardar datos que deben
 * expirar a la medianoche (por ejemplo, el contador diario de la IA).
 */
export function readDailyValue(name, fallback = null) {
  const today = new Date().toISOString().slice(0, 10)
  const stored = readValue(name, null)
  if (!stored || stored.date !== today) return fallback
  return stored.value
}

export function writeDailyValue(name, value) {
  return writeValue(name, { date: new Date().toISOString().slice(0, 10), value })
}
