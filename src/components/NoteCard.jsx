import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock3 } from 'lucide-react'
import { formatDate } from '../utils/date'

export function NoteCard({ note }) {
  return (
    <Link className="note-card" to={`/notes/${note.id}`}>
      <div className="note-card-top">
        <span className="category-tag">{note.category}</span>
        <span className="note-date"><Clock3 size={14} aria-hidden="true" />{formatDate(note.updatedAt)}</span>
      </div>
      <h3>{note.title}</h3>
      <p>{note.content}</p>
      <span className="note-card-open">Buka catatan <ArrowUpRight size={16} aria-hidden="true" /></span>
    </Link>
  )
}
