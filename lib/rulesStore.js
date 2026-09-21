// The rules file lives in the Supabase Storage `media` bucket: media/marketplace_rules.json
// Server-only — uses the service-role key, which must never reach the browser.
import { createClient } from '@supabase/supabase-js'
import { sanitizeTree } from '@/lib/categoryTree'

// SUPABASE_MEDIA_BUCKET is optional (e.g. a staging bucket); the default is the shared `media` bucket.
const BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'media'
const FILE_PATH = 'marketplace_rules.json'

export const RULES_FILE = Object.freeze({
  bucket: BUCKET,
  path: FILE_PATH,
  name: FILE_PATH,
  location: `${BUCKET}/${FILE_PATH}`,
})

// One client per server process (the service-role client keeps no session).
let client = null
function getClient() {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}

const isMissingBucket = (error) => /bucket not found/i.test(error.message || '')

// "Object not found" (file missing) is normal on first run and is not the same thing as a
// missing bucket, which is handled separately (see withBucket).
function isMissingObject(error) {
  const message = error.message || ''
  if (isMissingBucket(error)) return false
  return error.status === 404 || error.statusCode === '404' || error.code === 'NoSuchKey' || /object not found/i.test(message)
}

// Runs a storage call; if the bucket doesn't exist yet, creates it (private) and runs the call again.
async function withBucket(run) {
  let result = await run()
  if (result.error && isMissingBucket(result.error)) {
    const { error } = await getClient().storage.createBucket(BUCKET, { public: false })
    if (error && !/already exists/i.test(error.message || '')) {
      throw new Error(`Storage bucket "${BUCKET}" does not exist and could not be created: ${error.message}`)
    }
    result = await run()
  }
  return result
}

// Returns the stored tree, or null when there is nothing usable yet: the file doesn't exist, is
// empty, or isn't a category tree. An unreadable file is backed up first, so writing a fresh one
// can never destroy a hand-edited file.
export async function readRules() {
  const storage = getClient().storage.from(BUCKET)

  // cacheNonce + no-store: a save must be visible on the very next load, not after CDN expiry.
  const { data, error } = await withBucket(() =>
    storage.download(FILE_PATH, { cacheNonce: Date.now() }, { cache: 'no-store' })
  )
  if (error) {
    if (isMissingObject(error)) return null
    throw new Error(`Could not read ${RULES_FILE.location}: ${error.message}`)
  }

  const text = (await data.text()).replace(/^﻿/, '').trim()
  if (!text) return null

  try {
    const parsed = JSON.parse(text)
    const tree = Array.isArray(parsed) ? parsed : parsed?.treeData
    // Valid JSON that isn't a category tree (e.g. `{}`) counts as "nothing yet".
    return Array.isArray(tree) ? sanitizeTree(tree) : null
  } catch {
    const backupPath = FILE_PATH.replace(/\.json$/, `.corrupt-${Date.now()}.json`)
    const { error: copyError } = await storage.copy(FILE_PATH, backupPath)
    if (copyError) {
      throw new Error(`${RULES_FILE.location} is not a valid category file and could not be backed up: ${copyError.message}`)
    }
    return null
  }
}

// Creates the file if it doesn't exist, otherwise overwrites it.
export async function writeRules(tree) {
  const body = Buffer.from(JSON.stringify(tree, null, 2), 'utf-8')
  const { error } = await withBucket(() =>
    getClient().storage.from(BUCKET).upload(FILE_PATH, body, {
      contentType: 'application/json',
      upsert: true,
      cacheControl: '0',
    })
  )
  if (error) throw new Error(`Could not save ${RULES_FILE.location}: ${error.message}`)
}
