'use client'
import { Pencil, Plus, X } from 'lucide-react'

// Top-level marketplace tabs (Meesho, Flipkart, …).
export default function CategoryTabs({ tabs, activeTabId, onSwitch, onAdd, onRename, onDelete }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-slate-200 px-4 pt-2 sm:px-6">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            className={`group flex select-none items-center gap-2.5 rounded-t-lg px-4 py-2 text-sm font-semibold ${
              active ? 'border-t-[3px] border-indigo-600 bg-white text-indigo-600' : 'bg-slate-300 text-slate-600'
            }`}
          >
            <button type="button" onClick={() => onSwitch(tab.id)} className="whitespace-nowrap">
              {tab.name}
            </button>
            <span className={`flex gap-1 transition-opacity ${active ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
              <button type="button" title="Rename tab" aria-label={`Rename ${tab.name}`} onClick={() => onRename(tab)}>
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button type="button" title="Delete tab" aria-label={`Delete ${tab.name}`} onClick={() => onDelete(tab)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
        )
      })}
      <button
        type="button"
        onClick={onAdd}
        className="flex shrink-0 items-center gap-1 rounded-t-lg bg-slate-400 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-500"
      >
        <Plus className="h-4 w-4" /> Add Tab
      </button>
    </div>
  )
}
