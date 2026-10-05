/**
 * services/authService.js
 * -----------------------------------------------------------------------------
 * Autenticación simulada con verificación de edad (API Hacienda).
 * -----------------------------------------------------------------------------
 */

import db from '../data/db.json'
import { readValue, writeValue, removeValue } from './storage'
import { verifyAge, generateRandomName } from './ageVerificationService'

const SESSION_KEY = 'session'
const USERS_KEY = 'registered-users'

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms))

async function requestAuth(path, payload) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const result = await response.json()
    return { response, result }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function sanitize(user) {
  const { password, ...safe } = user
  return safe
}

function getRegisteredUsers() {
  return readValue(USERS_KEY, [])
}

function getAllUsers() {
  return [...db.users, ...getRegisteredUsers()]
}

function findUser(identifier) {
  const value = String(identifier || '').trim().toLowerCase()
  return (
    getAllUsers().find(
      (user) =>
        user.username.toLowerCase() === value || user.email.toLowerCase() === value
    ) || null
  )
}

export async function login({ identifier, password }) {
  await delay()

  if (!identifier || !password) {
    return { success: false, message: 'Completa tu usuario y tu contraseña.' }
  }

  try {
    const { response, result } = await requestAuth('/api/auth/login', { identifier, password })
    if (!response.ok) return { success: false, message: result.message || 'No se pudo iniciar sesión.' }
    writeValue(SESSION_KEY, { user: result.user, token: result.token, issuedAt: Date.now() })
    return result
  } catch {
    return { success: false, message: 'No se pudo conectar con el servidor de cuentas.' }
  }
}

export async function register({
  username,
  email,
  password,
  displayName,
  province,
  identificacion, // cédula para verificación de edad
  birthDate,      // fecha de nacimiento opcional
}) {
  await delay(550)

  const cleanUsername = String(username || '').trim()
  const cleanEmail = String(email || '').trim().toLowerCase()
  let cleanName = String(displayName || '').trim()
  const cleanIdentificacion = String(identificacion || '').trim()

  if (cleanUsername.length < 3) {
    return { success: false, message: 'El usuario debe tener al menos 3 caracteres.' }
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
    return { success: false, message: 'El usuario solo admite letras, números, punto, guion y guion bajo.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, message: 'El correo electrónico no tiene un formato válido.' }
  }
  if (String(password || '').length < 6) {
    return { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' }
  }
  if (!cleanName && !cleanIdentificacion) {
    // Si no hay nombre ni cédula, generamos uno aleatorio
    cleanName = generateRandomName()
  } else if (!cleanName) {
    cleanName = generateRandomName()
  }

  const all = getAllUsers()
  const taken = all.some(
    (u) =>
      u.username.toLowerCase() === cleanUsername.toLowerCase() ||
      u.email.toLowerCase() === cleanEmail
  )
  if (taken) {
    return { success: false, message: 'Ese usuario o correo ya están registrados.' }
  }

  // Verificación de edad si se proporciona identificación
  let age = 18
  let isAdult = true
  let birthDateParsed = null

  if (cleanIdentificacion) {
    const verification = await verifyAge(cleanIdentificacion)
    age = verification.age
    isAdult = verification.isAdult
    birthDateParsed = verification.birthDate
    
    if (!isAdult) {
      // Aún permitimos registrar pero marcamos como menor
      console.warn(`Usuario menor de edad registrado: ${cleanUsername}, edad: ${age}`)
    }
  } else if (birthDate) {
    const birth = new Date(birthDate)
    const today = new Date()
    age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    isAdult = age >= 18
    birthDateParsed = birthDate
  }

  try {
    const { response, result } = await requestAuth('/api/auth/register', {
      username: cleanUsername,
      email: cleanEmail,
      password,
      displayName: cleanName,
      province,
      age,
      isAdult,
      birthDate: birthDateParsed,
    })
    if (!response.ok) return { success: false, message: result.message || 'No se pudo crear la cuenta.' }
    writeValue(SESSION_KEY, { user: result.user, token: result.token, issuedAt: Date.now() })
    return result
  } catch {
    return { success: false, message: 'No se pudo conectar con el servidor de cuentas.' }
  }
}

export async function logout() {
  await delay(150)
  removeValue(SESSION_KEY)
  return { success: true }
}

export async function restoreSession() {
  const session = readValue(SESSION_KEY, null)
  if (!session || !session.user) return null

  const fresh = findUser(session.user.username)
  return fresh ? sanitize(fresh) : session.user
}

export async function changePassword({ currentPassword, newPassword }) {
  await delay(300)
  const session = readValue(SESSION_KEY, null)
  if (!session) return { success: false, message: 'No hay una sesión activa.' }

  const user = findUser(session.user.username)
  if (!user || user.password !== currentPassword) {
    return { success: false, message: 'La contraseña actual no coincide.' }
  }
  if (String(newPassword || '').length < 6) {
    return { success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' }
  }

  const registered = getRegisteredUsers()
  if (registered.some((item) => item.id === user.id)) {
    writeValue(
      USERS_KEY,
      registered.map((item) => (item.id === user.id ? { ...item, password: newPassword } : item))
    )
  } else {
    return { success: false, message: 'Las cuentas de demostración no se pueden modificar.' }
  }

  return { success: true, message: 'Contraseña actualizada.' }
}

function buildToken(userId) {
  return `mock-${userId}-${Math.random().toString(36).slice(2, 10)}`
}