import { useState } from 'react'
import { Download, GraduationCap, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { useNoteData } from '../hooks/useNoteData'
import { purgeCachedNotes } from '../services/offlineNotes'
import { profile } from '../data/profile'

function downloadBackup(notes) {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), notes }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `noteku-cadangan-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function Profile() {
  const { notes, online, serviceWorkerReady, user, signOut, pendingCount, syncing } = useNoteData()
  const [signOutError, setSignOutError] = useState('')
  const categoryCount = new Set(notes.map((note) => note.category.trim().toLocaleLowerCase())).size

  async function handleSignOut() {
    try {
      if (pendingCount > 0) {
        setSignOutError('Masih ada perubahan yang belum tersinkron. Sinkronkan dulu sebelum keluar.')
        return
      }
      purgeCachedNotes(user.id)
      const { error } = await signOut()
      if (error) setSignOutError(error.message || 'Keluar gagal. Coba lagi saat online.')
    } catch (error) {
      setSignOutError(error.message || 'Keluar gagal. Coba lagi saat online.')
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div><h1>Profil mahasiswa</h1><p className="muted">Informasi praktikan dan status aplikasi.</p></div>
      </div>
      <article className="profile-card">
        <div className="profile-summary">
          <span className="avatar avatar-large">FF</span>
          <div><h2>{profile.name}</h2><p>Akun: {user.email}</p></div>
        </div>
        <div className="profile-details">
          <div><span><UserRound size={17} />NIM</span><strong>{profile.studentId}</strong></div>
          <div><span><GraduationCap size={17} />Kelompok</span><strong>{profile.group}</strong></div>
          <div><span><GraduationCap size={17} />Program Studi</span><strong>{profile.program}</strong></div>
          <div><span><GraduationCap size={17} />Universitas</span><strong>{profile.university}</strong></div>
        </div>
      </article>
      <div className="stats-grid profile-stats">
        <article className="stat-card"><strong>{notes.length}</strong><span>Catatan tersimpan</span></article>
        <article className="stat-card"><strong>{categoryCount}</strong><span>Kategori</span></article>
      </div>
      <article className="settings-card">
        <div className="settings-title"><ShieldCheck size={20} /><div><h2>Status aplikasi</h2><p className="muted">Status perangkat saat ini.</p></div></div>
        <div className="status-row"><span>Koneksi</span><strong>{online ? 'Online' : 'Offline'}</strong></div>
        <div className="status-row"><span>Service worker</span><strong>{serviceWorkerReady ? 'Aktif' : 'Menunggu aktivasi'}</strong></div>
        <div className="status-row"><span>Status sinkronisasi</span><strong>{syncing ? 'Menyinkronkan...' : pendingCount ? `${pendingCount} perubahan menunggu` : 'Tersinkron'}</strong></div>
        <div className="status-row"><span>Penyimpanan</span><strong>Supabase + cache lokal akun</strong></div>
      </article>
      <div className="profile-actions">
        <button className="button button-secondary" type="button" onClick={() => downloadBackup(notes)}><Download size={18} />Cadangkan catatan (JSON)</button>
        <button className="button button-danger" type="button" onClick={handleSignOut}><LogOut size={18} />Keluar</button>
      </div>
      {signOutError && <p className="form-error" role="alert">{signOutError}</p>}
    </section>
  )
}
