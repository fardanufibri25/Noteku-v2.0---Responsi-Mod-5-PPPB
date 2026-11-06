import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { BookOpen, Home, NotebookPen, Plus, UserRound, WifiOff } from 'lucide-react'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'
import { AuthPage } from './pages/AuthPage'
import { useNotes } from './hooks/useNotes'
import { Dashboard } from './pages/Dashboard'
import { NoteDetail } from './pages/NoteDetail'
import { NoteEditor } from './pages/NoteEditor'
import { Notes } from './pages/Notes'
import { Profile } from './pages/Profile'
import './index.css'

function AppLayout() {
  const { user, loading: authLoading, signOut } = useAuth()
  const notes = useNotes(user?.id)
  const location = useLocation()
  const [online, setOnline] = useState(navigator.onLine)
  const [serviceWorkerReady, setServiceWorkerReady] = useState(Boolean(navigator.serviceWorker?.controller))
  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine)
    const updateWorker = () => setServiceWorkerReady(Boolean(navigator.serviceWorker?.controller))
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    navigator.serviceWorker?.addEventListener('controllerchange', updateWorker)
    navigator.serviceWorker?.ready.then(updateWorker)
    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
      navigator.serviceWorker?.removeEventListener('controllerchange', updateWorker)
    }
  }, [])

  const navItems = [
    { to: '/', label: 'Beranda', icon: Home, end: true },
    { to: '/notes', label: 'Catatan', icon: BookOpen },
    { to: '/profile', label: 'Profil', icon: UserRound },
  ]

  if (authLoading) return <main className="page-container"><p className="loading-state">Memeriksa sesi...</p></main>
  if (!user) return <AuthPage />

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="NoteKu, Beranda">
          <span className="brand-mark"><NotebookPen size={21} aria-hidden="true" /></span>
          <span className="brand-copy"><strong>NoteKu</strong><small>Catatan Kuliah</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="Navigasi utama">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <Link
              className={`nav-link ${location.pathname === to || (!end && to === '/notes' && location.pathname.startsWith('/notes')) ? 'is-active' : ''}`}
              key={to}
              to={to}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <Link className="profile-link" to="/profile" aria-label="Buka profil">
          <span className="avatar avatar-small">FF</span>
          <span className="profile-link-name">{user.email}</span>
        </Link>
      </header>

      <main className="page-container">
        {!online && (
          <div className="offline-banner" role="status">
            <WifiOff size={18} aria-hidden="true" />
            <div><strong>Mode luring</strong><span>Perubahan disimpan lokal dan menunggu sinkronisasi{notes.pendingCount ? ` (${notes.pendingCount})` : ''}.</span></div>
          </div>
        )}
        {notes.syncError && (
          <div className="error-banner" role="alert">
            <span>{notes.syncError}</span>
            <button type="button" className="text-button" onClick={notes.clearSyncError}>Tutup</button>
          </div>
        )}
        {notes.error && (
          <div className="error-banner" role="alert">
            <span>{notes.error}</span>
            <button type="button" className="text-button" onClick={notes.clearError}>Tutup</button>
          </div>
        )}
        <Outlet context={{ ...notes, online, serviceWorkerReady, user, signOut }} />
      </main>

      <nav className="mobile-nav" aria-label="Navigasi utama">
        {navItems.map(({ to, label, icon: Icon, end }) => {
          const active = location.pathname === to || (!end && to === '/notes' && location.pathname.startsWith('/notes'))
          return (
            <Link className={`mobile-nav-link ${active ? 'is-active' : ''}`} key={to} to={to} aria-current={active ? 'page' : undefined}>
              <Icon size={21} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
      <Link className="mobile-fab" to="/notes/new" aria-label="Buat catatan baru"><Plus size={23} /></Link>
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="notes" element={<Notes />} />
          <Route path="notes/new" element={<NoteEditor />} />
          <Route path="notes/:noteId" element={<NoteDetail />} />
          <Route path="notes/:noteId/edit" element={<NoteEditor />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
