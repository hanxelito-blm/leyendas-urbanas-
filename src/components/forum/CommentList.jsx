/**
 * components/forum/CommentList.jsx
 * -----------------------------------------------------------------------------
 * Lista de comentarios de una publicacion + formulario de respuesta.
 * Solo renderiza el formulario si hay sesion activa; en caso contrario
 * muestra el aviso de acceso restringido.
 * -----------------------------------------------------------------------------
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from './PostCard'

export default function CommentList({ comments, authors, onSubmit }) {
  const { isAuthenticated } = useAuth()
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (body.trim().length < 3) {
      setError('El comentario necesita al menos 3 caracteres.')
      return
    }
    setSending(true)
    try {
      await onSubmit(body.trim())
      setBody('')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="heading-gothic text-accent" style={{ fontSize: '0.9rem' }}>
        Respuestas ({comments.length})
      </h3>

      {comments.length === 0 && (
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
          Todavia no hay respuestas. Se la primera persona en documentar este avistamiento.
        </p>
      )}

      {comments.map((comment) => {
        const author = authors[comment.authorId]
        return (
          <div key={comment.id} className="card-surface p-3">
            <header className="flex items-center gap-2" style={{ fontSize: '0.75rem' }}>
              <span className="text-secondary">{author ? author.displayName : 'Miembro'}</span>
              <span className="text-muted">{formatDate(comment.createdAt)}</span>
              <span className="text-muted ml-auto">{comment.likes} me gusta</span>
            </header>
            <p className="text-secondary mt-1" style={{ fontSize: '0.87rem', lineHeight: 1.6 }}>
              {comment.body}
            </p>
          </div>
        )
      })}

      {/* Formulario restringido a usuarios con sesion */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="panel flex flex-col gap-2">
          <label className="field-label" htmlFor="nuevo-comentario">
            Responder en el hilo
          </label>
          <textarea
            id="nuevo-comentario"
            className="field-textarea"
            style={{ minHeight: 90 }}
            placeholder="Comparte tu experiencia, pide evidencia o responde a otro miembro..."
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          {error && <p className="field-error">{error}</p>}
          <button type="submit" className="btn-base btn-solid self-start" disabled={sending}>
            {sending ? 'Publicando...' : 'Publicar respuesta'}
          </button>
        </form>
      ) : (
        <p className="text-muted" style={{ fontSize: '0.82rem' }}>
          <Link to="/login" className="text-accent hover:underline">
            Inicia sesion
          </Link>{' '}
          para responder en este hilo. La comunidad es un espacio privado.
        </p>
      )}
    </section>
  )
}
