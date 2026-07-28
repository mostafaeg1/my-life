import { useState, type FormEvent } from 'react'

interface AddHabitFormProps {
  onAdd: (name: string) => boolean
}

export function AddHabitForm({ onAdd }: AddHabitFormProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const added = onAdd(name)
    if (!added) {
      setError('Enter a habit name that is not already in your list.')
      return
    }

    setName('')
    setError('')
  }

  return (
    <form className="add-project-form add-habit-form" onSubmit={handleSubmit}>
      <label htmlFor="habit-name" className="field-label">
        New habit
      </label>
      <input
        id="habit-name"
        type="text"
        value={name}
        onChange={(event) => {
          setName(event.target.value)
          if (error) setError('')
        }}
        placeholder="Meditate, stretch, read..."
        maxLength={60}
      />
      <button type="submit" disabled={!name.trim()}>
        Add habit
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  )
}
