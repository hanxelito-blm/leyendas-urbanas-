/**
 * components/admin/UsersView.jsx
 * -----------------------------------------------------------------------------
 * Vista parcial: gestion de usuarios y asignacion de roles.
 * Permite promover o degradar cuentas entre usuario, moderador y admin.
 * -----------------------------------------------------------------------------
 */

import { useEffect, useMemo, useState } from 'react'
import { getUsers, getRoles } from '../../services/dbService'
import { useToast } from '../../context/ToastContext'

const ROLE_COLORS = { usuario: 'var(--accent)', moderador: 'var(--color-alert)', admin: 'var(--color-danger)' }

export default function UsersView() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('todos')
  const toast = useToast()

  useEffect(() => {
    Promise.all([getUsers(), getRoles()]).then(([list, roleList]) => {
      setUsers(list)
      setRoles(roleList)
    })
  }, [])

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
  const changeRole = (id, nextRole) => {
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, role: nextRole } : user)))
    const target = users.find((user) => user.id === id)
    toast.success('Rol actualizado', `${target?.displayName || 'Usuario'} ahora es ${nextRole}.`)
  }

  return (
    <div className="flex flex-col gap-4">
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
