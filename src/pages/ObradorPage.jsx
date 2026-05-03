import { useState } from 'react'
import CategoriasPage from './obrador/CategoriasPage'
import ProductosPage from './obrador/ProductosPage'

const SUB_TABS = ['Categorías', 'Productos', 'Variantes', 'Fórmulas']

function PendingModule({ nombre }) {
  return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">
      <p>Módulo <strong>{nombre}</strong> en construcción...</p>
    </div>
  )
}

export default function ObradorPage() {
  const [activeSubTab, setActiveSubTab] = useState('Categorías')

  function renderSubContent() {
    if (activeSubTab === 'Categorías') return <CategoriasPage />
    if (activeSubTab === 'Productos') return <ProductosPage />
    return <PendingModule nombre={activeSubTab} />
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 border-b pb-0">
        {SUB_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors border-b-2 ${
              activeSubTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Contenido del sub-tab */}
      {renderSubContent()}
    </div>
  )
}
