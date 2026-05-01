import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './lib/AuthContext'
import LoginPage from './lib/LoginPage'
import HomePage from './pages/HomePage'

const GOOGLE_CLIENT_ID = '451662222311-b5gs6c5mhag2gl9dk70mh0s7cg2e88ks.apps.googleusercontent.com'

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
  return <HomePage />
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
