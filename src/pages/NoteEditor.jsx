import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { LoadingState } from '../components/AppShell'
import { useNoteData } from '../hooks/useNoteData'

export function NoteEditor() {
  const { noteId } = useParams()
  const { notes, isLoading, createNote, updateNote } = useNoteData()
  const existing = notes.find((note) => note.id === noteId)
  const categories = [...new Set(notes.map((note) => note.category.trim()).filter(Boolean))]

  if (noteId && isLoading && !existing) return <section><LoadingState /></section>
  if (noteId && !existing) {
    return <section className="not-found"><h1>Catatan tidak ditemukan</h1><Link className="button button-secondary" to="/notes">Kembali ke catatan</Link></section>
  }

  return (
    <NoteForm
      key={noteId ?? 'new'}
      noteId={noteId}
      existing={existing}
      categories={categories}
      createNote={createNote}
      updateNote={updateNote}
    />
  )
}

function NoteForm({ noteId, existing, categories, createNote, updateNote }) {
  const [title, setTitle] = useState(existing?.title || '')
  const [category, setCategory] = useState(existing?.category || '')
  const [content, setContent] = useState(existing?.content || '')
  const [validation, setValidation] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim() || !category.trim() || !content.trim()) {
      setValidation('Lengkapi judul, kategori, dan isi catatan.')
      return
    }
    setSaving(true)
    setValidation('')
    try {
      const note = noteId
        ? updateNote(noteId, { title: title.trim(), category: category.trim(), content: content.trim() })
        : createNote({ title: title.trim(), category: category.trim(), content: content.trim() })
      navigate(`/notes/${note.id}`, { state: { flash: noteId ? 'Perubahan catatan disimpan.' : 'Catatan baru disimpan.' } })
    } catch (error) {
      setValidation(error.message || 'Catatan gagal disimpan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="editor-page">
      <div className="detail-toolbar">
        <Link className="quiet-link" to={existing ? `/notes/${existing.id}` : '/notes'}><ArrowLeft size={17} />Kembali</Link>
        <span className="draft-label">Tersimpan lokal</span>
      </div>
      <div className="editor-card">
        <h1>{existing ? 'Edit catatan' : 'Catatan baru'}</h1>
        <p className="muted">Simpan materi kuliah agar mudah dibaca kembali.</p>
        <form className="note-form" onSubmit={handleSubmit}>
          <label htmlFor="note-title">Judul catatan <span aria-hidden="true">*</span></label>
          <input id="note-title" autoFocus maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: Pengantar jaringan komputer" required />
          <label htmlFor="note-category">Kategori <span aria-hidden="true">*</span></label>
          <input id="note-category" list="category-options" maxLength={80} value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Masukkan kategori catatan" required />
          <datalist id="category-options">{categories.map((item) => <option value={item} key={item} />)}</datalist>
          <div className="label-with-count"><label htmlFor="note-content">Isi catatan <span aria-hidden="true">*</span></label><span>{content.length} karakter</span></div>
          <textarea id="note-content" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Tulis materi, ringkasan, atau poin penting..." rows={12} maxLength={50000} required />
          {validation && <p className="form-error" role="alert">{validation}</p>}
          <div className="form-actions">
            <Link className="button button-secondary" to={existing ? `/notes/${existing.id}` : '/notes'}>Batal</Link>
            <button className="button button-primary" type="submit" disabled={saving}><Save size={17} />{saving ? 'Menyimpan...' : 'Simpan catatan'}</button>
          </div>
        </form>
      </div>
    </section>
  )
}
