import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createLocalNote,
  deleteLocalNote,
  getCachedNotes,
  getPendingCount,
  syncNotes,
  updateLocalNote,
} from '../src/services/offlineNotes.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

test('replays queued create, edit, and delete in version order', async () => {
  const storage = memoryStorage()
  const note = createLocalNote('user-a', { title: 'React', category: 'PPB', content: 'Hooks' }, storage, '2026-01-01T00:00:00.000Z')
  updateLocalNote('user-a', note.id, { title: 'React Hooks', category: 'PPB', content: 'State' }, storage, '2026-01-02T00:00:00.000Z')
  deleteLocalNote('user-a', note.id, storage)
  const calls = []
  const api = {
    create: async (item) => calls.push(['create', item.version]),
    update: async (_id, item) => calls.push(['update', item.expectedVersion]),
    delete: async (_id, version) => calls.push(['delete', version]),
    list: async () => [],
  }

  assert.deepEqual(await syncNotes('user-a', api, storage), [])
  assert.deepEqual(calls, [['create', 1], ['update', 1], ['delete', 2]])
  assert.equal(getPendingCount('user-a', storage), 0)
  assert.deepEqual(getCachedNotes('user-a', storage), [])
})

test('keeps unsynced work and isolates local data per account after a failed request', async () => {
  const storage = memoryStorage()
  const note = createLocalNote('user-a', { title: 'Jaringan', category: 'PPB', content: 'Materi' }, storage)

  await assert.rejects(syncNotes('user-a', { create: async () => { throw new Error('offline') } }, storage), /offline/)
  assert.equal(getPendingCount('user-a', storage), 1)
  assert.equal(getCachedNotes('user-a', storage)[0].id, note.id)
  assert.deepEqual(getCachedNotes('user-b', storage), [])
})

test('preserves local mutations made while refreshing remote notes', async () => {
  const storage = memoryStorage()
  let releaseList
  let firstList = true
  const listPending = new Promise((resolve) => { releaseList = resolve })
  const remote = []
  const api = {
    create: async (item) => remote.push(item),
    list: () => {
      if (firstList) {
        firstList = false
        return listPending
      }
      return Promise.resolve(remote)
    },
  }
  const syncing = syncNotes('user-a', api, storage)
  const note = createLocalNote('user-a', { title: 'Offline', category: 'PPB', content: 'Tersimpan' }, storage)
  releaseList([])

  assert.deepEqual((await syncing).map((item) => item.id), [note.id])
})

test('migrates account cache fields from course to category', () => {
  const storage = memoryStorage()
  storage.setItem('noteku.sync.v1.user.user-a', JSON.stringify({
    notes: [{
      id: 'legacy',
      title: 'Lokal',
      course: 'PPB',
      content: 'Tersimpan',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      version: 1,
    }],
    outbox: [],
  }))

  assert.equal(getCachedNotes('user-a', storage)[0].category, 'PPB')
})

test('rejects empty or oversized categories before queueing', () => {
  const storage = memoryStorage()
  assert.throws(() => createLocalNote('user-a', { title: 'T', category: ' ', content: 'C' }, storage), /kategori/)
  assert.throws(() => createLocalNote('user-a', { title: 'T', category: 'x'.repeat(81), content: 'C' }, storage), /kategori/)
  assert.equal(getPendingCount('user-a', storage), 0)
})
