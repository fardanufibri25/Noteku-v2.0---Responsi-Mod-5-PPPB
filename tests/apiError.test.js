import assert from 'node:assert/strict'
import { test } from 'node:test'
import { messageOf } from '../src/services/apiError.js'

test('maps HTTP and network failures to actionable Indonesian messages', () => {
  assert.match(messageOf({ response: { status: 403, data: { message: 'row-level security' } } }), /Akses ditolak/)
  assert.match(messageOf({ response: { status: 401 } }), /Sesi berakhir/)
  assert.match(messageOf({ response: { status: 404 } }), /tidak ditemukan/)
  assert.match(messageOf({ response: { status: 500, data: { message: 'boom' } } }), /Server catatan/)
  assert.match(messageOf({ request: {}, code: 'ERR_NETWORK' }), /Tidak dapat terhubung/)
  assert.equal(messageOf({ response: { status: 422, data: { message: 'detail server' } } }, 'cadangan'), 'detail server')
  assert.equal(messageOf({ message: 'Sesi tidak valid.' }, 'cadangan'), 'Sesi tidak valid.')
  assert.equal(messageOf({}, 'cadangan'), 'cadangan')
})
