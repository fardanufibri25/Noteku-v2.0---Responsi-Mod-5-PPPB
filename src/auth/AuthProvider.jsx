import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase.js'
import { AuthContext } from './AuthContext.js'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
      if (error) setSessionError('Sesi gagal dibaca. Coba masuk kembali.')
    }).catch(() => {
      if (!active) return
      setLoading(false)
      setSessionError('Sesi gagal dibaca. Periksa penyimpanan browser atau coba masuk kembali.')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
      setSessionError('')
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user: session?.user ?? null,
    loading,
    sessionError,
    configured: Boolean(supabase),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
