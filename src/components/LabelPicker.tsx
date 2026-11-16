import { useState, type KeyboardEvent } from 'react'
import { getLabelColor, parseLabels } from '../utils/labels'

interface LabelPickerProps {
  selectedLabels: string[]
  availableLabels: string[]
  onChange: (labels: string[]) => void
}

export function LabelPicker({ selectedLabels, availableLabels, onChange }: LabelPickerProps) {
  const [inputValue, setInputValue] = useState('')

  const suggestions = availableLabels.filter(
    (label) =>
      !selectedLabels.some((selected) => selected.toLowerCase() === label.toLowerCase()) &&
      label.toLowerCase().includes(inputValue.trim().toLowerCase()),
  )

  function addLabels(rawInput: string) {
    const candidates = parseLabels(rawInput)
    if (candidates.length === 0) return

    const merged = [...selectedLabels]
    for (const candidate of candidates) {
      if (!merged.some((label) => label.toLowerCase() === candidate.toLowerCase())) {
        merged.push(candidate)
      }
    }

    onChange(merged)
    setInputValue('')
  }

  function removeLabel(label: string) {
    onChange(selectedLabels.filter((item) => item !== label))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addLabels(inputValue)
      return
    }

    if (event.key === 'Backspace' && inputValue === '' && selectedLabels.length > 0) {
      removeLabel(selectedLabels[selectedLabels.length - 1])
    }
  }

  return (
    <div className="label-picker">
      {selectedLabels.length > 0 ? (
        <ul className="project-labels">
          {selectedLabels.map((label) => (
            <li key={label} className="project-label-chip removable">
              <span className="label-dot" style={{ backgroundColor: getLabelColor(label) }} />
              {label}
              <button
                type="button"
                className="label-remove-button"
                aria-label={`Remove label ${label}`}
                onClick={() => removeLabel(label)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        type="text"
        className="modal-input"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addLabels(inputValue)}
        placeholder="Add a label, then press Enter"
        maxLength={40}
      />

      {suggestions.length > 0 ? (
        <div className="label-suggestions">
          {suggestions.map((label) => (
            <button
              key={label}
              type="button"
              className="label-suggestion-chip"
              onClick={() => addLabels(label)}
            >
              <span className="label-dot" style={{ backgroundColor: getLabelColor(label) }} />
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
