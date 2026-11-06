import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus, Search, Upload, X } from 'lucide-react'
import { EmptyState, LoadingState } from '../components/AppShell'
import { NoteCard } from '../components/NoteCard'
import { useNoteData } from '../hooks/useNoteData'

export function Notes() {
  const { notes, isLoading, legacyNotes, importLegacyNotes, pendingCount, syncing, sync, online } = useNoteData()
  const flash = useLocation().state?.flash
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Semua')
  const categories = useMemo(() => [...new Set(notes.map((note) => note.category.trim()).filter(Boolean))].sort(), [notes])
  const filtered = useMemo(() => notes.filter((note) => {
    const matchesCategory = category === 'Semua' || note.category === category
    const text = `${note.title} ${note.category} ${note.content}`.toLocaleLowerCase()
    return matchesCategory && text.includes(query.trim().toLocaleLowerCase())
  }), [notes, query, category])

  return (
    <section>
      {flash && <div className="success-banner" role="status">{flash}</div>}
      <div className="page-heading">
        <div>
          <h1>Catatan kuliah</h1>
          <p className="muted">Kelola dan temukan kembali materi perkuliahan.</p>
        </div>
        <div className="toolbar-actions">
          {legacyNotes.length > 0 && (
            <button className="button button-secondary" type="button" onClick={() => importLegacyNotes().catch(() => {})}>
              <Upload size={17} />Impor lokal ({legacyNotes.length})
            </button>
          )}
          {online && pendingCount > 0 && (
            <button className="button button-secondary" type="button" onClick={sync} disabled={syncing}>
              {syncing ? 'Menyinkronkan...' : `Sinkronkan (${pendingCount})`}
            </button>
          )}
          <Link className="button button-primary" to="/notes/new"><Plus size={18} />Catatan baru</Link>
        </div>
      </div>
      <div className="notes-controls">
        <label className="search-field">
          <Search size={19} aria-hidden="true" />
          <span className="visually-hidden">Cari catatan</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul, kategori, atau isi..." />
          {query && <button className="icon-button" type="button" onClick={() => setQuery('')} aria-label="Hapus pencarian"><X size={17} /></button>}
        </label>
      </div>
      <div className="filter-list" aria-label="Filter kategori">
        {['Semua', ...categories].map((item) => (
          <button key={item} type="button" className={`filter-chip ${category === item ? 'is-selected' : ''}`} aria-pressed={category === item} onClick={() => setCategory(item)}>
            {item}{item === 'Semua' && <span>{notes.length}</span>}
          </button>
        ))}
      </div>
      {isLoading ? <LoadingState /> : filtered.length ? (
        <div className="notes-grid">
          {filtered.map((note) => <NoteCard key={note.id} note={note} />)}
        </div>
      ) : (
        <EmptyState
          title={notes.length ? 'Catatan tidak ditemukan' : 'Belum ada catatan'}
          description={notes.length ? 'Coba ubah kata pencarian atau pilih mata kuliah lain.' : 'Tambahkan catatan baru agar materi mudah ditemukan.'}
          action={!notes.length && <Link className="button button-secondary" to="/notes/new"><Plus size={17} />Tambah catatan</Link>}
        />
      )}
    </section>
  )
}
