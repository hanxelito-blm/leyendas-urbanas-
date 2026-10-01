import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const DATABASE_PATH = path.join(ROOT, 'src', 'data', 'db.json')
const MAX_BODY_SIZE = 1024 * 1024

function readDatabase() {
  return JSON.parse(fs.readFileSync(DATABASE_PATH, 'utf8'))
}

function writeDatabase(database) {
  const temporaryPath = `${DATABASE_PATH}.${crypto.randomUUID()}.tmp`
  fs.writeFileSync(temporaryPath, `${JSON.stringify(database, null, 2)}\n`, 'utf8')
  fs.renameSync(temporaryPath, DATABASE_PATH)
}

function sendJson(response, status, payload) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > MAX_BODY_SIZE) {
        reject(new Error('El cuerpo de la solicitud es demasiado grande.'))
        request.destroy()
      }
    })
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('El cuerpo de la solicitud no es JSON válido.'))
      }
    })
    request.on('error', reject)
  })
}

function sanitizeUser(user) {
  const { password, passwordHash, identificacion, ...safeUser } = user
  return safeUser
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

function verifyPassword(user, password) {
  if (!user.passwordHash) return user.password === password
  const [, salt, expectedHex] = user.passwordHash.split(':')
  const expected = Buffer.from(expectedHex || '', 'hex')
  const actual = crypto.scryptSync(password, salt, 64)
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

function createToken(user, secret) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, expiresAt: Date.now() + 7 * 86400000 })).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

function getAuthenticatedUser(request, database, secret) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = crypto.createHmac('sha256', secret).update(payload).digest()
  let supplied
  try {
    supplied = Buffer.from(signature, 'base64url')
  } catch {
    return null
  }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return null

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (claims.expiresAt < Date.now()) return null
    return database.users.find((user) => user.id === claims.id) || null
  } catch {
    return null
  }
}

function parseModelJson(content) {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  return JSON.parse(cleaned)
}

function normalizeProjection(result, factors, model) {
  const series = Array.isArray(result.series) ? result.series.slice(0, 6) : []
  if (series.length === 0) throw new Error('DeepSeek no devolvió una serie de proyección válida.')

  const recommendations = Array.isArray(result.recommendations) ? result.recommendations.slice(0, 8) : []
  return {
    model,
    generatedAt: new Date().toISOString(),
    horizonDays: Number(result.horizonDays) || 60,
    growthRate: Number(result.growthRate) || 0,
    projectedReach: Math.max(0, Math.round(Number(result.projectedReach) || 0)),
    confidence: Math.min(Math.max(Number(result.confidence) || 0.5, 0), 1),
    riskLevel: ['alto', 'medio', 'bajo'].includes(result.riskLevel) ? result.riskLevel : 'medio',
    factors,
    series: series.map((item, index) => ({
      month: String(item.month || `Mes ${index + 1}`).slice(0, 40),
      activeUsers: Math.max(0, Math.round(Number(item.activeUsers) || 0)),
      posts: Math.max(0, Math.round(Number(item.posts) || 0)),
      engagement: Math.min(Math.max(Number(item.engagement) || 0, 0), 1),
    })),
    recommendations: recommendations.map((item, index) => ({
      id: `deepseek-${index + 1}`,
      title: String(item.title || 'Recomendación').slice(0, 120),
      detail: String(item.detail || '').slice(0, 600),
      impact: ['alto', 'medio', 'bajo'].includes(item.impact) ? item.impact : 'medio',
    })),
    disclaimer: 'Estimación generada por IA a partir de datos de actividad; no constituye una predicción garantizada.',
  }
}

