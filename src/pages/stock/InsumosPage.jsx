import { useState, useEffect } from 'react'
import { list, create, update, remove } from '../../api/sheetsClient'
import { Breadcrumb, SearchBar, ActionBar, ModalConfirmDelete } from '../shared'

const SHEET = 'INSUMOS'
const UNIDADES = ['GRAMO', 'KG', 'LITROS', 'ML', 'UD', 'DOCENA']

function InsumoForm({ initial, onSave, onCancel }) {
  const [nombre, setNombre] = useState(initial?.Nombre || '')
  const [unidad, setUnidad] = useState(initial?.Unidad || 'GRAMO')
  const [costeRef, setCosteRef] = useState(initial?.CostoRef || '')
  const [clase, setClase] = useState(initial?.Clase || 'OTROS')

  function handleSubmit() {
    if (!nombre.trim()) return
    onSave({ Nombre: nombre.trim().toUpperCase(), Unidad: unidad, CostoRef: costeRef, Clase: clase })
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <h3 className="font-semibold mb-3">{initial ? 'Editar insumo' : 'Nuevo insumo'}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Nombre *</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm uppercase"
            value={nombre}
            onChange={e => setNombre(e.target.value.toUpperCase())}
            placeholder="EJ: HARINA DE FUERZA"
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Clase</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={clase}
            onChange={e => setClase(e.target.value)}
          >
            <option>HARINA</option>
            <option>AGUA</option>
            <option>SEMILLAS</option>
            <option>OTROS</option>
          </select>
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

export default function InsumosPage({ breadcrumbExtra = [] }) {
  const [insumos, setInsumos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busqueda, setBusqueda] = useState('')

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
    setSelected(prev => prev?.Id === ins.Id ? null : ins)
    setShowForm(false)
    setEditing(null)
  }

  const insumosOrdenados = [...insumos]
    .filter(ins => ins.Nombre.toUpperCase().includes(busqueda.toUpperCase()))
    .sort((a, b) => parseInt(b.Id) - parseInt(a.Id))

  const crumbs = [...breadcrumbExtra]

  return (
    <div onClick={() => setSelected(null)}>

      <Breadcrumb crumbs={crumbs} />

      <div className="flex items-center justify-between mb-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Insumos</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setSelected(null) }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90"
        >
          + Nuevo insumo
        </button>
      </div>

      <div onClick={e => e.stopPropagation()}>
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar insumo..." />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm" onClick={e => e.stopPropagation()}>
          {error}
        </div>
      )}

      {(showForm || editing) && (
        <div onClick={e => e.stopPropagation()}>
          <InsumoForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      {!(showForm || editing) && (
        loading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : insumosOrdenados.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {insumos.length === 0 ? 'No hay insumos. Crea el primero.' : 'No hay resultados.'}
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Clase</th>
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
                          : i % 2 === 0 ? 'bg-white hover:bg-orange-50' : 'bg-gray-50 hover:bg-orange-50',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 font-medium">{ins.Nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ins.Clase}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
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