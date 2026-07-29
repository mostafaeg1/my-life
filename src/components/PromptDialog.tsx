import { useEffect, useRef, useState, type FormEvent } from 'react'

interface PromptDialogProps {
  open: boolean
  title: string
  placeholder: string
  confirmLabel?: string
  errorMessage?: string
  onSubmit: (value: string) => boolean
  onCancel: () => void
}

export function PromptDialog({
  open,
  title,
  placeholder,
  confirmLabel = 'Add',
  errorMessage = 'Enter a name that is not already in your list.',
  onSubmit,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    setValue('')
    setError('')
    inputRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const added = onSubmit(value)
    if (!added) {
      setError(errorMessage)
      return
    }

    setValue('')
    setError('')
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="prompt-dialog-title">{title}</h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="modal-input"
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              if (error) setError('')
            }}
            placeholder={placeholder}
            maxLength={60}
          />
          {error ? <p className="form-error">{error}</p> : null}
          <div className="modal-actions">
            <button type="button" className="modal-cancel-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="modal-confirm-button" disabled={!value.trim()}>
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
