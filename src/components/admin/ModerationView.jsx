/**
 * components/admin/ModerationView.jsx
 * -----------------------------------------------------------------------------
 * Vista parcial de moderacion del foro.
 * Disponible para roles "moderador" y "admin".
 * -----------------------------------------------------------------------------
 */

import { useEffect, useMemo, useState } from 'react'
import { listPosts, moderatePost, getModerationQueue } from '../../services/forumService'
import { getUsers, getForumCategories } from '../../services/dbService'
import { useToast } from '../../context/ToastContext'
import PostCard from '../forum/PostCard'

export default function ModerationView({ openQueueRequest = 0 }) {
  const [posts, setPosts] = useState([])
  const [queueCount, setQueueCount] = useState(0)
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [filter, setFilter] = useState('todos')
  const toast = useToast()

  useEffect(() => {
    if (openQueueRequest > 0) setFilter('revision')
  }, [openQueueRequest])

  useEffect(() => {
    let active = true
    Promise.all([listPosts({ includeHidden: true }), getUsers(), getForumCategories(), getModerationQueue()])
      .then(([postList, userList, categoryList, queue]) => {
        if (!active) return
        setPosts(postList)
        setUsers(userList)
        setCategories(categoryList)
        setQueueCount(queue.length)
      })
    return () => {
      active = false
    }
  }, [])

  /** Mapa id -> usuario para resolver autores sin consultas adicionales. */
  const authorsById = useMemo(() => users.reduce((acc, user) => {
    acc[user.id] = user
    return acc
  }, {}), [users])

  const visible = useMemo(() => {
    if (filter === 'todos') return posts
    if (filter === 'revision') return posts.filter((post) => post.status !== 'publicado')
    return posts.filter((post) => post.status === filter)
  }, [posts, filter])

  const handleToggle = async (postId, action) => {
    const result = await moderatePost(postId, action)
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, status: result.status } : post)))
    const queue = await getModerationQueue()
    setQueueCount(queue.length)
    if (action === 'hide') {
      toast.warning('Publicacion oculta', 'El contenido dejo de estar visible en la comunidad.')
    } else {
      toast.success('Publicacion restaurada', 'Vuelve a estar visible para la comunidad.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="panel flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="panel-title">Cola de moderacion</h2>
          <p className="panel-subtitle">
            {queueCount} publicacion(es) fuera del listado publico · {posts.length} en total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['todos', 'revision', 'publicado', 'oculto', 'pendiente'].map((option) => (
            <button
              key={option}
              type="button"
              className="a11y-option"
              style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
            >
              {option === 'revision' ? 'por revisar' : option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {visible.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            author={authorsById[post.authorId]}
            category={categories.find((item) => item.id === post.categoryId)}
            onToggleStatus={handleToggle}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-muted text-center py-8" style={{ fontSize: '0.85rem' }}>
          No hay publicaciones en este estado.
        </p>
      )}
    </div>
  )
}
