import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import InsumosPage from './stock/InsumosPage'
import ObradorPage from './ObradorPage'
import { Breadcrumb } from './shared'

const TABS = ['COMPRAS', 'STOCK', 'OBRADOR', 'VENTAS']

const SUBMODULOS = {
  STOCK: ['Insumos'],
  OBRADOR: ['Categorías', 'Productos', 'Variantes', 'Fórmulas'],
  COMPRAS: [],
  VENTAS: [],
}

function PendingModule({ nombre }) {
  return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">
      <p>Módulo <strong>{nombre}</strong> en construcción...</p>
    </div>
  )
}

function SubMenu({ tab, activeSubmod, onSelect }) {
  const opciones = SUBMODULOS[tab] || []
  if (opciones.length === 0) return null
  return (
    <div className="border-b bg-gray-50">
      <div className="flex px-4">
        {opciones.map(op => (
          <button
            key={op}
            onClick={() => onSelect(op)}
            className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSubmod === op
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  )
}

function renderSubmod(tab, submod, breadcrumbBase, onSubmodChange) {
  if (!submod) return null

  if (tab === 'STOCK' && submod === 'Insumos') {
    return (
      <InsumosPage
        breadcrumbExtra={breadcrumbBase}
      />
    )
  }

  if (tab === 'OBRADOR') {
    return (
      <ObradorPage
        submodulo={submod}
        breadcrumbExtra={breadcrumbBase}
        onSubmodChange={onSubmodChange}
      />
    )
  }

  return <PendingModule nombre={submod} />
}

export default function HomePage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState(null)
  const [activeSubmod, setActiveSubmod] = useState(null)

  function handleTabChange(tab) {
    setActiveTab(tab)
    setActiveSubmod(null)
  }

  function handleSubmodChange(submod) {
    setActiveSubmod(submod)
  }

  const breadcrumbBase = [
    { label: activeTab, onClick: () => setActiveSubmod(null) },
    ...(activeSubmod ? [{ label: activeSubmod }] : []),
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍞</span>
          <span className="font-bold text-lg">PanApp — Mamapanelhierro</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80">{user?.email || user?.name}</span>
          <button
            onClick={logout}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Tabs principales */}
      <div className="border-b bg-white">
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Submenú */}
      {activeTab && (
        <SubMenu
          tab={activeTab}
          activeSubmod={activeSubmod}
          onSelect={handleSubmodChange}
        />
      )}

      {/* Contenido */}
      <main className="p-4">
        {!activeTab && (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>Selecciona un módulo para comenzar.</p>
          </div>
        )}
        {activeTab && !activeSubmod && SUBMODULOS[activeTab].length > 0 && (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>Selecciona una opción del menú.</p>
          </div>
        )}
        {activeTab && activeSubmod && (
          renderSubmod(activeTab, activeSubmod, breadcrumbBase, handleSubmodChange)
        )}
        {activeTab && SUBMODULOS[activeTab].length === 0 && (
          <PendingModule nombre={activeTab} />
        )}
      </main>
    </div>
  )
}