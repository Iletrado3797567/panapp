import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { setAccessToken, setUnauthorizedCallback } from '../api/sheetsClient'

const AuthContext = createContext(null)

const CLIENT_ID = '451662222311-b5gs6c5mhag2gl9dk70mh0s7cg2e88ks.apps.googleusercontent.com'
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const RENEW_BEFORE_MS = 5 * 60 * 1000   // renovar 5 min antes de caducar

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('panapp_user')
    return saved ? JSON.parse(saved) : null
  })

  const renewTimerRef = useRef(null)

  // Renovación silenciosa: devuelve Promise<string|null>
  function renewSilently() {
    return new Promise((resolve) => {
      if (!window.google?.accounts?.oauth2) {
        resolve(null)
        return
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        prompt: '',
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            console.warn('Renovación silenciosa fallida:', tokenResponse.error)
            handleLogout()
            resolve(null)
            return
          }
          applyToken(tokenResponse)
          resolve(tokenResponse.access_token)
        },
      })
      client.requestAccessToken()
    })
  }

  // Aplica el token y programa la siguiente renovación
  function applyToken(tokenResponse) {
    const t = tokenResponse.access_token
    const expiresIn = tokenResponse.expires_in ?? 3600
    setAccessToken(t)
    localStorage.setItem('panapp_token', t)
    localStorage.setItem('panapp_token_expiry', String(Date.now() + expiresIn * 1000))
    scheduleRenewal(expiresIn)
  }

  // Programa un setTimeout para renovar antes de que caduque
  function scheduleRenewal(expiresInSeconds) {
    if (renewTimerRef.current) clearTimeout(renewTimerRef.current)
    const delayMs = (expiresInSeconds * 1000) - RENEW_BEFORE_MS
    if (delayMs <= 0) {
      renewSilently()
      return
    }
    renewTimerRef.current = setTimeout(() => renewSilently(), delayMs)
  }

  function handleLogout() {
    if (renewTimerRef.current) clearTimeout(renewTimerRef.current)
    setUser(null)
    localStorage.removeItem('panapp_user')
    localStorage.removeItem('panapp_token')
    localStorage.removeItem('panapp_token_expiry')
  }

  useEffect(() => {
    const token = localStorage.getItem('panapp_token')
    const expiry = parseInt(localStorage.getItem('panapp_token_expiry') || '0')

    if (token && expiry > Date.now()) {
      // Token guardado aún válido: restaurar y programar renovación
      setAccessToken(token)
      const remainingSeconds = Math.floor((expiry - Date.now()) / 1000)
      scheduleRenewal(remainingSeconds)
    } else if (token) {
      // Token caducado: limpiar
      localStorage.removeItem('panapp_token')
      localStorage.removeItem('panapp_token_expiry')
    }

    // El callback de 401 ahora devuelve Promise<string|null>
    // sheetsClient espera el resultado y reintenta la petición
    setUnauthorizedCallback(() => renewSilently())

    return () => {
      if (renewTimerRef.current) clearTimeout(renewTimerRef.current)
    }
  }, [])

  function login() {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          console.error('Login error', tokenResponse)
          return
        }
        applyToken(tokenResponse)
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        })
        const profile = await res.json()
        setUser(profile)
        localStorage.setItem('panapp_user', JSON.stringify(profile))
      },
    })
    client.requestAccessToken()
  }

  function logout() {
    handleLogout()
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
