/**
 * services/forumService.js
 * -----------------------------------------------------------------------------
 * Servicio del Foro de la Comunidad.
 *
 * Lee la semilla de `db.json` y aplica encima las publicaciones/comentarios
 * creados en este navegador (persistidos en localStorage). Asi el foro parece
 * vivo sin necesidad de un backend real.
 * -----------------------------------------------------------------------------
 */

import db from '../data/db.json'
import { readValue, writeValue } from './storage'
import { getUsers } from './dbService'

const POSTS_KEY = 'forum-posts'
const COMMENTS_KEY = 'forum-comments'

/** Estados posibles de una publicacion. */
export const POST_STATUS = {
  PUBLISHED: 'publicado',
  HIDDEN: 'oculto',
  PENDING: 'pendiente',
}

/** Posts sembrados en db.json + los creados localmente. */
function getAllPosts() {
  const local = readValue(POSTS_KEY, [])
  return [...db.forum.posts, ...local]
}

/** Comments sembrados en db.json + los creados localmente. */
function getAllComments() {
  const local = readValue(COMMENTS_KEY, [])
  return [...db.forum.comments, ...local]
}

function persistPost(post) {
  const local = readValue(POSTS_KEY, [])
  writeValue(POSTS_KEY, [...local, post])
}

function persistComment(comment) {
  const local = readValue(COMMENTS_KEY, [])
  writeValue(COMMENTS_KEY, [...local, comment])
}

/**
 * Actualiza el estado de un post semilla o local.
 * Los posts locales se reescriben completos; los sembrados solo se marcan
 * como ocultos en un registro aparte.
 */
function updatePostStatus(postId, status) {
  const local = readValue(POSTS_KEY, [])
  if (local.some((post) => post.id === postId)) {
    writeValue(
      POSTS_KEY,
      local.map((post) => (post.id === postId ? { ...post, status } : post))
    )
    return true
  }

  const overrides = readValue('forum-post-overrides', {})
  overrides[postId] = status
  writeValue('forum-post-overrides', overrides)
  return true
}

/** Aplica las marcas de moderacion guardadas a los posts de db.json. */
function applyOverrides(posts) {
  const overrides = readValue('forum-post-overrides', {})
  return posts.map((post) =>
    overrides[post.id] ? { ...post, status: overrides[post.id] } : post
  )
}

/* ── Lectura ───────────────────────────────────────────────────────────────── */

/**
 * Lista publicaciones.
 * @param {{categoryId?: string, includeHidden?: boolean, search?: string}} options
 */
export async function listPosts({ categoryId, includeHidden = false, search } = {}) {
  const term = (search || '').trim().toLowerCase()

  const posts = applyOverrides(getAllPosts())
    .filter((post) => includeHidden || post.status === POST_STATUS.PUBLISHED)
    .filter((post) => !categoryId || post.categoryId === categoryId)
    .filter((post) => {
      if (!term) return true
      return `${post.title} ${post.excerpt} ${(post.tags || []).join(' ')}`
        .toLowerCase()
        .includes(term)
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

  return posts
}

/** Detalle de una publicacion con sus comentarios. */
export async function getPostWithComments(postId) {
  const posts = applyOverrides(getAllPosts())
  const post = posts.find((item) => item.id === postId) || null
  if (!post) return null

  const comments = getAllComments()
    .filter((comment) => comment.postId === postId && comment.status === 'visible')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  return { post, comments }
}

/** Autor de una publicacion, resuelto contra la lista de usuarios. */
export async function getPostAuthor(authorId) {
  const users = await getUsers()
  return users.find((user) => user.id === authorId) || null
}

/* ── Escritura ─────────────────────────────────────────────────────────────── */

/**
 * Crea una publicacion. Solo debe invocarse con un usuario autenticado;
 * la ruta privada ya garantiza esa condicion.
 */
export async function createPost({ authorId, title, body, categoryId, tags, relatedLegendId }) {
  const cleanTitle = String(title || '').trim()
  const cleanBody = String(body || '').trim()

  if (cleanTitle.length < 6) throw new Error('El titulo debe tener al menos 6 caracteres.')
  if (cleanBody.length < 20) throw new Error('El cuerpo debe tener al menos 20 caracteres.')

  const post = {
    id: `p-local-${Date.now().toString(36)}`,
    categoryId: categoryId || 'c-1',
    title: cleanTitle,
    excerpt: cleanBody.slice(0, 140) + (cleanBody.length > 140 ? '...' : ''),
    body: cleanBody,
    authorId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
    status: POST_STATUS.PUBLISHED,
    pinned: false,
    likes: 0,
    views: 0,
    relatedLegendId: relatedLegendId || null,
  }

  persistPost(post)
  return post
}

/** Crea un comentario en una publicacion. */
export async function createComment({ postId, authorId, body }) {
  const cleanBody = String(body || '').trim()
  if (cleanBody.length < 3) throw new Error('El comentario es demasiado corto.')

  const comment = {
    id: `c-local-${Date.now().toString(36)}`,
    postId,
    authorId,
    body: cleanBody,
    createdAt: new Date().toISOString(),
    likes: 0,
    status: 'visible',
  }

  persistComment(comment)
  return comment
}

/** Marca "me gusta" en una publicacion (solo registros locales nuevos). */
export async function toggleLike(postId, userId) {
  const local = readValue(POSTS_KEY, [])
  const post = local.find((item) => item.id === postId)
  if (!post) {
    // Los posts de db.json son de solo lectura: devolvemos el estado actual.
    const seeded = applyOverrides(getAllPosts()).find((item) => item.id === postId)
    return { success: false, likes: seeded ? seeded.likes : 0, message: 'El archivo semilla es de solo lectura.' }
  }
  post.likes += 1
  writeValue(POSTS_KEY, local)
  return { success: true, likes: post.likes }
}

/* ── Moderacion (rol moderador o admin) ────────────────────────────────────── */

/** Oculta o restaura una publicacion. */
export async function moderatePost(postId, action) {
  const status = action === 'restore' ? POST_STATUS.PUBLISHED : POST_STATUS.HIDDEN
  await new Promise((resolve) => setTimeout(resolve, 200))
  updatePostStatus(postId, status)
  return { id: postId, status }
}

/** Cola de moderacion: publicaciones ocultas pendientes de revision. */
export async function getModerationQueue() {
  const posts = applyOverrides(getAllPosts())
  return posts.filter((post) => post.status !== POST_STATUS.PUBLISHED)
}

/** Busqueda de usuarios por nombre visible o usuario. */
export async function searchUsers(term) {
  const value = String(term || '').trim().toLowerCase()
  if (!value) return []
  const list = await getUsers()
  return list.filter(
    (user) =>
      user.displayName.toLowerCase().includes(value) ||
      user.username.toLowerCase().includes(value)
  )
}