async function generateDeepSeekProjection(request, user, database, apiKey) {
  if (!apiKey) {
    const error = new Error('Configura DEEPSEEK_API_KEY en el archivo .env del proyecto y reinicia el servidor.')
    error.status = 503
    throw error
  }

  const body = await readBody(request)
  const factors = body.factors || {}
  const userContent = {
    horizonDays: database.aiConfig.horizons?.[1] || 60,
    activity: {
      posts: Number(user.stats?.posts) || 0,
      comments: Number(user.stats?.comments) || 0,
      legendsVisited: Number(user.stats?.legendsVisited) || 0,
      reputation: Number(user.reputation) || 0,
    },
    factors,
    weights: database.aiConfig.weights,
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Eres un analista de actividad comunitaria. Devuelve solo JSON válido en español con: horizonDays (número), growthRate (porcentaje), projectedReach (entero), confidence (0 a 1), riskLevel (alto|medio|bajo), series (3 elementos con month, activeUsers, posts, engagement), recommendations (2 a 4 objetos con title, detail, impact alto|medio|bajo). Basa las cifras en las entradas, evita afirmar certezas y no inventes datos actuales.',
          },
          { role: 'user', content: JSON.stringify(userContent) },
        ],
      }),
      signal: controller.signal,
    })
    const payload = await response.json()
    if (!response.ok) {
      const message = payload.error?.message || `DeepSeek respondió con estado ${response.status}.`
      const error = new Error(message)
      error.status = response.status === 429 ? 429 : 502
      throw error
    }

    const content = payload.choices?.[0]?.message?.content
    if (typeof content !== 'string') throw new Error('DeepSeek devolvió una respuesta vacía.')
    return normalizeProjection(parseModelJson(content), factors, payload.model || 'deepseek-chat')
  } finally {
    clearTimeout(timeout)
  }
}

