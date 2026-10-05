/**
 * pages/CommunityForum.jsx
 * -----------------------------------------------------------------------------
 * Foro de la Comunidad (ruta privada).
 *
 * Solo es accesible con sesion activa: `AppRoutes` la envuelve en
 * `<PrivateRoutes>`, y esta pagina ademas oculta la zona de escritura cuando el
 * usuario no puede publicar. Incluye:
 *   - listado por categoria y buscador,
 *   - formulario de nueva publicacion,
 *   - vista de detalle con comentarios,
 *   - cola de moderacion para roles moderador / administrador.
 * -----------------------------------------------------------------------------
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  listPosts,
  getPostWithComments,
  createPost,
  createComment,
  toggleCommentLike,
  moderatePost,
  getModerationQueue,
} from '../services/forumService'
import { getUsers, getForumCategories, getLegends } from '../services/dbService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import PostCard from '../components/forum/PostCard'
import CommentList from '../components/forum/CommentList'

export default function CommunityForum() {
  const { postId } = useParams()
  const [searchParams] = useSearchParams()
  const { user, can, hasRole } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [legends, setLegends] = useState([])
  const [users, setUsers] = useState({})
  const [categoryId, setCategoryId] = useState('')
  const [search, setSearch] = useState('')
  const [queueCount, setQueueCount] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [moderationMode, setModerationMode] = useState(searchParams.get('vista') === 'moderacion')

  /* Modo moderacion activable solo para el personal del archivo. */
  useEffect(() => {
    if (!hasRole('moderador', 'admin')) setModerationMode(false)
  }, [hasRole])

  /* Carga inicial de datos auxiliares. */
  useEffect(() => {
    Promise.all([getForumCategories(), getUsers(), getLegends(), getModerationQueue()]).then(
      ([categoryList, userList, legendList, queue]) => {
        setCategories(categoryList)
        setUsers(userList.reduce((acc, item) => ({ ...acc, [item.id]: item }), {}))
        setLegends(legendList)
        setQueueCount(queue.length)
      }
    )
  }, [])

  /* Lista de publicaciones segun categoria y busqueda. */
  useEffect(() => {
    if (postId) return
    listPosts({
      categoryId: categoryId || undefined,
      includeHidden: moderationMode,
      search,
    }).then(setPosts)
  }, [categoryId, search, postId, moderationMode])

  const authorsById = users

  const handleCreate = async (payload) => {
    try {
      const post = await createPost({ ...payload, authorId: user.id })
      setShowForm(false)
      toast.success('Publicacion creada', 'Tu testimonio ya esta visible en la comunidad.')
      navigate(`/comunidad/${post.id}`)
    } catch (error) {
      toast.error('No se pudo publicar', error.message)
    }
  }

  const handleComment = async (post, body, parentId = null) => {
    try {
      const createdComment = await createComment({ postId: post.id, authorId: user.id, body, parentId })
      toast.success('Respuesta publicada', 'Tu comentario se sumo al hilo.')
      return createdComment
    } catch (error) {
      toast.error('No se pudo comentar', error.message)
      return null
    }
  }

  const handleCommentLike = async (commentId) => {
    try {
      const result = await toggleCommentLike(commentId, user.id)
      if (!result.success) {
        toast.info('Voto registrado', result.message || 'Ya habias reaccionado a este comentario.')
      }
      return result
    } catch (error) {
      toast.error('No se pudo registrar el me gusta', error.message)
      return { success: false, likes: 0, message: error.message }
    }
  }

  const handleToggleStatus = async (id, action) => {
    const result = await moderatePost(id, action)
    setPosts((prev) => prev.map((post) => (post.id === id ? { ...post, status: result.status } : post)))
    setQueueCount((await getModerationQueue()).length)
    toast.info('Estado actualizado', `La publicacion ahora esta ${result.status}.`)
  }

  if (postId) {
    return (
      <PostDetail
        postId={postId}
        users={authorsById}
        categories={categories}
        legends={legends}
        onBack={() => navigate('/comunidad')}
        onComment={(body, parentId) => handleComment({ id: postId }, body, parentId)}
        onLike={handleCommentLike}
        canModerate={can('forum:moderate')}
        onToggleStatus={handleToggleStatus}
      />
    )
  }

  return (
    <div className="app-container flex flex-col gap-5 py-6">
      {/* Encabezado */}
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="heading-display text-accent" style={{ fontSize: '1.8rem' }}>
            Comunidad
          </h1>
          <p className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
            Espacio privado del archivo: {posts.length} publicaciones · {queueCount} en moderacion
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-base btn-solid" onClick={() => setShowForm((prev) => !prev)}>
            {showForm ? 'Cerrar formulario' : 'Nueva publicacion'}
          </button>
          {hasRole('moderador', 'admin') && (
            <button
              type="button"
              className="a11y-option"
              style={{ width: 'auto', padding: '0.55rem 0.9rem' }}
              aria-pressed={moderationMode}
              onClick={() => setModerationMode((prev) => !prev)}
            >
              {moderationMode ? 'Ocultando' : 'Ver'} publicaciones ocultas ({queueCount})
            </button>
          )}
        </div>
      </header>

      {/* Formulario de nueva publicacion */}
      {showForm && (
        <NewPostForm categories={categories} legends={legends} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {/* Filtros */}
      <div className="panel grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-end">
        <div className="lg:col-span-2">
          <label className="field-label" htmlFor="buscar-foro">
            Buscar en el foro
          </label>
          <input
            id="buscar-foro"
            className="field-input"
            placeholder="Titulo, contenido o etiqueta..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="categoria-foro">
            Categoria
          </label>
          <select
            id="categoria-foro"
            className="field-select"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Todas las categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Listado */}
      <section className="grid gap-3 lg:grid-cols-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            author={authorsById[post.authorId]}
            category={categories.find((item) => item.id === post.categoryId)}
            legend={legends.find((item) => item.id === post.relatedLegendId)}
            onToggleStatus={moderationMode ? handleToggleStatus : undefined}
          />
        ))}
      </section>

      {posts.length === 0 && (
        <p className="text-muted text-center py-10" style={{ fontSize: '0.88rem' }}>
          No hay publicaciones que coincidan con la busqueda.
        </p>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Formulario de nueva publicacion
   ═══════════════════════════════════════════════════════════════════════════ */

function NewPostForm({ categories, legends, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    body: '',
    categoryId: categories[0]?.id || 'c-1',
    relatedLegendId: '',
    tags: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSubmit({
        ...form,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        relatedLegendId: form.relatedLegendId || null,
      })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="panel flex flex-col gap-3" onSubmit={handleSubmit}>
      <h2 className="panel-title">Nueva publicacion</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="post-title">
            Titulo
          </label>
          <input
            id="post-title"
            className="field-input"
            placeholder="Titulo claro y descriptivo"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="post-category">
            Categoria
          </label>
          <select
            id="post-category"
            className="field-select"
            value={form.categoryId}
            onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="post-legend">
            Leyenda relacionada (opcional)
          </label>
          <select
            id="post-legend"
            className="field-select"
            value={form.relatedLegendId}
            onChange={(event) => setForm((prev) => ({ ...prev, relatedLegendId: event.target.value }))}
          >
            <option value="">Sin relacion</option>
            {legends.map((legend) => (
              <option key={legend.id} value={legend.id}>{legend.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="post-body">
          Detalle
        </label>
        <textarea
          id="post-body"
          className="field-textarea"
          placeholder="Describe el avistamiento, el contexto, la fecha y la hora..."
          value={form.body}
          onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="post-tags">
          Etiquetas (separadas por coma)
        </label>
        <input
          id="post-tags"
          className="field-input"
          placeholder="Puntarenas, sanatorio, evidencia"
          value={form.tags}
          onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
        />
      </div>

      {error && <p className="field-error">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" className="btn-base btn-solid" disabled={saving}>
          {saving ? 'Publicando...' : 'Publicar'}
        </button>
        <button type="button" className="btn-base btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Detalle de una publicacion con sus respuestas
   ═══════════════════════════════════════════════════════════════════════════ */

function PostDetail({ postId, users, categories, legends, onBack, onComment, onLike, canModerate, onToggleStatus }) {
  const [data, setData] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    getPostWithComments(postId).then((result) => {
      if (!active) return
      if (!result) {
        setNotFound(true)
        return
      }
      setData(result)
    })
    return () => {
      active = false
    }
  }, [postId])

  if (notFound) {
    return (
      <div className="app-container py-16 text-center">
        <p className="text-muted">Esta publicacion no existe o fue retirada del archivo.</p>
        <button type="button" className="btn-base btn-ghost mt-4" onClick={onBack}>
          Volver al foro
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="app-container py-10 flex flex-col gap-3">
        <div className="skeleton" style={{ height: 160 }} />
        <div className="skeleton" style={{ height: 60 }} />
      </div>
    )
  }

  const { post, comments } = data
  const category = categories.find((item) => item.id === post.categoryId)
  const legend = legends.find((item) => item.id === post.relatedLegendId)

  return (
    <div className="app-container flex flex-col gap-5 py-6" style={{ maxWidth: 860 }}>
      <button type="button" className="btn-base btn-ghost self-start" onClick={onBack}>
        ← Volver al foro
      </button>

      <PostCard
        post={post}
        author={users[post.authorId]}
        category={category}
        legend={legend}
        compact
        onToggleStatus={canModerate ? onToggleStatus : undefined}
      />

      {/* Cuerpo completo */}
      <article className="panel">
        <h2 className="panel-title mb-2">Relato completo</h2>
        <p className="text-secondary" style={{ fontSize: '0.92rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {post.body}
        </p>
      </article>

      <CommentList comments={comments} authors={users} onSubmit={onComment} onReply={onComment} onLike={onLike} />
    </div>
  )
}
