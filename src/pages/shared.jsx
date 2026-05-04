// shared.jsx — componentes reutilizables de PanApp
// Ruta destino: src/pages/shared.jsx

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
export function Breadcrumb({ crumbs }) {
  if (!crumbs || crumbs.length === 0) return null
  return (
    <nav className="flex items-center flex-wrap gap-1 text-xs text-muted-foreground mb-4 select-none">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300">›</span>}
            {isLast || !crumb.onClick ? (
              <span className={isLast ? 'text-gray-700 font-medium' : ''}>{crumb.label}</span>
            ) : (
              <button
                onClick={crumb.onClick}
                className="text-primary hover:underline hover:text-primary/80 transition-colors"
              >
                {crumb.label}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}

// ─── SearchBar ────────────────────────────────────────────────────────────────
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

// ─── FullScreenPanel ──────────────────────────────────────────────────────────
export function FullScreenPanel({ children }) {
  return (
    <div className="fixed inset-0 z-30 bg-background overflow-y-auto">
      <div className="p-4">{children}</div>
    </div>
  )
}

// ─── ActionBar ────────────────────────────────────────────────────────────────
export function ActionBar({ label, onEdit, onDelete }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center gap-3">
      <span className="flex-1 text-sm font-medium text-gray-700 truncate">{label}</span>
      <button
        onClick={onEdit}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90"
      >
        ✏️ Editar
      </button>
      <button
        onClick={onDelete}
        className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-600"
      >
        🗑 Eliminar
      </button>
    </div>
  )
}

// ─── ModalConfirmDelete ───────────────────────────────────────────────────────
export function ModalConfirmDelete({ nombre, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl mx-4 p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-2 text-gray-900">¿Eliminar?</h3>
        <p className="text-gray-600 mb-6">
          Vas a eliminar <span className="font-bold text-gray-900">{nombre}</span>.
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 rounded-xl py-3 text-sm font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-red-600"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
