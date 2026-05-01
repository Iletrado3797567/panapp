import { useGoogleLogin } from "@react-oauth/google"
import { useAuth } from "./AuthContext"

export default function LoginPage() {
  const { loginSuccess } = useAuth()

  const login = useGoogleLogin({
    onSuccess: loginSuccess,
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
  })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-4xl">🍞</span>
        <span className="text-3xl font-bold text-primary">PanApp</span>
      </div>
      <p className="text-muted-foreground">Gestion de obrador - Mamapanelhierro</p>
      <button
        onClick={() => login()}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90"
      >
        Acceder con Google
      </button>
    </div>
  )
}
