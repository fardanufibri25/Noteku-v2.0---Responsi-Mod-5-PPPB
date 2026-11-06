import { useState } from 'react'
import { NotebookPen } from 'lucide-react'
import { useAuth } from '../auth/useAuth'

export function AuthPage() {
  const { configured, signIn, signUp, sessionError } = useAuth()
  const [registering, setRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const { data, error: authError } = await (registering ? signUp : signIn)(email.trim(), password)
      if (authError) throw authError
      if (registering && !data.session) setMessage('Akun dibuat. Periksa email untuk konfirmasi sebelum masuk.')
    } catch (authError) {
      setError(authError.message || 'Autentikasi gagal. Periksa koneksi dan data akun.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="brand-mark auth-mark"><NotebookPen size={23} aria-hidden="true" /></span>
        <h1>NoteKu — Catatan Kuliah</h1>
        {!configured ? (
          <>
            <p>Hubungkan Supabase untuk mengaktifkan akun dan API catatan.</p>
            <div className="auth-message" role="status">Atur <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> di <code>.env.local</code>, lalu jalankan ulang Vite.</div>
          </>
        ) : (
          <>
            <p>{registering ? 'Buat akun untuk menjaga catatan tetap privat.' : 'Masuk untuk membuka catatan milik akun Anda.'}</p>
            {sessionError && <p className="form-error" role="alert">{sessionError}</p>}
            <form className="note-form" onSubmit={handleSubmit}>
              <label htmlFor="auth-email">Email</label>
              <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <label htmlFor="auth-password">Kata sandi</label>
              <input id="auth-password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
              {error && <p className="form-error" role="alert">{error}</p>}
              {message && <p className="auth-message" role="status">{message}</p>}
              <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
                {submitting ? 'Memproses...' : registering ? 'Buat akun' : 'Masuk'}
              </button>
            </form>
            <button className="text-button auth-toggle" type="button" onClick={() => { setRegistering((value) => !value); setError(''); setMessage('') }}>
              {registering ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
            </button>
            {/* Demo credentials are public on purpose for the course submission; remove after grading. */}
            {!registering && (
              <div className="auth-demo">
                Akun demo: <code>demo@example.com</code> / <code>NoteKuDemo#2026</code>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
