import { createContext, useContext, useState, useEffect } from 'react'
import { googleLogout } from '@react-oauth/google'
import { setAccessToken } from '../api/sheetsClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('panapp_token')
    const savedUser = localStorage.getItem('panapp_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      setAccessToken(savedToken)
    }
    setLoading(false)
  }, [])

  function login(credentialResponse) {
    const { access_token } = credentialResponse
    setToken(access_token)
    setAccessToken(access_token)
    localStorage.setItem('panapp_token', access_token)
    const userData = { name: 'Usuario', email: '' }
    setUser(userData)
    localStorage.setItem('panapp_user', JSON.stringify(userData))
  }

  function logout() {
    googleLogout()
    setUser(null)
    setToken(null)
    setAccessToken(null)
    localStorage.removeItem('panapp_token')
    localStorage.removeItem('panapp_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}