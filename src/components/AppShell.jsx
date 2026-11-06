import { useEffect, useRef } from 'react'
import { FileText } from 'lucide-react'

export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><FileText size={23} aria-hidden="true" /></span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  const cancelRef = useRef(null)
  const confirmRef = useRef(null)
  const cancelHandler = useRef(onCancel)

  useEffect(() => {
    cancelHandler.current = onCancel
  }, [onCancel])

  useEffect(() => {
    const previous = document.activeElement
    cancelRef.current?.focus()
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelHandler.current()
        return
      }
      if (event.key !== 'Tab') return
      if (event.shiftKey && document.activeElement === cancelRef.current) {
        event.preventDefault()
        confirmRef.current?.focus()
      } else if (!event.shiftKey && document.activeElement === confirmRef.current) {
        event.preventDefault()
        cancelRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel()
    }}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="dialog-actions">
          <button ref={cancelRef} className="button button-secondary" type="button" onClick={onCancel}>Batal</button>
          <button ref={confirmRef} className="button button-danger" type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}

export function LoadingState() {
  return <p className="loading-state" role="status">Memuat catatan…</p>
}
