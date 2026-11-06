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
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel()
    }}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="dialog-actions">
          <button className="button button-secondary" type="button" onClick={onCancel}>Batal</button>
          <button className="button button-danger" type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}

export function LoadingState() {
  return <p className="loading-state" role="status">Memuat catatan…</p>
}
