/**
 * pages/LoginPage.jsx
 * -----------------------------------------------------------------------------
 * Inicio de sesion + Registro unificado en una sola vista limpia.
 * - Pestañas para alternar entre Entrar y Registrarse.
 * - Valida contra `services/authService.login` / `register`.
 * - Redirige a la ruta originalmente solicitada o al inicio.
 * - Cuentas de demostracion accesibles desde un acordeon discreto.
 * -----------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getProvinces } from '../services/dbService'

/** Cuentas de demostracion. */
const DEMO_ACCOUNTS = [
  { username: 'admin', role: 'Administrador', note: 'Panel completo + IA' },
  { username: 'mod_isabel', role: 'Moderador', note: 'Moderacion del foro' },
  { username: 'explorador', role: 'Usuario', note: 'Lectura, mapa y foro' },
]

export default function LoginPage() {
  const { login, register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({
    identifier: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    email: '',
    province: 'San José',
    identificacion: '',
    birthDate: '',
  })
  const [provinces, setProvinces] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)

  // Carga provincias para el selector de registro.
  useEffect(() => {
    getProvinces().then(setProvinces)
  }, [])

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    // Validación de confirmación de contraseña en registro
    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      setSubmitting(false)
      return
    }

    let result
    if (mode === 'login') {
      result = await login({ identifier: form.identifier, password: form.password })
    } else {
      result = await register({
        username: form.identifier,
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        province: form.province,
        identificacion: form.identificacion,
        birthDate: form.birthDate,
      })
    }

    setSubmitting(false)

    if (!result.success) {
      setError(result.message)
      return
    }

    toast.success(`Bienvenido, ${result.user.displayName}`, 'Tu sesion se inicio correctamente.')
    const destination = location.state?.from || '/'
    navigate(destination, { replace: true })
  }

  const fillDemo = (username) => {
    setForm((prev) => ({ ...prev, identifier: username, password: 'leyendas123' }))
    setError('')
    setMode('login')
    setDemoOpen(false)
  }

