'use client'
import { Pencil, X } from 'lucide-react'

// Cascading columns: picking an item opens its children in the next column to the right.
export default function CategoryColumns({ tab, selectedPath, onSelect, onAdd, onRename, onDelete }) {
  const columns = []
  let nodes = tab.children || []
  for (let level = 0; ; level++) {
    const selected = nodes.find((n) => n.id === selectedPath[level])
    columns.push({ level, nodes, selectedId: selected?.id })
    if (!selected) break
    nodes = selected.children || []
  }

  return (
    <div className="flex flex-1 items-start gap-5 overflow-x-auto p-5">
      {columns.map(({ level, nodes: items, selectedId }) => (
        <div
          key={level}
          className="flex max-h-[65vh] w-[270px] min-w-[270px] flex-col rounded-[10px] border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between rounded-t-[10px] border-b border-slate-200 bg-slate-100 px-3.5 py-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Level {level + 2}</h2>
            <button
              type="button"
              onClick={() => onAdd(level)}
              className="rounded-[5px] bg-indigo-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
            >
              + Subcategory
            </button>
          </div>

          <ul className="flex-1 overflow-y-auto p-2">
            {items.length === 0 && <li className="px-3 py-2 text-xs text-slate-400">No subcategories yet</li>}
            {items.map((node) => {
              const active = node.id === selectedId
              return (
                <li
                  key={node.id}
                  className={`group mb-1.5 flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'border-blue-500 bg-blue-50 font-semibold text-indigo-600'
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <button type="button" onClick={() => onSelect(level, node.id)} className="flex-1 truncate text-left">
                    {node.name}
                  </button>
                  <span className={`flex gap-1 transition-opacity ${active ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`}>
                    <button type="button" title="Rename" aria-label={`Rename ${node.name}`} onClick={() => onRename(node)}>
                      <Pencil className="h-3.5 w-3.5 text-slate-500 hover:text-slate-900" />
                    </button>
                    <button type="button" title="Delete" aria-label={`Delete ${node.name}`} onClick={() => onDelete(level, node)}>
                      <X className="h-3.5 w-3.5 text-slate-500 hover:text-red-500" />
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
