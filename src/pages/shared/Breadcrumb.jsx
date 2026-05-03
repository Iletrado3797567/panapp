// Breadcrumb.jsx
// Uso:
//   const crumbs = [
//     { label: 'Categorías', onClick: () => navigate('categorias') },
//     { label: 'PANES DE MASA MADRE', onClick: () => navigate('categoria') },
//     { label: 'Productos' },   // último: sin onClick, no es pulsable
//   ]
//   <Breadcrumb crumbs={crumbs} />

export default function Breadcrumb({ crumbs }) {
  if (!crumbs || crumbs.length === 0) return null

  return (
    <nav className="flex items-center flex-wrap gap-1 text-xs text-muted-foreground mb-4 select-none">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300">›</span>}
            {isLast || !crumb.onClick ? (
              <span className={isLast ? 'text-gray-700 font-medium' : ''}>
                {crumb.label}
              </span>
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
