import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Pencil, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../components/AppShell'
import { useNoteData } from '../hooks/useNoteData'
import { formatDate } from '../utils/date'

export function NoteDetail() {
  const { noteId } = useParams()
  const { notes, deleteNote } = useNoteData()
  const note = notes.find((item) => item.id === noteId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const navigate = useNavigate()
  const flash = useLocation().state?.flash

  if (!note) {
    return <section className="not-found"><h1>Catatan tidak ditemukan</h1><p className="muted">Catatan mungkin sudah dihapus atau tautannya tidak valid.</p><Link className="button button-secondary" to="/notes"><ArrowLeft size={17} />Kembali ke catatan</Link></section>
  }

  function handleDelete() {
    try {
      deleteNote(note.id)
      navigate('/notes', { replace: true, state: { flash: 'Catatan dihapus.' } })
    } catch {
      setConfirmDelete(false)
    }
  }

  return (
    <article className="detail-page">
      {flash && <div className="success-banner" role="status">{flash}</div>}
      <div className="detail-toolbar">
        <Link className="quiet-link" to="/notes"><ArrowLeft size={17} />Kembali ke catatan</Link>
        <div className="toolbar-actions">
          <Link className="button button-secondary" to={`/notes/${note.id}/edit`}><Pencil size={16} />Edit</Link>
          <button className="button button-danger" type="button" onClick={() => setConfirmDelete(true)}><Trash2 size={16} />Hapus</button>
        </div>
      </div>
      <div className="detail-card">
        <span className="category-tag">{note.category}</span>
        <h1>{note.title}</h1>
        <div className="detail-dates">
          <span><CalendarDays size={15} />Dibuat {formatDate(note.createdAt)}</span>
          {note.updatedAt !== note.createdAt && <span>Diperbarui {formatDate(note.updatedAt)}</span>}
        </div>
        <div className="note-content">{note.content}</div>
        <div className="local-note-label">Tersimpan di perangkat ini</div>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title="Hapus catatan ini?"
          message={`“${note.title}” akan dihapus dari perangkat dan tindakan ini tidak bisa dibatalkan.`}
          confirmLabel="Hapus catatan"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </article>
  )
}
