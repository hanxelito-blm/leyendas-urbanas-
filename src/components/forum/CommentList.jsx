/**
 * components/forum/CommentList.jsx
 * -----------------------------------------------------------------------------
 * Lista de comentarios de una publicacion + formulario de respuesta.
 * Solo renderiza el formulario si hay sesion activa; en caso contrario
 * muestra el aviso de acceso restringido.
 * -----------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from './PostCard'

export default function CommentList({ comments, authors, onSubmit, onReply, onLike }) {
  const { isAuthenticated, user } = useAuth()
  const [body, setBody] = useState('')
  const [localComments, setLocalComments] = useState(comments)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [error, setError] = useState('')
  const [replyError, setReplyError] = useState('')
  const [sending, setSending] = useState(false)
  const [replySending, setReplySending] = useState(false)

  useEffect(() => {
    setLocalComments(comments)
  }, [comments])

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

  const handleLike = async (commentId) => {
    if (!onLike) return
    const result = await onLike(commentId)
    if (result && result.success) {
      setLocalComments((prev) =>
        prev.map((comment) => (comment.id === commentId ? { ...comment, likes: result.likes } : comment))
      )
    }
  }

  const handleReply = async (commentId) => {
    setReplyError('')
    if (replyBody.trim().length < 3) {
      setReplyError('La respuesta necesita al menos 3 caracteres.')
      return
    }

    if (!onReply) return

    setReplySending(true)
    try {
      const createdComment = await onReply(commentId, replyBody.trim())
      if (createdComment) {
        setLocalComments((prev) => [...prev, { ...createdComment, likes: 0 }])
      }
      setReplyBody('')
      setReplyingTo(null)
    } catch (submitError) {
      setReplyError(submitError.message)
    } finally {
      setReplySending(false)
    }
  }

  const topLevelComments = localComments.filter((comment) => !comment.parentId)
  const renderComment = (comment, depth = 0) => {
    const author = authors[comment.authorId]
    const replies = localComments.filter((item) => item.parentId === comment.id)

    return (
      <div
        key={comment.id}
        className={depth === 0 ? 'card-surface p-3' : 'rounded border border-[var(--border-soft)] p-2'}
      >
        <header className="flex items-center gap-2 flex-wrap" style={{ fontSize: '0.75rem' }}>
          <span className="text-secondary">{author ? author.displayName : 'Miembro'}</span>
          <span className="text-muted">{formatDate(comment.createdAt)}</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="btn-base btn-ghost"
              style={{ padding: '0.28rem 0.55rem', fontSize: '0.7rem' }}
              onClick={() => handleLike(comment.id)}
              disabled={!isAuthenticated || !user?.id}
              aria-label={`Me gusta en comentario de ${author ? author.displayName : 'Miembro'}`}
            >
              {comment.likes || 0} me gusta
            </button>
            <button
              type="button"
              className="btn-base btn-ghost"
              style={{ padding: '0.28rem 0.55rem', fontSize: '0.7rem' }}
              onClick={() => setReplyingTo((prev) => (prev === comment.id ? null : comment.id))}
              aria-expanded={replyingTo === comment.id}
            >
              Responder
            </button>
          </div>
        </header>
        <p className="text-secondary mt-1" style={{ fontSize: '0.87rem', lineHeight: 1.6 }}>
          {comment.body}
        </p>

        {replyingTo === comment.id && (
          <div className="mt-3 rounded border border-[var(--border-soft)] p-2">
            <label className="field-label" htmlFor={`reply-${comment.id}`}>
              Responder a este comentario
            </label>
            <textarea
              id={`reply-${comment.id}`}
              className="field-textarea"
              style={{ minHeight: 72 }}
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              placeholder="Escribe una respuesta..."
            />
            {replyError && <p className="field-error mt-2">{replyError}</p>}
            <div className="mt-2 flex gap-2">
              <button type="button" className="btn-base btn-solid" onClick={() => handleReply(comment.id)} disabled={replySending}>
                {replySending ? 'Publicando...' : 'Enviar respuesta'}
              </button>
              <button
                type="button"
                className="btn-base btn-ghost"
                onClick={() => {
                  setReplyingTo(null)
                  setReplyBody('')
                  setReplyError('')
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 border-l border-[var(--border-soft)] pl-3">
            {replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="heading-gothic text-accent" style={{ fontSize: '0.9rem' }}>
        Respuestas ({localComments.length})
      </h3>

      {topLevelComments.length === 0 && (
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
          Todavia no hay respuestas. Se la primera persona en documentar este avistamiento.
        </p>
      )}

      {topLevelComments.map((comment) => renderComment(comment))}

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
