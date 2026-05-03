import { useState, useEffect } from 'react'
import { list, create, update, remove } from '../../api/sheetsClient'
import Breadcrumb from '../shared/Breadcrumb'
import ProductosPage from './ProductosPage'

const SHEET = 'CATEGORIAS'

// ─── Componentes compartidos ──────────────────────────────────────────────────

function ModalConfirmDelete({ nombre, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl mx-4 p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2 text-gray-900">¿Eliminar?</h3>
        <p className="text-gray-600 mb-6">
          Vas a eliminar <span className="font-bold text-gray-900">{nombre}</span>.
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-300 rounded-xl py-3 text-sm font-medium hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-red-600">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

function ActionBar({ label, onEdit, onDelete }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center gap-3">
      <span className="flex-1 text-sm font-medium text-gray-700 truncate">{label}</span>
      <button onClick={onEdit} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90">
        ✏️ Editar
      </button>
      <button onClick={onDelete} className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-600">
        🗑 Eliminar
      </button>
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative mb-4">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
      <input
        className="w-full border rounded-lg pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Buscar...'}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  )
}

// Panel que ocupa toda la pantalla para niveles hijos
export function FullScreenPanel({ children }) {
  return (
    <div className="fixed inset-0 z-30 bg-background overflow-y-auto">
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

// ─── Formulario de categoría ──────────────────────────────────────────────────
function CategoriaForm({ initial, onSave, onCancel, onVerProductos }) {
  const [nombre, setNombre] = useState(initial?.Nombre || '')

  function handleSubmit() {
    if (!nombre.trim()) return
    onSave({ Nombre: nombre.trim().toUpperCase() })
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <h3 className="font-semibold mb-3">
        {initial ? 'Editar categoría' : 'Nueva categoría'}
      </h3>
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
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={handleSubmit} className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90">
          Guardar
        </button>
        <button onClick={onCancel} className="border px-4 py-2 rounded text-sm hover:bg-gray-50">
          Cancelar
        </button>
        {initial && onVerProductos && (
          <button
            onClick={onVerProductos}
            className="ml-auto flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded text-sm hover:bg-orange-50"
          >
            📦 Ver productos →
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CategoriasPage({ breadcrumbBase = [] }) {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [nivelProductos, setNivelProductos] = useState(null) // categoría activa al navegar a productos

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

  function handleVerProductos() {
    setNivelProductos(editing)
    setEditing(null)
    setShowForm(false)
    setSelected(null)
  }

  function handleVolverDeProductos() {
    const cat = nivelProductos
    setNivelProductos(null)
    setEditing(cat)
  }

  // ── Nivel productos ────────────────────────────────────────────────────────
  if (nivelProductos) {
    const crumbs = [
      ...breadcrumbBase,
      { label: 'Categorías', onClick: () => { setNivelProductos(null); setEditing(null) } },
      { label: nivelProductos.Nombre, onClick: handleVolverDeProductos },
      { label: 'Productos' },
    ]
    return (
      <FullScreenPanel>
        <Breadcrumb crumbs={crumbs} />
        <ProductosPage
          categoriaFija={nivelProductos}
          breadcrumbBase={crumbs.slice(0, -1)}
          onVolver={handleVolverDeProductos}
        />
      </FullScreenPanel>
    )
  }

  // ── Vista lista de categorías ──────────────────────────────────────────────
  const crumbs = [...breadcrumbBase, { label: 'Categorías' }]

  const categoriasFiltradas = [...categorias]
    .filter(c => c.Nombre.toUpperCase().includes(busqueda.toUpperCase()))
    .sort((a, b) => parseInt(b.Id) - parseInt(a.Id))

  return (
    <div onClick={() => setSelected(null)}>

      <Breadcrumb crumbs={crumbs} />

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

      {/* Búsqueda */}
      <div onClick={e => e.stopPropagation()}>
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar categoría..." />
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
            onVerProductos={editing ? handleVerProductos : null}
          />
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : categoriasFiltradas.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {categorias.length === 0 ? 'No hay categorías. Crea la primera.' : 'No hay resultados.'}
        </p>
      ) : (
        <div
          className={`bg-white rounded-lg border overflow-hidden ${selected ? 'pb-24' : ''}`}
          onClick={e => e.stopPropagation()}
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
              </tr>
            </thead>
            <tbody>
              {categoriasFiltradas.map((cat, i) => {
                const isSelected = selected?.Id === cat.Id
                return (
                  <tr
                    key={cat.Id}
                    onClick={() => handleRowClick(cat)}
                    className={[
                      'cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-orange-100 border-l-4 border-l-primary'
                        : i % 2 === 0 ? 'bg-white hover:bg-orange-50' : 'bg-gray-50 hover:bg-orange-50',
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

      {/* ActionBar */}
      {selected && !showForm && !editing && (
        <ActionBar
          label={selected.Nombre}
          onEdit={() => { setEditing(selected); setSelected(null) }}
          onDelete={() => setConfirmDelete(selected)}
        />
      )}

      {/* Modal borrado */}
      {confirmDelete && (
        <ModalConfirmDelete
          nombre={confirmDelete.Nombre}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
