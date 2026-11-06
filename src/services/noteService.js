import { apiClient } from '../config/api.js'
import { supabase } from './supabase.js'

const columns = 'id,owner_id,title,content,category,created_at,updated_at,version'

async function currentUser() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.user) throw new Error('Sesi tidak valid. Silakan masuk kembali.')
  return data.session.user
}

function toClientNote(note) {
  return {
    id: note.id,
    title: note.title,
    category: note.category,
    content: note.content,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
    version: note.version,
  }
}

function sameContent(serverNote, note) {
  return serverNote.title === note.title
    && serverNote.category === note.category
    && serverNote.content === note.content
}

async function findNote(id, userId) {
  const { data } = await apiClient.get('/notes', {
    params: { select: columns, id: `eq.${id}`, owner_id: `eq.${userId}`, limit: 1 },
  })
  return data[0]
}

export const noteService = {
  async list() {
    const user = await currentUser()
    const { data } = await apiClient.get('/notes', {
      params: { select: columns, owner_id: `eq.${user.id}`, order: 'updated_at.desc' },
    })
    return data.map(toClientNote)
  },

  async create(note) {
    const user = await currentUser()
    const row = {
      id: note.id,
      owner_id: user.id,
      title: note.title,
      category: note.category,
      content: note.content,
    }
    try {
      const { data } = await apiClient.post('/notes', row, {
        params: { select: columns },
        headers: { Prefer: 'return=representation' },
      })
      return toClientNote(data[0])
    } catch (error) {
      const existing = await findNote(note.id, user.id).catch(() => undefined)
      if (existing && sameContent(existing, note)) return toClientNote(existing)
      throw error
    }
  },

  async update(id, note) {
    const user = await currentUser()
    const { expectedVersion } = note
    const { data } = await apiClient.patch('/notes', {
      title: note.title,
      category: note.category,
      content: note.content,
      updated_at: new Date().toISOString(),
      version: expectedVersion + 1,
    }, {
      params: {
        id: `eq.${id}`,
        owner_id: `eq.${user.id}`,
        version: `eq.${expectedVersion}`,
        select: columns,
      },
      headers: { Prefer: 'return=representation' },
    })
    if (data[0]) return toClientNote(data[0])

    const existing = await findNote(id, user.id)
    if (existing?.version === expectedVersion + 1 && sameContent(existing, note)) return toClientNote(existing)
    throw new Error('Catatan berubah di perangkat lain. Sinkronisasi dijeda agar perubahan lokal tidak hilang.')
  },

  async delete(id, expectedVersion) {
    const user = await currentUser()
    const { data } = await apiClient.delete('/notes', {
      params: {
        id: `eq.${id}`,
        owner_id: `eq.${user.id}`,
        version: `eq.${expectedVersion}`,
        select: 'id',
      },
      headers: { Prefer: 'return=representation' },
    })
    if (data.length) return
    if (await findNote(id, user.id)) {
      throw new Error('Catatan berubah di perangkat lain. Sinkronisasi dijeda agar perubahan lokal tidak hilang.')
    }
  },
}
