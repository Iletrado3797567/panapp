import { useState, useEffect } from 'react'
import { list, create, update, remove } from '../../api/sheetsClient'

const SHEET = 'CATEGORIAS'

// ─── Formulario de creación / edición ────────────────────────────────────────
function CategoriaForm({ initial, onSave, onCancel }) {
  const [nombre, setNombre] = useState(initial?.Nombre || '')

  function handleSubmit() {
    if (!nombre.trim()) return
    onSave({ Nombre: nombre.trim().toUpperCase() })
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <h3 className="font-semibold mb-3">{initial ? 'Editar categoría' : 'Nueva categoría'}</h3>
      <div className="max-w-sm">
        <label className="text-sm text-muted-foreground block mb-1">Nombre *</label>
        <input
          className="w-full border rounded px-3 py-2 text-sm uppercase"
          value={nombre}
          onChange={e => setNombre(e.target.value.toUpperCase())}
          placeholder="EJ: PANES DE MASA MADRE"
          autoFocus
        />
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
function ModalConfirmDelete({ categoria, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl mx-4 p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-2 text-gray-900">¿Eliminar categoría?</h3>
        <p className="text-gray-600 mb-6">
          Vas a eliminar <span className="font-bold text-gray-900">{categoria.Nombre}</span>.
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

// ─── Barra de acciones fija ───────────────────────────────────────────────────
function ActionBar({ categoria, onEdit, onDelete }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center gap-3">
      <span className="flex-1 text-sm font-medium text-gray-700 truncate">
        {categoria.Nombre}
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
export default function CategoriasPage() {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    try {
      setLoading(true)
      const data = await list(SHEET)
      setCategorias(data)
    } catch (e) {
      setError('Error al cargar categorías: ' + e.message)
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

  function handleRowClick(cat) {
    setSelected(prev => prev?.Id === cat.Id ? null : cat)
    setShowForm(false)
    setEditing(null)
  }

  const categoriasOrdenadas = [...categorias].sort((a, b) => parseInt(b.Id) - parseInt(a.Id))
  const listPaddingBottom = selected ? 'pb-24' : 'pb-4'

  return (
    <div onClick={() => setSelected(null)}>

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Categorías</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setSelected(null) }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90"
        >
          + Nueva categoría
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm" onClick={e => e.stopPropagation()}>
          {error}
        </div>
      )}

      {/* Formulario */}
      {(showForm || editing) && (
        <div onClick={e => e.stopPropagation()}>
          <CategoriaForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : categorias.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay categorías. Crea la primera.</p>
      ) : (
        <div className={`bg-white rounded-lg border overflow-hidden ${listPaddingBottom}`} onClick={e => e.stopPropagation()}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
              </tr>
            </thead>
            <tbody>
              {categoriasOrdenadas.map((cat, i) => {
                const isSelected = selected?.Id === cat.Id
                return (
                  <tr
                    key={cat.Id}
                    onClick={() => handleRowClick(cat)}
                    className={[
                      'cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-orange-100 border-l-4 border-l-primary'
                        : i % 2 === 0
                          ? 'bg-white hover:bg-orange-50'
                          : 'bg-gray-50 hover:bg-orange-50',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3 text-muted-foreground w-16">{cat.Id}</td>
                    <td className="px-4 py-3 font-medium">{cat.Nombre}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Barra de acciones */}
      {selected && !showForm && !editing && (
        <ActionBar
          categoria={selected}
          onEdit={() => { setEditing(selected); setSelected(null) }}
          onDelete={() => setConfirmDelete(selected)}
        />
      )}

      {/* Modal borrado */}
      {confirmDelete && (
        <ModalConfirmDelete
          categoria={confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
