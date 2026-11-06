import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createNote, deleteNote, getNotes, updateNote } from '../src/services/notes.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

test('creates, updates, sorts, and deletes persisted notes', () => {
  const storage = memoryStorage()
  const first = createNote({ title: 'Jaringan', category: 'PPB', content: 'Materi' }, storage, '2026-01-01T00:00:00.000Z')
  const second = createNote({ title: 'React', category: 'PPB', content: 'Hooks' }, storage, '2026-01-02T00:00:00.000Z')

  assert.deepEqual(getNotes(storage).map((note) => note.title), ['React', 'Jaringan'])
  const updated = updateNote(first.id, { title: 'Jaringan komputer' }, storage, '2026-01-03T00:00:00.000Z')
  assert.equal(updated.createdAt, '2026-01-01T00:00:00.000Z')
  assert.equal(getNotes(storage)[0].title, 'Jaringan komputer')
  deleteNote(second.id, storage)
  assert.deepEqual(getNotes(storage).map((note) => note.id), [first.id])
})

test('does not silently overwrite invalid persisted data', () => {
  const storage = memoryStorage()
  storage.setItem('noteku.notes.v1', '{')
  assert.throws(() => createNote({ title: 'T', category: 'C', content: 'X' }, storage), /tidak dapat dibaca/)
  assert.equal(storage.getItem('noteku.notes.v1'), '{')
})

test('reads existing course-based local notes as categories', () => {
  const storage = memoryStorage()
  storage.setItem('noteku.notes.v1', JSON.stringify([{
    id: 'legacy',
    title: 'Jaringan',
    course: 'PPB',
    content: 'Materi',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }]))

  assert.equal(getNotes(storage)[0].category, 'PPB')
})
