/**
 * components/forum/PostCard.jsx
 * -----------------------------------------------------------------------------
 * Tarjeta de una publicacion del foro. Muestra autor, categoria, etiquetas,
 * leyenda relacionada con su nivel de riesgo y acciones de moderacion
 * disponibles para el personal del archivo.
 * -----------------------------------------------------------------------------
 */

import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const STATUS_LABELS = {
  publicado: 'Publicado',
  oculto: 'Oculto por moderacion',
  pendiente: 'Pendiente de revision',
}

export default function PostCard({ post, author, category, legend, onToggleStatus, compact = false }) {
  const { hasRole } = useAuth()
  const canModerate = hasRole('moderador', 'admin')
  const published = post.status === 'publicado'

  return (
    <article className="card-surface p-4 sm:p-5 flex flex-col gap-3">
      {/* Cabecera */}
      <header className="flex flex-wrap items-center gap-2 text-muted" style={{ fontSize: '0.75rem' }}>
        <span
          className="badge"
          style={{ color: category ? category.color : 'var(--accent)' }}
          title={category ? category.description : ''}
        >
          {category ? category.name : 'General'}
        </span>
        {post.pinned && <span className="badge">Fijado</span>}
        {!published && <span className="badge danger-3">{STATUS_LABELS[post.status] || post.status}</span>}
        <span className="ml-auto">{formatDate(post.createdAt)}</span>
      </header>

      <h3 className="heading-gothic text-accent" style={{ fontSize: '1.02rem', lineHeight: 1.35 }}>
        {post.title}
      </h3>

      <p className="text-secondary" style={{ fontSize: '0.86rem', lineHeight: 1.6 }}>
        {post.excerpt}
      </p>

      {/* Leyenda relacionada */}
      {legend && (
        <p className="text-muted" style={{ fontSize: '0.78rem' }}>
          Leyenda relacionada:{' '}
          <Link to="/mapa" className="text-accent hover:underline">
            {legend.title}
          </Link>{' '}
          <span className={`badge danger-${legend.danger.level}`}>Riesgo {legend.danger.level}</span>
        </p>
      )}

      {/* Etiquetas */}
      {post.tags?.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <li key={tag} className="text-muted" style={{ fontSize: '0.72rem' }}>
              #{tag}
            </li>
          ))}
        </ul>
      )}

      {/* Pie */}
      <footer className="flex flex-wrap items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
        <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
          {author ? author.displayName : 'Miembro archivado'}
        </span>
        <span className="text-muted ml-auto" style={{ fontSize: '0.75rem' }}>
          {post.likes} me gusta · {post.views} vistas
        </span>
        {!compact && (
          <Link to={`/comunidad/${post.id}`} className="btn-base btn-ghost">
            Abrir
          </Link>
        )}
        {canModerate && onToggleStatus && (
          <button
            type="button"
            className="btn-base btn-ghost"
            onClick={() => onToggleStatus(post.id, published ? 'hide' : 'restore')}
          >
            {published ? 'Ocultar' : 'Restaurar'}
          </button>
        )}
      </footer>
    </article>
  )
}

/** Formatea una fecha ISO a "12 sep 2025". */
export function formatDate(iso) {
  if (!iso) return 'sin fecha'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'sin fecha'
  return date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
}
