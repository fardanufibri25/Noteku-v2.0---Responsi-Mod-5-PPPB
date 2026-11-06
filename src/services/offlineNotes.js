import { getNotes } from './notes.js'

const STATE_PREFIX = 'noteku.sync.v1.user.'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function storageOrDefault(storage) {
  try {
    return storage || window.localStorage
  } catch {
    throw new Error('Penyimpanan lokal tidak tersedia di browser ini.')
  }
}

function stateKey(userId) {
  if (!userId) throw new Error('Akun tidak valid.')
  return `${STATE_PREFIX}${userId}`
}

function readState(userId, storage) {
  const key = stateKey(userId)
  let raw
  try {
    raw = storageOrDefault(storage).getItem(key)
  } catch {
    throw new Error('Data catatan lokal gagal dibaca.')
  }
  if (raw === null) return { notes: [], outbox: [] }
  try {
    const state = JSON.parse(raw)
    if (!Array.isArray(state.notes) || !Array.isArray(state.outbox)) throw new Error()
    const normalizeNote = (note) => {
      if (!note || typeof note !== 'object') return note
      const { course, ...fields } = note
      return { ...fields, category: note.category ?? course }
    }
    return {
      notes: state.notes.map(normalizeNote),
      outbox: state.outbox.map((operation) => operation.note
        ? { ...operation, note: normalizeNote(operation.note) }
        : operation),
    }
  } catch {
    throw new Error('Data sinkronisasi lokal tidak valid dan tidak diubah.')
  }
}

function writeState(userId, state, storage) {
  try {
    storageOrDefault(storage).setItem(stateKey(userId), JSON.stringify(state))
  } catch {
    throw new Error('Data gagal disimpan. Periksa ruang penyimpanan browser.')
  }
}

function noteFields(input) {
  const category = input?.category ?? input?.course
  if (!input || typeof input.title !== 'string' || typeof category !== 'string' || typeof input.content !== 'string') {
    throw new Error('Data catatan tidak valid.')
  }
  const note = { title: input.title.trim(), category: category.trim(), content: input.content.trim() }
  if (!note.title || note.title.length > 120 || !note.category || note.category.length > 80 || !note.content || note.content.length > 50000) {
    throw new Error('Lengkapi judul, kategori, dan isi catatan dengan panjang yang valid.')
  }
  return note
}

function sortNotes(notes) {
  return notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

function overlayPending(serverNotes, outbox) {
  const notes = new Map(serverNotes.map((note) => [note.id, note]))
  for (const operation of outbox) {
    if (operation.kind === 'create' || operation.kind === 'update') notes.set(operation.note.id, operation.note)
    if (operation.kind === 'delete') notes.delete(operation.noteId)
  }
  return sortNotes([...notes.values()])
}

export function getCachedNotes(userId, storage) {
  const notes = readState(userId, storage).notes
  if (!notes.every((note) => note && typeof note.id === 'string' && typeof note.title === 'string'
    && typeof note.category === 'string' && typeof note.content === 'string'
    && typeof note.createdAt === 'string' && typeof note.updatedAt === 'string'
    && Number.isInteger(note.version) && note.version > 0)) {
    throw new Error('Format catatan lokal tidak valid; data tidak diubah.')
  }
  return sortNotes(notes)
}

export function getPendingCount(userId, storage) {
  return readState(userId, storage).outbox.length
}

export function createLocalNote(userId, input, storage, now = new Date().toISOString()) {
  const fields = noteFields(input)
  const id = input.id || crypto.randomUUID()
  if (!UUID_PATTERN.test(id)) throw new Error('ID catatan tidak valid.')
  const note = {
    id,
    ...fields,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
    version: 1,
  }
  const state = readState(userId, storage)
  if (state.notes.some((item) => item.id === note.id)) throw new Error('Catatan dengan ID ini sudah ada.')
  writeState(userId, {
    notes: [note, ...state.notes],
    outbox: [...state.outbox, { id: crypto.randomUUID(), kind: 'create', note }],
  }, storage)
  return note
}

export function updateLocalNote(userId, id, input, storage, now = new Date().toISOString()) {
  const state = readState(userId, storage)
  const previous = state.notes.find((note) => note.id === id)
  if (!previous) throw new Error('Catatan tidak ditemukan.')
  const note = { ...previous, ...noteFields(input), updatedAt: now, version: previous.version + 1 }
  writeState(userId, {
    notes: state.notes.map((item) => item.id === id ? note : item),
    outbox: [...state.outbox, { id: crypto.randomUUID(), kind: 'update', note, expectedVersion: previous.version }],
  }, storage)
  return note
}

export function deleteLocalNote(userId, id, storage) {
  const state = readState(userId, storage)
  const previous = state.notes.find((note) => note.id === id)
  if (!previous) throw new Error('Catatan tidak ditemukan.')
  writeState(userId, {
    notes: state.notes.filter((note) => note.id !== id),
    outbox: [...state.outbox, { id: crypto.randomUUID(), kind: 'delete', noteId: id, expectedVersion: previous.version }],
  }, storage)
}

export async function syncNotes(userId, api, storage) {
  while (true) {
    while (readState(userId, storage).outbox.length) {
      const operation = readState(userId, storage).outbox[0]
      if (operation.kind === 'create') await api.create(operation.note)
      else if (operation.kind === 'update') {
        await api.update(operation.note.id, { ...noteFields(operation.note), expectedVersion: operation.expectedVersion })
      } else if (operation.kind === 'delete') {
        await api.delete(operation.noteId, operation.expectedVersion)
      } else {
        throw new Error('Operasi sinkronisasi tidak dikenal; antrean lokal dipertahankan.')
      }
      const state = readState(userId, storage)
      writeState(userId, { ...state, outbox: state.outbox.filter((item) => item.id !== operation.id) }, storage)
    }
    const serverNotes = await api.list()
    const latest = readState(userId, storage)
    if (latest.outbox.length) continue
    const notes = overlayPending(serverNotes, latest.outbox)
    writeState(userId, { ...latest, notes }, storage)
    return notes
  }
}

export function getLegacyNotes(storage) {
  return getNotes(storage)
}
