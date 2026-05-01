import { useState, useEffect } from 'react'
import { list, create, update, remove } from '../../api/sheetsClient'

const SHEET = 'INSUMOS'
const UNIDADES = ['kg', 'g', 'l', 'ml', 'ud', 'docena']

function InsumoForm({ initial, onSave, onCancel }) {
  const [nombre, setNombre] = useState(initial?.Nombre || '')
  const [unidad, setUnidad] = useState(initial?.Unidad || 'kg')
  const [costeRef, setCosteRef] = useState(initial?.CostoRef || '')

  function handleSubmit() {
    if (!nombre.trim()) return
    onSave({ Nombre: nombre.trim(), Unidad: unidad, CostoRef: costeRef })
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <h3 className="font-semibold mb-3">{initial ? 'Editar insumo' : 'Nuevo insumo'}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Nombre *</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Harina de fuerza"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Unidad</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={unidad}
            onChange={e => setUnidad(e.target.value)}
          >
            {UNIDADES.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Coste ref. (€)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            type="number"
            step="0.01"
            value={costeRef}
            onChange={e => setCosteRef(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSubmit}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90"
        >
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="border px-4 py-2 rounded text-sm hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default function InsumosPage() {
  const [insumos, setInsumos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    try {
      setLoading(true)
      const data = await list(SHEET)
      setInsumos(data)
    } catch (e) {
      setError('Error al cargar insumos: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave(data) {
    try {
      if (editing) {
        await update(SHEET, editing.Id, data)
      } else {
        await create(SHEET, data)
      }
      setShowForm(false)
      setEditing(null)
      load()
    } catch (e) {
      setError('Error al guardar: ' + e.message)
    }
  }

  async function handleDelete(id) {
    try {
      await remove(SHEET, id)
      setConfirmDelete(null)
      load()
    } catch (e) {
      setError('Error al eliminar: ' + e.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Insumos</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null) }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90"
        >
          + Nuevo insumo
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {(showForm || editing) && (
        <InsumoForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="bg-orange-50 border border-orange-200 px-4 py-3 rounded mb-4 text-sm flex items-center justify-between">
          <span>¿Eliminar <strong>{confirmDelete.Nombre}</strong>?</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleDelete(confirmDelete.Id)}
              className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
            >
              Eliminar
            </button>
            <button
              onClick={() => setConfirmDelete(null)}
              className="border px-3 py-1 rounded text-xs hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : insumos.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay insumos. Crea el primero.</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unidad</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Coste ref.</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((ins, i) => (
                <tr key={ins.Id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium">{ins.Nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{ins.Unidad}</td>
                  <td className="px-4 py-3 text-right">
                    {ins.CostoRef ? `${parseFloat(ins.CostoRef).toFixed(2)} €` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { setEditing(ins); setShowForm(false) }}
                      className="text-primary hover:underline mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(ins)}
                      className="text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
