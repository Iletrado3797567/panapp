import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from './AuthContext'

export default function LoginPage() {
  const { login } = useAuth()

  const handleLogin = useGoogleLogin({
    onSuccess: login,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary">🍞 PanApp</h1>
          <p className="text-muted-foreground">Gestión de obrador · Mamapanelhierro</p>
        </div>
        <button
          onClick={handleLogin}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Acceder con Google
        </button>
      </div>
    </div>
  )
}