/**
 * pages/ModerationPage.jsx
 * -----------------------------------------------------------------------------
 * Ruta de moderacion accesible para roles "moderador" y "admin".
 * Reutiliza la vista parcial del panel para no duplicar la interfaz.
 * -----------------------------------------------------------------------------
 */

import ModerationView from '../components/admin/ModerationView'

export default function ModerationPage() {
  return (
    <div className="app-container flex flex-col gap-5 py-6">
      <header>
        <p className="field-label" style={{ marginBottom: 2 }}>
          Moderacion de la comunidad
        </p>
        <h1 className="heading-display text-accent" style={{ fontSize: '1.6rem' }}>
          Cola de revision
        </h1>
        <p className="text-muted mt-1" style={{ fontSize: '0.84rem' }}>
          Revisa las publicaciones denunciadas y decide si vuelven a estar visibles.
        </p>
      </header>

      <ModerationView />
    </div>
  )
}
