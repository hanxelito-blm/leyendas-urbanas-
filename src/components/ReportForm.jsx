/**
 * components/ReportForm.jsx
 * -----------------------------------------------------------------------------
 * Formulario modal para reportar una leyenda o avistamiento.
 *
 * Se abre desde `MapPage`; al enviarse, la leyenda creada se incorpora de
 * inmediato al mapa con su nivel de riesgo declarado por quien reporta.
 * -----------------------------------------------------------------------------
 */

import { useState } from 'react'

/** Niveles de riesgo: el color nunca es la unica senal, siempre hay etiqueta. */
const RISK_LEVELS = [
  { value: 1, label: 'Bajo', advice: 'Riesgo minimo. Se puede visitar de dia y en grupo.' },
  { value: 2, label: 'Inquietante', advice: 'Lleva linterna y evita visiting solo de noche.' },
  { value: 3, label: 'Peligroso', advice: 'No ingreses en horario nocturno. Registra tu entrada y salida.' },
  { value: 4, label: 'Extremo', advice: 'Riesgo alto. Recomendamos no visitar sin guia autorizado.' },
]

const CATEGORIES = ['Mito Tradicional', 'Historia Urbana', 'Rural']

const PROVINCES = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón']

const EMPTY_FORM = {
  title: '',
  category: CATEGORIES[0],
  province: PROVINCES[0],
  locationName: '',
  dangerLevel: 2,
  description: '',
}

export default function ReportForm({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (form.title.trim().length < 4) {
      setError('El titulo debe tener al menos 4 caracteres.')
      return
    }
    if (form.description.trim().length < 20) {
      setError('Describe el avistamiento con al menos 20 caracteres.')
      return
    }
    onSubmit({ ...form, dangerLevel: Number(form.dangerLevel) })
    setForm(EMPTY_FORM)
    onClose()
  }

  const selectedRisk = RISK_LEVELS.find((item) => item.value === Number(form.dangerLevel))

  return (
    <div
      className="fixed inset-0 z-[1100] grid place-items-center p-3"
      style={{ background: 'var(--overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Reportar leyenda"
    >
      <form
        onSubmit={handleSubmit}
        className="panel w-full max-w-lg flex flex-col gap-3"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 className="panel-title">Reportar leyenda</h2>
            <p className="panel-subtitle">Registra un avistamiento o un sitio sin documentar</p>
          </div>
          <button type="button" onClick={onClose} className="toast-close" aria-label="Cerrar formulario">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div>
          <label className="field-label" htmlFor="reporte-titulo">Titulo</label>
          <input
            id="reporte-titulo"
            className="field-input"
            placeholder="Nombre del sitio o del avistamiento"
            value={form.title}
            onChange={handleChange('title')}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="reporte-categoria">Categoria</label>
            <select id="reporte-categoria" className="field-select" value={form.category} onChange={handleChange('category')}>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="reporte-provincia">Provincia</label>
            <select id="reporte-provincia" className="field-select" value={form.province} onChange={handleChange('province')}>
              {PROVINCES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="reporte-lugar">Lugar exacto</label>
          <input
            id="reporte-lugar"
            className="field-input"
            placeholder="Finca, escuela, puente, ruta..."
            value={form.locationName}
            onChange={handleChange('locationName')}
          />
        </div>

        {/* Nivel de riesgo con etiqueta textual (accesible en daltonismo) */}
        <div>
          <span className="field-label">Nivel de peligro</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {RISK_LEVELS.map((item) => (
              <button
                key={item.value}
                type="button"
                className="a11y-option"
                style={{ justifyContent: 'center' }}
                aria-pressed={Number(form.dangerLevel) === item.value}
                onClick={() => setForm((prev) => ({ ...prev, dangerLevel: item.value }))}
              >
                {item.value} · {item.label}
              </button>
            ))}
          </div>
          {selectedRisk && (
            <p className="text-muted mt-2" style={{ fontSize: '0.76rem' }}>
              Consejo: {selectedRisk.advice}
            </p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="reporte-descripcion">Descripcion</label>
          <textarea
            id="reporte-descripcion"
            className="field-textarea"
            placeholder="Que ocurrio, cuando, quienes estaban presentes y que se observo..."
            value={form.description}
            onChange={handleChange('description')}
          />
        </div>

        {error && <p className="field-error">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" className="btn-base btn-solid">Registrar reporte</button>
          <button type="button" className="btn-base btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
