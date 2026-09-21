'use client'

const DOT = {
  saved: 'bg-emerald-500',
  saving: 'bg-amber-500 animate-pulse',
  loading: 'bg-slate-400 animate-pulse',
  error: 'bg-red-500',
}

// "● Saved" pill shown just above the tabs.
export default function SaveStatus({ status }) {
  return (
    <div
      role="status"
      className={`inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[13px] font-medium ${
        status.kind === 'error' ? 'text-red-500' : 'text-slate-500'
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[status.kind] || DOT.saved}`} />
      <span className="truncate">{status.text}</span>
    </div>
  )
}
