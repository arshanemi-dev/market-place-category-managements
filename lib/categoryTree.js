// Pure helpers for the category tree: [{ id, name, children: [...] }].
// Used by the UI and by the API route, so nothing here touches the DOM, React or Node APIs.

const MAX_TABS = 200
const MAX_NODES = 20000
const MAX_DEPTH = 12
const MAX_NAME_LENGTH = 120

// randomUUID only exists in secure contexts (https / localhost); fall back for plain-http LAN use.
function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

export function makeNode(name) {
  return { id: newId(), name: name.trim(), children: [] }
}

// File name stem for a selected path, e.g. Meesho > Ethnic Wear -> "meesho_ethnicwear"
export function generateSlug(nodes) {
  return nodes
    .map((n) => n.name.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(Boolean)
    .join('_')
}

// Every node as a root-to-node path, for the global search box
export function getAllCategoryPaths(tree) {
  const paths = []
  const walk = (nodes, parents) => {
    for (const node of nodes) {
      const path = [...parents, node]
      paths.push(path)
      if (node.children?.length) walk(node.children, path)
    }
  }
  walk(tree, [])
  return paths
}

// Follows selectedPath (child ids) down from a tab. Returns the visited nodes, tab first.
export function resolveSelection(tab, selectedPath) {
  const nodes = [tab]
  let current = tab.children || []
  for (const id of selectedPath) {
    const next = current.find((n) => n.id === id)
    if (!next) break
    nodes.push(next)
    current = next.children || []
  }
  return nodes
}

// The children array shown in the column at `level` (0 = right under the tab), or null when
// an ancestor in selectedPath no longer exists.
export function getChildrenAtLevel(tab, selectedPath, level) {
  let current = tab.children || []
  for (let i = 0; i < level; i++) {
    const parent = current.find((n) => n.id === selectedPath[i])
    if (!parent) return null
    parent.children = parent.children || []
    current = parent.children
  }
  return current
}

export function findNodeById(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findNodeById(node.children || [], id)
    if (found) return found
  }
  return null
}

// Validates untrusted input (an API request body, or a hand-edited file in storage) and returns a
// clean copy: only { id, name, children } survive, ids become strings, names are trimmed.
// Throws an Error with a readable message when the input isn't a usable category tree.
export function sanitizeTree(input) {
  if (!Array.isArray(input)) throw new Error('expected an array of tabs')
  if (input.length > MAX_TABS) throw new Error(`too many tabs (max ${MAX_TABS})`)

  let total = 0
  const clean = (node, depth) => {
    if (depth > MAX_DEPTH) throw new Error(`nested deeper than ${MAX_DEPTH} levels`)
    if (++total > MAX_NODES) throw new Error(`more than ${MAX_NODES} categories`)
    if (!node || typeof node !== 'object') throw new Error('a category is not an object')

    const name = typeof node.name === 'string' ? node.name.trim() : ''
    if (!name) throw new Error('a category has no name')
    if (name.length > MAX_NAME_LENGTH) throw new Error(`"${name.slice(0, 20)}…" is longer than ${MAX_NAME_LENGTH} characters`)

    const id = node.id == null || node.id === '' ? newId() : String(node.id).slice(0, 64)
    const children = Array.isArray(node.children) ? node.children.map((c) => clean(c, depth + 1)) : []
    return { id, name, children }
  }

  return input.map((tab) => clean(tab, 1))
}
