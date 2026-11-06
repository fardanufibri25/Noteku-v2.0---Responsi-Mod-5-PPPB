const STORAGE_KEY = 'noteku.notes.v1'

function getStorage(storage) {
  if (storage) return storage
  try {
    return window.localStorage
  } catch {
    throw new Error('Penyimpanan lokal tidak tersedia di browser ini.')
  }
}

function read(storage) {
  let raw
  try {
    raw = getStorage(storage).getItem(STORAGE_KEY)
  } catch {
    throw new Error('Catatan gagal dibaca dari penyimpanan lokal.')
  }
  if (raw === null) return []

  let notes
  try {
    notes = JSON.parse(raw)
  } catch {
    throw new Error('Data catatan tidak dapat dibaca. Data yang tersimpan tidak diubah.')
  }
  if (!Array.isArray(notes) || !notes.every(isNote)) {
    throw new Error('Format data catatan tidak valid; data lama tidak dihapus.')
  }
  return notes.map(normalizeNote).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

function isNote(value) {
  return value && typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof (value.category ?? value.course) === 'string'
    && typeof value.content === 'string'
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string'
}

function normalizeNote(note) {
  const { course, ...fields } = note
  return { ...fields, category: note.category ?? course }
}

function write(notes, storage) {
  try {
    getStorage(storage).setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {
    throw new Error('Catatan gagal disimpan. Periksa ruang penyimpanan browser Anda.')
  }
}

export function getNotes(storage) {
  return read(storage)
}

export function createNote(input, storage, now = new Date().toISOString()) {
  const { course, ...fields } = input
  const note = { id: crypto.randomUUID(), ...fields, category: input.category ?? course, createdAt: now, updatedAt: now }
  write([note, ...read(storage)], storage)
  return note
}

export function updateNote(id, input, storage, now = new Date().toISOString()) {
  const notes = read(storage)
  const previous = notes.find((note) => note.id === id)
  if (!previous) throw new Error('Catatan tidak ditemukan.')

  const { course, ...fields } = input
  const updated = { ...previous, ...fields, category: input.category ?? course ?? previous.category, updatedAt: now }
  write(notes.map((note) => note.id === id ? updated : note), storage)
  return updated
}

export function deleteNote(id, storage) {
  const notes = read(storage)
  if (!notes.some((note) => note.id === id)) throw new Error('Catatan tidak ditemukan.')
  write(notes.filter((note) => note.id !== id), storage)
}