function validateNewUser(body, existingUsers) {
  const username = String(body.username || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const displayName = String(body.displayName || '').trim()
  const password = String(body.password || '')

  if (username.length < 3 || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return { error: 'El usuario debe tener al menos 3 caracteres y usar letras, números, punto, guion o guion bajo.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'El correo electrónico no es válido.' }
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  if (!displayName) return { error: 'Escribe el nombre visible de la cuenta.' }
  if (existingUsers.some((user) => user.username.toLowerCase() === username.toLowerCase() || user.email.toLowerCase() === email)) {
    return { error: 'Ese usuario o correo ya están registrados.' }
  }
  return { username, email, displayName, password }
}

export function createApiPlugin(env) {
  const secret = env.AUTH_SECRET || crypto.randomBytes(32).toString('hex')
  const apiKey = env.DEEPSEEK_API_KEY || ''

  async function handle(request, response, next) {
    const url = new URL(request.url || '/', 'http://localhost')
    if (!url.pathname.startsWith('/api/')) return next()

    try {
      if (request.method === 'GET' && url.pathname === '/api/health') {
        return sendJson(response, 200, { ready: true, deepseekConfigured: Boolean(apiKey) })
      }

      let database = readDatabase()

      if (request.method === 'POST' && url.pathname === '/api/auth/login') {
        const body = await readBody(request)
        const identifier = String(body.identifier || '').trim().toLowerCase()
        const user = database.users.find((item) => item.username.toLowerCase() === identifier || item.email.toLowerCase() === identifier)
        if (!user || !verifyPassword(user, String(body.password || ''))) {
          return sendJson(response, 401, { success: false, message: 'Usuario o contraseña incorrectos.' })
        }
        if (user.passwordHash && user.password) {
          delete user.password
          writeDatabase(database)
        }
        return sendJson(response, 200, { success: true, user: sanitizeUser(user), token: createToken(user, secret) })
      }

      if (request.method === 'POST' && url.pathname === '/api/auth/register') {
        const body = await readBody(request)
        const validated = validateNewUser(body, database.users)
        if (validated.error) return sendJson(response, 400, { success: false, message: validated.error })
        const user = {
          id: `u-${crypto.randomUUID()}`,
          username: validated.username,
          email: validated.email,
          passwordHash: hashPassword(validated.password),
          displayName: validated.displayName,
          role: 'usuario',
          avatar: '/images/la-segua.jpg',
          bio: 'Nuevo miembro de la comunidad de LEYENDAS CR.',
          province: String(body.province || 'San José'),
          joinedAt: new Date().toISOString().slice(0, 10),
          reputation: 0,
          badges: ['Nuevo miembro'],
          stats: { posts: 0, comments: 0, legendsVisited: 0 },
          age: Number(body.age) || 18,
          isAdult: body.isAdult !== false,
          birthDate: body.birthDate || null,
        }
        database.users.push(user)
        writeDatabase(database)
        return sendJson(response, 201, {
          success: true,
          user: sanitizeUser(user),
          token: createToken(user, secret),
          ageWarning: user.isAdult ? null : `Eres menor de edad (${user.age} años). Algunas zonas peligrosas estarán restringidas.`,
        })
      }

      const authenticatedUser = getAuthenticatedUser(request, database, secret)
      if (!authenticatedUser || authenticatedUser.role !== 'admin') {
        return sendJson(response, 403, { message: 'Se requiere una sesión de administrador.' })
      }

      if (request.method === 'GET' && url.pathname === '/api/users') {
        return sendJson(response, 200, database.users.map(sanitizeUser))
      }

      if (request.method === 'POST' && url.pathname === '/api/users') {
        const body = await readBody(request)
        const validated = validateNewUser(body, database.users)
        if (validated.error) return sendJson(response, 400, { message: validated.error })
        const validRoles = database.roles.map((role) => role.id)
        if (!validRoles.includes(body.role)) return sendJson(response, 400, { message: 'El rol seleccionado no existe.' })
        const user = {
          id: `u-${crypto.randomUUID()}`,
          username: validated.username,
          email: validated.email,
          passwordHash: hashPassword(validated.password),
          displayName: validated.displayName,
          role: body.role,
          avatar: '/images/la-segua.jpg',
          bio: 'Cuenta creada desde el panel de administración.',
          province: String(body.province || 'San José'),
          joinedAt: new Date().toISOString().slice(0, 10),
          reputation: 0,
          badges: ['Nuevo miembro'],
          stats: { posts: 0, comments: 0, legendsVisited: 0 },
          age: 18,
          isAdult: true,
          birthDate: null,
        }
        database.users.push(user)
        writeDatabase(database)
        return sendJson(response, 201, sanitizeUser(user))
      }

      const roleMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/role$/)
      if (request.method === 'PATCH' && roleMatch) {
        const body = await readBody(request)
        const validRoles = database.roles.map((role) => role.id)
        const target = database.users.find((user) => user.id === decodeURIComponent(roleMatch[1]))
        if (!target) return sendJson(response, 404, { message: 'No se encontró esa cuenta.' })
        if (!validRoles.includes(body.role)) return sendJson(response, 400, { message: 'El rol seleccionado no existe.' })
        if (target.id === authenticatedUser.id && body.role !== 'admin') {
          return sendJson(response, 400, { message: 'No puedes quitarte tu propio rol de administrador.' })
        }
        target.role = body.role
        writeDatabase(database)
        return sendJson(response, 200, sanitizeUser(target))
      }

      if (request.method === 'POST' && url.pathname === '/api/ai/projection') {
        const result = await generateDeepSeekProjection(request, authenticatedUser, database, apiKey)
        return sendJson(response, 200, result)
      }

      return sendJson(response, 404, { message: 'Ruta API no encontrada.' })
    } catch (error) {
      const status = error.status || (error.message.includes('JSON') ? 400 : 500)
      if (!response.headersSent) sendJson(response, status, { message: error.message || 'Error interno del servidor.' })
    }
  }

  const middleware = (request, response, next) => {
    handle(request, response, next).catch((error) => {
      if (!response.headersSent) sendJson(response, 500, { message: error.message || 'Error interno del servidor.' })
    })
  }

  return {
    name: 'leyendas-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
