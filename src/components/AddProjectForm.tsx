import { useState, type FormEvent } from 'react'

interface AddProjectFormProps {
  onAdd: (name: string) => boolean
}

export function AddProjectForm({ onAdd }: AddProjectFormProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const added = onAdd(name)
    if (!added) {
      setError('Enter a project name that is not already in your list.')
      return
    }

    setName('')
    setError('')
  }

  return (
    <form className="add-project-form sidebar-add-form" onSubmit={handleSubmit}>
      <label htmlFor="project-name" className="field-label">
        New project
      </label>
      <input
        id="project-name"
        type="text"
        value={name}
        onChange={(event) => {
          setName(event.target.value)
          if (error) setError('')
        }}
        placeholder="Math homework, reading..."
        maxLength={60}
      />
      <button type="submit" disabled={!name.trim()}>
        Add project
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  )
}
