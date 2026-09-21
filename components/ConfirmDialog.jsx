'use client'
import Modal from '@/components/Modal'

// Delete confirmation (replaces the browser confirm()).
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-relaxed text-slate-500">{message}</p>
      <div className="mt-1 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-200 px-3.5 py-2 text-[13px] font-medium hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          autoFocus
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-red-500 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-red-600"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
