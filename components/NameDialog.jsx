'use client'
import { useEffect, useState } from 'react'
import Modal from '@/components/Modal'

// Input dialog for adding / renaming a tab or subcategory (replaces the browser prompt()).
export default function NameDialog({ open, title, initialValue = '', placeholder = 'Category name', onSubmit, onClose }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setValue(initialValue)
      setError('')
    }
  }, [open, initialValue])

  function handleSubmit(e) {
    e.preventDefault()
    const name = value.trim()
    if (!name) {
      setError('Please enter a name.')
      return
    }
    onSubmit(name)
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          autoFocus
          type="text"
          value={value}
          maxLength={120}
          placeholder={placeholder}
          onFocus={(e) => e.target.select()}
          onChange={(e) => { setValue(e.target.value); setError('') }}
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
            error ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-100'
          }`}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3.5 py-2 text-[13px] font-medium hover:bg-slate-100"
          >
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-indigo-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-indigo-700">
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}
