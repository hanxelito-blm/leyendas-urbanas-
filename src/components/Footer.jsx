/**
 * components/Footer.jsx
 * -----------------------------------------------------------------------------
 * Pie de pagina del portal: creditos, enlaces rapidos y aviso de que las
 * leyendas son relatos de folclore sin valor scientifico.
 * -----------------------------------------------------------------------------
 */

import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer mt-12">
      <div className="app-container grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h3 className="heading-gothic text-accent mb-2" style={{ fontSize: '0.95rem' }}>
            LEYENDAS CR
          </h3>
          <p className="text-muted leading-relaxed" style={{ fontSize: '0.8rem' }}>
            Portal interactivo de leyendas e historias urbanas de Costa Rica. Archivamos
            testimonios, advertencias y relatos del folclore nacional.
          </p>
        </div>

        <nav aria-label="Enlaces del pie de pagina">
          <h3 className="heading-gothic text-accent mb-2" style={{ fontSize: '0.8rem' }}>
            Secciones
          </h3>
          <ul className="flex flex-col gap-1">
            <li><Link className="text-muted hover:text-accent" to="/mapa">Mapa interactivo</Link></li>
            <li><Link className="text-muted hover:text-accent" to="/comunidad">Comunidad</Link></li>
            <li><Link className="text-muted hover:text-accent" to="/expediciones">Expediciones</Link></li>
            <li><Link className="text-muted hover:text-accent" to="/sobre">Sobre el archivo</Link></li>
          </ul>
        </nav>

        <div>
          <h3 className="heading-gothic text-accent mb-2" style={{ fontSize: '0.8rem' }}>
            Aviso del archivo
          </h3>
          <p className="text-muted leading-relaxed" style={{ fontSize: '0.78rem' }}>
            Las historias reunidas aqui pertenecen al folclore costarricense. Visitá los
            lugares por su valor cultural y respeta siempre las indicaciones de seguridad
            publicadas para cada sitio.
          </p>
        </div>
      </div>

      <div className="app-container flex flex-col sm:flex-row items-center justify-between gap-2 py-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
          Base de datos local · db.json · Proyecto academico
        </span>
        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
          Cartografia satelital © Esri
        </span>
      </div>
    </footer>
  )
}
