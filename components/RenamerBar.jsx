'use client'
import { useRef, useState } from 'react'
import { Download, FileText, FolderOpen } from 'lucide-react'

function extensionOf(fileName) {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(dot) : ''
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Top-right toolbar: the full generated name, then the file picker and the rename & download button.
// One file downloads directly as <name>.<ext>; several download as a zip of <name>_1.<ext>, <name>_2.<ext>, …
export default function RenamerBar({ slug, onNotice }) {
  const inputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)

  const fileLabel = files.length === 0
    ? 'Choose Main File(s)'
    : files.length === 1 ? files[0].name : `${files.length} files chosen`

  async function download() {
    if (!slug) {
      onNotice('Select categories to generate the final name first.')
      return
    }
    if (files.length === 0) {
      onNotice('Choose at least one file to rename.')
      return
    }

    setBusy(true)
    try {
      if (files.length === 1) {
        saveBlob(files[0], `${slug}${extensionOf(files[0].name)}`)
      } else {
        const { default: JSZip } = await import('jszip')
        const zip = new JSZip()
        files.forEach((file, i) => zip.file(`${slug}_${i + 1}${extensionOf(file.name)}`, file))
        saveBlob(await zip.generateAsync({ type: 'blob' }), `${slug}_files.zip`)
      }
    } catch (err) {
      onNotice(`Download failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
      <div
        className={`min-w-0 break-all rounded-lg border border-dashed border-slate-300 bg-slate-100 px-3 py-1.5 text-[13px] leading-snug ${
          slug ? 'font-mono font-semibold text-indigo-600' : 'text-slate-500'
        }`}
      >
        {slug || 'Select categories to generate name'}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => setFiles(Array.from(e.target.files))}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title={files.map((f) => f.name).join('\n')}
        className="flex max-w-[220px] items-center gap-1.5 rounded-md bg-slate-200 px-3 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-300"
      >
        {files.length === 0 ? <FolderOpen className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
        <span className="truncate">{fileLabel}</span>
      </button>

      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
      >
        <Download className="h-4 w-4" /> {busy ? 'Preparing…' : 'Rename & Download File(s)'}
      </button>
    </div>
  )
}
