import { createContext, useContext, useState, useEffect } from "react"
import { googleLogout, useGoogleLogin } from "@react-oauth/google"
import { setAccessToken } from "../api/sheetsClient"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem("panapp_token")
    const savedUser = localStorage.getItem("panapp_user")
    if (savedToken && savedUser) {
      setAccessToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  function logout() {
    googleLogout()
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem("panapp_token")
    localStorage.removeItem("panapp_user")
  }

  function loginSuccess(tokenResponse) {
    const token = tokenResponse.access_token
    setAccessToken(token)
    localStorage.setItem("panapp_token", token)
    const userData = { name: "Usuario", email: "" }
    setUser(userData)
    localStorage.setItem("panapp_user", JSON.stringify(userData))
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, loginSuccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
