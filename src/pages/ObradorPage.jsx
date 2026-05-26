import CategoriasPage from './obrador/CategoriasPage'
import ProductosPage from './obrador/ProductosPage'

function PendingModule({ nombre }) {
  return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">
      <p>Módulo <strong>{nombre}</strong> en construcción...</p>
    </div>
  )
}

export default function ObradorPage({ submodulo, breadcrumbExtra, onSubmodChange }) {
  if (submodulo === 'Categorías') {
    return (
      <CategoriasPage
        breadcrumbExtra={breadcrumbExtra}
      />
    )
  }
  if (submodulo === 'Productos') {
    return (
      <ProductosPage
        breadcrumbExtra={breadcrumbExtra}
      />
    )
  }
  return <PendingModule nombre={submodulo} />
}