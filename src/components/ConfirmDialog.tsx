import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    confirmButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-dialog-title"
        aria-describedby="modal-dialog-message"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="modal-dialog-title">{title}</h2>
        <p id="modal-dialog-message">{message}</p>
        <div className="modal-actions">
          <button type="button" className="modal-cancel-button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className={`modal-confirm-button ${danger ? 'danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
