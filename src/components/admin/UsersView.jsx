/**
 * components/admin/UsersView.jsx
 * -----------------------------------------------------------------------------
 * Vista parcial: gestion de usuarios y asignacion de roles.
 * Permite promover o degradar cuentas entre usuario, moderador y admin.
 * -----------------------------------------------------------------------------
 */

import { useEffect, useMemo, useState } from 'react'
import { createUser, getUsers, getRoles, updateUserRole } from '../../services/dbService'
import { useToast } from '../../context/ToastContext'

const ROLE_COLORS = { usuario: 'var(--accent)', moderador: 'var(--color-alert)', admin: 'var(--color-danger)' }

export default function UsersView({ openCreateRequest = 0 }) {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('todos')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newUser, setNewUser] = useState({ displayName: '', username: '', email: '', password: '', province: 'San José', role: 'usuario' })
  const toast = useToast()

  useEffect(() => {
    if (openCreateRequest > 0) setCreateOpen(true)
  }, [openCreateRequest])

  useEffect(() => {
    Promise.all([getUsers(), getRoles()]).then(([list, roleList]) => {
      setUsers(list)
      setRoles(roleList)
    }).catch((error) => toast.error('No se pudieron cargar las cuentas', error.message))
  }, [toast])

  /** Filtra por texto y por rol. */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users
      .filter((user) => (roleFilter === 'todos' ? true : user.role === roleFilter))
      .filter((user) =>
        term
          ? `${user.displayName} ${user.username} ${user.email}`.toLowerCase().includes(term)
          : true
      )
  }, [users, search, roleFilter])

  /**
   * Cambio de rol simulado: en un backend real seria
   *   await fetch(`/api/users/${id}/role`, { method: 'PATCH', ... })
   */
  const changeRole = async (id, nextRole) => {
    try {
      const updated = await updateUserRole(id, nextRole)
      setUsers((prev) => prev.map((user) => (user.id === id ? updated : user)))
      toast.success('Rol actualizado', `${updated.displayName} ahora es ${nextRole}.`)
    } catch (error) {
      toast.error('No se pudo cambiar el rol', error.message)
    }
  }

  const handleCreateUser = async (event) => {
    event.preventDefault()
    setCreating(true)
    try {
      const created = await createUser(newUser)
      setUsers((prev) => [...prev, created])
      setNewUser({ displayName: '', username: '', email: '', password: '', province: 'San José', role: 'usuario' })
      setCreateOpen(false)
      toast.success('Cuenta creada', `${created.displayName} se guardó en la base de datos.`)
    } catch (error) {
      toast.error('No se pudo crear la cuenta', error.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button type="button" className="btn-base btn-solid" onClick={() => setCreateOpen((open) => !open)}>
          {createOpen ? 'Cancelar' : 'Crear usuario'}
        </button>
      </div>

      {createOpen && (
        <form className="panel grid gap-3 sm:grid-cols-2" onSubmit={handleCreateUser}>
          <div>
            <label className="field-label" htmlFor="new-display-name">Nombre visible</label>
            <input id="new-display-name" className="field-input" required value={newUser.displayName} onChange={(event) => setNewUser((prev) => ({ ...prev, displayName: event.target.value }))} />
          </div>
          <div>
            <label className="field-label" htmlFor="new-username">Usuario</label>
            <input id="new-username" className="field-input" required minLength={3} value={newUser.username} onChange={(event) => setNewUser((prev) => ({ ...prev, username: event.target.value }))} />
          </div>
          <div>
            <label className="field-label" htmlFor="new-email">Correo</label>
            <input id="new-email" type="email" className="field-input" required value={newUser.email} onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))} />
          </div>
          <div>
            <label className="field-label" htmlFor="new-password">Contraseña temporal</label>
            <input id="new-password" type="password" className="field-input" required minLength={6} autoComplete="new-password" value={newUser.password} onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))} />
          </div>
          <div>
            <label className="field-label" htmlFor="new-province">Provincia</label>
            <input id="new-province" className="field-input" value={newUser.province} onChange={(event) => setNewUser((prev) => ({ ...prev, province: event.target.value }))} />
          </div>
          <div>
            <label className="field-label" htmlFor="new-role">Rol inicial</label>
            <select id="new-role" className="field-select" value={newUser.role} onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-base btn-solid justify-self-start sm:col-span-2" disabled={creating}>
            {creating ? 'Guardando...' : 'Guardar usuario'}
          </button>
        </form>
      )}

      {/* Filtros */}
      <div className="panel flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="field-label" htmlFor="buscar-usuarios">
            Buscar
          </label>
          <input
            id="buscar-usuarios"
            className="field-input"
            placeholder="Nombre, usuario o correo..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <label className="field-label" htmlFor="filtro-rol">
            Rol
          </label>
          <select
            id="filtro-rol"
            className="field-select"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="todos">Todos los roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        <span className="text-muted" style={{ fontSize: '0.78rem' }}>
          {filtered.length} de {users.length} cuentas
        </span>
      </div>

      {/* Listado */}
      <div className="panel">
        <div className="table-scroll">
          <table className="w-full text-left" style={{ fontSize: '0.85rem', minWidth: 640 }}>
            <thead>
              <tr className="text-muted" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <th className="py-2">Miembro</th>
                <th className="py-2">Provincia</th>
                <th className="py-2 text-right">Reputacion</th>
                <th className="py-2 text-right">Actividad</th>
                <th className="py-2">Rol</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt=""
                        className="rounded"
                        style={{ width: 36, height: 36, objectFit: 'cover', border: '1px solid var(--border-soft)' }}
                        onError={(event) => {
                          event.currentTarget.style.visibility = 'hidden'
                        }}
                      />
                      <div>
                        <div className="text-primary">{user.displayName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          @{user.username} · {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-secondary">{user.province}</td>
                  <td className="py-3 text-right text-primary">{user.reputation.toLocaleString('es-CR')}</td>
                  <td className="py-3 text-right text-muted" style={{ fontSize: '0.78rem' }}>
                    {user.stats.posts} pub · {user.stats.comments} com
                  </td>
                  <td className="py-3">
                    <select
                      className="field-select"
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem', width: 'auto', color: ROLE_COLORS[user.role] }}
                      value={user.role}
                      onChange={(event) => changeRole(user.id, event.target.value)}
                      aria-label={`Rol de ${user.displayName}`}
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-muted text-center py-6" style={{ fontSize: '0.85rem' }}>
            Ningun miembro coincide con el filtro aplicado.
          </p>
        )}
      </div>
    </div>
  )
}
