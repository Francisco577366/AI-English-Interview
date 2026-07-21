import { createContext, useContext, useEffect, useState } from 'react'
import * as api from '../api.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('iapage_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .me()
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem('iapage_token'))
      .finally(() => setLoading(false))
  }, [])

  const doLogin = async (payload) => {
    const d = await api.login(payload)
    localStorage.setItem('iapage_token', d.token)
    setUser(d.user)
    return d
  }

  const doRegister = async (payload) => {
    const d = await api.register(payload)
    localStorage.setItem('iapage_token', d.token)
    setUser(d.user)
    return d
  }

  const logout = () => {
    localStorage.removeItem('iapage_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login: doLogin, register: doRegister, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
