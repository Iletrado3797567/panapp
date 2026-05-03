import { useState, useEffect } from 'react'
import { list, create, update, remove } from '../../api/sheetsClient'

const SHEET = 'PRODUCTOS'

// ─── Formulario de creación / edición ────────────────────────────────────────
function ProductoForm({ initial, categorias, onSave, onCancel }) {
  const [catId, setCatId] = useState(initial?.Cat_Id || '')
  const [nombre, setNombre] = useState(initial?.Nombre || '')
  const [precio1, setPrecio1] = useState(initial?.Precio1 || '')
  const [precio2, setPrecio2] = useState(initial?.Precio2 || '')
  const [costo, setCosto] = useState(initial?.Costo || '')
  const [notas, setNotas] = useState(initial?.Notas || '')

  // Al montar en modo edición, catId ya viene relleno
  const catSeleccionada = categorias.find(c => String(c.Id) === String(catId))

  function handleSubmit() {
    if (!nombre.trim() || !catId) return
    onSave({
      Categoria: catSeleccionada?.Nombre || '',
      Cat_Id: String(catId),
      Nombre: nombre.trim().toUpperCase(),
      Precio1: precio1,
      Precio2: precio2,
      Costo: costo,
      Notas: notas.trim(),
    })
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <h3 className="font-semibold mb-3">{initial ? 'Editar producto' : 'Nuevo producto'}</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        {/* Categoría */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Categoría *</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={catId}
            onChange={e => setCatId(e.target.value)}
          >
            <option value="">— Selecciona —</option>
            {categorias.map(c => (
              <option key={c.Id} value={c.Id}>{c.Nombre}</option>
            ))}
          </select>
        </div>

        {/* Nombre */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Nombre *</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm uppercase"
            value={nombre}
            onChange={e => setNombre(e.target.value.toUpperCase())}
            placeholder="EJ: PAN DE CENTENO"
          />
        </div>

        {/* Precio 1 */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Precio estándar (€)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            type="number"
            step="0.01"
            value={precio1}
            onChange={e => setPrecio1(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {/* Precio 2 */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Precio especial (€)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            type="number"
            step="0.01"
            value={precio2}
            onChange={e => setPrecio2(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {/* Costo */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Costo (€)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            type="number"
            step="0.0001"
            value={costo}
            onChange={e => setCosto(e.target.value)}
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Normalmente se actualiza desde Fórmulas
          </p>
        </div>

        {/* Notas */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Notas</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Observaciones opcionales"
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
function ModalConfirmDelete({ producto, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl mx-4 p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-2 text-gray-900">¿Eliminar producto?</h3>
        <p className="text-gray-600 mb-6">
          Vas a eliminar <span className="font-bold text-gray-900">{producto.Nombre}</span>.
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
function ActionBar({ producto, onEdit, onDelete }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center gap-3">
      <span className="flex-1 text-sm font-medium text-gray-700 truncate">
        {producto.Nombre}
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
export default function ProductosPage() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [filtroCategoria, setFiltroCategoria] = useState('') // '' = todas

  async function load() {
    try {
      setLoading(true)
      const [prods, cats] = await Promise.all([list(SHEET), list('CATEGORIAS')])
      setProductos(prods)
      setCategorias(cats)
    } catch (e) {
      setError('Error al cargar productos: ' + e.message)
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

  function handleRowClick(prod) {
    setSelected(prev => prev?.Id === prod.Id ? null : prod)
    setShowForm(false)
    setEditing(null)
  }

  // Filtrado por categoría + orden descendente por Id
  const productosFiltrados = [...productos]
    .filter(p => filtroCategoria === '' || String(p.Cat_Id) === filtroCategoria)
    .sort((a, b) => parseInt(b.Id) - parseInt(a.Id))

  const listPaddingBottom = selected ? 'pb-24' : 'pb-4'

  return (
    <div onClick={() => setSelected(null)}>

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Productos</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setSelected(null) }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90"
        >
          + Nuevo producto
        </button>
      </div>

      {/* Filtro por categoría */}
      {categorias.length > 0 && (
        <div className="mb-4" onClick={e => e.stopPropagation()}>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias
              .slice()
              .sort((a, b) => a.Nombre.localeCompare(b.Nombre))
              .map(c => (
                <option key={c.Id} value={c.Id}>{c.Nombre}</option>
              ))}
          </select>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm" onClick={e => e.stopPropagation()}>
          {error}
        </div>
      )}

      {/* Formulario */}
      {(showForm || editing) && (
        <div onClick={e => e.stopPropagation()}>
          <ProductoForm
            initial={editing}
            categorias={categorias}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : productosFiltrados.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {productos.length === 0
            ? 'No hay productos. Crea el primero.'
            : 'No hay productos en esta categoría.'}
        </p>
      ) : (
        <div
          className={`bg-white rounded-lg border overflow-hidden ${listPaddingBottom}`}
          onClick={e => e.stopPropagation()}
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Categoría</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">P. estándar</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">P. especial</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Costo</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((prod, i) => {
                const isSelected = selected?.Id === prod.Id
                return (
                  <tr
                    key={prod.Id}
                    onClick={() => handleRowClick(prod)}
                    className={[
                      'cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-orange-100 border-l-4 border-l-primary'
                        : i % 2 === 0
                          ? 'bg-white hover:bg-orange-50'
                          : 'bg-gray-50 hover:bg-orange-50',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3 font-medium">
                      {prod.Nombre}
                      {/* En móvil mostramos la categoría bajo el nombre */}
                      <span className="block text-xs text-muted-foreground sm:hidden">
                        {prod.Categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{prod.Categoria}</td>
                    <td className="px-4 py-3 text-right">
                      {prod.Precio1 ? `${parseFloat(prod.Precio1).toFixed(2)} €` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      {prod.Precio2 ? `${parseFloat(prod.Precio2).toFixed(2)} €` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      {prod.Costo ? `${parseFloat(prod.Costo).toFixed(4)} €` : '—'}
                    </td>
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
          producto={selected}
          onEdit={() => { setEditing(selected); setSelected(null) }}
          onDelete={() => setConfirmDelete(selected)}
        />
      )}

      {/* Modal borrado */}
      {confirmDelete && (
        <ModalConfirmDelete
          producto={confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
