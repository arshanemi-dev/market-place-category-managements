'use client'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { getAllCategoryPaths } from '@/lib/categoryTree'

const MAX_SUGGESTIONS = 50

// Global category search: type part of any name, click a suggestion to jump to that category.
export default function CategorySearch({ tree, onSelect }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return getAllCategoryPaths(tree)
      .filter((path) => path.some((node) => node.name.toLowerCase().includes(q)))
      .slice(0, MAX_SUGGESTIONS)
  }, [tree, query])

  function pick(path) {
    setQuery('')
    setOpen(false)
    onSelect(path)
  }

  return (
    <div className="relative min-w-[200px] max-w-lg flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder="Search category… (e.g. Kurti, Jumpsuits)"
        autoComplete="off"
        className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-indigo-600 focus:bg-white focus:ring-[3px] focus:ring-indigo-100"
      />
      {open && matches.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
          {matches.map((path) => (
            <li
              key={path[path.length - 1].id}
              // mousedown (not click) so it fires before the input's blur closes the list
              onMouseDown={(e) => { e.preventDefault(); pick(path) }}
              className="cursor-pointer border-b border-slate-200 px-3.5 py-2.5 text-[13px] last:border-b-0 hover:bg-blue-50 hover:font-medium hover:text-indigo-600"
            >
              {path.map((n) => n.name).join(' > ')}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
