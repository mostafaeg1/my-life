import { useEffect, useRef, useState, type FormEvent } from 'react'
import { LabelPicker } from './LabelPicker'

interface PromptDialogLabelsField {
  label: string
  availableLabels: string[]
}

interface PromptDialogProps {
  open: boolean
  title: string
  placeholder: string
  confirmLabel?: string
  errorMessage?: string
  labelsField?: PromptDialogLabelsField
  onSubmit: (value: string, labels: string[]) => boolean
  onCancel: () => void
}

export function PromptDialog({
  open,
  title,
  placeholder,
  confirmLabel = 'Add',
  errorMessage = 'Enter a name that is not already in your list.',
  labelsField,
  onSubmit,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState('')
  const [labels, setLabels] = useState<string[]>([])
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    setValue('')
    setLabels([])
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

    const added = onSubmit(value, labels)
    if (!added) {
      setError(errorMessage)
      return
    }

    setValue('')
    setLabels([])
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
          {labelsField ? (
            <div className="modal-secondary-field">
              <span className="field-label">{labelsField.label}</span>
              <LabelPicker
                selectedLabels={labels}
                availableLabels={labelsField.availableLabels}
                onChange={setLabels}
              />
            </div>
          ) : null}
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
