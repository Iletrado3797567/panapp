import { useState, useEffect, useCallback } from 'react'
import { list, create, update, remove } from '../../api/sheetsClient'

const SHEET = 'INSUMOS'
const UNIDADES = ['GRAMOS', 'KG', 'LITROS', 'ML', 'UD', 'DOCENA']

// ─── Formulario de creación / edición ────────────────────────────────────────
function InsumoForm({ initial, onSave, onCancel }) {
  const [nombre, setNombre] = useState(initial?.Nombre || '')
  const [unidad, setUnidad] = useState(initial?.Unidad || 'GRAMOS')
  const [costeRef, setCosteRef] = useState(initial?.CostoRef || '')

  function handleSubmit() {
    if (!nombre.trim()) return
    onSave({ Nombre: nombre.trim().toUpperCase(), Unidad: unidad, CostoRef: costeRef })
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <h3 className="font-semibold mb-3">{initial ? 'Editar insumo' : 'Nuevo insumo'}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Nombre *</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm uppercase"
            value={nombre}
            onChange={e => setNombre(e.target.value.toUpperCase())}
            placeholder="EJ: HARINA DE FUERZA"
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

// ─── Modal de confirmación de borrado ─────────────────────────────────────────
function ModalConfirmDelete({ insumo, onConfirm, onCancel }) {
  return (
    // Fondo oscuro que cubre toda la pantalla
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      {/* Tarjeta del modal — stopPropagation para que el clic interior no cierre */}
      <div
        className="bg-white rounded-2xl shadow-xl mx-4 p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-2 text-gray-900">¿Eliminar insumo?</h3>
        <p className="text-gray-600 mb-6">
          Vas a eliminar <span className="font-bold text-gray-900">{insumo.Nombre}</span>.
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 active:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-red-600 active:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Barra de acciones fija en la parte inferior ──────────────────────────────
function ActionBar({ insumo, onEdit, onDelete, onDeselect }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center gap-3">
      <span className="flex-1 text-sm font-medium text-gray-700 truncate">
        {insumo.Nombre}
      </span>
      <button
        onClick={onEdit}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 active:opacity-80"
      >
        ✏️ Editar
      </button>
      <button
        onClick={onDelete}
        className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 active:bg-red-700"
      >
        🗑 Eliminar
      </button>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function InsumosPage() {
  const [insumos, setInsumos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)       // insumo seleccionado (toque)
  const [confirmDelete, setConfirmDelete] = useState(null) // insumo pendiente de borrar

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
      setSelected(null)
      load()
    } catch (e) {
      setError('Error al guardar: ' + e.message)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    try {
      await remove(SHEET, confirmDelete.Id)
      setConfirmDelete(null)
      setSelected(null)
      load()
    } catch (e) {
      setError('Error al eliminar: ' + e.message)
    }
  }

  function handleRowClick(ins) {
    // Si ya estaba seleccionado, deselecciona
    setSelected(prev => prev?.Id === ins.Id ? null : ins)
    // Cerrar formulario si estaba abierto
    setShowForm(false)
    setEditing(null)
  }

  function handleDeselect() {
    setSelected(null)
  }

  function handleEditSelected() {
    if (!selected) return
    setEditing(selected)
    setShowForm(false)
    setSelected(null)
  }

  function handleDeleteSelected() {
    if (!selected) return
    setConfirmDelete(selected)
  }

  const insumosOrdenados = [...insumos].sort((a, b) => parseInt(b.Id) - parseInt(a.Id))

  // Añadir padding inferior cuando la ActionBar está visible para que la tabla no quede tapada
  const listPaddingBottom = selected ? 'pb-24' : 'pb-4'

  return (
    // Al hacer clic en el fondo (fuera de la tabla) se deselecciona
    <div onClick={handleDeselect}>

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Insumos</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setSelected(null) }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90"
        >
          + Nuevo insumo
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm"
          onClick={e => e.stopPropagation()}
        >
          {error}
        </div>
      )}

      {/* Formulario de creación / edición */}
      {(showForm || editing) && (
        <div onClick={e => e.stopPropagation()}>
          <InsumoForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : insumos.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay insumos. Crea el primero.</p>
      ) : (
        <div
          className={`bg-white rounded-lg border overflow-hidden ${listPaddingBottom}`}
          onClick={e => e.stopPropagation()}
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unidad</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Coste ref.</th>
              </tr>
            </thead>
            <tbody>
              {insumosOrdenados.map((ins, i) => {
                const isSelected = selected?.Id === ins.Id
                return (
                  <tr
                    key={ins.Id}
                    onClick={() => handleRowClick(ins)}
                    className={[
                      'cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-orange-100 border-l-4 border-l-primary'
                        : i % 2 === 0
                          ? 'bg-white hover:bg-orange-50'
                          : 'bg-gray-50 hover:bg-orange-50',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3 font-medium">{ins.Nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ins.Unidad}</td>
                    <td className="px-4 py-3 text-right">
                      {ins.CostoRef ? `${parseFloat(ins.CostoRef).toFixed(2)} €` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Barra de acciones fija (visible solo cuando hay selección) */}
      {selected && !showForm && !editing && (
        <ActionBar
          insumo={selected}
          onEdit={handleEditSelected}
          onDelete={handleDeleteSelected}
          onDeselect={handleDeselect}
        />
      )}

      {/* Modal de confirmación de borrado */}
      {confirmDelete && (
        <ModalConfirmDelete
          insumo={confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
