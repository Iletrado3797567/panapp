import { AuthProvider, useAuth } from './lib/AuthContext'
import LoginPage from './lib/LoginPage'
import HomePage from './pages/HomePage'

function AppContent() {
  const { user } = useAuth()
  if (!user) {
    return <LoginPage />
  }
  return <HomePage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}