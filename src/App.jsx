import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './lib/AuthContext'
import LoginPage from './lib/LoginPage'

const GOOGLE_CLIENT_ID = 'TU_CLIENT_ID_AQUI'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-background">
      <h1 className="text-2xl font-bold text-primary p-4">
        🍞 PanApp — Mamapanelhierro
      </h1>
      <p className="p-4 text-muted-foreground">
        Bienvenido. Navegación en construcción...
      </p>
    </div>
  )
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}