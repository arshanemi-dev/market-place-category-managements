import { NextResponse } from 'next/server'
import { readRules, writeRules, RULES_FILE } from '@/lib/rulesStore'
import { sanitizeTree } from '@/lib/categoryTree'
import { DEFAULT_CATEGORIES } from '@/data/defaultCategories'

export const dynamic = 'force-dynamic'

// Loads the rules from Supabase. If the file doesn't exist yet it is created from the defaults.
export async function GET() {
  try {
    let tree = await readRules()
    let created = false
    if (!tree) {
      tree = DEFAULT_CATEGORIES
      await writeRules(tree)
      created = true
    }
    return NextResponse.json({ tree, created, file: RULES_FILE })
  } catch (err) {
    // Always JSON, so the client's res.json() never chokes on an empty error body.
    return NextResponse.json({ error: err.message || 'Failed to load rules' }, { status: 500 })
  }
}

// Body: { tree: [...] } — the whole hierarchy, saved as media/marketplace_rules.json.
export async function PUT(req) {
  try {
    const body = await req.json().catch(() => null)

    let tree
    try {
      tree = sanitizeTree(body?.tree)
    } catch (err) {
      return NextResponse.json({ error: `Invalid category tree: ${err.message}` }, { status: 400 })
    }

    await writeRules(tree)
    return NextResponse.json({ ok: true, file: RULES_FILE })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to save rules' }, { status: 500 })
  }
}
