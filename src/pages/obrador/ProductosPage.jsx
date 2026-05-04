import { useState, useEffect } from 'react'
import { list, create, update, remove } from '../../api/sheetsClient'
import { Breadcrumb, SearchBar, FullScreenPanel, ActionBar, ModalConfirmDelete } from '../shared'

const SHEET = 'PRODUCTOS'

function ProductoForm({ initial, categorias, categoriaFija, onSave, onCancel, onVerVariantes }) {
  const [catId, setCatId] = useState(
    categoriaFija ? String(categoriaFija.Id) : (initial?.Cat_Id || '')
  )
  const [nombre, setNombre] = useState(initial?.Nombre || '')
  const [precio1, setPrecio1] = useState(initial?.Precio1 || '')
  const [precio2, setPrecio2] = useState(initial?.Precio2 || '')
  const [costo, setCosto] = useState(initial?.Costo || '')
  const [notas, setNotas] = useState(initial?.Notas || '')

  const catSeleccionada = categoriaFija || categorias.find(c => String(c.Id) === String(catId))

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
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Categoría *</label>
          {categoriaFija ? (
            <div className="w-full border rounded px-3 py-2 text-sm bg-gray-50 text-gray-600">
              {categoriaFija.Nombre}
            </div>
          ) : (
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
          )}
        </div>

        <div>
          <label className="text-sm text-muted-foreground block mb-1">Nombre *</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm uppercase"
            value={nombre}
            onChange={e => setNombre(e.target.value.toUpperCase())}
            placeholder="EJ: PAN DE CENTENO"
            autoFocus
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground block mb-1">Precio estándar (€)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            type="number" step="0.01"
            value={precio1}
            onChange={e => setPrecio1(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground block mb-1">Precio especial (€)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            type="number" step="0.01"
            value={precio2}
            onChange={e => setPrecio2(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground block mb-1">Costo (€)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            type="number" step="0.0001"
            value={costo}
            onChange={e => setCosto(e.target.value)}
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground mt-1">Normalmente se actualiza desde Fórmulas</p>
        </div>

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

      <div className="flex flex-wrap gap-2 mt-4">
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
        {initial && (
          <button
            onClick={onVerVariantes}
            className="ml-auto flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded text-sm hover:bg-orange-50"
          >
            🔧 Ver variantes →
          </button>
        )}
      </div>
    </div>
  )
}

// Props:
//   categoriaFija → objeto categoría cuando venimos desde CategoriasPage
//   onVolver      → fn para volver al nivel anterior
export default function ProductosPage({ categoriaFija, onVolver, breadcrumbExtra = [] }) {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState(
    categoriaFija ? String(categoriaFija.Id) : ''
  )
  const [nivelVariantes, setNivelVariantes] = useState(null)

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

  function handleVerVariantes() {
    setNivelVariantes(editing)
    setEditing(null)
    setShowForm(false)
    setSelected(null)
  }

  function handleVolverDeVariantes() {
    const prod = nivelVariantes
    setNivelVariantes(null)
    setEditing(prod)
  }

  // ── Nivel variantes (placeholder hasta VariantesPage) ─────────────────────
  if (nivelVariantes) {
    const crumbs = [
      ...breadcrumbExtra,
      { label: 'Productos', onClick: () => { setNivelVariantes(null); setEditing(null) } },
      { label: nivelVariantes.Nombre, onClick: handleVolverDeVariantes },
      { label: 'Variantes' },
    ]
    return (
      <FullScreenPanel>
        <Breadcrumb crumbs={crumbs} />
        <div className="flex flex-col items-center justify-center h-48 gap-4 text-muted-foreground">
          <p>Módulo <strong>Variantes</strong> en construcción...</p>
          <button
            onClick={handleVolverDeVariantes}
            className="flex items-center gap-2 border px-4 py-2 rounded text-sm hover:bg-gray-50"
          >
            ← Volver a {nivelVariantes.Nombre}
          </button>
        </div>
      </FullScreenPanel>
    )
  }

  // ── Vista lista de productos ───────────────────────────────────────────────
  const crumbs = [
    ...breadcrumbExtra,
    { label: categoriaFija ? `Productos — ${categoriaFija.Nombre}` : 'Productos' },
  ]

  const productosFiltrados = [...productos]
    .filter(p => {
      const coincideCategoria = filtroCategoria === '' || String(p.Cat_Id) === filtroCategoria
      const coincideBusqueda = p.Nombre.toUpperCase().includes(busqueda.toUpperCase())
      return coincideCategoria && coincideBusqueda
    })
    .sort((a, b) => parseInt(b.Id) - parseInt(a.Id))

  return (
    <div onClick={() => setSelected(null)}>

      <Breadcrumb crumbs={crumbs} />

      <div className="flex items-center justify-between mb-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">
          {categoriaFija ? `Productos — ${categoriaFija.Nombre}` : 'Productos'}
        </h2>
        <div className="flex items-center gap-2">
          {onVolver && (
            <button
              onClick={onVolver}
              className="border px-3 py-2 rounded text-sm hover:bg-gray-50"
            >
              ← Volver
            </button>
          )}
          <button
            onClick={() => { setShowForm(true); setEditing(null); setSelected(null) }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90"
          >
            + Nuevo producto
          </button>
        </div>
      </div>

      <div onClick={e => e.stopPropagation()}>
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
      </div>

      {!categoriaFija && categorias.length > 0 && (
        <div className="mb-4" onClick={e => e.stopPropagation()}>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias
              .slice().sort((a, b) => a.Nombre.localeCompare(b.Nombre))
              .map(c => <option key={c.Id} value={c.Id}>{c.Nombre}</option>)}
          </select>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm" onClick={e => e.stopPropagation()}>
          {error}
        </div>
      )}

      {(showForm || editing) && (
        <div onClick={e => e.stopPropagation()}>
          <ProductoForm
            initial={editing}
            categorias={categorias}
            categoriaFija={categoriaFija}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null) }}
            onVerVariantes={handleVerVariantes}
          />
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : productosFiltrados.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {productos.length === 0 ? 'No hay productos. Crea el primero.' : 'No hay resultados.'}
        </p>
      ) : (
        <div
          className={`bg-white rounded-lg border overflow-hidden ${selected ? 'pb-24' : ''}`}
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
                        : i % 2 === 0 ? 'bg-white hover:bg-orange-50' : 'bg-gray-50 hover:bg-orange-50',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3 font-medium">
                      {prod.Nombre}
                      <span className="block text-xs text-muted-foreground sm:hidden">{prod.Categoria}</span>
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

      {selected && !showForm && !editing && (
        <ActionBar
          label={selected.Nombre}
          onEdit={() => { setEditing(selected); setSelected(null) }}
          onDelete={() => setConfirmDelete(selected)}
        />
      )}

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
