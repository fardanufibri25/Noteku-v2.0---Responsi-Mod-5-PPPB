import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Plus, Sparkles } from 'lucide-react'
import { EmptyState, LoadingState } from '../components/AppShell'
import { NoteCard } from '../components/NoteCard'
import { useNoteData } from '../hooks/useNoteData'

export function Dashboard() {
  const { notes, isLoading } = useNoteData()
  const categories = new Set(notes.map((note) => note.category.trim().toLocaleLowerCase())).size

  return (
    <section>
      <div className="welcome-panel">
        <div>
          <h1>Selamat datang kembali!</h1>
          <p>Semua catatan tersimpan rapi—lanjutkan belajar kapan pun dibutuhkan.</p>
          <Link className="button button-primary" to="/notes/new"><Plus size={18} />Buat catatan</Link>
        </div>
        <div className="welcome-illustration" aria-hidden="true"><BookOpen size={72} strokeWidth={1.4} /></div>
      </div>

      <div className="stats-grid" aria-label="Ringkasan catatan">
        <article className="stat-card">
          <span className="stat-icon purple"><BookOpen size={20} aria-hidden="true" /></span>
          <strong>{isLoading ? '—' : notes.length}</strong><span>Total catatan</span>
        </article>
        <article className="stat-card">
          <span className="stat-icon mint"><Sparkles size={20} aria-hidden="true" /></span>
          <strong>{isLoading ? '—' : categories}</strong><span>Kategori</span>
        </article>
      </div>

      <div className="section-heading">
        <div><h2>Catatan terbaru</h2><p className="muted">Lanjutkan belajar dari catatan terakhir.</p></div>
        <Link className="quiet-link" to="/notes">Lihat semua <ArrowRight size={16} /></Link>
      </div>
      {isLoading ? <LoadingState /> : notes.length ? (
        <div className="notes-grid">
          {notes.slice(0, 3).map((note) => <NoteCard key={note.id} note={note} />)}
        </div>
      ) : (
        <EmptyState
          title="Belum ada catatan"
          description="Catatan pertama bisa dimulai dari materi kuliah hari ini."
          action={<Link className="button button-secondary" to="/notes/new"><Plus size={17} />Tulis catatan pertama</Link>}
        />
      )}
    </section>
  )
}
