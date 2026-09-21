'use client'
import { useEffect, useState } from 'react'
import { FileText, X } from 'lucide-react'
import { useCategoryRules } from '@/hooks/useCategoryRules'
import { findNodeById, generateSlug, getChildrenAtLevel, makeNode, resolveSelection } from '@/lib/categoryTree'
import CategoryColumns from '@/components/CategoryColumns'
import CategorySearch from '@/components/CategorySearch'
import CategoryTabs from '@/components/CategoryTabs'
import ConfirmDialog from '@/components/ConfirmDialog'
import NameDialog from '@/components/NameDialog'
import RenamerBar from '@/components/RenamerBar'
import SaveStatus from '@/components/SaveStatus'

const NAME_DIALOG_TITLES = {
  addTab: 'Add new tab',
  renameTab: 'Rename tab',
  addSub: 'Add subcategory',
  renameSub: 'Rename subcategory',
}
const NAME_DIALOG_PLACEHOLDERS = { addTab: 'e.g. Flipkart', addSub: 'e.g. Kurti With Bottomwear' }

export default function CategoryManager() {
  const { tree, file, status, commit, retryLoad } = useCategoryRules()
  const [activeTabId, setActiveTabId] = useState(null)
  const [selectedPath, setSelectedPath] = useState([]) // child ids under the active tab
  const [dialog, setDialog] = useState(null) // { type, ...context } for whichever dialog is open
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(timer)
  }, [notice])

  const activeTab = tree ? tree.find((t) => t.id === activeTabId) || tree[0] || null : null
  const slug = activeTab ? generateSlug(resolveSelection(activeTab, selectedPath)) : ''

  // Every edit works on a copy of the tree, then goes through commit() (UI update + auto-save).
  function mutate(edit) {
    const next = structuredClone(tree)
    edit(next)
    commit(next)
  }

  const closeDialog = () => setDialog(null)

  function switchTab(id) {
    setActiveTabId(id)
    setSelectedPath([])
  }

  function selectFromSearch(path) {
    setActiveTabId(path[0].id)
    setSelectedPath(path.slice(1).map((n) => n.id))
  }

  function submitName(name) {
    const d = dialog
    closeDialog()

    if (d.type === 'addTab') {
      const tab = makeNode(name)
      commit([...tree, tab])
      switchTab(tab.id)
    } else if (d.type === 'renameTab') {
      mutate((next) => { next.find((t) => t.id === d.id).name = name })
    } else if (d.type === 'addSub') {
      const node = makeNode(name)
      mutate((next) => {
        const list = getChildrenAtLevel(next.find((t) => t.id === activeTab.id), selectedPath, d.level)
        if (list) list.push(node)
      })
      setSelectedPath([...selectedPath.slice(0, d.level), node.id])
    } else if (d.type === 'renameSub') {
      mutate((next) => { findNodeById(next, d.id).name = name })
    }
  }

  function confirmDelete() {
    const d = dialog
    closeDialog()

    if (d.type === 'deleteTab') {
      commit(tree.filter((t) => t.id !== d.id))
      if (activeTab?.id === d.id) switchTab(null)
    } else if (d.type === 'deleteSub') {
      mutate((next) => {
        const list = getChildrenAtLevel(next.find((t) => t.id === activeTab.id), selectedPath, d.level)
        const index = list ? list.findIndex((n) => n.id === d.id) : -1
        if (index !== -1) list.splice(index, 1)
      })
      setSelectedPath(selectedPath.slice(0, d.level))
    }
  }

  const nameDialog = dialog && NAME_DIALOG_TITLES[dialog.type] ? dialog : null
  const deleteDialog = dialog && !NAME_DIALOG_TITLES[dialog.type] ? dialog : null

  return (
    <div className="flex min-h-screen flex-col">
      {/* Title, search, and the Supabase file the rules are saved to */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <h1 className="whitespace-nowrap text-[1.15rem] font-bold tracking-tight">Category Manager</h1>
        {tree && <CategorySearch tree={tree} onSelect={selectFromSearch} />}
        {file && (
          <span
            title={file.location}
            className="ml-auto flex max-w-[260px] items-center gap-1.5 font-mono text-[13px] font-semibold text-slate-500"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{file.name}</span>
          </span>
        )}
      </header>

      {/* Save status (left) and the full name + file buttons (right end), just above the tabs */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
        <SaveStatus status={status} />
        {tree && <RenamerBar slug={slug} onNotice={setNotice} />}
      </div>

      {notice && (
        <div role="alert" className="mx-4 mb-2 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-800 sm:mx-6">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </div>
      )}

      {!tree && status.kind === 'error' && (
        <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:mx-6">
          <p>{status.text}</p>
          <button
            type="button"
            onClick={retryLoad}
            className="mt-3 rounded-md bg-red-500 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-red-600"
          >
            Try again
          </button>
        </div>
      )}

      {tree && (
        <>
          <CategoryTabs
            tabs={tree}
            activeTabId={activeTab?.id}
            onSwitch={switchTab}
            onAdd={() => setDialog({ type: 'addTab' })}
            onRename={(tab) => setDialog({ type: 'renameTab', id: tab.id, name: tab.name })}
            onDelete={(tab) => setDialog({ type: 'deleteTab', id: tab.id, name: tab.name })}
          />
          {activeTab ? (
            <CategoryColumns
              tab={activeTab}
              selectedPath={selectedPath}
              onSelect={(level, id) => setSelectedPath([...selectedPath.slice(0, level), id])}
              onAdd={(level) => setDialog({ type: 'addSub', level })}
              onRename={(node) => setDialog({ type: 'renameSub', id: node.id, name: node.name })}
              onDelete={(level, node) => setDialog({ type: 'deleteSub', level, id: node.id, name: node.name })}
            />
          ) : (
            <p className="p-6 text-sm text-slate-500">No tabs yet — click “Add Tab” to create one.</p>
          )}
        </>
      )}

      <NameDialog
        open={!!nameDialog}
        title={nameDialog ? NAME_DIALOG_TITLES[nameDialog.type] : ''}
        initialValue={nameDialog?.name || ''}
        placeholder={nameDialog ? NAME_DIALOG_PLACEHOLDERS[nameDialog.type] : undefined}
        onSubmit={submitName}
        onClose={closeDialog}
      />
      <ConfirmDialog
        open={!!deleteDialog}
        title={deleteDialog?.type === 'deleteTab' ? 'Delete tab' : 'Delete subcategory'}
        message={deleteDialog ? `Delete “${deleteDialog.name}” and everything nested under it?` : ''}
        onConfirm={confirmDelete}
        onClose={closeDialog}
      />
    </div>
  )
}
