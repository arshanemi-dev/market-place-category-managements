'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

const ENDPOINT = '/api/rules'
const SAVE_DELAY_MS = 800

// Loads the category rules from Supabase (the server creates the file on first run)
// and auto-saves every change back, debounced. Saving stays off until a load has succeeded,
// so a failed load can never overwrite the stored file with an empty/default tree.
export function useCategoryRules() {
  const [tree, setTree] = useState(null) // null until loaded
  const [file, setFile] = useState(null) // { name, location } of the Supabase object
  const [status, setStatus] = useState({ kind: 'loading', text: 'Loading…' })

  const treeRef = useRef(null)
  const canSaveRef = useRef(false)
  const timerRef = useRef(null)
  const inFlightRef = useRef(false)
  const rerunRef = useRef(false)

  const load = useCallback(async () => {
    setStatus({ kind: 'loading', text: 'Loading…' })
    try {
      const res = await fetch(ENDPOINT, { credentials: 'include', cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)

      treeRef.current = data.tree
      canSaveRef.current = true
      setTree(data.tree)
      setFile(data.file)
      setStatus({ kind: 'saved', text: data.created ? 'Created' : 'Loaded' })
    } catch (err) {
      canSaveRef.current = false
      setStatus({ kind: 'error', text: `Could not load: ${err.message}` })
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Serialised: a slow save can never land after (and overwrite) a newer one.
  const saveNow = useCallback(async () => {
    if (!canSaveRef.current) return
    if (inFlightRef.current) { rerunRef.current = true; return }

    inFlightRef.current = true
    try {
      do {
        rerunRef.current = false
        const res = await fetch(ENDPOINT, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tree: treeRef.current }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `Request failed (${res.status})`)
        }
      } while (rerunRef.current)
      setStatus({ kind: 'saved', text: 'Saved' })
    } catch (err) {
      setStatus({ kind: 'error', text: `Save failed: ${err.message}` })
    } finally {
      inFlightRef.current = false
    }
  }, [])

  // Every edit goes through here: update the UI now, save to Supabase shortly after.
  const commit = useCallback((nextTree) => {
    treeRef.current = nextTree
    setTree(nextTree)
    if (!canSaveRef.current) return

    setStatus({ kind: 'saving', text: 'Saving changes…' })
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { timerRef.current = null; saveNow() }, SAVE_DELAY_MS)
  }, [saveNow])

  // Leaving the page (close tab, reload, or navigating elsewhere in the app) with an edit still
  // waiting on the debounce: send it now. keepalive lets the request outlive the page.
  useEffect(() => {
    function flush() {
      if (!timerRef.current || !canSaveRef.current) return
      clearTimeout(timerRef.current)
      timerRef.current = null
      fetch(ENDPOINT, {
        method: 'PUT',
        credentials: 'include',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tree: treeRef.current }),
      }).catch(() => {})
    }
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [])

  return { tree, file, status, commit, retryLoad: load }
}