const resetForm = () => {
    setForm({ identifier: '', password: '', confirmPassword: '', displayName: '', email: '', province: 'San José', identificacion: '', birthDate: '' })
    setError('')
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    resetForm()
    setDemoOpen(false)
  }

  return (
    <div className="app-container py-8 flex justify-center">
      <div className="w-full max-w-md flex flex-col gap-5">
        {/* Encabezado minimalista */}
        <header className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4" style={{ textDecoration: 'none' }}>
            <span className="grid place-items-center rounded" style={{
              width: 44, height: 44,
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-surface)',
            }}>
              <svg width="24" height="24" fill="none" stroke="var(--accent)" viewBox="0 0 24 24" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m6 3l-5.447-2.724A1 1 0 0115 4.618v10.764a1 1 0 01-.553.894L9 19" />
              </svg>
            </span>
            <span className="heading-display text-accent" style={{ fontSize: '1.5rem' }}>
              LEYENDAS CR
            </span>
          </Link>
          <h1 className="heading-gothic text-primary" style={{ fontSize: '1.3rem', marginTop: 4 }}>
            {mode === 'login' ? 'Entrar al archivo' : 'Crear tu cuenta'}
          </h1>
          <p className="text-muted mt-1" style={{ fontSize: '0.82rem', maxWidth: '22ch', margin: '0 auto' }}>
            {mode === 'login'
              ? 'Accede a la comunidad, expediciones y panel de administracion.'
              : 'Unete a la comunidad de investigadores del folklore costarricense.'}
          </p>
        </header>

        {/* Pestañas de modo */}
        <div className="flex gap-1" style={{ background: 'var(--bg-inset)', borderRadius: 8, padding: 2 }}>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded transition ${mode === 'login' ? 'bg-[var(--accent)] text-[var(--bg-base)]' : 'text-muted hover:text-primary'}`}
            onClick={() => switchMode('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded transition ${mode === 'register' ? 'bg-[var(--accent)] text-[var(--bg-base)]' : 'text-muted hover:text-primary'}`}
            onClick={() => switchMode('register')}
          >
            Registrarse
          </button>
        </div>

        {/* Formulario */}
        <form className="panel flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
          {mode === 'login' ? (
            <>
              <div>
                <label className="field-label" htmlFor="identifier">Usuario o correo</label>
                <input
                  id="identifier"
                  className="field-input"
                  autoComplete="username"
                  placeholder="admin"
                  value={form.identifier}
                  onChange={handleChange('identifier')}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="password">Contrasena</label>
                <input
                  id="password"
                  type="password"
                  className="field-input"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange('password')}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="field-label" htmlFor="displayName">Nombre visible</label>
                <input
                  id="displayName"
                  className="field-input"
                  placeholder="Como te veran en la comunidad"
                  value={form.displayName}
                  onChange={handleChange('displayName')}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="username">Usuario</label>
                  <input
                    id="username"
                    className="field-input"
                    autoComplete="username"
                    placeholder="explorador_01"
                    value={form.identifier}
                    onChange={handleChange('identifier')}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="province">Provincia</label>
                  <select
                    id="province"
                    className="field-select"
                    value={form.province}
                    onChange={handleChange('province')}
                  >
                    {(provinces.length > 0 ? provinces : [form.province]).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="email">Correo electronico</label>
                <input
                  id="email"
                  type="email"
                  className="field-input"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  value={form.email}
                  onChange={handleChange('email')}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="passwordReg">Contrasena</label>
                <input
                  id="passwordReg"
                  type="password"
                  className="field-input"
                  autoComplete="new-password"
                  placeholder="Minimo 6 caracteres"
                  value={form.password}
                  onChange={handleChange('password')}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="confirmPassword">Confirmar contrasena</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="field-input"
                  autoComplete="new-password"
                  placeholder="Repite la contrasena"
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="identificacion">Cedula (opcional, para verificar edad)</label>
                <input
                  id="identificacion"
                  className="field-input"
                  placeholder="1-2345-6789"
                  value={form.identificacion}
                  onChange={handleChange('identificacion')}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="birthDate">Fecha de nacimiento (opcional)</label>
                <input
                  id="birthDate"
                  type="date"
                  className="field-input"
                  value={form.birthDate}
                  onChange={handleChange('birthDate')}
                />
              </div>
            </>
          )}

          {error && <p className="field-error" role="alert">{error}</p>}

          <button type="submit" className="btn-base btn-solid w-full" disabled={submitting}>
            {submitting ? (mode === 'login' ? 'Verificando...' : 'Creando cuenta...') : (mode === 'login' ? 'Entrar al archivo' : 'Crear mi cuenta')}
          </button>
        </form>

        {/* Demo accounts - acordeon discreto */}
        <details className="panel" open={demoOpen} onToggle={() => setDemoOpen(!demoOpen)}>
          <summary className="flex items-center justify-between cursor-pointer field-label">
            <span>Cuentas de demostracion</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ transition: 'transform 0.2s', transform: demoOpen ? 'rotate(180deg)' : '' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-muted" style={{ fontSize: '0.75rem' }}>
              Contrasena compartida: <code>leyendas123</code>
            </p>
            <ul className="flex flex-col gap-2 m-0 p-0 list-none">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.username}>
                  <button
                    type="button"
                    className="a11y-option"
                    onClick={() => fillDemo(account.username)}
                  >
                    <span className="flex flex-col items-start">
                      <span className="text-primary">{account.username}</span>
                      <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {account.note}
                      </span>
                    </span>
                    <span className="badge">{account.role}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </details>

        <p className="text-muted text-center" style={{ fontSize: '0.72rem' }}>
          Todas las cuentas nuevas inician con rol <strong>Usuario</strong>.
          Los roles Moderador y Administrador se asignan desde el panel interno.
        </p>
      </div>
    </div>
  )
}