import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import InsumosPage from './stock/InsumosPage'

const TABS = ['COMPRAS', 'STOCK', 'OBRADOR', 'VENTAS']

function PendingModule({ nombre }) {
  return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">
      <p>Módulo <strong>{nombre}</strong> en construcción...</p>
    </div>
  )
}

export default function HomePage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('STOCK')
  const [activeSubTab, setActiveSubTab] = useState('Insumos')

  function renderContent() {
    if (activeTab === 'STOCK') {
      return <InsumosPage />
    }
    return <PendingModule nombre={activeTab} />
  }

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
              onClick={() => setActiveTab(tab)}
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

      {/* Contenido */}
      <main className="p-4">
        {renderContent()}
      </main>
    </div>
  )
}
