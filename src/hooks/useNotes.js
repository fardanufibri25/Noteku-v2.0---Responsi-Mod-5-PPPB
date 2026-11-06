import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createLocalNote,
  deleteLocalNote,
  getCachedNotes,
  getLegacyNotes,
  getPendingCount,
  syncNotes,
  updateLocalNote,
} from '../services/offlineNotes'
import { noteService } from '../services/noteService.js'

function messageOf(error, fallback) {
  return error.response?.data?.message
    || error.response?.data?.error
    || error.message
    || fallback
}

export function useNotes(userId) {
  const [noteState, setNoteState] = useState({ userId: null, notes: [] })
  const [errorState, setErrorState] = useState({ userId: null, message: '' })
  const [syncErrorState, setSyncErrorState] = useState({ userId: null, message: '' })
  const [syncingState, setSyncingState] = useState({ userId: null, value: false })
  const [pendingState, setPendingState] = useState({ userId: null, count: 0 })
  const [legacyState, setLegacyState] = useState({ userId: null, notes: [] })
  const syncingRef = useRef(new Set())
  const notes = noteState.userId === userId ? noteState.notes : []
  const isLoading = Boolean(userId && noteState.userId !== userId)
  const error = errorState.userId === userId ? errorState.message : ''
  const syncError = syncErrorState.userId === userId ? syncErrorState.message : ''
  const syncing = syncingState.userId === userId && syncingState.value
  const pendingCount = pendingState.userId === userId ? pendingState.count : 0
  const legacyNotes = legacyState.userId === userId ? legacyState.notes : []

  const setError = useCallback((message) => setErrorState({ userId, message }), [userId])
  const setSyncError = useCallback((message) => setSyncErrorState({ userId, message }), [userId])
  const setSyncing = useCallback((value) => setSyncingState({ userId, value }), [userId])
  const setPendingCount = useCallback((count) => setPendingState({ userId, count }), [userId])

  const refreshLocalState = useCallback(() => {
    if (!userId) return
    const cached = getCachedNotes(userId)
    setNoteState({ userId, notes: cached })
    setPendingCount(getPendingCount(userId))
  }, [setPendingCount, userId])

  const sync = useCallback(async () => {
    if (!userId || !navigator.onLine || syncingRef.current.has(userId)) return
    syncingRef.current.add(userId)
    setSyncing(true)
    try {
      const current = await syncNotes(userId, noteService)
      setNoteState({ userId, notes: current })
      setPendingCount(getPendingCount(userId))
      setSyncError('')
    } catch (syncFailure) {
      try {
        setPendingCount(getPendingCount(userId))
      } catch (storageFailure) {
        setSyncError(storageFailure.message)
      }
      setSyncError(messageOf(syncFailure, 'Perubahan belum tersinkron; antrean lokal tetap disimpan.'))
    } finally {
      syncingRef.current.delete(userId)
      setSyncing(false)
    }
  }, [userId, setPendingCount, setSyncError, setSyncing])

  useEffect(() => {
    if (!userId) return undefined
    try {
      // Hydrate the account-scoped cache from localStorage before remote sync.
      // oxlint-disable-next-line react/set-state-in-effect
      refreshLocalState()
      // Import eligibility is derived from the existing local database for this account.
      // oxlint-disable-next-line react/set-state-in-effect
      setLegacyState({
        userId,
        notes: getLegacyNotes().filter((note) => !getCachedNotes(userId).some((item) => item.id === note.id)),
      })
    } catch (loadFailure) {
      // Surface storage validation errors during account-specific local hydration.
      // oxlint-disable-next-line react/set-state-in-effect
      setError(loadFailure.message || 'Catatan lokal gagal dimuat.')
      setNoteState({ userId, notes: [] })
    }
    void sync()
    window.addEventListener('online', sync)
    return () => window.removeEventListener('online', sync)
  }, [userId, refreshLocalState, setError, sync])

  const createNote = useCallback((input) => {
    try {
      const note = createLocalNote(userId, input)
      refreshLocalState()
      setError('')
      if (navigator.onLine) void sync()
      return note
    } catch (saveError) {
      setError(saveError.message || 'Catatan tidak dapat disimpan.')
      throw saveError
    }
  }, [refreshLocalState, setError, sync, userId])

  const updateNote = useCallback((id, input) => {
    try {
      const note = updateLocalNote(userId, id, input)
      refreshLocalState()
      setError('')
      if (navigator.onLine) void sync()
      return note
    } catch (saveError) {
      setError(saveError.message || 'Perubahan tidak dapat disimpan.')
      throw saveError
    }
  }, [refreshLocalState, setError, sync, userId])

  const deleteNote = useCallback((id) => {
    try {
      deleteLocalNote(userId, id)
      refreshLocalState()
      setError('')
      if (navigator.onLine) void sync()
    } catch (deleteError) {
      setError(deleteError.message || 'Catatan tidak dapat dihapus.')
      throw deleteError
    }
  }, [refreshLocalState, setError, sync, userId])

  const importLegacyNotes = useCallback(() => {
    try {
      const cachedIds = new Set(getCachedNotes(userId).map((note) => note.id))
      const imported = getLegacyNotes().filter((note) => !cachedIds.has(note.id))
      for (const note of imported) createLocalNote(userId, note)
      refreshLocalState()
      setLegacyState({ userId, notes: [] })
      setError('')
      if (navigator.onLine) void sync()
      return imported.length
    } catch (importError) {
      setError(importError.message || 'Catatan lokal gagal diimpor.')
      throw importError
    }
  }, [refreshLocalState, setError, sync, userId])

  const clearError = useCallback(() => setError(''), [setError])
  const clearSyncError = useCallback(() => setSyncError(''), [setSyncError])

  return {
    notes, isLoading, error, clearError, createNote, updateNote, deleteNote,
    syncError, clearSyncError, syncing, pendingCount, legacyNotes, importLegacyNotes, sync,
  }
}
